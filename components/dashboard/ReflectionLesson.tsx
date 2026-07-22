"use client";

import { useState } from "react";

interface Props {
  title: string;
  prompt: string;
  onComplete: () => void;
}

export default function ReflectionLesson({ title, prompt, onComplete }: Props) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  function handleSave() {
    setSaved(true);
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[480px] text-center max-w-lg mx-auto">
        <div className="text-6xl mb-5">📓</div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Reflection saved</h2>
        <p className="text-stone-500 mb-2">
          You wrote <span className="font-semibold text-sage-700">{wordCount} words</span>.
        </p>
        <p className="text-stone-400 text-sm mb-8">
          Journaling builds self-awareness over time. Your entries are private and stored only on this device.
        </p>
        <div className="bg-sage-50 border border-sage-100 rounded-2xl p-5 text-left mb-8 w-full">
          <p className="text-stone-500 text-sm leading-relaxed italic line-clamp-4">"{text}"</p>
        </div>
        <button
          onClick={onComplete}
          className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors"
        >
          Continue →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl">📝</div>
        <div>
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Reflection</div>
          <h2 className="font-bold text-stone-800">{title}</h2>
        </div>
      </div>

      {/* Prompt card */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <p className="font-semibold text-stone-800 text-sm mb-1">Your prompt:</p>
            <p className="text-stone-700 text-sm leading-relaxed">{prompt}</p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="flex gap-4 mb-5 flex-wrap">
        {["Write without editing", "No right or wrong answers", "Stay honest with yourself"].map((tip) => (
          <span key={tip} className="text-xs bg-stone-100 text-stone-500 px-3 py-1.5 rounded-full">
            ✦ {tip}
          </span>
        ))}
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start writing here... Let your thoughts flow without judgment."
          rows={12}
          className="w-full bg-white border-2 border-stone-200 focus:border-amber-300 rounded-2xl p-5 text-stone-700 text-sm leading-relaxed resize-none focus:outline-none placeholder-stone-300 transition-colors"
        />
        <div className="absolute bottom-4 right-4 text-xs text-stone-300">
          {wordCount} words
        </div>
      </div>

      {/* Min word suggestion */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className="w-24 bg-stone-100 rounded-full h-1.5">
            <div
              className="bg-amber-400 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min((wordCount / 50) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs text-stone-400">
            {wordCount >= 50 ? "✓ Great depth!" : `${50 - wordCount} more words suggested`}
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={wordCount < 10}
          className="bg-amber-400 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-stone-900 font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          Save Reflection
        </button>
      </div>
    </div>
  );
}
