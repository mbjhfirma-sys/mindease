"use client";

import { useState } from "react";

export default function GratitudeExercise({ onComplete }: { onComplete: () => void }) {
  const [items, setItems] = useState(["", "", ""]);
  const [saved, setSaved] = useState(false);

  function update(i: number, val: string) {
    const next = [...items];
    next[i] = val;
    setItems(next);
  }

  const filled = items.filter((x) => x.trim().length > 2).length;

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="text-6xl mb-5">🌻</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Gratitude logged</h3>
        <p className="text-stone-500 mb-6 text-sm">Research by Emmons & McCullough shows daily gratitude practice increases wellbeing, improves sleep, and strengthens relationships over time.</p>
        <div className="bg-sage-50 rounded-2xl p-5 w-full text-left mb-8 space-y-2">
          {items.filter(Boolean).map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-stone-700">
              <span className="text-sage-500 mt-0.5">✦</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <button onClick={onComplete} className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors">Continue →</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🌻</div>
        <h3 className="font-bold text-stone-800 text-lg mb-2">Gratitude Practice</h3>
        <p className="text-stone-500 text-sm leading-relaxed">
          Write 3 things you're genuinely grateful for right now. They can be big or small — a conversation, your health, a cup of tea. The key is specificity and sincerity.
        </p>
      </div>
      <div className="space-y-4 mb-8">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
              {i + 1}
            </div>
            <input
              type="text"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={["I'm grateful for...", "Something that made me smile...", "A person or thing I appreciate..."][i]}
              className="flex-1 border-2 border-stone-200 focus:border-amber-300 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
            />
          </div>
        ))}
      </div>
      <button
        onClick={() => setSaved(true)}
        disabled={filled < 3}
        className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-stone-900 font-semibold py-3 rounded-xl transition-colors"
      >
        {filled < 3 ? `Add ${3 - filled} more ${3 - filled === 1 ? "item" : "items"}` : "Save Gratitude List"}
      </button>
    </div>
  );
}
