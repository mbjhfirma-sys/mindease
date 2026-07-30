"use client";

import { Star } from "lucide-react";

// Promoted out of app/dashboard/my-therapist/page.tsx's local, display-only `Stars()` — the
// display branch below is byte-identical markup to that original, so existing call sites are
// a drop-in swap. `onChange` turns it into a real interactive rating input (used by the
// match-feedback prompt) rather than duplicating a second star-row component.
export function StarRating({
  value,
  onChange,
  size = 13,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  if (!onChange) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={i <= Math.round(value) ? "text-amber-400 fill-amber-400" : "text-stone-200 fill-stone-200"}
          />
        ))}
        <span className="text-sm font-semibold text-stone-800 ml-1.5">{value.toFixed(1)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} aria-label={`Rate ${i} out of 5`} className="p-0.5 -m-0.5">
          <Star
            size={size + 4}
            className={i <= value ? "text-amber-400 fill-amber-400" : "text-stone-200 fill-stone-200 hover:text-amber-300 hover:fill-amber-300 transition-colors"}
          />
        </button>
      ))}
    </div>
  );
}
