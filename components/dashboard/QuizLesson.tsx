"use client";

import { useState } from "react";
type QuizQuestion = { q: string; options: string[]; correct: number; explanation: string };

interface Props {
  title: string;
  questions: QuizQuestion[];
  onComplete: () => void;
}

export default function QuizLesson({ title, questions, onComplete }: Props) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const q = questions[current];
  const isLast = current === questions.length - 1;
  const score = answers.filter((a, i) => a === questions[i].correct).length;

  function handleSelect(i: number) {
    if (submitted) return;
    setSelected(i);
  }

  function handleSubmit() {
    if (selected === null) return;
    const next = [...answers];
    next[current] = selected;
    setAnswers(next);
    setSubmitted(true);
  }

  function handleNext() {
    if (isLast) {
      setShowResults(true);
    } else {
      setCurrent(current + 1);
      setSelected(null);
      setSubmitted(false);
    }
  }

  if (showResults) {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= 70;
    return (
      <div className="flex flex-col items-center justify-center min-h-[480px] text-center">
        <div className="text-6xl mb-5">{passed ? "🎉" : "📚"}</div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">
          {passed ? "Great work!" : "Keep practising!"}
        </h2>
        <p className="text-stone-500 mb-6">
          You scored <span className="font-bold text-sage-700">{score}/{questions.length}</span> ({pct}%)
        </p>

        {/* Score ring */}
        <div className="relative w-28 h-28 mb-8">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#E7E5E4" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={passed ? "#40916C" : "#FBBF24"} strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-stone-800">{pct}%</span>
          </div>
        </div>

        {/* Review wrong answers */}
        {!passed && (
          <div className="w-full max-w-lg mb-8 space-y-3 text-left">
            <h3 className="font-semibold text-stone-700 text-sm mb-2">Review incorrect answers:</h3>
            {questions.map((q, i) => {
              if (answers[i] === q.correct) return null;
              return (
                <div key={i} className="bg-red-50 border border-red-100 rounded-2xl p-4">
                  <p className="font-medium text-stone-800 text-sm mb-2">{q.q}</p>
                  <p className="text-xs text-red-600 mb-1">Your answer: {q.options[answers[i]!]}</p>
                  <p className="text-xs text-sage-700 mb-2">Correct: {q.options[q.correct]}</p>
                  <p className="text-xs text-stone-500 italic">{q.explanation}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-3">
          {!passed && (
            <button
              onClick={() => { setCurrent(0); setSelected(null); setAnswers(Array(questions.length).fill(null)); setSubmitted(false); setShowResults(false); }}
              className="border border-sage-600 text-sage-700 font-semibold px-6 py-3 rounded-xl hover:bg-sage-50 transition-colors"
            >
              Retry Quiz
            </button>
          )}
          <button
            onClick={onComplete}
            className="bg-sage-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-sage-800 transition-colors"
          >
            {passed ? "Continue →" : "Continue Anyway →"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-stone-800">{title}</h2>
        <span className="text-stone-400 text-sm">{current + 1} / {questions.length}</span>
      </div>
      <div className="w-full bg-stone-100 rounded-full h-1.5 mb-8">
        <div
          className="bg-sage-500 h-1.5 rounded-full transition-all"
          style={{ width: `${((current) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-sage-50 border border-sage-100 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 bg-sage-700 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
            {current + 1}
          </div>
          <p className="text-stone-800 font-semibold leading-relaxed">{q.q}</p>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {q.options.map((opt, i) => {
          let style = "border-stone-200 bg-white text-stone-700 hover:border-sage-400";
          if (submitted) {
            if (i === q.correct) style = "border-sage-500 bg-sage-50 text-sage-800";
            else if (i === selected) style = "border-red-400 bg-red-50 text-red-700";
            else style = "border-stone-100 bg-stone-50 text-stone-400";
          } else if (selected === i) {
            style = "border-sage-500 bg-sage-50 text-sage-800";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`w-full text-left flex items-center gap-4 border-2 rounded-2xl px-5 py-4 transition-all ${style}`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                submitted && i === q.correct ? "border-sage-500 bg-sage-500 text-white" :
                submitted && i === selected && i !== q.correct ? "border-red-400 bg-red-400 text-white" :
                selected === i && !submitted ? "border-sage-500 bg-sage-500 text-white" :
                "border-current"
              }`}>
                {submitted && i === q.correct ? "✓" : submitted && i === selected ? "✕" : ["A","B","C","D"][i]}
              </div>
              <span className="text-sm font-medium">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {submitted && (
        <div className={`rounded-2xl p-5 mb-6 border ${selected === q.correct ? "bg-sage-50 border-sage-200" : "bg-amber-50 border-amber-200"}`}>
          <div className="flex items-start gap-2">
            <span className="text-lg">{selected === q.correct ? "💡" : "📖"}</span>
            <div>
              <p className="font-semibold text-stone-800 text-sm mb-1">
                {selected === q.correct ? "Correct!" : `Correct answer: ${q.options[q.correct]}`}
              </p>
              <p className="text-stone-600 text-sm leading-relaxed">{q.explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selected === null}
            className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors"
          >
            {isLast ? "See Results →" : "Next Question →"}
          </button>
        )}
      </div>
    </div>
  );
}
