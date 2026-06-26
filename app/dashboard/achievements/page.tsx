"use client";

import { useState, useEffect } from "react";
import { userStats, badges, activeChallenge, moodHistory, type Badge } from "@/lib/mockData";
import { Flame, CheckSquare, Clock, BookOpen, PenLine, Activity, X, CheckCircle2, Circle, ChevronRight } from "lucide-react";

// ── Mood helpers ──────────────────────────────────────────────────────────────

const MOOD_LABELS = ["", "Low", "Not great", "Okay", "Good", "Great"];
const MOOD_EMOJIS = ["", "😔", "😟", "😐", "🙂", "😊"];
const MOOD_COLORS = ["", "bg-red-300", "bg-orange-300", "bg-amber-300", "bg-lime-400", "bg-sage-400"];

// ── Milestone category config ─────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  streak:    { label: "Consistency",  color: "bg-amber-100 text-amber-700" },
  mission:   { label: "Daily tasks",  color: "bg-sage-100 text-sage-700" },
  course:    { label: "Learning",     color: "bg-blue-100 text-blue-700" },
  journal:   { label: "Reflection",   color: "bg-violet-100 text-violet-700" },
  community: { label: "Community",    color: "bg-teal-100 text-teal-700" },
  special:   { label: "Special",      color: "bg-stone-100 text-stone-600" },
};

const CATEGORY_FILTERS = ["all", "streak", "mission", "course", "journal", "community", "special"] as const;
type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

// ── Milestone detail panel ────────────────────────────────────────────────────

function MilestoneSheet({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const cat = CATEGORY_CONFIG[badge.category];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="px-6 pt-5 pb-6">
          <div className="flex items-start gap-4 mb-5">
            <div className={`mt-0.5 flex-shrink-0 ${badge.earned ? "text-sage-600" : "text-stone-300"}`}>
              {badge.earned
                ? <CheckCircle2 size={28} strokeWidth={1.5} />
                : <Circle size={28} strokeWidth={1.5} />
              }
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900 mb-0.5">{badge.title}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat?.color ?? "bg-stone-100 text-stone-500"}`}>
                {cat?.label ?? badge.category}
              </span>
            </div>
          </div>

          <p className="text-sm text-stone-500 leading-relaxed mb-5">{badge.description}</p>

          <div className={`rounded-xl px-4 py-3 text-sm ${
            badge.earned
              ? "bg-sage-50 border border-sage-100 text-sage-700"
              : "bg-stone-50 border border-stone-100 text-stone-400"
          }`}>
            {badge.earned
              ? `Achieved on ${badge.earnedDate}`
              : "Not yet achieved — keep going"
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const [activeTab, setActiveTab]             = useState<"overview" | "milestones" | "mood">("overview");
  const [milestoneFilter, setMilestoneFilter] = useState<CategoryFilter>("all");
  const [selectedBadge, setSelectedBadge]     = useState<Badge | null>(null);
  const [challengeDone, setChallengeDone]     = useState(false);
  const [selectedMoodIdx, setSelectedMoodIdx] = useState<number | null>(null);
  const [animated, setAnimated]               = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  const filteredBadges   = milestoneFilter === "all" ? badges : badges.filter((b) => b.category === milestoneFilter);
  const earnedFiltered   = filteredBadges.filter((b) => b.earned);
  const pendingFiltered  = filteredBadges.filter((b) => !b.earned);

  const challengeProgress = challengeDone
    ? Math.min(activeChallenge.progress + 1, activeChallenge.total)
    : activeChallenge.progress;

  const moodAvg    = (moodHistory.reduce((s, e) => s + e.score, 0) / moodHistory.length).toFixed(1);
  const moodAvgInt = Math.round(parseFloat(moodAvg));

  const metrics = [
    { label: "Consistency streak", value: `${userStats.currentStreak} days`, sub: `Best: ${userStats.longestStreak} days`, Icon: Flame },
    { label: "Tasks completed",    value: userStats.missionsCompleted,        sub: "Since joining",              Icon: CheckSquare },
    { label: "Minutes in practice",value: userStats.minutesMeditated,        sub: "Meditation & breathing",     Icon: Clock },
    { label: "Courses in progress",value: userStats.coursesCompleted + 2,    sub: `${userStats.coursesCompleted} completed`, Icon: BookOpen },
    { label: "Journal entries",    value: userStats.journalEntries,          sub: "Private entries",            Icon: PenLine },
    { label: "Wellness score",     value: `${userStats.wellnessScore}%`,     sub: "+4% this week",              Icon: Activity },
  ];

  const wellnessBreakdown = [
    { label: "Emotional wellbeing", pct: 74, note: "Mood tracking" },
    { label: "Consistency",         pct: 82, note: "Task & session attendance" },
    { label: "Learning progress",   pct: 65, note: "Course completion" },
    { label: "Social connection",   pct: 55, note: "Community engagement" },
    { label: "Self-awareness",      pct: 78, note: "Journal frequency" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">My Progress</h1>
        <p className="text-sm text-stone-500 mt-1">A summary of your wellness journey</p>
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-stone-100 rounded-xl px-4 py-3 text-center">
          <div className="text-xl font-bold text-stone-900">{userStats.currentStreak}</div>
          <div className="text-xs text-stone-400 mt-0.5">day streak</div>
        </div>
        <div className="bg-white border border-stone-100 rounded-xl px-4 py-3 text-center">
          <div className="text-xl font-bold text-stone-900">{userStats.missionsCompleted}</div>
          <div className="text-xs text-stone-400 mt-0.5">tasks done</div>
        </div>
        <div className="bg-white border border-stone-100 rounded-xl px-4 py-3 text-center">
          <div className="text-xl font-bold text-stone-900">{userStats.wellnessScore}%</div>
          <div className="text-xs text-stone-400 mt-0.5">wellness</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
        {(["overview", "milestones", "mood"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
              activeTab === tab
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {metrics.map(({ label, value, sub, Icon }) => (
              <div
                key={label}
                className="bg-white border border-stone-100 rounded-xl p-5 hover:border-stone-200 hover:shadow-sm transition-all"
              >
                <div className="mb-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center">
                    <Icon size={15} className="text-stone-400" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="text-2xl font-semibold text-stone-900">{value}</div>
                <div className="text-sm text-stone-600 mt-1">{label}</div>
                <div className="text-xs text-stone-400 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-stone-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-stone-900">Wellness Score Breakdown</h2>
              <span className="text-xl font-semibold text-stone-900">{userStats.wellnessScore}%</span>
            </div>
            <div className="space-y-4">
              {wellnessBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-sm text-stone-700">{item.label}</span>
                      <span className="text-xs text-stone-400 ml-2">{item.note}</span>
                    </div>
                    <span className="text-sm font-medium text-stone-700">{item.pct}%</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1.5">
                    <div
                      className="bg-sage-600 h-1.5 rounded-full transition-all duration-700 ease-out"
                      style={{ width: animated ? `${item.pct}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-stone-100 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Active Challenge</p>
                <h3 className="text-sm font-semibold text-stone-900">{activeChallenge.title}</h3>
                <p className="text-xs text-stone-500 mt-0.5">{activeChallenge.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-stone-400">Ends in</div>
                <div className="text-sm font-semibold text-stone-700">{activeChallenge.endsIn}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-stone-500 mb-1">
                  <span>Day {challengeProgress} of {activeChallenge.total}</span>
                  <span>{activeChallenge.participants.toLocaleString()} participants</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-1.5">
                  <div
                    className="bg-sage-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(challengeProgress / activeChallenge.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => setChallengeDone(true)}
              disabled={challengeDone}
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                challengeDone
                  ? "bg-sage-50 text-sage-700 border border-sage-100 cursor-default"
                  : "bg-stone-900 hover:bg-stone-800 text-white"
              }`}
            >
              {challengeDone ? "✓ Logged for today" : "Log today's activity"}
            </button>
          </div>
        </>
      )}

      {/* ── Milestones ───────────────────────────────────────────────────────── */}
      {activeTab === "milestones" && (
        <>
          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
            {CATEGORY_FILTERS.map((f) => {
              const count = f === "all" ? badges.length : badges.filter((b) => b.category === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setMilestoneFilter(f)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    milestoneFilter === f
                      ? "bg-stone-800 text-white"
                      : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                  }`}
                >
                  {f === "all" ? "All" : CATEGORY_CONFIG[f]?.label ?? f} ({count})
                </button>
              );
            })}
          </div>

          {/* Achieved */}
          {earnedFiltered.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                Achieved · {earnedFiltered.length}
              </p>
              <div className="bg-white border border-stone-100 rounded-xl overflow-hidden divide-y divide-stone-50">
                {earnedFiltered.map((badge) => {
                  const cat = CATEGORY_CONFIG[badge.category];
                  return (
                    <button
                      key={badge.id}
                      onClick={() => setSelectedBadge(badge)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-stone-50 transition-colors group"
                    >
                      <CheckCircle2 size={20} className="text-sage-500 flex-shrink-0" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-stone-800">{badge.title}</div>
                        <div className="text-xs text-stone-400 mt-0.5">{badge.description}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cat?.color ?? "bg-stone-100 text-stone-500"}`}>
                          {cat?.label ?? badge.category}
                        </span>
                        <span className="text-xs text-stone-400">{badge.earnedDate}</span>
                        <ChevronRight size={14} className="text-stone-300 group-hover:text-stone-400 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Not yet achieved */}
          {pendingFiltered.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                In progress · {pendingFiltered.length}
              </p>
              <div className="bg-white border border-stone-100 rounded-xl overflow-hidden divide-y divide-stone-50">
                {pendingFiltered.map((badge) => {
                  const cat = CATEGORY_CONFIG[badge.category];
                  return (
                    <button
                      key={badge.id}
                      onClick={() => setSelectedBadge(badge)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-stone-50 transition-colors group"
                    >
                      <Circle size={20} className="text-stone-200 flex-shrink-0" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-stone-500">{badge.title}</div>
                        <div className="text-xs text-stone-400 mt-0.5">{badge.description}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full opacity-50 ${cat?.color ?? "bg-stone-100 text-stone-500"}`}>
                          {cat?.label ?? badge.category}
                        </span>
                        <ChevronRight size={14} className="text-stone-300 group-hover:text-stone-400 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Mood ─────────────────────────────────────────────────────────────── */}
      {activeTab === "mood" && (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-stone-100 rounded-xl px-4 py-3 text-center">
              <div className="text-xl font-semibold text-stone-900">{moodAvg}</div>
              <div className="text-xs text-stone-400 mt-0.5">avg / 5</div>
            </div>
            <div className="bg-white border border-stone-100 rounded-xl px-4 py-3 text-center">
              <div className="text-xl">{MOOD_EMOJIS[moodAvgInt]}</div>
              <div className="text-xs text-stone-400 mt-0.5">{MOOD_LABELS[moodAvgInt]}</div>
            </div>
            <div className="bg-white border border-stone-100 rounded-xl px-4 py-3 text-center">
              <div className="text-xl font-semibold text-stone-900">7</div>
              <div className="text-xs text-stone-400 mt-0.5">check-ins</div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white border border-stone-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-stone-900">This week</h2>
              {selectedMoodIdx !== null && (
                <button
                  onClick={() => setSelectedMoodIdx(null)}
                  className="text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Bar chart */}
            <div className="flex items-end justify-between gap-2 h-32 mb-3">
              {moodHistory.map((entry, i) => {
                const isSelected = selectedMoodIdx === i;
                const heightPct  = (entry.score / 5) * 100;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedMoodIdx(isSelected ? null : i)}
                    className="flex-1 h-full flex flex-col justify-end group"
                    aria-label={`${entry.date}: ${MOOD_LABELS[entry.score]}`}
                  >
                    <div
                      className={`w-full rounded-sm transition-all duration-500 ease-out ${MOOD_COLORS[entry.score]} ${
                        isSelected ? "opacity-100" : "opacity-50 group-hover:opacity-75"
                      } ${isSelected ? "ring-2 ring-stone-400 ring-offset-1" : ""}`}
                      style={{ height: animated ? `${heightPct}%` : "0%", borderRadius: "4px 4px 2px 2px" }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Day labels */}
            <div className="flex justify-between gap-2 mb-4">
              {moodHistory.map((entry, i) => (
                <div
                  key={i}
                  className={`flex-1 text-center text-[10px] transition-colors ${
                    selectedMoodIdx === i ? "text-stone-800 font-semibold" : "text-stone-400"
                  }`}
                >
                  {entry.date}
                </div>
              ))}
            </div>

            {/* Selected day detail */}
            {selectedMoodIdx !== null ? (
              <div className="border-t border-stone-100 pt-4 flex items-center gap-3">
                <span className="text-2xl">{MOOD_EMOJIS[moodHistory[selectedMoodIdx].score]}</span>
                <div>
                  <div className="text-sm font-medium text-stone-800">{moodHistory[selectedMoodIdx].date}</div>
                  <div className="text-xs text-stone-500">
                    {MOOD_LABELS[moodHistory[selectedMoodIdx].score]} · {moodHistory[selectedMoodIdx].score} out of 5
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400 text-center border-t border-stone-100 pt-4">
                Select a day to see details
              </p>
            )}
          </div>

          {/* Scale reference */}
          <div className="bg-white border border-stone-100 rounded-xl p-5">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">How we measure mood</p>
            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((score) => (
                <div key={score} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${MOOD_COLORS[score]}`} />
                  <span className="text-sm text-stone-600 w-4">{score}</span>
                  <span className="text-xl flex-shrink-0">{MOOD_EMOJIS[score]}</span>
                  <span className="text-sm text-stone-500">{MOOD_LABELS[score]}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedBadge && (
        <MilestoneSheet badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
      )}
    </div>
  );
}
