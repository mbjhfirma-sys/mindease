"use client";

import { useState } from "react";

type Step = "mindfulness" | "humanity" | "kindness" | "done";

export default function SelfCompassionExercise({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("mindfulness");
  const [struggle, setStruggle] = useState("");
  const [humanityNote, setHumanityNote] = useState("");
  const [kindMessage, setKindMessage] = useState("");

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-lg mx-auto">
        <div className="text-6xl mb-5">🤍</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Your self-compassion note</h3>
        <div className="bg-sage-50 border border-sage-100 rounded-2xl p-5 w-full text-left mb-6 space-y-3">
          <p className="text-sm text-stone-700"><span className="font-semibold">This is a moment of suffering:</span> {struggle}</p>
          <p className="text-sm text-stone-700"><span className="font-semibold">Suffering is part of being human.</span> {humanityNote || "I'm not alone in feeling this way."}</p>
          <p className="text-sm text-stone-700"><span className="font-semibold">May I be kind to myself:</span> {kindMessage}</p>
        </div>
        <p className="text-stone-400 text-xs mb-8">
          This is Dr. Kristin Neff's Self-Compassion Break — mindfulness, common humanity, and self-kindness. Research
          shows self-compassion (unlike self-esteem) reliably reduces anxiety and depression without any downside.
        </p>
        <button onClick={onComplete} className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors">Continue →</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🤍</div>
        <h3 className="font-bold text-stone-800 text-lg">Self-Compassion Break</h3>
      </div>

      <div className="flex gap-2 mb-8 justify-center">
        {(["mindfulness", "humanity", "kindness"] as Step[]).map((s, i) => (
          <div key={s} className={`w-8 h-1.5 rounded-full transition-all ${
            (["mindfulness", "humanity", "kindness"] as Step[]).indexOf(step) >= i ? "bg-sage-600" : "bg-stone-200"
          }`} />
        ))}
      </div>

      {step === "mindfulness" && (
        <div>
          <div className="bg-stone-50 rounded-2xl p-4 mb-4 text-center">
            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Step 1 · Mindfulness</div>
            <p className="text-stone-700 text-sm italic">"This is a moment of suffering."</p>
          </div>
          <p className="text-stone-600 text-sm mb-2">What's going on for you right now?</p>
          <textarea rows={3} value={struggle} onChange={(e) => setStruggle(e.target.value)} placeholder="I'm struggling with..." className="w-full border-2 border-stone-200 focus:border-sage-400 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors resize-none mb-6" />
          <button onClick={() => setStep("humanity")} disabled={struggle.trim().length < 5} className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next →</button>
        </div>
      )}

      {step === "humanity" && (
        <div>
          <div className="bg-stone-50 rounded-2xl p-4 mb-4 text-center">
            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Step 2 · Common Humanity</div>
            <p className="text-stone-700 text-sm italic">"Suffering is part of being human. I'm not alone in this."</p>
          </div>
          <p className="text-stone-600 text-sm mb-2">How might other people feel this way too? (optional)</p>
          <textarea rows={2} value={humanityNote} onChange={(e) => setHumanityNote(e.target.value)} placeholder="Lots of people feel this when..." className="w-full border-2 border-stone-200 focus:border-sage-400 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors resize-none mb-6" />
          <button onClick={() => setStep("kindness")} className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 transition-colors">Next →</button>
        </div>
      )}

      {step === "kindness" && (
        <div>
          <div className="bg-stone-50 rounded-2xl p-4 mb-4 text-center">
            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Step 3 · Self-Kindness</div>
            <p className="text-stone-700 text-sm italic">"May I be kind to myself."</p>
          </div>
          <p className="text-stone-600 text-sm mb-2">What would you say to a close friend going through exactly this? Say it to yourself.</p>
          <textarea rows={3} value={kindMessage} onChange={(e) => setKindMessage(e.target.value)} placeholder="It's okay that..." className="w-full border-2 border-stone-200 focus:border-sage-400 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors resize-none mb-6" />
          <button onClick={() => setStep("done")} disabled={kindMessage.trim().length < 5} className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Finish</button>
        </div>
      )}
    </div>
  );
}
