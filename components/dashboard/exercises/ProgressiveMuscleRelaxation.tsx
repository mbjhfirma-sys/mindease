"use client";

import { useState, useEffect, useRef } from "react";

const GROUPS = [
  { label: "Hands & Forearms", emoji: "👊", cue: "Clench your fists tightly, squeezing your forearms" },
  { label: "Upper Arms", emoji: "💪", cue: "Bend your elbows and tense your biceps hard" },
  { label: "Shoulders", emoji: "🙆", cue: "Shrug your shoulders up toward your ears" },
  { label: "Face", emoji: "😬", cue: "Scrunch your whole face — eyes shut, jaw tight" },
  { label: "Neck", emoji: "🦒", cue: "Gently press your head back, tensing your neck" },
  { label: "Chest & Back", emoji: "🫁", cue: "Take a deep breath and tighten your chest and back" },
  { label: "Stomach", emoji: "🎈", cue: "Pull your stomach in tight, like bracing for a punch" },
  { label: "Legs & Feet", emoji: "🦵", cue: "Point your toes and tense your thighs and calves" },
];

type Phase = "tense" | "release";

export default function ProgressiveMuscleRelaxation({ onComplete }: { onComplete: () => void }) {
  const [current, setCurrent] = useState(-1);
  const [phase, setPhase] = useState<Phase>("tense");
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [done, setDone] = useState(false);

  const TENSE_SECONDS = 5;
  const RELEASE_SECONDS = 10;

  useEffect(() => {
    if (current < 0 || current >= GROUPS.length) return;
    setPhase("tense");
    setTimer(TENSE_SECONDS);
  }, [current]);

  useEffect(() => {
    if (current < 0 || current >= GROUPS.length) return;
    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          if (phase === "tense") {
            setPhase("release");
            return RELEASE_SECONDS;
          }
          clearInterval(intervalRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [current, phase]);

  const atStepEnd = current >= 0 && current < GROUPS.length && phase === "release" && timer === 0;

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="text-6xl mb-5">💪</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Fully relaxed</h3>
        <p className="text-stone-500 mb-8 text-sm">
          Jacobson's Progressive Muscle Relaxation works by contrast — actively tensing then releasing each
          muscle group teaches your body to recognize and let go of physical tension you didn't know you were holding.
        </p>
        <button onClick={onComplete} className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors">Continue →</button>
      </div>
    );
  }

  if (current < 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="text-6xl mb-4">💪</div>
        <h3 className="font-bold text-stone-800 mb-2 text-lg">Progressive Muscle Relaxation</h3>
        <p className="text-stone-500 text-sm mb-3">
          You'll tense each muscle group for 5 seconds, then release and notice the difference for 10 seconds.
          The contrast between tension and relaxation is what makes this technique so effective.
        </p>
        <p className="text-stone-400 text-sm mb-8">8 muscle groups · ~2 minutes total</p>
        <button onClick={() => setCurrent(0)} className="bg-sage-700 text-white font-semibold px-10 py-3 rounded-xl hover:bg-sage-800 transition-colors">
          Begin
        </button>
      </div>
    );
  }

  const group = GROUPS[current];
  const duration = phase === "tense" ? TENSE_SECONDS : RELEASE_SECONDS;

  return (
    <div className="flex flex-col items-center justify-center min-h-[480px] max-w-lg mx-auto text-center">
      <div className="flex gap-1.5 mb-8">
        {GROUPS.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < current ? "bg-sage-500" : i === current ? "bg-sage-700 w-4" : "bg-stone-200"}`} />
        ))}
      </div>

      <div className="text-5xl mb-3">{group.emoji}</div>
      <h3 className="text-lg font-bold text-stone-800 mb-2">{group.label}</h3>

      <div className={`rounded-2xl px-6 py-4 mb-6 transition-colors ${phase === "tense" ? "bg-red-50 border border-red-100" : "bg-sage-50 border border-sage-100"}`}>
        <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${phase === "tense" ? "text-red-500" : "text-sage-600"}`}>
          {phase === "tense" ? "Tense" : "Release & Notice"}
        </div>
        <p className="text-stone-700 text-sm">{phase === "tense" ? group.cue : "Let it all go completely. Feel the warmth and heaviness as the muscles relax."}</p>
      </div>

      <div className="relative w-24 h-24 mb-6">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#E7E5E4" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="42" fill="none" stroke={phase === "tense" ? "#DC2626" : "#2D6A4F"} strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (timer / duration)}`}
            strokeLinecap="round" className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-stone-700">{timer}</span>
        </div>
      </div>

      <button
        onClick={() => { if (current === GROUPS.length - 1) setDone(true); else setCurrent(current + 1); }}
        disabled={!atStepEnd}
        className="bg-sage-700 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {current === GROUPS.length - 1 ? "Finish" : "Next Muscle Group →"}
      </button>
      <p className="text-stone-400 text-xs mt-4">Step {current + 1} of {GROUPS.length}</p>
    </div>
  );
}
