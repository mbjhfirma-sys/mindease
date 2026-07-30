import type { DailyFacts } from "@/lib/mindo/factsTypes";

const TILE = "bg-white border border-stone-100 rounded-lg p-3";
const LABEL = "text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1";
const VALUE = "text-sm font-semibold text-stone-900";

// The client-facing counterpart to the therapist insights tab's stat grid — same
// "show every number the narration is actually based on" idea, applied to
// computeClientDailyFacts() instead of the weekly therapist digest.
export function DailyFactsGrid({ facts }: { facts: DailyFacts }) {
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <div className={TILE}>
          <div className={LABEL}>Yesterday&apos;s mood</div>
          <div className={VALUE}>{facts.yesterday.avgMood !== null ? `${facts.yesterday.avgMood} avg` : "—"}</div>
          <div className="text-xs text-stone-400">{facts.yesterday.moodEntries.length} check-in{facts.yesterday.moodEntries.length !== 1 ? "s" : ""}</div>
        </div>

        <div className={TILE}>
          <div className={LABEL}>Yesterday&apos;s tasks</div>
          <div className={VALUE}>{facts.yesterday.missionsCompleted}/{facts.yesterday.missionsAssigned}</div>
          <div className="text-xs text-stone-400">
            {facts.yesterday.completionRate !== null ? `${Math.round(facts.yesterday.completionRate * 100)}% completed` : "none assigned"}
          </div>
        </div>

        <div className={TILE}>
          <div className={LABEL}>7-day mood</div>
          <div className={VALUE}>{facts.last7Days.avgMood !== null ? `${facts.last7Days.avgMood} avg` : "—"}</div>
          <div className="text-xs text-stone-400 capitalize">{facts.last7Days.moodTrend.replace(/_/g, " ")}</div>
        </div>

        <div className={TILE}>
          <div className={LABEL}>Streak</div>
          <div className={VALUE}>{facts.last7Days.currentStreak} day{facts.last7Days.currentStreak !== 1 ? "s" : ""}</div>
          <div className="text-xs text-stone-400">
            {facts.last7Days.completionRate !== null ? `${Math.round(facts.last7Days.completionRate * 100)}% completion this week` : "—"}
          </div>
        </div>

        {facts.yesterday.journalEntries.length > 0 && (
          <div className={TILE}>
            <div className={LABEL}>Yesterday&apos;s journaling</div>
            <div className={VALUE}>{facts.yesterday.journalEntries.length} entr{facts.yesterday.journalEntries.length !== 1 ? "ies" : "y"}</div>
          </div>
        )}

        {facts.openRiskFlag && (
          <div className={TILE}>
            <div className={LABEL}>Open flag</div>
            <div className={`${VALUE} capitalize ${facts.openRiskFlag.severity === "high" ? "text-red-600" : "text-amber-700"}`}>{facts.openRiskFlag.severity}</div>
            <div className="text-xs text-stone-400">{new Date(facts.openRiskFlag.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
          </div>
        )}
      </div>

      {facts.activeTreatmentGoals && (
        <div className={TILE}>
          <div className={`${LABEL} mb-1.5`}>Your treatment goals</div>
          {facts.activeTreatmentGoals.shortTermGoals && (
            <p className="text-xs text-stone-600 mb-1"><span className="font-medium text-stone-700">Short-term:</span> {facts.activeTreatmentGoals.shortTermGoals}</p>
          )}
          {facts.activeTreatmentGoals.longTermGoals && (
            <p className="text-xs text-stone-600"><span className="font-medium text-stone-700">Long-term:</span> {facts.activeTreatmentGoals.longTermGoals}</p>
          )}
        </div>
      )}

      {facts.todaysAssignedMissions.length > 0 && (
        <div className={TILE}>
          <div className={`${LABEL} mb-1.5`}>Today&apos;s tasks</div>
          <ul className="space-y-1">
            {facts.todaysAssignedMissions.map((m, i) => (
              <li key={i} className="text-xs text-stone-600 flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-stone-400 mt-1.5 flex-shrink-0" />
                {m.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
