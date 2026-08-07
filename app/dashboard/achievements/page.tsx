"use client";

import { useState, useEffect, useCallback } from "react";
import { Flame, CheckSquare, Heart, BookOpen, PenLine, Activity, Award, X, CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { BADGE_DEFINITIONS } from "@/lib/achievements";

const MOOD_LABELS = ["", "Low", "Not great", "Okay", "Good", "Great"];
const MOOD_COLORS = ["", "bg-red-300", "bg-orange-300", "bg-amber-300", "bg-lime-400", "bg-sage-400"];

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  streak:    { label: "Consistency", color: "bg-amber-100 text-amber-700" },
  mission:   { label: "Daily tasks", color: "bg-sage-100 text-sage-700" },
  course:    { label: "Learning",    color: "bg-blue-100 text-blue-700" },
  journal:   { label: "Reflection",  color: "bg-violet-100 text-violet-700" },
  community: { label: "Community",   color: "bg-teal-100 text-teal-700" },
  special:   { label: "Special",     color: "bg-stone-100 text-stone-600" },
};

const TILE_TONE: Record<string, { bg: string; text: string }> = {
  warm: { bg: "bg-amber-100", text: "text-amber-600" },
  sage: { bg: "bg-sage-50", text: "text-sage-700" },
  rose: { bg: "bg-rose-50", text: "text-rose-500" },
};

type Achievement = { id: string; badgeId: string; earnedAt: string };
type MoodEntry   = { score: number; createdAt: string };
type Stats       = { streak: number; moodEntries: number; journalEntries: number; missionsCompleted: number; lessonsCompleted: number; communityGroups: number };

function badgeProgress(badgeId: string, stats: Stats): { current: number; target: number } | null {
  const [cat, raw] = badgeId.split("_");
  const target = Number(raw);
  if (!Number.isFinite(target)) return null;
  const current =
    cat === "streak"    ? stats.streak :
    cat === "mission"   ? stats.missionsCompleted :
    cat === "journal"   ? stats.journalEntries :
    cat === "course"    ? stats.lessonsCompleted :
    cat === "community" ? stats.communityGroups :
    null;
  if (current == null) return null;
  return { current: Math.min(current, target), target };
}

function moodTrendCaption(history: MoodEntry[]): string | null {
  if (history.length < 4) return null;
  const mid = Math.floor(history.length / 2);
  const firstAvg = history.slice(0, mid).reduce((s, e) => s + e.score, 0) / mid;
  const secondAvg = history.slice(mid).reduce((s, e) => s + e.score, 0) / (history.length - mid);
  const diff = secondAvg - firstAvg;
  if (diff >= 0.5) return "Trending up compared to earlier in the week.";
  if (diff <= -0.5) return "A little lower than earlier in the week.";
  return "Holding steady this week.";
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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
  const [achievements,    setAchievements]    = useState<Achievement[]>([]);
  const [allMoodEntries,  setAllMoodEntries]  = useState<MoodEntry[]>([]);
  const [stats,           setStats]           = useState<Stats>({ streak: 0, moodEntries: 0, journalEntries: 0, missionsCompleted: 0, lessonsCompleted: 0, communityGroups: 0 });
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(false);
  const [selectedBadge,   setSelectedBadge]   = useState<{ badgeId: string; earnedDate: string | null } | null>(null);
  const [animated,        setAnimated]        = useState(false);

  const loadData = useCallback(() => {
    Promise.all([
      fetch("/api/achievements").then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
      fetch("/api/mood").then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
    ]).then(([achData, moodData]) => {
      setAchievements(achData.achievements ?? []);
      setStats(achData.stats ?? { streak: 0, moodEntries: 0, journalEntries: 0, missionsCompleted: 0, lessonsCompleted: 0, communityGroups: 0 });
      setAllMoodEntries(moodData.entries ?? []);
    }).catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    loadData();
    return () => clearTimeout(t);
  }, [loadData]);

  function retry() {
    setLoading(true);
    setError(false);
    loadData();
  }

  const earnedBadgeIds = new Set(achievements.map((a) => a.badgeId));
  const earnedBadges  = BADGE_DEFINITIONS.filter((b) => earnedBadgeIds.has(b.badgeId))
    .slice()
    .sort((a, b) => {
      const ea = achievements.find((x) => x.badgeId === a.badgeId)?.earnedAt ?? "";
      const eb = achievements.find((x) => x.badgeId === b.badgeId)?.earnedAt ?? "";
      return +new Date(eb) - +new Date(ea);
    });
  const pendingBadges = BADGE_DEFINITIONS.filter((b) => !earnedBadgeIds.has(b.badgeId))
    .slice()
    .sort((a, b) => {
      const pa = badgeProgress(a.badgeId, stats);
      const pb = badgeProgress(b.badgeId, stats);
      const pctA = pa ? pa.current / pa.target : 0;
      const pctB = pb ? pb.current / pb.target : 0;
      return pctB - pctA;
    });

  // last7Entries/prev7Entries are desc (most recent first) straight from the API;
  // moodHistory is the chronological order the bar chart renders left-to-right.
  const last7Entries = allMoodEntries.slice(0, 7);
  const prev7Entries = allMoodEntries.slice(7, 14);
  const moodHistory = [...last7Entries].reverse();
  const thisWeekAvg = last7Entries.length ? last7Entries.reduce((s, e) => s + e.score, 0) / last7Entries.length : null;
  const prevWeekAvg = prev7Entries.length ? prev7Entries.reduce((s, e) => s + e.score, 0) / prev7Entries.length : null;
  const moodDelta = thisWeekAvg != null && prevWeekAvg != null ? Math.round((thisWeekAvg - prevWeekAvg) * 10) / 10 : null;
  const weekMoodLabel = thisWeekAvg != null ? MOOD_LABELS[Math.max(1, Math.min(5, Math.round(thisWeekAvg)))] : null;
  const trendCaption = moodTrendCaption(moodHistory);

  const wellnessScore = Math.min(100, Math.round(
    (stats.streak * 2 + stats.missionsCompleted + stats.journalEntries * 2 + stats.lessonsCompleted * 3 + stats.moodEntries)
    / 2
  ));

  const activeDaysThisWeek = Math.min(stats.streak, 7);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentAchievement = achievements
    .filter((a) => new Date(a.earnedAt) >= weekAgo)
    .sort((a, b) => +new Date(b.earnedAt) - +new Date(a.earnedAt))[0] ?? null;
  const recentBadgeDef = recentAchievement ? BADGE_DEFINITIONS.find((b) => b.badgeId === recentAchievement.badgeId) ?? null : null;

  const metrics = [
    { label: "Streak",          value: `${stats.streak}d`,          sub: "Consecutive days active", Icon: Flame,       tone: "warm" },
    { label: "Tasks done",      value: stats.missionsCompleted,     sub: "Since joining",           Icon: CheckSquare, tone: "sage" },
    { label: "Lessons",         value: stats.lessonsCompleted,      sub: "Course progress",         Icon: BookOpen,    tone: "sage" },
    { label: "Journal entries", value: stats.journalEntries,        sub: "Private entries",         Icon: PenLine,     tone: "sage" },
    { label: "Mood check-ins",  value: stats.moodEntries,           sub: "Daily check-ins",         Icon: Heart,       tone: "rose" },
    { label: "Wellness score",  value: `${wellnessScore}%`,         sub: "Based on your activity",  Icon: Activity,    tone: "sage" },
  ];

  const ringCircumference = 220;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-stone-100 rounded w-1/3" />
        <div className="h-28 bg-stone-100 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-stone-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <p className="text-sm text-red-600 mb-3">Could not load your progress. Please try again.</p>
          <button onClick={retry} className="text-xs font-medium text-red-700 underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">My Progress</h1>
        <p className="text-sm text-stone-500 mt-1">A summary of your wellness journey</p>
      </div>

      {/* ── Recap hero ── */}
      <div className="bg-gradient-to-br from-sage-800 to-sage-700 rounded-2xl p-6 text-white flex items-center gap-6 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-[240px]">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-sage-200/70 mb-2">This week</p>
          <h2 className="text-[17px] leading-relaxed font-medium mb-4">
            {stats.streak > 0 ? (
              <>
                You&apos;ve shown up on <b className="font-extrabold">{activeDaysThisWeek} of the last 7 days</b>
                {weekMoodLabel && <> and your mood has averaged <b className="font-extrabold">{weekMoodLabel}</b> this week</>}.
                You&apos;re on a <b className="font-extrabold">{stats.streak}-day streak</b>.
              </>
            ) : (
              <>
                {weekMoodLabel ? <>Your mood has averaged <b className="font-extrabold">{weekMoodLabel}</b> this week. </> : null}
                Check in today to start building a streak.
              </>
            )}
          </h2>
          {(stats.streak > 0 || thisWeekAvg !== null) && (
            <div className="flex flex-wrap gap-2">
              {stats.streak > 0 && (
                <div className="bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-[11px] leading-tight">
                  Streak <span className="block text-sm font-bold text-sage-100">+{activeDaysThisWeek}d this wk</span>
                </div>
              )}
              {thisWeekAvg !== null && (
                <div className="bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-[11px] leading-tight">
                  Mood avg <span className="block text-sm font-bold text-sage-100">
                    {thisWeekAvg.toFixed(1)}{moodDelta !== null && <> {moodDelta >= 0 ? "↑" : "↓"} {Math.abs(moodDelta).toFixed(1)}</>}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="relative w-[84px] h-[84px] flex-shrink-0">
          <svg viewBox="0 0 84 84" className="w-[84px] h-[84px] -rotate-90">
            <circle cx="42" cy="42" r="35" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="8" />
            <circle
              cx="42" cy="42" r="35" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${animated ? (wellnessScore / 100) * ringCircumference : 0} ${ringCircumference}`}
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold">{wellnessScore}%</span>
            <span className="text-[8px] font-bold uppercase tracking-wide text-white/70">Wellness</span>
          </div>
        </div>
      </div>

      {/* ── New milestone banner ── */}
      {recentBadgeDef && (
        <button
          onClick={() => setSelectedBadge({ badgeId: recentBadgeDef.badgeId, earnedDate: recentAchievement!.earnedAt })}
          className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 text-left hover:bg-amber-100/60 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-400 text-white flex items-center justify-center flex-shrink-0">
            <Award size={16} strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-stone-800">New milestone: {recentBadgeDef.label}</div>
            <div className="text-xs text-stone-500 mt-0.5">{recentBadgeDef.desc} — unlocked {formatShortDate(recentAchievement!.earnedAt)}</div>
          </div>
          <ChevronRight size={15} className="text-stone-300 flex-shrink-0" />
        </button>
      )}

      {/* ── Metric tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map(({ label, value, sub, Icon, tone }) => (
          <div key={label} className="bg-white border border-stone-100 rounded-2xl p-4 hover:border-stone-200 hover:shadow-sm transition-all">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${TILE_TONE[tone].bg} ${TILE_TONE[tone].text}`}>
              <Icon size={16} strokeWidth={1.75} />
            </div>
            <div className="text-lg font-bold text-stone-900">{value}</div>
            <div className="text-xs font-semibold text-stone-500 mt-0.5">{label}</div>
            <div className="text-[11px] text-stone-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Wellness score breakdown ── */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-stone-900">Wellness score breakdown</h2>
          <span className="text-xl font-semibold text-stone-900">{wellnessScore}%</span>
        </div>
        <div className="space-y-4">
          {[
            { label: "Mood tracking",      pct: Math.min(100, stats.moodEntries * 5) },
            { label: "Task consistency",   pct: Math.min(100, stats.streak * 3) },
            { label: "Learning progress",  pct: Math.min(100, stats.lessonsCompleted * 10) },
            { label: "Self-reflection",    pct: Math.min(100, stats.journalEntries * 4) },
            { label: "Mission completion", pct: Math.min(100, stats.missionsCompleted * 2) },
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

      {/* ── Mood, last 7 days ── */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-stone-900">Mood, last 7 days</h2>
          {thisWeekAvg !== null && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sage-100 text-sage-800">
              avg {thisWeekAvg.toFixed(1)} · {weekMoodLabel}
            </span>
          )}
        </div>
        {trendCaption && <p className="text-xs text-stone-400 mb-4">{trendCaption}</p>}
        {moodHistory.length > 0 ? (
          <div className={`flex items-end gap-2 h-28 ${!trendCaption ? "mt-4" : ""}`}>
            {moodHistory.map((entry, i) => {
              const isToday = i === moodHistory.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full group">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className={`w-full rounded-t-md rounded-b-sm relative transition-[filter] group-hover:brightness-95 ${MOOD_COLORS[entry.score]}`}
                      style={{ height: `${(entry.score / 5) * 100}%` }}
                    >
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-stone-900 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {MOOD_LABELS[entry.score]} · {entry.score}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold mt-1.5 ${isToday ? "text-sage-600" : "text-stone-300"}`}>
                    {isToday ? "Today" : new Date(entry.createdAt).toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-stone-400">No mood data yet.</p>
            <p className="text-xs text-stone-300 mt-1">Log your mood on the dashboard to see trends here.</p>
          </div>
        )}
      </div>

      {/* ── Milestones checklist ── */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-stone-900">Milestones</h2>
          <span className="text-xs font-medium text-stone-400 bg-stone-50 border border-stone-100 px-2.5 py-1 rounded-full">
            {earnedBadges.length} of {BADGE_DEFINITIONS.length}
          </span>
        </div>
        {earnedBadges.length === 0 && pendingBadges.length === 0 ? (
          <div className="text-center py-10 text-stone-400 text-sm">No milestones yet — keep going!</div>
        ) : (
          <div className="divide-y divide-stone-50">
            {earnedBadges.map((badge) => {
              const cat = CATEGORY_CONFIG[badge.category];
              const ach = achievements.find((a) => a.badgeId === badge.badgeId);
              return (
                <button
                  key={badge.badgeId}
                  onClick={() => setSelectedBadge({ badgeId: badge.badgeId, earnedDate: ach?.earnedAt ?? null })}
                  className="w-full flex items-center gap-3 py-3 text-left hover:bg-stone-50 -mx-2 px-2 rounded-lg transition-colors group"
                >
                  <CheckCircle2 size={18} className="text-sage-500 flex-shrink-0" strokeWidth={1.5} />
                  <span className="flex-1 min-w-0 text-[13px] font-medium text-stone-800 truncate">{badge.label}</span>
                  <span className={`text-[9.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${cat?.color}`}>{cat?.label}</span>
                  <span className="text-[11px] text-stone-400 flex-shrink-0 w-14 text-right">{ach ? formatShortDate(ach.earnedAt) : ""}</span>
                  <ChevronRight size={14} className="text-stone-300 group-hover:text-stone-400 transition-colors flex-shrink-0" />
                </button>
              );
            })}
            {pendingBadges.map((badge) => {
              const cat = CATEGORY_CONFIG[badge.category];
              const progress = badgeProgress(badge.badgeId, stats);
              return (
                <button
                  key={badge.badgeId}
                  onClick={() => setSelectedBadge({ badgeId: badge.badgeId, earnedDate: null })}
                  className="w-full flex items-center gap-3 py-3 text-left hover:bg-stone-50 -mx-2 px-2 rounded-lg transition-colors group"
                >
                  <Circle size={18} className="text-stone-200 flex-shrink-0" strokeWidth={1.5} />
                  <span className="flex-1 min-w-0 text-[13px] font-medium text-stone-500 truncate">{badge.label}</span>
                  <span className={`text-[9.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 opacity-60 ${cat?.color}`}>{cat?.label}</span>
                  <span className="text-[11px] text-stone-400 flex-shrink-0 w-14 text-right">{progress ? `${progress.current}/${progress.target}` : ""}</span>
                  <ChevronRight size={14} className="text-stone-300 group-hover:text-stone-400 transition-colors flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedBadge && (
        <MilestoneSheet badgeId={selectedBadge.badgeId} earnedDate={selectedBadge.earnedDate} onClose={() => setSelectedBadge(null)} />
      )}
    </div>
  );
}
