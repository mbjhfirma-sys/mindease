"use client";

import { useState, useEffect, useRef } from "react";

// Each edge of the box corresponds to one phase of box breathing.
const EDGES = [
  { label: "Inhale", side: "top" as const },
  { label: "Hold", side: "right" as const },
  { label: "Exhale", side: "bottom" as const },
  { label: "Hold", side: "left" as const },
];
const PHASE_SECONDS = 4;
const TOTAL_CYCLES = 6;

export default function BoxBreathingExercise({ onComplete }: { onComplete: () => void }) {
  const [running, setRunning] = useState(false);
  const [edge, setEdge] = useState(0);
  const [count, setCount] = useState(PHASE_SECONDS);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          setEdge((e) => {
            const next = (e + 1) % EDGES.length;
            if (next === 0) {
              setCycles((cy) => {
                if (cy + 1 >= TOTAL_CYCLES) { setRunning(false); return cy + 1; }
                return cy + 1;
              });
            }
            return next;
          });
          return PHASE_SECONDS;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const done = cycles >= TOTAL_CYCLES && !running;

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="text-6xl mb-5">⬜</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Box breathing complete</h3>
        <p className="text-stone-500 mb-8 text-sm">
          Box breathing — used by Navy SEALs to stay calm under pressure — evens out your breath rhythm and
          activates your body's relaxation response within minutes.
        </p>
        <button onClick={onComplete} className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors">Continue →</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[480px]">
      <h3 className="font-bold text-stone-800 mb-2 text-lg">Box Breathing</h3>
      <p className="text-stone-500 text-sm mb-8 text-center max-w-sm">
        Inhale, hold, exhale, hold — 4 seconds each, tracing the box. Follow the glowing edge.
      </p>

      {/* Animated square path */}
      <div className="relative w-56 h-56 mb-8">
        {/* Base square */}
        <div className="absolute inset-4 border-4 border-stone-100 rounded-2xl" />
        {/* Edge highlights */}
        <div className={`absolute top-4 left-4 right-4 h-1 rounded-full transition-colors duration-500 ${running && edge === 0 ? "bg-sage-500" : "bg-transparent"}`} />
        <div className={`absolute top-4 bottom-4 right-4 w-1 rounded-full transition-colors duration-500 ${running && edge === 1 ? "bg-amber-400" : "bg-transparent"}`} />
        <div className={`absolute bottom-4 left-4 right-4 h-1 rounded-full transition-colors duration-500 ${running && edge === 2 ? "bg-blue-400" : "bg-transparent"}`} />
        <div className={`absolute top-4 bottom-4 left-4 w-1 rounded-full transition-colors duration-500 ${running && edge === 3 ? "bg-stone-400" : "bg-transparent"}`} />
        {/* Center readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-stone-800">{running ? count : "—"}</div>
          <div className="text-sm font-medium text-stone-500 mt-1">{running ? EDGES[edge].label : "Ready"}</div>
        </div>
        {/* Cycle counter */}
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border-2 border-stone-100 rounded-full flex items-center justify-center text-xs font-bold text-stone-500 shadow">
          {cycles}/{TOTAL_CYCLES}
        </div>
      </div>

      <div className="flex gap-3 mb-8">
        {EDGES.map((e, i) => (
          <div key={i} className={`text-center transition-all ${running && edge === i ? "opacity-100" : "opacity-40"}`}>
            <div className="text-xs text-stone-500">{e.label}</div>
            <div className="text-xs text-stone-400">{PHASE_SECONDS}s</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => { setRunning(!running); if (!running) { setEdge(0); setCount(PHASE_SECONDS); } }}
        className="bg-sage-700 text-white font-semibold px-10 py-3 rounded-xl hover:bg-sage-800 transition-colors"
      >
        {running ? "Pause" : cycles > 0 ? "Resume" : "Begin"}
      </button>
    </div>
  );
}
