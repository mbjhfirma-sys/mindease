import type { WeeklyFacts } from "@/lib/mindo/factsTypes";
import { formatDateKeyDisplay } from "@/lib/dateKey";

const TILE = "bg-white border border-chart-line rounded-xl p-4";
const LABEL = "text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1";
const VALUE = "text-lg font-semibold text-stone-900";

// Extends the therapist insights tab's original stat-tile grid to cover every field
// computeClientWeeklyFacts() actually returns — previously several were computed but
// silently never rendered (weekEnd, moodSummary.min/max/entryCount, most of
// sleepMoodImpact, the full categoryCompletionTrend[] beyond just the single lowest
// entry, and per-item riskFlagsThisWeek detail beyond a bare count).
export function WeeklyFactsGrid({ facts }: { facts: WeeklyFacts }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className={TILE}>
          <div className={LABEL}>Week</div>
          <div className="text-sm font-semibold text-stone-900">
            {formatDateKeyDisplay(facts.weekStart)} – {formatDateKeyDisplay(facts.weekEnd)}
          </div>
        </div>

        <div className={TILE}>
          <div className={LABEL}>Assignment completion</div>
          <div className={VALUE}>{facts.completion.rate !== null ? `${Math.round(facts.completion.rate * 100)}%` : "—"}</div>
          <div className="text-xs text-stone-400">{facts.completion.completed} of {facts.completion.assigned} possible</div>
        </div>

        <div className={TILE}>
          <div className={LABEL}>Mood this week</div>
          <div className={VALUE}>{facts.moodSummary.avg !== null ? `${facts.moodSummary.avg} avg` : "—"}</div>
          <div className="text-xs text-stone-400 capitalize">
            {facts.moodSummary.trend.replace(/_/g, " ")}
            {facts.moodSummary.entryCount > 0 && ` · ${facts.moodSummary.entryCount} entries (${facts.moodSummary.min}–${facts.moodSummary.max})`}
          </div>
        </div>

        {facts.sleepMoodImpact && facts.sleepMoodImpact.moodDeltaOnPoorSleepDays !== null && (
          <div className={TILE}>
            <div className={LABEL}>Sleep-mood link</div>
            <div className={VALUE}>{facts.sleepMoodImpact.moodDeltaOnPoorSleepDays} pts</div>
            <div className="text-xs text-stone-400 capitalize">
              {facts.sleepMoodImpact.direction.replace(/_/g, " ")} · {facts.sleepMoodImpact.nPoorSleepDays} poor / {facts.sleepMoodImpact.nGoodSleepDays} good sleep days
              {facts.sleepMoodImpact.pearsonR !== null && ` · r=${facts.sleepMoodImpact.pearsonR}`}
            </div>
          </div>
        )}

        {facts.lowestCompletionCategory && (
          <div className={TILE}>
            <div className={LABEL}>Lowest completion</div>
            <div className="text-sm font-semibold text-stone-900 capitalize">{facts.lowestCompletionCategory.activityType}</div>
            <div className="text-xs text-stone-400">{Math.round(facts.lowestCompletionCategory.rate * 100)}% this week</div>
          </div>
        )}

        <div className={TILE}>
          <div className={LABEL}>Risk flags this week</div>
          <div className={`${VALUE} ${facts.riskFlagsThisWeek.length > 0 ? "text-red-600" : ""}`}>{facts.riskFlagsThisWeek.length}</div>
        </div>
      </div>

      {facts.categoryCompletionTrend.length > 1 && (
        <div className={TILE}>
          <div className={`${LABEL} mb-2`}>Completion by category</div>
          <div className="space-y-1.5">
            {facts.categoryCompletionTrend.map((c) => (
              <div key={c.activityType} className="flex items-center justify-between text-xs">
                <span className="text-stone-600 capitalize">{c.activityType}</span>
                <span className="text-stone-400">
                  {Math.round(c.thisWeekRate * 100)}%
                  {c.priorFourWeekAvgRate !== null && ` (vs ${Math.round(c.priorFourWeekAvgRate * 100)}% avg, ${c.direction.replace(/_/g, " ")})`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {facts.riskFlagsThisWeek.length > 0 && (
        <div className={TILE}>
          <div className={`${LABEL} mb-2`}>Risk flag detail</div>
          <div className="space-y-1.5">
            {facts.riskFlagsThisWeek.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className={`font-medium capitalize ${f.severity === "high" ? "text-red-600" : "text-amber-700"}`}>{f.severity}</span>
                <span className="text-stone-400">{f.status} · {new Date(f.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
