"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import VideoCallRoom from "@/components/video/VideoCallRoom";
import TaskActivityModal from "@/components/dashboard/TaskActivityModal";
import { useAchievementCheck } from "@/components/dashboard/AchievementToast";
import { getJoinWindow } from "@/lib/video";
import {
  TrendingUp, BookOpen, Clock, Flame,
  PenLine, Bot, ClipboardList, Users,
  Video, CalendarDays, ArrowRight, CheckCircle2, Check, Lock,
} from "lucide-react";

type Category = "mindfulness" | "movement" | "journaling" | "breathing" | "social" | "habit";
type Mission = {
  id: string; title: string; description: string; category: Category;
  duration: number; xp: number; completed: boolean; dueTime?: string | null; activityType?: string;
};
type Course = {
  id: string; title: string; instructor: string; progress: number;
  thumbnail: string; duration: string; rating: number; category: string;
};
type Appt = {
  id: string; date: string; duration: number; type: string; status: string;
  therapist: { user: { name: string } };
  notes?: string | null;
};

const FALLBACK_MISSIONS: Mission[] = [
  { id: "default_breathing",  title: "4-7-8 Breathing",        description: "Two rounds of 4-7-8 breathing to reduce stress.",   category: "breathing",   duration: 5,  xp: 10, completed: false, activityType: "breathing" },
  { id: "default_journal",    title: "Daily Gratitude Entry",   description: "Write three things you're grateful for today.",      category: "journaling",  duration: 5,  xp: 15, completed: false, activityType: "gratitude" },
  { id: "default_meditation", title: "Morning Mindfulness",     description: "10 minutes of breath-awareness meditation.",         category: "mindfulness", duration: 10, xp: 25, completed: false, activityType: "timer" },
  { id: "default_walk",       title: "Mindful Walk",            description: "15-minute walk outside with grounding awareness.",   category: "movement",    duration: 15, xp: 20, completed: false, activityType: "walk" },
  { id: "default_checkin",    title: "Evening Check-in",        description: "Reflect on one challenge from today for 5 minutes.", category: "journaling",  duration: 5,  xp: 15, completed: false, activityType: "reflection" },
];

const MOOD_OPTIONS = [
  { score: 1, emoji: "😔", label: "Low" },
  { score: 2, emoji: "😟", label: "Not great" },
  { score: 3, emoji: "😐", label: "Okay" },
  { score: 4, emoji: "🙂", label: "Good" },
  { score: 5, emoji: "😊", label: "Great" },
];

const QUICK_LINKS = [
  { href: "/dashboard/journal",    Icon: PenLine,      label: "Write in journal",          meta: "Private & secure",   iconCls: "bg-amber-50 text-amber-600" },
  { href: "/dashboard/ai-chat",    Icon: Bot,          label: "AI Support — Sage",         meta: "Available 24/7",     iconCls: "bg-violet-50 text-violet-600" },
  { href: "/dashboard/assessment", Icon: ClipboardList,label: "Mental health check-in",    meta: "6 assessments",      iconCls: "bg-blue-50 text-blue-600" },
  { href: "/dashboard/community",  Icon: Users,        label: "Community groups",          meta: "Join a group",       iconCls: "bg-teal-50 text-teal-600" },
];

const SCHEDULE_COLORS: Record<string, string> = {
  video:     "bg-blue-50 text-blue-600",
  in_person: "bg-sage-50 text-sage-700",
  phone:     "bg-violet-50 text-violet-600",
};
const SCHEDULE_ICONS: Record<string, React.ReactNode> = {
  video:     <Video size={12} />,
  in_person: <Users size={12} />,
  phone:     <Clock size={12} />,
};

const MISSION_EMOJIS: Record<string, string> = {
  default_breathing:     "🌬️",
  default_journal:       "📔",
  default_meditation:    "🧘",
  default_walk:          "🌿",
  default_checkin:       "🌙",
  default_bodyscan:      "🫁",
  default_affirmations:  "✨",
  default_stretch:       "🤸",
  default_grounding:     "🌱",
  default_social:        "💌",
  default_progressive:   "💆",
  default_worry:         "📝",
  default_screen:        "📵",
  default_hydration:     "💧",
  default_selfcompassion:"🫶",
  default_creative:      "🎨",
  default_nature:        "🌳",
  default_strength:      "⭐",
  default_sleep:         "😴",
  default_values:        "🧭",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  mindfulness: "🧘", movement: "🚶", journaling: "📝",
  breathing:   "🌬️", social:   "💌", habit:      "✨",
};

const TASK_CATEGORY_COLORS: Record<string, string> = {
  mindfulness: "bg-violet-300",
  journaling:  "bg-amber-300",
  breathing:   "bg-sky-300",
  movement:    "bg-sage-400",
  social:      "bg-pink-300",
  habit:       "bg-stone-300",
  exposure:    "bg-orange-300",
  safety:      "bg-red-300",
};

const COURSE_COLORS = [
  "from-sage-500 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-violet-500 to-indigo-500",
  "from-rose-400 to-pink-500",
];

function fmtApptTime(iso: string) {
  const d = new Date(iso);
  return {
    dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
    dateStr: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

function fmtDur(min: number) {
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ""}`;
}

function formatCountdown(ms: number): string {
  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
}

export default function DashboardPage() {
  const checkAchievements = useAchievementCheck();
  const [missions,    setMissions]   = useState<Mission[]>([]);
  const [dailyLimit,  setDailyLimit] = useState(5);
  const [courses,     setCourses]    = useState<Course[]>([]);
  const [appts,       setAppts]      = useState<Appt[]>([]);
  const [streak,      setStreak]     = useState(0);
  const [userName,    setUserName]   = useState("there");
  const [loading,     setLoading]    = useState(true);

  const [activeTask,  setActiveTask]  = useState<Mission | null>(null);
  const [moodScore,   setMoodScore]   = useState<number | null>(null);
  const [moodNote,    setMoodNote]    = useState("");
  const [moodSaved,   setMoodSaved]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [callOpen,    setCallOpen]    = useState(false);

  // Keeps the next-session join-window countdown fresh without a network round trip.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 20_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const safe = (p: Promise<Response>) =>
      p.then((r) => (r.ok ? r.json() : Promise.reject())).catch(() => ({}));

    const done = (() => {
      try {
        const d = new Date();
        const key = `me_done_${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        return new Set<string>(JSON.parse(localStorage.getItem(key) ?? "[]"));
      } catch { return new Set<string>(); }
    })();

    Promise.all([
      safe(fetch("/api/missions")),
      safe(fetch("/api/courses")),
      safe(fetch("/api/appointments")),
      safe(fetch("/api/achievements")),
      safe(fetch("/api/user")),
    ]).then(([mData, cData, aData, achData, uData]) => {
      const apiMissions: Mission[] = mData.missions ?? [];
      const limit: number = mData.dailyLimit ?? 5;
      if (apiMissions.length > 0) {
        // Merge DB state with localStorage — localStorage wins if DB missed the completion
        setMissions(apiMissions.map((m) => ({ ...m, completed: m.completed || done.has(m.id) })));
        setDailyLimit(limit);
      } else {
        // API unavailable — use localStorage-enhanced fallback
        setMissions(FALLBACK_MISSIONS.map((m) => ({ ...m, completed: done.has(m.id) })));
        setDailyLimit(FALLBACK_MISSIONS.length);
      }
      setCourses(cData.courses ?? []);
      setAppts(aData.appointments ?? []);
      setStreak(achData.stats?.streak ?? 0);
      if (uData.user?.name) {
        const first = uData.user.name.split(" ")[0];
        setUserName(first);
      }
    }).finally(() => setLoading(false));
  }, []);

  async function completeMission(id: string, responseData?: Record<string, unknown>) {
    try {
      const d = new Date();
      const key = `me_done_${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const s = new Set<string>(JSON.parse(localStorage.getItem(key) ?? "[]"));
      s.add(id);
      localStorage.setItem(key, JSON.stringify([...s]));
    } catch {}
    setMissions((p) => p.map((m) => m.id === id ? { ...m, completed: true } : m));
    fetch("/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId: id, responseData }),
    }).then(() => checkAchievements()).catch(() => {});
  }

  async function handleMoodSave() {
    if (!moodScore) return;
    setSaving(true);
    try {
      await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: moodScore, note: moodNote || undefined }),
      });
      checkAchievements();
    } finally {
      setSaving(false);
      setMoodSaved(true);
    }
  }

  const todayMissions    = missions.slice(0, dailyLimit);
  const upcomingMissions = missions.slice(dailyLimit);
  const completedCount   = todayMissions.filter((m) => m.completed).length;
  const taskTotal        = todayMissions.length;
  const progressPct      = taskTotal > 0 ? Math.round((completedCount / taskTotal) * 100) : 0;

  const inProgress  = courses.filter((c) => c.progress > 0 && c.progress < 100);
  const recommended = courses.filter((c) => c.progress === 0).slice(0, 2);

  const nextCall = appts
    .filter((a) => a.status === "confirmed" && a.type === "video")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null;
  const nextCallJoinWindow = nextCall ? getJoinWindow(new Date(nextCall.date), nextCall.duration) : null;

  const thisWeekAppts = appts
    .filter((a) => {
      const d = new Date(a.date);
      const now = new Date();
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() + 7);
      return d >= now && d <= weekEnd && a.status !== "cancelled";
    })
    .slice(0, 4);

  const stats = [
    {
      label: "Missions Done",
      value: `${completedCount}`,
      change: `${taskTotal - completedCount} left today`,
      Icon: TrendingUp,
      iconCls: "bg-sage-50 text-sage-600",
      valueCls: "text-sage-700",
      border: "border-sage-100",
    },
    {
      label: "Courses Enrolled",
      value: String(courses.length || "—"),
      change: inProgress.length > 0 ? `${inProgress.length} in progress` : "Start a course",
      Icon: BookOpen,
      iconCls: "bg-amber-50 text-amber-600",
      valueCls: "text-stone-900",
      border: "border-amber-100",
    },
    {
      label: "Sessions This Month",
      value: String(appts.filter((a) => a.status === "completed").length || "—"),
      change: "Therapy sessions",
      Icon: Clock,
      iconCls: "bg-blue-50 text-blue-600",
      valueCls: "text-stone-900",
      border: "border-blue-100",
    },
    {
      label: "Streak",
      value: streak > 0 ? `${streak} days` : "—",
      change: streak > 0 ? "Keep it up!" : "Start today",
      Icon: Flame,
      iconCls: "bg-orange-50 text-orange-500",
      valueCls: "text-orange-600",
      border: "border-orange-100",
    },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Greeting */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-2xl font-semibold text-stone-900">{greeting}, {userName} 👋</h1>
          <p className="text-stone-500 text-sm mt-1">
            {loading ? "Loading…" : `${completedCount} of ${taskTotal} tasks done today`}
          </p>
        </div>
        {streak > 0 && (
          <div className="hidden sm:flex items-center gap-2 border border-amber-200 bg-amber-50 rounded-xl px-4 py-2.5 flex-shrink-0">
            <Flame size={14} className="text-amber-500" />
            <span className="text-sm font-semibold text-amber-700">{streak} days</span>
            <span className="text-xs text-amber-500">streak</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white border rounded-xl p-5 ${s.border}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.iconCls}`}>
                <s.Icon size={16} strokeWidth={1.5} />
              </div>
            </div>
            <div className={`text-2xl font-semibold ${s.valueCls}`}>{loading ? "…" : s.value}</div>
            <div className="text-sm text-stone-600 mt-1">{s.label}</div>
            <div className="text-xs text-stone-400 mt-0.5">{s.change}</div>
          </div>
        ))}
      </div>

      {/* Next therapy session */}
      {!loading && nextCall && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 flex items-center gap-4 text-white shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Video size={18} className="text-white" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-200 uppercase tracking-widest mb-0.5">Upcoming Session</p>
            <p className="text-sm font-semibold text-white">{nextCall.therapist.user.name}</p>
            {(() => {
              const { dateStr, time } = fmtApptTime(nextCall.date);
              return <p className="text-xs text-blue-200 mt-0.5">{dateStr} · {time} · {fmtDur(nextCall.duration)}</p>;
            })()}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] border border-white/30 text-white/80 px-2 py-0.5 rounded-md font-medium">Confirmed</span>
            {nextCallJoinWindow?.isOpen ? (
              <button
                onClick={() => setCallOpen(true)}
                className="text-sm font-semibold bg-white text-blue-700 px-3.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1.5"
              >
                <Video size={13} />
                Join
              </button>
            ) : nextCallJoinWindow && new Date() < nextCallJoinWindow.opensAt ? (
              <span className="text-[11px] text-blue-200 font-medium whitespace-nowrap">
                Available in {formatCountdown(nextCallJoinWindow.opensInMs)}
              </span>
            ) : null}
          </div>
        </div>
      )}

      {/* Two-column */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

        {/* Left — 3 cols */}
        <div className="md:col-span-3 space-y-6">

          {/* Today's tasks */}
          <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-sage-600" strokeWidth={1.5} />
                <div>
                  <h2 className="text-sm font-semibold text-stone-900">Today&apos;s Tasks</h2>
                  <p className="text-xs text-stone-400 mt-0.5">{completedCount} of {taskTotal} completed</p>
                </div>
              </div>
              <Link href="/dashboard/missions" className="text-xs text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-px animate-pulse">
                {[1,2,3].map((i) => <div key={i} className="h-12 bg-stone-50" />)}
              </div>
            ) : todayMissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">No daily tasks yet — check back soon.</div>
            ) : (
              <div className="divide-y divide-stone-50">
                {todayMissions.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors group">
                    <span className="text-lg flex-shrink-0 w-7 text-center">
                      {MISSION_EMOJIS[m.id] ?? CATEGORY_EMOJIS[m.category] ?? "✨"}
                    </span>
                    <button
                      onClick={() => !m.completed && setActiveTask(m)}
                      disabled={m.completed}
                      className="flex-1 flex items-center gap-3 text-left min-w-0 disabled:cursor-default"
                    >
                      <span className={`text-sm flex-1 truncate transition-colors ${m.completed ? "line-through text-stone-400" : "text-stone-700 group-hover:text-stone-900"}`}>
                        {m.title}
                      </span>
                      <span className="text-xs text-stone-400 flex-shrink-0">{fmtDur(m.duration)}</span>
                      {!m.completed && (
                        <ArrowRight size={12} className="text-stone-300 group-hover:text-stone-500 flex-shrink-0 transition-colors" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="px-5 py-3 bg-stone-50 border-t border-stone-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-stone-400">{progressPct}% complete</span>
                <span className="text-[10px] text-stone-400">{taskTotal - completedCount} left</span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-sage-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Upcoming tasks */}
          {upcomingMissions.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <Lock size={15} className="text-stone-400" strokeWidth={1.5} />
                  <div>
                    <h2 className="text-sm font-semibold text-stone-900">Upcoming Tasks</h2>
                    <p className="text-xs text-stone-400 mt-0.5">{upcomingMissions.length} tasks queued</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-stone-50">
                {upcomingMissions.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-base flex-shrink-0 w-6 text-center opacity-50">
                      {MISSION_EMOJIS[m.id] ?? CATEGORY_EMOJIS[m.category] ?? "✨"}
                    </span>
                    <span className="flex-1 text-sm text-stone-400 truncate">{m.title}</span>
                    <span className="text-xs text-stone-300 flex-shrink-0">{fmtDur(m.duration)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Continue learning */}
          {inProgress.length > 0 && (
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <BookOpen size={16} className="text-amber-500" strokeWidth={1.5} />
                <h2 className="text-sm font-semibold text-stone-900 flex-1">Continue Learning</h2>
                <Link href="/dashboard/courses" className="text-xs text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1">
                  All courses <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-3">
                {inProgress.map((c, i) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/courses/${c.id}`}
                    className="bg-white border border-stone-100 rounded-xl p-4 flex items-center gap-4 hover:border-stone-300 hover:shadow-sm transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${COURSE_COLORS[i % COURSE_COLORS.length]} flex items-center justify-center text-xl flex-shrink-0`}>
                      {c.thumbnail}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-800 group-hover:text-stone-900 truncate">{c.title}</div>
                      <div className="text-xs text-stone-400 mt-0.5">{c.instructor}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-stone-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full bg-gradient-to-r ${COURSE_COLORS[i % COURSE_COLORS.length]}`} style={{ width: `${c.progress}%` }} />
                        </div>
                        <span className="text-xs text-stone-400 flex-shrink-0">{c.progress}%</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming schedule */}
          <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <CalendarDays size={16} className="text-blue-500" strokeWidth={1.5} />
                <h2 className="text-sm font-semibold text-stone-900">Upcoming Sessions</h2>
              </div>
              <Link href="/dashboard/schedule" className="text-xs text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1">
                Full schedule <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-stone-50">
              {loading ? (
                <div className="py-8 text-center animate-pulse"><div className="h-4 bg-stone-100 rounded mx-auto w-32" /></div>
              ) : thisWeekAppts.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">No sessions booked this week</div>
              ) : thisWeekAppts.map((a) => {
                const { dayName, time } = fmtApptTime(a.date);
                return (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="text-center w-10 flex-shrink-0">
                      <div className="text-[10px] text-stone-400 uppercase font-medium">{dayName}</div>
                      <div className="text-sm font-semibold text-stone-700">{time.split(" ")[0]}</div>
                      <div className="text-[10px] text-stone-400">{time.split(" ")[1]}</div>
                    </div>
                    <div className="w-px h-8 bg-stone-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-stone-700 truncate">Therapy — {a.therapist.user.name}</div>
                      <div className="text-xs text-stone-400">{fmtDur(a.duration)}</div>
                    </div>
                    <div className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md font-medium flex-shrink-0 ${SCHEDULE_COLORS[a.type] ?? "bg-stone-50 text-stone-600"}`}>
                      {SCHEDULE_ICONS[a.type] ?? <Video size={12} />}
                      <span className="capitalize">{a.type.replace("_", " ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — 2 cols */}
        <div className="md:col-span-2 space-y-6">

          {/* Mood check-in */}
          <div className="bg-gradient-to-br from-sage-800 via-sage-700 to-indigo-800 rounded-xl p-5 text-white">
            {moodSaved ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">{MOOD_OPTIONS.find((m) => m.score === moodScore)?.emoji}</div>
                <p className="font-medium text-sm mb-1">Check-in saved ✓</p>
                <p className="text-white/60 text-xs">Feeling {MOOD_OPTIONS.find((m) => m.score === moodScore)?.label.toLowerCase()}</p>
                {moodNote && <p className="text-white/40 text-xs mt-2 italic">&quot;{moodNote}&quot;</p>}
                <button
                  onClick={() => { setMoodSaved(false); setMoodScore(null); setMoodNote(""); }}
                  className="mt-4 text-white/40 text-xs hover:text-white/70 transition-colors"
                >
                  Log again
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs font-medium text-white/50 uppercase tracking-widest mb-1">Daily Check-in</p>
                <h3 className="text-sm font-medium text-white mb-4">How are you feeling today?</h3>
                <div className="flex gap-1.5 mb-4">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      key={m.score}
                      onClick={() => setMoodScore(m.score)}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all text-xs ${
                        moodScore === m.score ? "bg-white/25 ring-1 ring-white/50 scale-105" : "hover:bg-white/10"
                      }`}
                    >
                      <span className="text-lg">{m.emoji}</span>
                      <span className="text-white/50 text-[10px]">{m.label}</span>
                    </button>
                  ))}
                </div>
                <textarea
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="Add a note (optional)…"
                  rows={2}
                  className="w-full bg-white/10 text-white placeholder-white/30 text-xs rounded-xl p-3 resize-none focus:outline-none focus:ring-1 focus:ring-white/30 mb-3"
                />
                <button
                  onClick={handleMoodSave}
                  disabled={!moodScore || saving}
                  className="w-full bg-white text-sage-800 font-semibold text-sm py-2.5 rounded-xl hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? "Saving…" : "Save Check-in"}
                </button>
              </>
            )}
          </div>

          {/* Quick access */}
          <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <h2 className="text-sm font-semibold text-stone-900">Quick Access</h2>
            </div>
            <div className="divide-y divide-stone-50">
              {QUICK_LINKS.map(({ href, Icon, label, meta, iconCls }) => (
                <Link key={href} href={href} className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-stone-50 transition-colors group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconCls}`}>
                    <Icon size={15} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors truncate">{label}</div>
                    <div className="text-xs text-stone-400 mt-0.5">{meta}</div>
                  </div>
                  <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recommended courses */}
          {recommended.length > 0 && (
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <BookOpen size={16} className="text-amber-500" strokeWidth={1.5} />
                <h2 className="text-sm font-semibold text-stone-900 flex-1">Recommended</h2>
                <Link href="/dashboard/courses" className="text-xs text-stone-500 hover:text-stone-900 transition-colors">Browse →</Link>
              </div>
              <div className="space-y-2">
                {recommended.map((c, i) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/courses/${c.id}`}
                    className="bg-white border border-stone-100 rounded-xl p-4 flex items-center gap-3 hover:border-stone-300 hover:shadow-sm transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${COURSE_COLORS[(i + 2) % COURSE_COLORS.length]} flex items-center justify-center text-lg flex-shrink-0`}>
                      {c.thumbnail}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-800 truncate group-hover:text-stone-900">{c.title}</div>
                      <div className="text-xs text-stone-400 mt-0.5">{c.duration} · ★ {c.rating}</div>
                    </div>
                    <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {callOpen && nextCall && (
        <VideoCallRoom
          appointmentId={nextCall.id}
          otherPartyName={nextCall.therapist.user.name}
          sessionType={nextCall.type}
          durationLabel={fmtDur(nextCall.duration)}
          onEnd={() => setCallOpen(false)}
        />
      )}
      {activeTask && (
        <TaskActivityModal
          mission={activeTask as Parameters<typeof TaskActivityModal>[0]["mission"]}
          onComplete={(id, data) => { completeMission(id, data); setActiveTask(null); }}
          onClose={() => setActiveTask(null)}
        />
      )}
    </div>
  );
}
