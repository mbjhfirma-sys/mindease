"use client";

import { useState } from "react";

const VALUES = [
  "Family", "Health", "Creativity", "Adventure", "Honesty", "Growth", "Connection", "Achievement",
  "Freedom", "Compassion", "Security", "Spirituality", "Fun", "Justice", "Independence", "Nature",
];

type Step = "select" | "narrow" | "reflect" | "done";

export default function ValuesCardSortExercise({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<string[]>([]);
  const [topThree, setTopThree] = useState<string[]>([]);
  const [chosenOne, setChosenOne] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");

  function toggleSelect(v: string) {
    setSelected((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  function toggleNarrow(v: string) {
    setTopThree((prev) => {
      if (prev.includes(v)) return prev.filter((x) => x !== v);
      if (prev.length >= 3) return prev;
      return [...prev, v];
    });
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-lg mx-auto">
        <div className="text-6xl mb-5">🧭</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Your core values</h3>
        <div className="flex gap-3 my-6">
          {topThree.map((v) => (
            <div key={v} className={`px-4 py-3 rounded-2xl border-2 ${v === chosenOne ? "bg-sage-600 border-sage-600 text-white" : "border-sage-200 text-sage-700"}`}>
              <div className="font-bold text-sm">{v}</div>
              {v === chosenOne && <div className="text-[10px] text-sage-100 mt-0.5">This week's focus</div>}
            </div>
          ))}
        </div>
        {reflection && (
          <div className="bg-sage-50 rounded-2xl p-4 w-full text-left mb-6">
            <p className="text-sm text-stone-700">{reflection}</p>
          </div>
        )}
        <p className="text-stone-400 text-xs mb-8">
          This is values clarification from Acceptance & Commitment Therapy (ACT) — living in line with what genuinely
          matters to you, rather than chasing goals, is strongly linked to lasting wellbeing.
        </p>
        <button onClick={onComplete} className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors">Continue →</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🧭</div>
        <h3 className="font-bold text-stone-800 text-lg">Values Card Sort</h3>
      </div>

      {step === "select" && (
        <div>
          <p className="text-stone-600 text-sm mb-4 text-center">Tap every value that genuinely matters to you. Select at least 5.</p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {VALUES.map((v) => (
              <button
                key={v}
                onClick={() => toggleSelect(v)}
                className={`px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  selected.includes(v) ? "bg-sage-600 border-sage-600 text-white" : "border-stone-200 text-stone-600 hover:border-sage-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-stone-400 mb-4">Selected: {selected.length}</p>
          <button
            onClick={() => setStep("narrow")}
            disabled={selected.length < 5}
            className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {selected.length < 5 ? `Select ${5 - selected.length} more` : "Narrow Down →"}
          </button>
        </div>
      )}

      {step === "narrow" && (
        <div>
          <p className="text-stone-600 text-sm mb-4 text-center">Now narrow it down — tap to keep exactly your top 3.</p>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {selected.map((v) => (
              <button
                key={v}
                onClick={() => toggleNarrow(v)}
                disabled={!topThree.includes(v) && topThree.length >= 3}
                className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all disabled:opacity-30 ${
                  topThree.includes(v) ? "bg-amber-400 border-amber-400 text-stone-900" : "border-stone-200 text-stone-600 hover:border-amber-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-stone-400 mb-4">Kept: {topThree.length}/3</p>
          <button
            onClick={() => setStep("reflect")}
            disabled={topThree.length !== 3}
            className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Continue →
          </button>
        </div>
      )}

      {step === "reflect" && (
        <div>
          <p className="text-stone-600 text-sm mb-4 text-center">Which of these three matters most right now?</p>
          <div className="flex gap-3 justify-center mb-6">
            {topThree.map((v) => (
              <button
                key={v}
                onClick={() => setChosenOne(v)}
                className={`px-4 py-3 rounded-2xl border-2 font-medium text-sm transition-all ${
                  chosenOne === v ? "bg-sage-600 border-sage-600 text-white" : "border-stone-200 text-stone-600 hover:border-sage-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          {chosenOne && (
            <>
              <p className="text-stone-500 text-xs mb-2">How will you honor "{chosenOne}" this week?</p>
              <textarea
                rows={3}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="One small, concrete way I can live this value this week is..."
                className="w-full border-2 border-stone-200 focus:border-sage-400 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors resize-none mb-6"
              />
            </>
          )}
          <button
            onClick={() => setStep("done")}
            disabled={!chosenOne || reflection.trim().length < 5}
            className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Finish
          </button>
        </div>
      )}
    </div>
  );
}
