// Mindo's animation state machine. Pure config — no React here, so it can be
// imported by both the avatar component and any hook that drives it.
//
// Each MindoState composes:
//   - which face (brow/mouth path set) to use
//   - held facial modifiers (brow lift, eye scale, gaze, mouth scale) that the
//     avatar cross-fades into with a spring-like CSS transition
//   - an optional one-shot body gesture (jump/pop/nod/tilt/bounce) that plays
//     once on entry, then hands back to the ambient idle-body loop
//   - whether natural blinking should run while in this state
//
// This is the layer that lets callers say `<MindoAvatar state="excited" />`
// or `mindo.animate("celebrating")` without hand-rolling a new animation
// every time — see components/dashboard/MindoAvatar.tsx and
// lib/mindo/useMindoAnimator.ts.

export type MindoExpression = "cheerful" | "warm-smile" | "serene" | "curious" | "sparkle-wink" | "gentle";
export type MindoMotion = "none" | "jump" | "nod" | "tilt" | "pop" | "bounce";

export type MindoState =
  | "idle"
  | "happy"
  | "excited"
  | "thinking"
  | "listening"
  | "curious"
  | "calm"
  | "encouraging"
  | "celebrating"
  | "gentle"
  | "surprised"
  | "breathing";

export type MindoStateConfig = {
  expression: MindoExpression;
  /** SVG units on the 0–100 viewBox. Negative = raised. */
  browLift: number;
  /** 1 = normal eye size. */
  eyeScale: number;
  gazeX: number;
  gazeY: number;
  /** Held head/body tilt in degrees. */
  headTilt: number;
  /** 1 = normal mouth size. */
  mouthScale: number;
  /** Ambient loop animation class for the svg body while resting in this state. */
  loopClass: string;
  /** One-shot gesture class that plays once when entering this state. */
  motionClass?: string;
  /** Must match the gesture's CSS animation-duration. */
  motionMs?: number;
  /** Where `useMindoAnimator` should settle after the gesture finishes. */
  settleTo?: MindoState;
  /** Whether the natural-blink scheduler should run in this state. */
  blinks: boolean;
  transitionMs: number;
  transitionEase: string;
};

const EASE_OUT = "cubic-bezier(.22,.61,.36,1)";
const EASE_SPRING = "cubic-bezier(.34,1.56,.64,1)";
const EASE_CALM = "cubic-bezier(.45,.05,.55,.95)";

export const MINDO_STATES: Record<MindoState, MindoStateConfig> = {
  idle: {
    expression: "warm-smile",
    browLift: 0, eyeScale: 1, gazeX: 0, gazeY: 0, headTilt: 0, mouthScale: 1,
    loopClass: "animate-mindo-idle-body",
    blinks: true,
    transitionMs: 420, transitionEase: EASE_OUT,
  },
  happy: {
    expression: "cheerful",
    browLift: -1.5, eyeScale: 1.03, gazeX: 0, gazeY: 0, headTilt: 0, mouthScale: 1.06,
    loopClass: "animate-mindo-idle-body",
    motionClass: "mindo-motion-bounce", motionMs: 520,
    blinks: true,
    transitionMs: 360, transitionEase: EASE_SPRING,
  },
  excited: {
    expression: "cheerful",
    browLift: -2.5, eyeScale: 1.12, gazeX: 0, gazeY: 0, headTilt: 0, mouthScale: 1.14,
    loopClass: "animate-mindo-idle-body",
    motionClass: "mindo-motion-jump", motionMs: 780, settleTo: "happy",
    blinks: true,
    transitionMs: 260, transitionEase: EASE_SPRING,
  },
  thinking: {
    expression: "warm-smile",
    browLift: -0.5, eyeScale: 0.98, gazeX: 1, gazeY: -3, headTilt: 2, mouthScale: 0.98,
    loopClass: "animate-mindo-idle-body",
    blinks: true,
    transitionMs: 460, transitionEase: EASE_OUT,
  },
  listening: {
    expression: "warm-smile",
    browLift: -0.5, eyeScale: 1.04, gazeX: 1, gazeY: 0, headTilt: 5, mouthScale: 1,
    loopClass: "animate-mindo-idle-body",
    blinks: true,
    transitionMs: 420, transitionEase: EASE_OUT,
  },
  curious: {
    expression: "curious",
    browLift: 0, eyeScale: 1.02, gazeX: 2, gazeY: -1, headTilt: -6, mouthScale: 1.02,
    loopClass: "animate-mindo-idle-body",
    motionClass: "mindo-motion-tilt", motionMs: 1200,
    blinks: true,
    transitionMs: 420, transitionEase: EASE_OUT,
  },
  calm: {
    expression: "warm-smile",
    browLift: 0.5, eyeScale: 0.92, gazeX: 0, gazeY: 0, headTilt: 0, mouthScale: 0.99,
    loopClass: "animate-mindo-idle-body-slow",
    blinks: true,
    transitionMs: 560, transitionEase: EASE_CALM,
  },
  encouraging: {
    expression: "warm-smile",
    browLift: -1, eyeScale: 1.02, gazeX: 0, gazeY: 0, headTilt: 0, mouthScale: 1.05,
    loopClass: "animate-mindo-idle-body",
    motionClass: "mindo-motion-nod", motionMs: 1500,
    blinks: true,
    transitionMs: 420, transitionEase: EASE_OUT,
  },
  celebrating: {
    expression: "sparkle-wink",
    browLift: -2, eyeScale: 1.05, gazeX: 0, gazeY: 0, headTilt: 0, mouthScale: 1.1,
    loopClass: "animate-mindo-idle-body",
    motionClass: "mindo-motion-pop", motionMs: 850, settleTo: "happy",
    blinks: true,
    transitionMs: 280, transitionEase: EASE_SPRING,
  },
  gentle: {
    expression: "gentle",
    browLift: 1.5, eyeScale: 0.9, gazeX: 0, gazeY: 1, headTilt: 3, mouthScale: 0.97,
    loopClass: "animate-mindo-idle-body-slow",
    blinks: true,
    transitionMs: 560, transitionEase: EASE_CALM,
  },
  surprised: {
    expression: "cheerful",
    browLift: -4, eyeScale: 1.2, gazeX: 0, gazeY: 0, headTilt: 0, mouthScale: 1.05,
    loopClass: "animate-mindo-idle-body",
    settleTo: "idle", motionMs: 650,
    blinks: false,
    transitionMs: 150, transitionEase: EASE_SPRING,
  },
  breathing: {
    expression: "serene",
    browLift: 0, eyeScale: 1, gazeX: 0, gazeY: 0, headTilt: 0, mouthScale: 0.98,
    loopClass: "animate-mindo-idle-body-deep",
    blinks: false,
    transitionMs: 600, transitionEase: EASE_CALM,
  },
};

/** States where idle micro-life (gaze jitter, tiny smile adjustments) is allowed to run. */
export const AMBIENT_LIFE_STATES: ReadonlySet<MindoState> = new Set(["idle", "calm"]);
