"use client";

import { useState } from "react";
import type { ArticleBlock } from "@/lib/articles/types";
import QuizLesson from "./QuizLesson";
import ReflectionLesson from "./ReflectionLesson";
import ExerciseLesson, { EXERCISE_META } from "./ExerciseLesson";

const CALLOUT_STYLE: Record<string, { bg: string; icon: string }> = {
  tip: { bg: "bg-amber-50 border-amber-200 text-amber-900", icon: "💡" },
  fact: { bg: "bg-blue-50 border-blue-200 text-blue-900", icon: "🔎" },
  quote: { bg: "bg-stone-50 border-stone-200 text-stone-600", icon: "❝" },
  warning: { bg: "bg-red-50 border-red-200 text-red-900", icon: "⚠️" },
};

function ChecklistBlock({ prompt, items }: { prompt: string; items: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="bg-sage-50 border border-sage-100 rounded-2xl p-5">
      <p className="font-semibold text-stone-800 text-sm mb-3">{prompt}</p>
      <div className="space-y-2">
        {items.map((item, i) => {
          const isChecked = checked.has(i);
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              className="w-full flex items-center gap-3 text-left bg-white rounded-xl px-4 py-2.5 border border-stone-100 hover:border-sage-300 transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-colors ${
                  isChecked ? "bg-sage-600 border-sage-600 text-white" : "border-stone-300 text-transparent"
                }`}
              >
                ✓
              </div>
              <span className={`text-sm transition-colors ${isChecked ? "text-stone-400 line-through" : "text-stone-700"}`}>{item}</span>
            </button>
          );
        })}
      </div>
      <div className="text-xs text-stone-400 mt-3">{checked.size}/{items.length} checked</div>
    </div>
  );
}

export default function ArticleBlocks({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <h2 key={i} className="text-lg font-bold text-stone-900 pt-1">
                {block.text}
              </h2>
            );

          case "paragraph":
            return (
              <p key={i} className="text-stone-600 text-sm leading-relaxed">
                {block.text}
              </p>
            );

          case "callout": {
            const style = CALLOUT_STYLE[block.style];
            return (
              <div key={i} className={`rounded-2xl border p-4 flex items-start gap-3 ${style.bg}`}>
                <span className="text-lg flex-shrink-0">{style.icon}</span>
                <div>
                  {block.label && <p className="text-xs font-bold uppercase tracking-wide mb-1 opacity-70">{block.label}</p>}
                  <p className={`text-sm leading-relaxed ${block.style === "quote" ? "italic" : ""}`}>{block.text}</p>
                </div>
              </div>
            );
          }

          case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return (
              <Tag key={i} className="space-y-2">
                {block.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-stone-600 leading-relaxed">
                    {block.ordered ? (
                      <span className="w-5 h-5 rounded-full bg-sage-100 text-sage-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {j + 1}
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-sage-400 flex-shrink-0 mt-1.5" />
                    )}
                    <span>{item}</span>
                  </li>
                ))}
              </Tag>
            );
          }

          case "stats":
            return (
              <div key={i} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {block.items.map((s, j) => (
                  <div key={j} className="bg-stone-50 rounded-xl p-3.5 text-center">
                    <div className="font-bold text-sage-700 text-lg">{s.value}</div>
                    <div className="text-stone-400 text-[11px] mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            );

          case "checklist":
            return <ChecklistBlock key={i} prompt={block.prompt} items={block.items} />;

          case "reflection":
            return (
              <div key={i} className="bg-white rounded-3xl border border-stone-100 p-4 md:p-6">
                <ReflectionLesson title="Reflect" prompt={block.prompt} onComplete={() => {}} />
              </div>
            );

          case "quiz":
            return (
              <div key={i} className="bg-white rounded-3xl border border-stone-100 p-4 md:p-6">
                <QuizLesson title="Check your understanding" questions={block.questions} onComplete={() => {}} />
              </div>
            );

          case "exercise": {
            const meta = EXERCISE_META[block.exerciseType];
            return (
              <div key={i} className="bg-white rounded-3xl border border-stone-100 p-4 md:p-6">
                <ExerciseLesson title={block.title ?? `Try it: ${meta.label}`} exerciseType={block.exerciseType} onComplete={() => {}} />
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
