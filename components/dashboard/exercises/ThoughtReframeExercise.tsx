"use client";

import { useState } from "react";

const DISTORTIONS = [
  { id: "catastrophizing", label: "Catastrophizing", def: "Assuming the worst possible outcome will happen." },
  { id: "allornothing", label: "All-or-Nothing", def: "Seeing things in black-and-white extremes, no middle ground." },
  { id: "mindreading", label: "Mind Reading", def: "Assuming you know what others are thinking about you." },
  { id: "fortunetelling", label: "Fortune Telling", def: "Predicting a negative future as if it's already certain." },
  { id: "shouldstatements", label: "Should Statements", def: "Holding rigid rules for yourself or others ('I should...')." },
  { id: "labeling", label: "Labeling", def: "Attaching a harsh global label to yourself over one event." },
  { id: "emotionalreasoning", label: "Emotional Reasoning", def: "Believing something is true because it feels true." },
  { id: "discountingpositive", label: "Discounting the Positive", def: "Dismissing good things as not counting or being flukes." },
];

type Step = "thought" | "distortions" | "reframe" | "done";

export default function ThoughtReframeExercise({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("thought");
  const [thought, setThought] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [reframe, setReframe] = useState("");

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-lg mx-auto">
        <div className="text-6xl mb-5">🔄</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Thought reframed</h3>
        <div className="w-full space-y-3 my-6 text-left">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Original thought</div>
            <p className="text-sm text-stone-700">{thought}</p>
          </div>
          <div className="bg-sage-50 border border-sage-100 rounded-2xl p-4">
            <div className="text-xs font-bold text-sage-600 uppercase tracking-widest mb-1">Balanced reframe</div>
            <p className="text-sm text-stone-700">{reframe}</p>
          </div>
        </div>
        <p className="text-stone-400 text-xs mb-8">
          This is Cognitive Behavioral Therapy's core skill: catching automatic thoughts, spotting the distortion, and
          replacing them with a more balanced view — practiced over time, it genuinely rewires reactive thinking patterns.
        </p>
        <button onClick={onComplete} className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors">Continue →</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🔄</div>
        <h3 className="font-bold text-stone-800 text-lg">Thought Reframe</h3>
      </div>

      <div className="flex gap-2 mb-8 justify-center">
        {(["thought", "distortions", "reframe"] as Step[]).map((s, i) => (
          <div key={s} className={`w-8 h-1.5 rounded-full transition-all ${
            (["thought", "distortions", "reframe"] as Step[]).indexOf(step) >= i ? "bg-sage-600" : "bg-stone-200"
          }`} />
        ))}
      </div>

      {step === "thought" && (
        <div>
          <p className="text-stone-600 text-sm mb-4">What's a negative thought that's been on your mind? Write it exactly as it occurs to you.</p>
          <textarea
            rows={3}
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            placeholder="e.g. I always mess everything up..."
            className="w-full border-2 border-stone-200 focus:border-sage-400 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors resize-none mb-6"
          />
          <button
            onClick={() => setStep("distortions")}
            disabled={thought.trim().length < 5}
            className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {step === "distortions" && (
        <div>
          <p className="text-stone-600 text-sm mb-4">Do any of these thinking patterns apply to your thought? Select any that fit — there's no wrong answer.</p>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {DISTORTIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => toggle(d.id)}
                title={d.def}
                className={`text-left px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                  selected.includes(d.id) ? "bg-sage-600 border-sage-600 text-white" : "border-stone-200 text-stone-600 hover:border-sage-300"
                }`}
              >
                {d.label}
                <div className={`text-[10px] font-normal mt-0.5 ${selected.includes(d.id) ? "text-sage-100" : "text-stone-400"}`}>{d.def}</div>
              </button>
            ))}
          </div>
          <button onClick={() => setStep("reframe")} className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 transition-colors">
            Next →
          </button>
        </div>
      )}

      {step === "reframe" && (
        <div>
          <p className="text-stone-600 text-sm mb-2">Now write a more balanced version of the thought.</p>
          <p className="text-stone-400 text-xs mb-4">Tip: what would you tell a friend who had this exact thought?</p>
          <textarea
            rows={3}
            value={reframe}
            onChange={(e) => setReframe(e.target.value)}
            placeholder="A fairer, more balanced way to see this is..."
            className="w-full border-2 border-stone-200 focus:border-sage-400 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors resize-none mb-6"
          />
          <button
            onClick={() => setStep("done")}
            disabled={reframe.trim().length < 5}
            className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save Reframe
          </button>
        </div>
      )}
    </div>
  );
}
