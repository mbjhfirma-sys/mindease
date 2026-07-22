"use client";

import { useState, useEffect, useRef } from "react";

const PROMPTS = [
  "Notice the urge without judging it. It's just a sensation passing through.",
  "Where do you feel it in your body? Chest, stomach, hands?",
  "The wave is cresting. It feels intense, but it will pass — urges always do.",
  "You don't have to act on it. You're just watching it rise and fall.",
  "Notice it beginning to subside. You're riding this out.",
];
const SECONDS_PER_PROMPT = 15;
const TOTAL_SECONDS = PROMPTS.length * SECONDS_PER_PROMPT;

export default function UrgeSurfingExercise({ onComplete }: { onComplete: () => void }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e + 0.5 >= TOTAL_SECONDS) {
          setRunning(false);
          setFinished(true);
          return TOTAL_SECONDS;
        }
        return e + 0.5;
      });
    }, 500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const waveOffset = Math.sin(elapsed * 0.7) * 24;
  const promptIdx = Math.min(Math.floor(elapsed / SECONDS_PER_PROMPT), PROMPTS.length - 1);
  const progressPct = (elapsed / TOTAL_SECONDS) * 100;

  if (reflection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="text-6xl mb-5">🌊</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">You rode it out</h3>
        <p className="text-stone-500 mb-8 text-sm">
          "Urge surfing" (Alan Marlatt, DBT/relapse-prevention) treats cravings and urges as waves — they always
          rise, crest, and fall. Each time you ride one out instead of acting on it, the next one gets easier.
        </p>
        <button onClick={onComplete} className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors">Continue →</button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="text-6xl mb-5">🏄</div>
        <h3 className="text-xl font-bold text-stone-900 mb-4">Wave complete</h3>
        <p className="text-stone-600 text-sm mb-4">Did the urge change while you were riding it out?</p>
        <div className="flex flex-col gap-2 w-full">
          {["Yes, it passed", "It's still there, and that's okay too", "Not sure"].map((r) => (
            <button key={r} onClick={() => setReflection(r)} className="border-2 border-stone-200 hover:border-sage-400 rounded-xl px-4 py-3 text-sm text-stone-700 transition-colors">
              {r}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!running && elapsed === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="text-6xl mb-4">🌊</div>
        <h3 className="font-bold text-stone-800 mb-2 text-lg">Urge Surfing</h3>
        <p className="text-stone-500 text-sm mb-8">
          Urges and cravings rise and fall like waves — they don't just keep climbing forever. Instead of fighting or
          acting on the urge, you'll simply observe it for about a minute while it passes on its own.
        </p>
        <button onClick={() => setRunning(true)} className="bg-sage-700 text-white font-semibold px-10 py-3 rounded-xl hover:bg-sage-800 transition-colors">
          Begin
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[480px] max-w-lg mx-auto text-center">
      <h3 className="font-bold text-stone-800 mb-6 text-lg">Riding the Wave</h3>

      {/* Animated wave */}
      <div className="relative w-full h-40 mb-8 overflow-hidden rounded-2xl bg-gradient-to-b from-blue-50 to-blue-100">
        <div
          className="absolute left-0 right-0 h-24 bg-blue-400/40 rounded-[50%]"
          style={{ bottom: `${20 + waveOffset}px`, transform: "scaleX(1.4)" }}
        />
        <div
          className="absolute left-0 right-0 h-20 bg-blue-500/50 rounded-[50%]"
          style={{ bottom: `${10 + waveOffset * 0.7}px`, transform: "scaleX(1.6)" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">🏄</span>
        </div>
      </div>

      <p className="text-stone-600 text-sm leading-relaxed mb-8 min-h-[3rem] max-w-sm">{PROMPTS[promptIdx]}</p>

      <div className="w-full bg-stone-100 rounded-full h-1.5 mb-6">
        <div className="bg-blue-400 h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
      </div>

      <button onClick={() => { setRunning(false); setFinished(true); }} className="text-sm border border-stone-200 text-stone-500 px-6 py-2 rounded-xl hover:bg-stone-50 transition-colors">
        I'm ready to finish
      </button>
    </div>
  );
}
