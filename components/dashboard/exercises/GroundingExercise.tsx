"use client";

import { useState } from "react";

export default function GroundingExercise({ onComplete }: { onComplete: () => void }) {
  const steps = [
    { count: 5, sense: "SEE", instruction: "Name 5 things you can see right now. Look carefully — notice colours, shapes, textures, shadows.", emoji: "👁️", color: "bg-blue-100 text-blue-700" },
    { count: 4, sense: "TOUCH", instruction: "Name 4 things you can physically feel — your feet on the floor, the weight of your body, the air on your skin.", emoji: "✋", color: "bg-sage-100 text-sage-700" },
    { count: 3, sense: "HEAR", instruction: "Name 3 sounds you can hear right now. Near sounds, distant sounds, the sound of your own breathing.", emoji: "👂", color: "bg-purple-100 text-purple-700" },
    { count: 2, sense: "SMELL", instruction: "Name 2 things you can smell, or 2 smells you enjoy and can imagine clearly.", emoji: "👃", color: "bg-amber-100 text-amber-700" },
    { count: 1, sense: "TASTE", instruction: "Name 1 thing you can taste, or one taste you enjoy. Take a moment to savour it mentally.", emoji: "👅", color: "bg-peach-100 text-orange-700" },
  ];

  const [current, setCurrent] = useState(0);
  const [inputs, setInputs] = useState<string[][]>(steps.map((s) => Array(s.count).fill("")));
  const [done, setDone] = useState(false);

  function update(stepIdx: number, itemIdx: number, val: string) {
    const next = inputs.map((arr) => [...arr]);
    next[stepIdx][itemIdx] = val;
    setInputs(next);
  }

  const stepFilled = inputs[current].filter((x) => x.trim().length > 0).length;
  const isComplete = stepFilled >= steps[current].count;

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="text-6xl mb-5">⚓</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Grounded</h3>
        <p className="text-stone-500 mb-8 text-sm">The 5-4-3-2-1 technique interrupts the anxiety spiral by pulling your attention back to your senses and the present moment. Use it whenever anxiety rises.</p>
        <button onClick={onComplete} className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors">Continue →</button>
      </div>
    );
  }

  const step = steps[current];

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">⚓</div>
        <h3 className="font-bold text-stone-800 text-lg">5-4-3-2-1 Grounding</h3>
        <p className="text-stone-400 text-sm mt-1">Step {current + 1} of 5</p>
      </div>

      <div className="flex gap-2 mb-8 justify-center">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
            i < current ? "bg-sage-500 text-white" : i === current ? "bg-sage-700 text-white" : "bg-stone-100 text-stone-400"
          }`}>
            {s.count}
          </div>
        ))}
      </div>

      <div className={`${step.color} rounded-2xl p-5 mb-6 text-center`}>
        <div className="text-3xl mb-2">{step.emoji}</div>
        <div className="font-bold text-lg mb-1">{step.count} things you can {step.sense.toLowerCase()}</div>
        <p className="text-sm opacity-80 leading-relaxed">{step.instruction}</p>
      </div>

      <div className="space-y-3 mb-6">
        {Array.from({ length: step.count }).map((_, i) => (
          <input
            key={i}
            type="text"
            value={inputs[current][i]}
            onChange={(e) => update(current, i, e.target.value)}
            placeholder={`${step.sense.toLowerCase().charAt(0).toUpperCase() + step.sense.toLowerCase().slice(1)} #${i + 1}...`}
            className="w-full border-2 border-stone-200 focus:border-sage-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
          />
        ))}
      </div>

      <button
        onClick={() => { if (current === steps.length - 1) setDone(true); else setCurrent(current + 1); }}
        disabled={!isComplete}
        className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {current === steps.length - 1 ? "Complete ✓" : "Next Sense →"}
      </button>
    </div>
  );
}
