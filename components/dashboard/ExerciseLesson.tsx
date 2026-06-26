"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  title: string;
  exerciseType: "breathing" | "bodyscan" | "gratitude" | "grounding";
  onComplete: () => void;
}

// ─── Breathing Exercise ───────────────────────────────────────────────────────
function BreathingExercise({ onComplete }: { onComplete: () => void }) {
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

      {/* Circle */}
      <div className="relative flex items-center justify-center mb-10">
        {/* Outer ring */}
        <div className={`w-52 h-52 rounded-full border-4 border-stone-100 flex items-center justify-center transition-all duration-1000 ${running ? current.scale : "scale-100"}`}>
          {/* Inner breathing circle */}
          <div className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-1000 ${running ? current.color : "bg-stone-200"}`}>
            <div className="text-white text-3xl font-bold">{running ? count : "—"}</div>
            <div className="text-white text-sm font-medium mt-1">{running ? current.label : "Ready"}</div>
          </div>
        </div>
        {/* Cycle counter */}
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border-2 border-stone-100 rounded-full flex items-center justify-center text-xs font-bold text-stone-500 shadow">
          {cycles}/{totalCycles}
        </div>
      </div>

      {/* Phase indicators */}
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

// ─── Body Scan ───────────────────────────────────────────────────────────────
function BodyScanExercise({ onComplete }: { onComplete: () => void }) {
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
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {regions.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < current ? "bg-sage-500" : i === current ? "bg-sage-700 w-4" : "bg-stone-200"}`} />
        ))}
      </div>

      <div className="text-5xl mb-3">{region.emoji}</div>
      <h3 className="text-lg font-bold text-stone-800 mb-4">{region.label}</h3>
      <p className="text-stone-600 text-sm leading-relaxed mb-8">{region.instruction}</p>

      {/* Timer ring */}
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

// ─── Gratitude Exercise ───────────────────────────────────────────────────────
function GratitudeExercise({ onComplete }: { onComplete: () => void }) {
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

// ─── Grounding Exercise ───────────────────────────────────────────────────────
function GroundingExercise({ onComplete }: { onComplete: () => void }) {
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

      {/* Progress */}
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

// ─── Main export ─────────────────────────────────────────────────────────────
export default function ExerciseLesson({ title, exerciseType, onComplete }: Props) {
  const typeLabels: Record<string, string> = {
    breathing: "Breathing Exercise",
    bodyscan: "Body Scan",
    gratitude: "Gratitude Practice",
    grounding: "Grounding Exercise",
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-sage-100 rounded-xl flex items-center justify-center text-xl">
          {exerciseType === "breathing" ? "🌬️" : exerciseType === "bodyscan" ? "🧘" : exerciseType === "gratitude" ? "🌻" : "⚓"}
        </div>
        <div>
          <div className="text-xs font-semibold text-sage-600 uppercase tracking-wide">{typeLabels[exerciseType]}</div>
          <h2 className="font-bold text-stone-800">{title}</h2>
        </div>
      </div>

      {exerciseType === "breathing" && <BreathingExercise onComplete={onComplete} />}
      {exerciseType === "bodyscan" && <BodyScanExercise onComplete={onComplete} />}
      {exerciseType === "gratitude" && <GratitudeExercise onComplete={onComplete} />}
      {exerciseType === "grounding" && <GroundingExercise onComplete={onComplete} />}
    </div>
  );
}
