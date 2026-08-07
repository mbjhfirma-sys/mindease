"use client";

import { useCallback, useRef, useState } from "react";
import { MINDO_STATES, type MindoState } from "./animation";

/**
 * Imperative control for MindoAvatar, for sequences that don't map to a
 * single controlled prop — e.g. `mindo.animate("celebrating")` on a button
 * click, or a scripted intro like idle → happy → excited → happy.
 *
 * Each state's `settleTo` (see lib/mindo/animation.ts) fires automatically
 * once its one-shot gesture finishes, so callers don't have to hand-roll
 * timers for "play the jump, then go back to happy".
 */
export function useMindoAnimator(initial: MindoState = "idle") {
  const [state, setState] = useState<MindoState>(initial);
  const [replayKey, setReplayKey] = useState(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const animate = useCallback((next: MindoState, opts?: { holdMs?: number; then?: MindoState }) => {
    clearTimeout(settleTimer.current);
    setState(next);
    setReplayKey((k) => k + 1);

    const cfg = MINDO_STATES[next];
    const settleTo = opts?.then ?? cfg.settleTo;
    if (settleTo) {
      const hold = opts?.holdMs ?? cfg.motionMs ?? 800;
      settleTimer.current = setTimeout(() => setState(settleTo), hold);
    }
  }, []);

  return { state, replayKey, animate };
}
