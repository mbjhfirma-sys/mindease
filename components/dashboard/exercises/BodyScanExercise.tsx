"use client";

import { useState, useEffect, useRef } from "react";

export default function BodyScanExercise({ onComplete }: { onComplete: () => void }) {
  const regions = [
    { label: "Feet & Toes", emoji: "🦶", instruction: "Bring your attention to your feet. Notice any sensations — warmth, tingling, pressure, or nothing at all. Simply observe without trying to change anything." },
    { label: "Calves & Shins", emoji: "🦵", instruction: "Move your attention up to your calves and shins. Do you notice any tension? Tightness? Let the muscles soften slightly as you exhale." },
    { label: "Knees & Thighs", emoji: "🦿", instruction: "Sense into your knees and thighs. These muscles often hold tension we don't notice. With each exhale, allow them to release a little more." },
    { label: "Hips & Lower Back", emoji: "🎯", instruction: "Bring awareness to your hips and lower back — a common area of tension and stress. Notice what's here without judgment. Breathe into any tightness." },
    { label: "Abdomen & Chest", emoji: "❤️", instruction: "Feel the rise and fall of your belly and chest with each breath. Notice the sensations of breathing itself. Is it shallow or deep? Tight or expansive?" },
    { label: "Hands & Arms", emoji: "🙌", instruction: "Move to your hands and arms. Uncurl your fingers if they're clenched. Notice the weight of your arms, any tingling in the fingertips." },
    { label: "Shoulders & Neck", emoji: "💆", instruction: "Shoulders and neck — perhaps the most common home of tension. Notice if they're raised toward your ears. With a gentle exhale, allow them to drop and soften." },
    { label: "Face & Head", emoji: "😌", instruction: "Finally, bring awareness to your face. Soften the jaw. Relax the muscles around the eyes. Let your forehead smooth. Feel the entirety of your body at rest." },
  ];

  const [current, setCurrent] = useState(-1);
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const duration = 20;

  useEffect(() => {
    if (current < 0 || current >= regions.length) return;
    setTimer(duration);
    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [current]);

  if (current >= regions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-6xl mb-5">✨</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Body scan complete</h3>
        <p className="text-stone-500 mb-8">Take a moment to notice how you feel compared to when you started.</p>
        <button onClick={onComplete} className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors">Continue →</button>
      </div>
    );
  }

  if (current < 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="text-6xl mb-4">🧘</div>
        <h3 className="font-bold text-stone-800 mb-2 text-lg">Guided Body Scan</h3>
        <p className="text-stone-500 text-sm mb-3">A body scan is a mindfulness practice where you move attention through different parts of the body, noticing sensations without trying to change them.</p>
        <p className="text-stone-400 text-sm mb-8">This session has 8 regions · ~3 minutes total</p>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {regions.map((r, i) => (
            <span key={i} className="text-xs bg-sage-50 text-sage-600 border border-sage-100 px-2.5 py-1 rounded-full">{r.emoji} {r.label}</span>
          ))}
        </div>
        <button onClick={() => setCurrent(0)} className="bg-sage-700 text-white font-semibold px-10 py-3 rounded-xl hover:bg-sage-800 transition-colors">
          Begin Body Scan
        </button>
      </div>
    );
  }

  const region = regions[current];

  return (
    <div className="flex flex-col items-center justify-center min-h-[480px] max-w-lg mx-auto text-center">
      <div className="flex gap-2 mb-8">
        {regions.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < current ? "bg-sage-500" : i === current ? "bg-sage-700 w-4" : "bg-stone-200"}`} />
        ))}
      </div>

      <div className="text-5xl mb-3">{region.emoji}</div>
      <h3 className="text-lg font-bold text-stone-800 mb-4">{region.label}</h3>
      <p className="text-stone-600 text-sm leading-relaxed mb-8">{region.instruction}</p>

      <div className="relative w-24 h-24 mb-6">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#E7E5E4" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="42" fill="none" stroke="#2D6A4F" strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (timer / duration)}`}
            strokeLinecap="round" className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-stone-700">{timer}</span>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={() => setCurrent(current + 1)} className="bg-sage-700 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-sage-800 transition-colors text-sm">
          {current === regions.length - 1 ? "Finish" : "Next →"}
        </button>
      </div>
      <p className="text-stone-400 text-xs mt-4">Step {current + 1} of {regions.length}</p>
    </div>
  );
}
