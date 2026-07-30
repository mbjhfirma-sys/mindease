"use client";

import { useState } from "react";
import { StarRating } from "@/components/dashboard/StarRating";

export function MatchFeedbackPrompt({
  feedbackId,
  counterpartName,
  counterpartRole,
  onDone,
}: {
  feedbackId: string;
  counterpartName: string;
  counterpartRole: "CLIENT" | "THERAPIST";
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (rating === 0 || busy) return;
    setBusy(true);
    const res = await fetch(`/api/match-feedback/${feedbackId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit", rating, comment: comment.trim() || undefined }),
    });
    setBusy(false);
    if (res.ok) onDone();
  }

  async function skip() {
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/match-feedback/${feedbackId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "skip" }),
    });
    setBusy(false);
    if (res.ok) onDone();
  }

  const prompt = counterpartRole === "THERAPIST"
    ? `Has working with ${counterpartName} felt like a good fit?`
    : `How has the fit been with ${counterpartName}?`;

  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-6">
      <p className="text-sm font-semibold text-stone-900">{prompt}</p>
      <p className="text-xs text-stone-400 mt-1">This helps us match people well — it&apos;s quick, and you can skip it.</p>
      <div className="mt-3">
        <StarRating value={rating} onChange={setRating} />
      </div>
      {rating > 0 && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Anything you'd like to add? (optional)"
          rows={2}
          className="mt-3 w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sage-400 resize-none"
        />
      )}
      <div className="flex gap-2 mt-3">
        <button
          onClick={submit}
          disabled={rating === 0 || busy}
          className="text-xs bg-stone-900 text-white px-4 py-2 rounded-xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          Submit
        </button>
        <button
          onClick={skip}
          disabled={busy}
          className="text-xs border border-stone-200 text-stone-500 px-4 py-2 rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-50"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
