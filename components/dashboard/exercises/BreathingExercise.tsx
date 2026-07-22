"use client";

import { useState, useEffect, useRef } from "react";

export default function BreathingExercise({ onComplete }: { onComplete: () => void }) {
  const phases = [
    { label: "Inhale", duration: 4, color: "bg-sage-500", scale: "scale-110" },
    { label: "Hold", duration: 4, color: "bg-amber-400", scale: "scale-110" },
    { label: "Exhale", duration: 6, color: "bg-blue-400", scale: "scale-90" },
    { label: "Hold", duration: 2, color: "bg-stone-300", scale: "scale-90" },
  ];
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(phases[0].duration);
  const [cycles, setCycles] = useState(0);
  const totalCycles = 5;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          setPhase((p) => {
            const next = (p + 1) % phases.length;
            if (next === 0) {
              setCycles((cy) => {
                if (cy + 1 >= totalCycles) {
                  setRunning(false);
                  return cy + 1;
                }
                return cy + 1;
              });
            }
            return next;
          });
          return phases[(phase + 1) % phases.length].duration;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, phase]);

  const current = phases[phase];
  const done = cycles >= totalCycles && !running;

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-6xl mb-5">🌬️</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Breathwork complete</h3>
        <p className="text-stone-500 mb-8">You completed {totalCycles} breathing cycles. Notice how you feel.</p>
        <button onClick={onComplete} className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors">
          Continue →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[480px]">
      <h3 className="font-bold text-stone-800 mb-2 text-lg">4-7-8 Breathing</h3>
      <p className="text-stone-500 text-sm mb-10 text-center max-w-sm">
        This pattern activates your parasympathetic nervous system, reducing anxiety and promoting calm.
      </p>

      <div className="relative flex items-center justify-center mb-10">
        <div className={`w-52 h-52 rounded-full border-4 border-stone-100 flex items-center justify-center transition-all duration-1000 ${running ? current.scale : "scale-100"}`}>
          <div className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-1000 ${running ? current.color : "bg-stone-200"}`}>
            <div className="text-white text-3xl font-bold">{running ? count : "—"}</div>
            <div className="text-white text-sm font-medium mt-1">{running ? current.label : "Ready"}</div>
          </div>
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border-2 border-stone-100 rounded-full flex items-center justify-center text-xs font-bold text-stone-500 shadow">
          {cycles}/{totalCycles}
        </div>
      </div>

      <div className="flex gap-3 mb-10">
        {phases.map((p, i) => (
          <div key={i} className={`text-center transition-all ${running && phase === i ? "opacity-100" : "opacity-40"}`}>
            <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${p.color}`} />
            <div className="text-xs text-stone-500">{p.label}</div>
            <div className="text-xs text-stone-400">{p.duration}s</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => { setRunning(!running); if (!running) { setPhase(0); setCount(phases[0].duration); } }}
        className="bg-sage-700 text-white font-semibold px-10 py-3 rounded-xl hover:bg-sage-800 transition-colors"
      >
        {running ? "Pause" : cycles > 0 ? "Resume" : "Begin"}
      </button>
    </div>
  );
}
