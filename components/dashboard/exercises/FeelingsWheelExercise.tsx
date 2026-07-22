"use client";

import { useState } from "react";

const PRIMARY = [
  { id: "happy", label: "Happy", emoji: "😊", color: "bg-amber-100 text-amber-700 border-amber-200", secondary: ["Content", "Proud", "Excited", "Optimistic", "Playful"] },
  { id: "sad", label: "Sad", emoji: "😔", color: "bg-blue-100 text-blue-700 border-blue-200", secondary: ["Lonely", "Disappointed", "Hurt", "Grief", "Guilty"] },
  { id: "angry", label: "Angry", emoji: "😠", color: "bg-red-100 text-red-700 border-red-200", secondary: ["Frustrated", "Resentful", "Irritated", "Betrayed", "Jealous"] },
  { id: "fearful", label: "Fearful", emoji: "😨", color: "bg-purple-100 text-purple-700 border-purple-200", secondary: ["Anxious", "Insecure", "Overwhelmed", "Worried", "Vulnerable"] },
  { id: "disgusted", label: "Disgusted", emoji: "😖", color: "bg-sage-100 text-sage-700 border-sage-200", secondary: ["Disapproving", "Disappointed in self", "Avoidant", "Judgmental", "Repelled"] },
  { id: "surprised", label: "Surprised", emoji: "😲", color: "bg-peach-100 text-orange-700 border-orange-200", secondary: ["Confused", "Amazed", "Startled", "Shocked", "Curious"] },
  { id: "peaceful", label: "Peaceful", emoji: "😌", color: "bg-stone-100 text-stone-700 border-stone-200", secondary: ["Relaxed", "Grateful", "Serene", "Trusting", "Fulfilled"] },
];

type Step = "primary" | "secondary" | "intensity" | "done";

export default function FeelingsWheelExercise({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("primary");
  const [primary, setPrimary] = useState<typeof PRIMARY[number] | null>(null);
  const [specific, setSpecific] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState("");

  if (step === "done" && primary && specific) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="text-6xl mb-5">🎡</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Feeling identified</h3>
        <div className="flex items-center justify-center gap-2 mb-2 text-sm text-stone-400">
          <span>{primary.label}</span><span>→</span><span className="font-bold text-stone-800">{specific}</span>
        </div>
        <div className="w-full bg-stone-100 rounded-full h-2 mb-1 mt-4">
          <div className="bg-sage-500 h-2 rounded-full transition-all" style={{ width: `${intensity * 10}%` }} />
        </div>
        <p className="text-stone-400 text-xs mb-6">Intensity: {intensity}/10</p>
        {note && <p className="text-stone-600 text-sm bg-sage-50 rounded-xl p-3 mb-6">{note}</p>}
        <p className="text-stone-400 text-xs mb-8">
          Naming your emotions with precision — "emotional granularity" — is linked in research to better emotional
          regulation. The more specific the word, the easier it is to know what you actually need.
        </p>
        <button onClick={onComplete} className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors">Continue →</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🎡</div>
        <h3 className="font-bold text-stone-800 text-lg">Feelings Wheel Check-in</h3>
      </div>

      {step === "primary" && (
        <div>
          <p className="text-stone-600 text-sm mb-4 text-center">Which broad emotion feels closest to what you're experiencing?</p>
          <div className="grid grid-cols-2 gap-2">
            {PRIMARY.map((p) => (
              <button
                key={p.id}
                onClick={() => { setPrimary(p); setStep("secondary"); }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all hover:scale-[1.02] ${p.color}`}
              >
                <span className="text-lg">{p.emoji}</span> {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "secondary" && primary && (
        <div>
          <p className="text-stone-600 text-sm mb-4 text-center">
            Within "<span className="font-semibold">{primary.label}</span>" — which word is most precise?
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {primary.secondary.map((s) => (
              <button
                key={s}
                onClick={() => { setSpecific(s); setStep("intensity"); }}
                className="px-4 py-2.5 rounded-xl border-2 border-stone-200 text-stone-700 text-sm font-medium hover:border-sage-400 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
          <button onClick={() => setStep("primary")} className="w-full text-xs text-stone-400 hover:text-stone-600 transition-colors">← Choose a different primary emotion</button>
        </div>
      )}

      {step === "intensity" && specific && (
        <div>
          <p className="text-stone-600 text-sm mb-6 text-center">How intense is "{specific}" right now?</p>
          <div className="px-2 mb-2">
            <input
              type="range" min={1} max={10} value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full accent-sage-600"
            />
          </div>
          <div className="flex justify-between text-xs text-stone-400 mb-6 px-1">
            <span>Mild</span>
            <span className="font-bold text-stone-700 text-sm">{intensity}/10</span>
            <span>Intense</span>
          </div>
          <p className="text-stone-500 text-xs mb-2">What's contributing to this feeling? (optional)</p>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="It might be related to..."
            className="w-full border-2 border-stone-200 focus:border-sage-400 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors resize-none mb-6"
          />
          <button onClick={() => setStep("done")} className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 transition-colors">
            Save Check-in
          </button>
        </div>
      )}
    </div>
  );
}
