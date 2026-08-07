"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { MINDO_STATES, AMBIENT_LIFE_STATES, type MindoExpression, type MindoMotion, type MindoState, type MindoStateConfig } from "@/lib/mindo/animation";
import { useNaturalBlink, useIdleMicroLife } from "@/lib/mindo/useMindoLife";

export type { MindoExpression, MindoMotion, MindoState };

const AVATAR_BOX = { lg: "w-14 h-14", md: "w-11 h-11", sm: "w-9 h-9", xs: "w-7 h-7" } as const;

const FACE: Record<MindoExpression, {
  browLeft: string;
  browRight: string;
  mouth: string;
  mouthWidth?: number;
  eyesClosed?: boolean;
  rightEyeUp?: boolean;
}> = {
  cheerful: {
    browLeft: "M28,29 Q37,24 46,28",
    browRight: "M54,28 Q63,24 72,29",
    mouth: "M39,64 Q50,73 61,64",
  },
  "warm-smile": {
    browLeft: "M28,29 Q37,24 46,28",
    browRight: "M54,28 Q63,24 72,29",
    mouth: "M41,63 Q50,68 59,63",
    mouthWidth: 3.2,
  },
  serene: {
    browLeft: "M29,31 Q37,28 45,31",
    browRight: "M55,31 Q63,28 71,31",
    mouth: "M43,65 Q50,68 57,65",
    eyesClosed: true,
  },
  curious: {
    browLeft: "M28,29 Q37,24 46,28",
    browRight: "M54,24 Q63,17 72,23",
    mouth: "M40,65 Q50,69 58,64",
    mouthWidth: 3.2,
    rightEyeUp: true,
  },
  "sparkle-wink": {
    browLeft: "M28,29 Q37,24 46,28",
    browRight: "M54,28 Q63,24 72,29",
    mouth: "M38,63 Q50,75 62,63",
  },
  gentle: {
    browLeft: "M28,32 Q37,29.5 46,32",
    browRight: "M54,32 Q63,29.5 72,32",
    mouth: "M42,64 Q50,67 58,64",
    mouthWidth: 3,
  },
};

const SPARK_OFFSETS: [number, number][] = [
  [26, 0], [13, -22], [-13, -22], [-26, 0], [-13, 22], [13, 22],
];

// Legacy `expression`/`motion` props render through the same state-machine
// pipeline, wrapped up as a one-off, unnamed config — so every existing call
// site keeps working exactly as before with no visual change.
function legacyConfig(expression: MindoExpression, motion: MindoMotion, loopClass: string, blinks: boolean): MindoStateConfig {
  return {
    expression,
    browLift: 0, eyeScale: 1, gazeX: 0, gazeY: 0, headTilt: 0, mouthScale: 1,
    loopClass,
    motionClass: motion !== "none" ? `mindo-motion-${motion}` : undefined,
    blinks,
    transitionMs: 380, transitionEase: "cubic-bezier(.22,.61,.36,1)",
  };
}

/** Wraps the svg body so a fresh `key` (new gesture) replays its one-shot
 *  animation from a clean, synchronous first render, then hands back to the
 *  ambient loop class once the gesture's own CSS animation completes. */
function MindoBody({
  motionClass,
  loopClass,
  children,
}: {
  motionClass?: string;
  loopClass: string;
  children: ReactNode;
}) {
  const [playing, setPlaying] = useState(!!motionClass);
  return (
    <svg
      viewBox="0 0 100 100"
      className={`w-full h-full rounded-full ${playing && motionClass ? motionClass : loopClass}`}
      style={{ overflow: "visible" }}
      onAnimationEnd={(e) => { if (e.target === e.currentTarget) setPlaying(false); }}
    >
      {children}
    </svg>
  );
}

export function MindoAvatar({
  size = "sm",
  expression = "cheerful",
  motion = "none",
  motionKey,
  state,
  replayKey,
}: {
  size?: keyof typeof AVATAR_BOX;
  expression?: MindoExpression;
  motion?: MindoMotion;
  /** Change this value to replay a one-shot `motion` (e.g. per new briefing). */
  motionKey?: string | number;
  /** Preferred API: drive Mindo through the named state machine (see lib/mindo/animation.ts). */
  state?: MindoState;
  /** Change this value to replay a one-shot state's gesture even if `state` itself is unchanged. */
  replayKey?: string | number;
}) {
  const gradId = useId();
  const idleLoop = size === "lg" || size === "md" ? "animate-mindo-idle-body" : "";
  const idleBlink = size === "lg" || size === "md" || size === "sm";

  const cfg = state ? MINDO_STATES[state] : legacyConfig(expression, motion, idleLoop, idleBlink);
  const face = FACE[cfg.expression];

  const gestureId = state ? `s:${state}:${replayKey ?? ""}` : `m:${expression}:${motion}:${motionKey ?? ""}`;

  const blinking = useNaturalBlink(cfg.blinks && idleBlink);
  const ambient = useIdleMicroLife(idleBlink && !!state && AMBIENT_LIFE_STATES.has(state));
  const gazeX = cfg.gazeX + ambient.gazeX;
  const gazeY = cfg.gazeY + ambient.gazeY;
  const mouthScale = cfg.mouthScale * (ambient.microSmile ? 1.04 : 1);

  const isCelebrating = state === "celebrating" || (motion === "pop" && expression === "sparkle-wink");
  const rightEyeCy = face.rightEyeUp ? 43 : 45;

  const facePartStyle = (transform: string): CSSProperties => ({
    transform,
    transitionDuration: `${cfg.transitionMs}ms`,
    transitionTimingFunction: cfg.transitionEase,
  });

  return (
    <span
      className={[AVATAR_BOX[size], "inline-block rounded-full flex-shrink-0"].join(" ")}
      style={{
        overflow: "visible",
        transform: `rotate(${cfg.headTilt}deg)`,
        transitionProperty: "transform",
        transitionDuration: `${cfg.transitionMs}ms`,
        transitionTimingFunction: cfg.transitionEase,
      }}
    >
      <MindoBody key={gestureId} motionClass={cfg.motionClass} loopClass={cfg.loopClass}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1B4332" />
            <stop offset="100%" stopColor="#74C69D" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill={`url(#${gradId})`} />

        <g className="mindo-face-part" style={facePartStyle(`translateY(${cfg.browLift}px)`)}>
          <path d={face.browLeft} stroke="#1B2A20" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d={face.browRight} stroke="#1B2A20" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>

        {face.eyesClosed ? (
          <>
            <path d="M28,45 Q37,49.5 46,45" stroke="#1B2A20" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M54,45 Q63,49.5 72,45" stroke="#1B2A20" strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <g className="mindo-face-part" style={facePartStyle(`translate(${gazeX}px, ${gazeY}px) scale(${cfg.eyeScale})`)}>
              <g className="mindo-blink-part" style={{ transform: blinking ? "scaleY(0.08)" : "scaleY(1)" }}>
                <ellipse cx="37" cy="45" rx="9.5" ry="10.5" fill="#1B2A20" />
                <circle cx="34" cy="41" r="2.6" fill="#fff" opacity="0.92" />
                <circle cx="40" cy="49" r="1.1" fill="#fff" opacity="0.5" />
              </g>
            </g>
            <g className="mindo-face-part" style={facePartStyle(`translate(${gazeX}px, ${gazeY}px) scale(${cfg.eyeScale})`)}>
              <g className={["mindo-blink-part", isCelebrating ? "mindo-eye-wink" : ""].filter(Boolean).join(" ")} style={{ transform: blinking ? "scaleY(0.08)" : "scaleY(1)" }}>
                <ellipse cx="63" cy={rightEyeCy} rx="9.5" ry="10.5" fill="#1B2A20" />
                <circle cx="60" cy={rightEyeCy - 4} r="2.6" fill="#fff" opacity="0.92" />
                <circle cx="66" cy={rightEyeCy + 4} r="1.1" fill="#fff" opacity="0.5" />
              </g>
            </g>
          </>
        )}

        <g className="mindo-face-part" style={facePartStyle(`scale(${mouthScale})`)}>
          <path d={face.mouth} stroke="#1B2A20" strokeWidth={face.mouthWidth ?? 3.6} strokeLinecap="round" fill="none" />
        </g>

        {isCelebrating && (
          <g>
            {SPARK_OFFSETS.map(([dx, dy], i) => (
              <circle
                key={i}
                className="mindo-spark"
                cx="50"
                cy="50"
                r="2.4"
                fill="#FBBF24"
                style={{ "--dx": `${dx}px`, "--dy": `${dy}px`, animationDelay: `${i * 40 + 240}ms` } as CSSProperties}
              />
            ))}
          </g>
        )}
      </MindoBody>
    </span>
  );
}
