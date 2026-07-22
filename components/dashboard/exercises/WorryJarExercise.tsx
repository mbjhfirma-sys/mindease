"use client";

import { useState, useEffect } from "react";

const WORRY_TIMES = ["In 1 hour", "This evening", "Tomorrow morning"];

function WorryChip({ text }: { text: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className={`bg-white border border-stone-200 rounded-full px-3 py-1.5 text-xs text-stone-600 shadow-sm transition-all duration-700 ease-out ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
      }`}
    >
      {text}
    </div>
  );
}

export default function WorryJarExercise({ onComplete }: { onComplete: () => void }) {
  const [worries, setWorries] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [worryTime, setWorryTime] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function addWorry() {
    const text = draft.trim();
    if (!text || worries.length >= 5) return;
    setWorries((prev) => [...prev, text]);
    setDraft("");
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="text-6xl mb-5">🫙</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Worries sealed away</h3>
        <p className="text-stone-500 mb-2 text-sm">
          You've set aside {worries.length} worr{worries.length === 1 ? "y" : "ies"} for <span className="font-semibold text-stone-700">{worryTime?.toLowerCase()}</span>.
        </p>
        <p className="text-stone-400 text-xs mb-8">
          Worry postponement is a well-supported CBT technique for anxiety: instead of suppressing worries (which
          backfires), you give them a specific, later time — freeing your mind now while honoring the worry itself.
        </p>
        <button onClick={onComplete} className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors">Continue →</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🫙</div>
        <h3 className="font-bold text-stone-800 text-lg">Worry Jar</h3>
        <p className="text-stone-500 text-sm mt-2">Write down what's worrying you and drop it in the jar — you'll deal with it later, at a time you choose.</p>
      </div>

      {/* The jar */}
      <div className="relative mx-auto mb-6 w-48">
        <div className="border-4 border-stone-200 border-t-0 rounded-b-[2rem] rounded-t-md bg-stone-50 min-h-[180px] p-3 flex flex-col-reverse gap-1.5 items-center justify-start overflow-hidden">
          {worries.length === 0 && <p className="text-stone-300 text-xs my-auto">Empty for now</p>}
          {worries.map((w, i) => <WorryChip key={i} text={w} />)}
        </div>
        <div className="h-3 bg-stone-300 rounded-t-lg -mt-1 mx-4" />
      </div>

      {worries.length < 5 && (
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addWorry(); } }}
            placeholder="What's on your mind?"
            className="flex-1 border-2 border-stone-200 focus:border-sage-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
          />
          <button onClick={addWorry} disabled={!draft.trim()} className="bg-stone-800 text-white font-medium px-4 rounded-xl hover:bg-stone-900 disabled:opacity-40 transition-colors text-sm">
            Drop it in
          </button>
        </div>
      )}

      {worries.length > 0 && (
        <>
          <p className="text-stone-600 text-sm mb-3 text-center">Now, schedule a worry time to revisit these:</p>
          <div className="flex gap-2 justify-center mb-6">
            {WORRY_TIMES.map((t) => (
              <button
                key={t}
                onClick={() => setWorryTime(t)}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                  worryTime === t ? "bg-sage-600 border-sage-600 text-white" : "border-stone-200 text-stone-600 hover:border-sage-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => setDone(true)}
            disabled={!worryTime}
            className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Seal the Jar
          </button>
        </>
      )}
    </div>
  );
}
