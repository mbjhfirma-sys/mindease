"use client";

import { useEffect, useState } from "react";

/**
 * Natural, randomized blinking — deliberately not a fixed-interval CSS loop,
 * since a metronomic blink is exactly the "obviously repetitive" idle
 * animation Mindo shouldn't have. Occasionally double-blinks, like a person.
 */
export function useNaturalBlink(enabled: boolean): boolean {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function closeThenOpen(onDone?: () => void) {
      setBlinking(true);
      timers.push(setTimeout(() => {
        if (cancelled) return;
        setBlinking(false);
        onDone?.();
      }, 130));
    }

    function scheduleNext() {
      const delay = 2600 + Math.random() * 3600;
      timers.push(setTimeout(() => {
        if (cancelled) return;
        closeThenOpen(() => {
          if (Math.random() < 0.12) {
            timers.push(setTimeout(() => { if (!cancelled) closeThenOpen(); }, 140));
          }
        });
        scheduleNext();
      }, delay));
    }

    scheduleNext();
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [enabled]);

  return enabled && blinking;
}

/**
 * Subconscious idle life: occasional micro glances and tiny smile
 * adjustments. Scoped to ambient resting states — see AMBIENT_LIFE_STATES —
 * so it never fights a deliberately posed expression like "curious" or
 * "thinking".
 */
export function useIdleMicroLife(enabled: boolean): { gazeX: number; gazeY: number; microSmile: boolean } {
  const [gaze, setGaze] = useState({ gazeX: 0, gazeY: 0 });
  const [microSmile, setMicroSmile] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function scheduleGaze() {
      const delay = 4200 + Math.random() * 5200;
      timers.push(setTimeout(() => {
        if (cancelled) return;
        setGaze({ gazeX: (Math.random() - 0.5) * 3.2, gazeY: (Math.random() - 0.5) * 2.2 });
        timers.push(setTimeout(() => { if (!cancelled) setGaze({ gazeX: 0, gazeY: 0 }); }, 1400 + Math.random() * 900));
        scheduleGaze();
      }, delay));
    }

    function scheduleSmile() {
      const delay = 7000 + Math.random() * 7000;
      timers.push(setTimeout(() => {
        if (cancelled) return;
        setMicroSmile(true);
        timers.push(setTimeout(() => { if (!cancelled) setMicroSmile(false); }, 1800 + Math.random() * 800));
        scheduleSmile();
      }, delay));
    }

    scheduleGaze();
    scheduleSmile();
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [enabled]);

  if (!enabled) return { gazeX: 0, gazeY: 0, microSmile: false };
  return { gazeX: gaze.gazeX, gazeY: gaze.gazeY, microSmile };
}
