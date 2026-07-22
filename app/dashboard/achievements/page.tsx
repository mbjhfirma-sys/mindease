"use client";

import { useState, useEffect } from "react";
import { Flame, CheckSquare, Clock, BookOpen, PenLine, Activity, X, CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { BADGE_DEFINITIONS } from "@/lib/achievements";

const MOOD_LABELS = ["", "Low", "Not great", "Okay", "Good", "Great"];
const MOOD_EMOJIS = ["", "😔", "😟", "😐", "🙂", "😊"];
const MOOD_COLORS = ["", "bg-red-300", "bg-orange-300", "bg-amber-300", "bg-lime-400", "bg-sage-400"];

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  streak:    { label: "Consistency", color: "bg-amber-100 text-amber-700" },
  mission:   { label: "Daily tasks", color: "bg-sage-100 text-sage-700" },
  course:    { label: "Learning",    color: "bg-blue-100 text-blue-700" },
  journal:   { label: "Reflection",  color: "bg-violet-100 text-violet-700" },
  community: { label: "Community",   color: "bg-teal-100 text-teal-700" },
  special:   { label: "Special",     color: "bg-stone-100 text-stone-600" },
};

type Achievement = { id: string; badgeId: string; createdAt: string };
type MoodEntry   = { score: number; createdAt: string };
type Stats       = { streak: number; moodEntries: number; journalEntries: number; missionsCompleted: number; lessonsCompleted: number };

function MilestoneSheet({ badgeId, earnedDate, onClose }: { badgeId: string; earnedDate: string | null; onClose: () => void }) {
  const cat = CATEGORY_CONFIG[badgeId.split("_")[0]] ?? { label: "Special", color: "bg-stone-100 text-stone-600" };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1 transition-colors">
          <X size={16} />
        </button>
        <div className="px-6 pt-5 pb-6">
          <div className="flex items-start gap-4 mb-5">
            <div className={`mt-0.5 flex-shrink-0 ${earnedDate ? "text-sage-600" : "text-stone-300"}`}>
              {earnedDate ? <CheckCircle2 size={28} strokeWidth={1.5} /> : <Circle size={28} strokeWidth={1.5} />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900 mb-0.5">{badgeId.replace(/_/g, " ")}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
            </div>
          </div>
          <div className={`rounded-xl px-4 py-3 text-sm ${earnedDate ? "bg-sage-50 border border-sage-100 text-sage-700" : "bg-stone-50 border border-stone-100 text-stone-400"}`}>
            {earnedDate ? `Achieved on ${new Date(earnedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : "Not yet achieved — keep going"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const [activeTab,       setActiveTab]       = useState<"overview" | "milestones" | "mood">("overview");
  const [achievements,    setAchievements]    = useState<Achievement[]>([]);
  const [moodHistory,     setMoodHistory]     = useState<MoodEntry[]>([]);
  const [stats,           setStats]           = useState<Stats>({ streak: 0, moodEntries: 0, journalEntries: 0, missionsCompleted: 0, lessonsCompleted: 0 });
  const [loading,         setLoading]         = useState(true);
  const [selectedBadge,   setSelectedBadge]   = useState<{ badgeId: string; earnedDate: string | null } | null>(null);
  const [selectedMoodIdx, setSelectedMoodIdx] = useState<number | null>(null);
  const [animated,        setAnimated]        = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    Promise.all([
      fetch("/api/achievements").then((r) => r.json()),
      fetch("/api/mood").then((r) => r.json()),
    ]).then(([achData, moodData]) => {
      setAchievements(achData.achievements ?? []);
      setStats(achData.stats ?? { streak: 0, moodEntries: 0, journalEntries: 0, missionsCompleted: 0, lessonsCompleted: 0 });
      const entries: MoodEntry[] = (moodData.entries ?? []).slice(0, 7).reverse();
      setMoodHistory(entries);
    }).finally(() => setLoading(false));
    return () => clearTimeout(t);
  }, []);

  const earnedBadgeIds = new Set(achievements.map((a) => a.badgeId));

  const earnedBadges  = BADGE_DEFINITIONS.filter((b) => earnedBadgeIds.has(b.badgeId));
  const pendingBadges = BADGE_DEFINITIONS.filter((b) => !earnedBadgeIds.has(b.badgeId));

  const moodAvg    = moodHistory.length ? (moodHistory.reduce((s, e) => s + e.score, 0) / moodHistory.length).toFixed(1) : "—";
  const moodAvgInt = moodHistory.length ? Math.round(moodHistory.reduce((s, e) => s + e.score, 0) / moodHistory.length) : 0;

  const wellnessScore = Math.min(100, Math.round(
    (stats.streak * 2 + stats.missionsCompleted + stats.journalEntries * 2 + stats.lessonsCompleted * 3 + stats.moodEntries)
    / 2
  ));

  const metrics = [
    { label: "Consistency streak",   value: `${stats.streak} days`,           sub: "Mood check-ins",              Icon: Flame },
    { label: "Tasks completed",      value: stats.missionsCompleted,           sub: "Since joining",               Icon: CheckSquare },
    { label: "Mood entries",         value: stats.moodEntries,                 sub: "Daily check-ins",             Icon: Clock },
    { label: "Lessons completed",    value: stats.lessonsCompleted,            sub: "Course progress",             Icon: BookOpen },
    { label: "Journal entries",      value: stats.journalEntries,              sub: "Private entries",             Icon: PenLine },
    { label: "Wellness score",       value: `${wellnessScore}%`,              sub: "Based on your activity",      Icon: Activity },
  ];

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-stone-100 rounded w-1/3" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-stone-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">My Progress</h1>
        <p className="text-sm text-stone-500 mt-1">A summary of your wellness journey</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-stone-100 rounded-xl px-4 py-3 text-center">
          <div className="text-xl font-bold text-stone-900">{stats.streak}</div>
          <div className="text-xs text-stone-400 mt-0.5">day streak</div>
        </div>
        <div className="bg-white border border-stone-100 rounded-xl px-4 py-3 text-center">
          <div className="text-xl font-bold text-stone-900">{stats.missionsCompleted}</div>
          <div className="text-xs text-stone-400 mt-0.5">tasks done</div>
        </div>
        <div className="bg-white border border-stone-100 rounded-xl px-4 py-3 text-center">
          <div className="text-xl font-bold text-stone-900">{wellnessScore}%</div>
          <div className="text-xs text-stone-400 mt-0.5">wellness</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
        {(["overview", "milestones", "mood"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${activeTab === tab ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {metrics.map(({ label, value, sub, Icon }) => (
              <div key={label} className="bg-white border border-stone-100 rounded-xl p-5 hover:border-stone-200 hover:shadow-sm transition-all">
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
              <span className="text-xl font-semibold text-stone-900">{wellnessScore}%</span>
            </div>
            <div className="space-y-4">
              {[
                { label: "Mood tracking",     pct: Math.min(100, stats.moodEntries * 5) },
                { label: "Task consistency",  pct: Math.min(100, stats.streak * 3) },
                { label: "Learning progress", pct: Math.min(100, stats.lessonsCompleted * 10) },
                { label: "Self-reflection",   pct: Math.min(100, stats.journalEntries * 4) },
                { label: "Mission completion",pct: Math.min(100, stats.missionsCompleted * 2) },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-stone-700">{item.label}</span>
                    <span className="text-sm font-medium text-stone-700">{item.pct}%</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1.5">
                    <div className="bg-sage-600 h-1.5 rounded-full transition-all duration-700 ease-out" style={{ width: animated ? `${item.pct}%` : "0%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Milestones ── */}
      {activeTab === "milestones" && (
        <>
          {earnedBadges.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Achieved · {earnedBadges.length}</p>
              <div className="bg-white border border-stone-100 rounded-xl overflow-hidden divide-y divide-stone-50">
                {earnedBadges.map((badge) => {
                  const cat = CATEGORY_CONFIG[badge.category];
                  const ach = achievements.find((a) => a.badgeId === badge.badgeId);
                  return (
                    <button key={badge.badgeId} onClick={() => setSelectedBadge({ badgeId: badge.badgeId, earnedDate: ach?.createdAt ?? null })} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-stone-50 transition-colors group">
                      <CheckCircle2 size={20} className="text-sage-500 flex-shrink-0" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-stone-800">{badge.label}</div>
                        <div className="text-xs text-stone-400 mt-0.5">{badge.desc}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cat?.color}`}>{cat?.label}</span>
                        <ChevronRight size={14} className="text-stone-300 group-hover:text-stone-400 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {pendingBadges.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">In progress · {pendingBadges.length}</p>
              <div className="bg-white border border-stone-100 rounded-xl overflow-hidden divide-y divide-stone-50">
                {pendingBadges.map((badge) => {
                  const cat = CATEGORY_CONFIG[badge.category];
                  return (
                    <button key={badge.badgeId} onClick={() => setSelectedBadge({ badgeId: badge.badgeId, earnedDate: null })} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-stone-50 transition-colors group">
                      <Circle size={20} className="text-stone-200 flex-shrink-0" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-stone-500">{badge.label}</div>
                        <div className="text-xs text-stone-400 mt-0.5">{badge.desc}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full opacity-50 ${cat?.color}`}>{cat?.label}</span>
                        <ChevronRight size={14} className="text-stone-300 group-hover:text-stone-400 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {earnedBadges.length === 0 && pendingBadges.length === 0 && (
            <div className="text-center py-12 text-stone-400 text-sm">No milestones yet — keep going!</div>
          )}
        </>
      )}

      {/* ── Mood ── */}
      {activeTab === "mood" && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-stone-100 rounded-xl px-4 py-3 text-center">
              <div className="text-xl font-semibold text-stone-900">{moodAvg}</div>
              <div className="text-xs text-stone-400 mt-0.5">avg / 5</div>
            </div>
            <div className="bg-white border border-stone-100 rounded-xl px-4 py-3 text-center">
              <div className="text-xl">{moodAvgInt > 0 ? MOOD_EMOJIS[moodAvgInt] : "—"}</div>
              <div className="text-xs text-stone-400 mt-0.5">{moodAvgInt > 0 ? MOOD_LABELS[moodAvgInt] : "No data"}</div>
            </div>
            <div className="bg-white border border-stone-100 rounded-xl px-4 py-3 text-center">
              <div className="text-xl font-semibold text-stone-900">{moodHistory.length}</div>
              <div className="text-xs text-stone-400 mt-0.5">check-ins</div>
            </div>
          </div>

          {moodHistory.length > 0 ? (
            <div className="bg-white border border-stone-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-stone-900">Recent mood</h2>
                {selectedMoodIdx !== null && (
                  <button onClick={() => setSelectedMoodIdx(null)} className="text-stone-400 hover:text-stone-600 transition-colors"><X size={14} /></button>
                )}
              </div>
              <div className="flex items-end justify-between gap-2 h-32 mb-3">
                {moodHistory.map((entry, i) => {
                  const isSelected = selectedMoodIdx === i;
                  return (
                    <button key={i} onClick={() => setSelectedMoodIdx(isSelected ? null : i)} className="flex-1 h-full flex flex-col justify-end group" aria-label={`${MOOD_LABELS[entry.score]}`}>
                      <div
                        className={`w-full rounded-sm transition-all duration-500 ease-out ${MOOD_COLORS[entry.score]} ${isSelected ? "opacity-100 ring-2 ring-stone-400 ring-offset-1" : "opacity-50 group-hover:opacity-75"}`}
                        style={{ height: animated ? `${(entry.score / 5) * 100}%` : "0%", borderRadius: "4px 4px 2px 2px" }}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between gap-2 mb-4">
                {moodHistory.map((entry, i) => (
                  <div key={i} className={`flex-1 text-center text-[10px] ${selectedMoodIdx === i ? "text-stone-800 font-semibold" : "text-stone-400"}`}>
                    {new Date(entry.createdAt).toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                ))}
              </div>
              {selectedMoodIdx !== null ? (
                <div className="border-t border-stone-100 pt-4 flex items-center gap-3">
                  <span className="text-2xl">{MOOD_EMOJIS[moodHistory[selectedMoodIdx].score]}</span>
                  <div>
                    <div className="text-sm font-medium text-stone-800">
                      {new Date(moodHistory[selectedMoodIdx].createdAt).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                    </div>
                    <div className="text-xs text-stone-500">{MOOD_LABELS[moodHistory[selectedMoodIdx].score]} · {moodHistory[selectedMoodIdx].score} out of 5</div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-400 text-center border-t border-stone-100 pt-4">Select a day to see details</p>
              )}
            </div>
          ) : (
            <div className="bg-white border border-stone-100 rounded-xl p-10 text-center">
              <p className="text-sm text-stone-400">No mood data yet.</p>
              <p className="text-xs text-stone-300 mt-1">Log your mood on the dashboard to see trends here.</p>
            </div>
          )}
        </>
      )}

      {selectedBadge && (
        <MilestoneSheet badgeId={selectedBadge.badgeId} earnedDate={selectedBadge.earnedDate} onClose={() => setSelectedBadge(null)} />
      )}
    </div>
  );
}
