"use client";

import { useState } from "react";

type Step = "situation" | "thought" | "feeling" | "behavior" | "done";
const ORDER: Step[] = ["situation", "thought", "feeling", "behavior"];

export default function CbtTriangleExercise({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("situation");
  const [situation, setSituation] = useState("");
  const [thought, setThought] = useState("");
  const [feeling, setFeeling] = useState("");
  const [intensity, setIntensity] = useState(5);
  const [behavior, setBehavior] = useState("");

  const Triangle = (
    <div className="relative w-full max-w-xs mx-auto aspect-square mb-6">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <polygon points="100,20 180,170 20,170" fill="none" stroke="#D6D3D1" strokeWidth="2" />
        <line x1="100" y1="20" x2="180" y2="170" stroke="#D6D3D1" strokeWidth="1" strokeDasharray="4" />
        <line x1="180" y1="170" x2="20" y2="170" stroke="#D6D3D1" strokeWidth="1" strokeDasharray="4" />
        <line x1="20" y1="170" x2="100" y2="20" stroke="#D6D3D1" strokeWidth="1" strokeDasharray="4" />
      </svg>
      {/* Thought — top vertex */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 text-center">
        <div className={`rounded-xl border-2 px-2 py-1.5 text-[11px] font-medium ${thought ? "bg-blue-50 border-blue-200 text-blue-700" : "border-stone-200 text-stone-300"}`}>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5 opacity-70">Thought</div>
          {thought || "…"}
        </div>
      </div>
      {/* Feeling — bottom right */}
      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/3 w-24 text-center">
        <div className={`rounded-xl border-2 px-2 py-1.5 text-[11px] font-medium ${feeling ? "bg-red-50 border-red-200 text-red-700" : "border-stone-200 text-stone-300"}`}>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5 opacity-70">Feeling</div>
          {feeling || "…"}
        </div>
      </div>
      {/* Behavior — bottom left */}
      <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/3 w-24 text-center">
        <div className={`rounded-xl border-2 px-2 py-1.5 text-[11px] font-medium ${behavior ? "bg-sage-50 border-sage-200 text-sage-700" : "border-stone-200 text-stone-300"}`}>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5 opacity-70">Behavior</div>
          {behavior || "…"}
        </div>
      </div>
    </div>
  );

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="text-6xl mb-5">🔺</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Your CBT triangle</h3>
        <p className="text-stone-500 text-xs mb-4 bg-stone-50 rounded-xl p-3 w-full">"{situation}"</p>
        {Triangle}
        <p className="text-stone-400 text-xs mb-8">
          This is the core CBT model: situations trigger thoughts, thoughts drive feelings, and feelings shape behavior
          — which often reinforces the original thought. You can interrupt this loop at any point, but thoughts are
          usually the easiest place to start.
        </p>
        <button onClick={onComplete} className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors">Continue →</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🔺</div>
        <h3 className="font-bold text-stone-800 text-lg">Thought–Feeling–Behavior</h3>
      </div>

      <div className="flex gap-2 mb-6 justify-center">
        {ORDER.map((s, i) => (
          <div key={s} className={`w-8 h-1.5 rounded-full transition-all ${ORDER.indexOf(step) >= i ? "bg-sage-600" : "bg-stone-200"}`} />
        ))}
      </div>

      {step === "situation" && (
        <div>
          <p className="text-stone-600 text-sm mb-4 text-center">Describe a recent situation that bothered you.</p>
          <textarea rows={3} value={situation} onChange={(e) => setSituation(e.target.value)} placeholder="What happened..." className="w-full border-2 border-stone-200 focus:border-sage-400 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors resize-none mb-6" />
          <button onClick={() => setStep("thought")} disabled={situation.trim().length < 5} className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next →</button>
        </div>
      )}

      {step === "thought" && (
        <div>
          {Triangle}
          <p className="text-stone-600 text-sm mb-4 text-center">What thought went through your mind?</p>
          <input type="text" value={thought} onChange={(e) => setThought(e.target.value)} placeholder="The thought that came up was..." className="w-full border-2 border-stone-200 focus:border-blue-400 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors mb-6" />
          <button onClick={() => setStep("feeling")} disabled={thought.trim().length < 2} className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next →</button>
        </div>
      )}

      {step === "feeling" && (
        <div>
          {Triangle}
          <p className="text-stone-600 text-sm mb-4 text-center">What emotion did you feel — and how strong was it?</p>
          <input type="text" value={feeling} onChange={(e) => setFeeling(e.target.value)} placeholder="e.g. Anxious, embarrassed..." className="w-full border-2 border-stone-200 focus:border-red-400 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors mb-4" />
          <input type="range" min={1} max={10} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="w-full accent-red-500 mb-1" />
          <p className="text-center text-xs text-stone-400 mb-6">Intensity: {intensity}/10</p>
          <button onClick={() => setStep("behavior")} disabled={feeling.trim().length < 2} className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next →</button>
        </div>
      )}

      {step === "behavior" && (
        <div>
          {Triangle}
          <p className="text-stone-600 text-sm mb-4 text-center">What did you do — or want to do — in response?</p>
          <input type="text" value={behavior} onChange={(e) => setBehavior(e.target.value)} placeholder="I ended up..." className="w-full border-2 border-stone-200 focus:border-sage-400 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors mb-6" />
          <button onClick={() => setStep("done")} disabled={behavior.trim().length < 2} className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">See My Triangle</button>
        </div>
      )}
    </div>
  );
}
