"use client";

import { useState, useEffect, useRef } from "react";

type Target = { id: string; label: string; emoji: string; needsName: boolean; defaultName: string };

const TARGETS: Target[] = [
  { id: "self", label: "Yourself", emoji: "🧍", needsName: false, defaultName: "" },
  { id: "loved", label: "Someone You Love", emoji: "💞", needsName: true, defaultName: "someone I love" },
  { id: "neutral", label: "A Neutral Person", emoji: "🚶", needsName: true, defaultName: "someone I saw today" },
  { id: "difficult", label: "Someone Difficult", emoji: "🌩️", needsName: true, defaultName: "someone I find difficult" },
  { id: "all", label: "All Beings", emoji: "🌍", needsName: false, defaultName: "" },
];

function phrasesFor(target: Target, name: string): string[] {
  if (target.id === "self") return ["May I be safe.", "May I be happy.", "May I be healthy.", "May I live with ease."];
  if (target.id === "all") return ["May all beings be safe.", "May all beings be happy.", "May all beings be healthy.", "May all beings live with ease."];
  const who = name.trim() || target.defaultName;
  return [`May ${who} be safe.`, `May ${who} be happy.`, `May ${who} be healthy.`, `May ${who} live with ease.`];
}

const PHRASE_SECONDS = 6;

export default function LovingKindnessExercise({ onComplete }: { onComplete: () => void }) {
  const [targetIdx, setTargetIdx] = useState(0);
  const [phase, setPhase] = useState<"name" | "phrases">("phrases");
  const [name, setName] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [timer, setTimer] = useState(PHRASE_SECONDS);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const target = TARGETS[targetIdx];

  useEffect(() => {
    setPhase(target.needsName ? "name" : "phrases");
    setPhraseIdx(0);
    setName("");
  }, [targetIdx]);

  function nextPhrase() {
    if (phraseIdx >= 3) {
      if (targetIdx >= TARGETS.length - 1) setDone(true);
      else setTargetIdx((t) => t + 1);
    } else {
      setPhraseIdx((p) => p + 1);
      setTimer(PHRASE_SECONDS);
    }
  }

  useEffect(() => {
    if (phase !== "phrases" || done) return;
    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { nextPhrase(); return PHRASE_SECONDS; }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, phraseIdx, targetIdx, done]);

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="text-6xl mb-5">💗</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Loving-kindness complete</h3>
        <p className="text-stone-500 mb-8 text-sm">
          You extended kindness to yourself, someone loved, a stranger, someone difficult, and all beings — the classic
          Metta sequence. Research links this practice to increased positive emotion and reduced self-criticism over time.
        </p>
        <button onClick={onComplete} className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors">Continue →</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">💗</div>
        <h3 className="font-bold text-stone-800 text-lg">Loving-Kindness Meditation</h3>
      </div>

      <div className="flex gap-2 mb-8 justify-center">
        {TARGETS.map((t, i) => (
          <div key={t.id} className={`flex items-center justify-center w-9 h-9 rounded-full text-sm transition-all ${
            i < targetIdx ? "bg-sage-100" : i === targetIdx ? "bg-sage-600" : "bg-stone-100 opacity-50"
          }`}>
            {t.emoji}
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-stone-500 mb-6">Directing kindness toward <span className="font-semibold text-stone-700">{target.label.toLowerCase()}</span></p>

      {phase === "name" && (
        <div>
          <p className="text-stone-600 text-sm mb-3 text-center">Who is this? (or leave blank)</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={target.defaultName}
            className="w-full border-2 border-stone-200 focus:border-sage-400 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors mb-6 text-center"
          />
          <button onClick={() => setPhase("phrases")} className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 transition-colors">
            Begin
          </button>
        </div>
      )}

      {phase === "phrases" && (
        <div className="flex flex-col items-center">
          <div className="w-40 h-40 bg-gradient-to-b from-pink-100 to-sage-100 rounded-full flex items-center justify-center mb-8 animate-pulse">
            <span className="text-5xl">{target.emoji}</span>
          </div>
          <p className="text-lg font-medium text-stone-800 text-center mb-8 min-h-[3rem]">{phrasesFor(target, name)[phraseIdx]}</p>
          <div className="flex gap-1.5 mb-6">
            {[0, 1, 2, 3].map((i) => <div key={i} className={`w-2 h-2 rounded-full ${i <= phraseIdx ? "bg-sage-500" : "bg-stone-200"}`} />)}
          </div>
          <button onClick={nextPhrase} className="text-sm border border-stone-200 text-stone-500 px-6 py-2 rounded-xl hover:bg-stone-50 transition-colors">
            Next phrase ({timer}s) →
          </button>
        </div>
      )}
    </div>
  );
}
