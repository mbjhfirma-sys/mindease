import type { MatchReasonFactor } from "@/lib/matching";

const DIRECTION_STYLE: Record<MatchReasonFactor["direction"], string> = {
  positive: "text-sage-600",
  negative: "text-stone-400",
  neutral: "text-stone-300",
};
const DIRECTION_ICON: Record<MatchReasonFactor["direction"], string> = {
  positive: "✓",
  negative: "–",
  neutral: "•",
};

function weightLabel(weight: number): string {
  return weight > 0 ? `+${weight}` : `${weight}`;
}

// Shared match-reasoning display. Two modes:
// - Full (default): a vertical list of every applicable factor, including zero/negative-weight
//   ones — deliberate full transparency, not cherry-picked positives.
// - compact: inline pills of positive factors only (top 3), sized for a dense row like a
//   waitlist table entry.
// showWeights is off for client-facing call sites (warmer, qualitative tone — no visible
// score) and on for therapist-facing ones (more clinical/operational audience).
export function MatchFactorsList({
  factors,
  compact = false,
  showWeights = false,
}: {
  factors: MatchReasonFactor[];
  compact?: boolean;
  showWeights?: boolean;
}) {
  if (!factors || factors.length === 0) return null;

  if (compact) {
    const positives = factors.filter((f) => f.direction === "positive").slice(0, 3);
    if (positives.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5">
        {positives.map((f) => (
          <span key={f.key} className="text-[10px] font-medium bg-sage-50 text-sage-800 px-2 py-0.5 rounded-full">
            {f.label}
            {showWeights ? ` (${weightLabel(f.weight)})` : ""}
          </span>
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-1.5">
      {factors.map((f) => (
        <li key={f.key} className="flex items-start gap-2 text-sm">
          <span className={`mt-0.5 flex-shrink-0 font-semibold ${DIRECTION_STYLE[f.direction]}`}>{DIRECTION_ICON[f.direction]}</span>
          <span className="text-stone-600">
            {f.label}
            {showWeights && <span className="text-stone-400 ml-1.5">({weightLabel(f.weight)})</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
