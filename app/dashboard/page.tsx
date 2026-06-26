"use client";

import Link from "next/link";
import { useState } from "react";
import { courses, scheduleItems, userStats, clientAppointments, type Mission } from "@/lib/mockData";
import { useTasks } from "@/lib/useTasks";
import VideoCallModal from "@/components/therapist/VideoCallModal";
import TaskActivityModal from "@/components/dashboard/TaskActivityModal";
import {
  TrendingUp, BookOpen, Clock, Flame,
  PenLine, Bot, ClipboardList, Users,
  Video, CalendarDays, ArrowRight, CheckCircle2, Check,
} from "lucide-react";

const MOOD_OPTIONS = [
  { score: 1, emoji: "😔", label: "Low" },
  { score: 2, emoji: "😟", label: "Not great" },
  { score: 3, emoji: "😐", label: "Okay" },
  { score: 4, emoji: "🙂", label: "Good" },
  { score: 5, emoji: "😊", label: "Great" },
];

const QUICK_LINKS = [
  { href: "/dashboard/journal", Icon: PenLine, label: "Write in journal", meta: "Private & secure", iconCls: "bg-amber-50 text-amber-600" },
  { href: "/dashboard/ai-chat", Icon: Bot, label: "AI Support — Sage", meta: "Available 24/7", iconCls: "bg-violet-50 text-violet-600" },
  { href: "/dashboard/assessment", Icon: ClipboardList, label: "Mental health check-in", meta: "6 assessments", iconCls: "bg-blue-50 text-blue-600" },
  { href: "/dashboard/community", Icon: Users, label: "Community groups", meta: "5 groups joined", iconCls: "bg-teal-50 text-teal-600" },
];

const SCHEDULE_COLORS: Record<string, string> = {
  therapy: "bg-blue-50 text-blue-600",
  group:   "bg-violet-50 text-violet-600",
  course:  "bg-amber-50 text-amber-700",
  self:    "bg-sage-50 text-sage-700",
};
const SCHEDULE_ICONS: Record<string, React.ReactNode> = {
  therapy: <Video size={12} />,
  group:   <Users size={12} />,
  course:  <BookOpen size={12} />,
  self:    <Clock size={12} />,
};

const COURSE_COLORS = [
  "from-sage-500 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-violet-500 to-indigo-500",
  "from-rose-400 to-pink-500",
];

const inProgress  = courses.filter((c) => c.progress > 0 && c.progress < 100);
const recommended = courses.filter((c) => c.progress === 0).slice(0, 2);
const nextCall    = clientAppointments.find((a) => a.status === "confirmed");

export default function DashboardPage() {
  const { tasks, complete, uncomplete, completedCount, total: taskTotal } = useTasks();
  const todayMissions = tasks.slice(0, 4);

  const [activeTask, setActiveTask] = useState<Mission | null>(null);
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [moodNote, setMoodNote] = useState("");
  const [moodSaved, setMoodSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [callOpen, setCallOpen] = useState(false);

  async function handleMoodSave() {
    if (!moodScore) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setMoodSaved(true);
  }

  const stats = [
    {
      label: "Wellness Score",
      value: `${userStats.wellnessScore}%`,
      change: "+4% this week",
      Icon: TrendingUp,
      iconCls: "bg-sage-50 text-sage-600",
      valueCls: "text-sage-700",
      border: "border-sage-100",
    },
    {
      label: "Courses Enrolled",
      value: "3",
      change: "1 in progress",
      Icon: BookOpen,
      iconCls: "bg-amber-50 text-amber-600",
      valueCls: "text-stone-900",
      border: "border-amber-100",
    },
    {
      label: "Hours This Month",
      value: "14.5",
      change: "Sessions & courses",
      Icon: Clock,
      iconCls: "bg-blue-50 text-blue-600",
      valueCls: "text-stone-900",
      border: "border-blue-100",
    },
    {
      label: "Streak",
      value: `${userStats.currentStreak} days`,
      change: `Best: ${userStats.longestStreak}`,
      Icon: Flame,
      iconCls: "bg-orange-50 text-orange-500",
      valueCls: "text-orange-600",
      border: "border-orange-100",
    },
  ];

  const progressPct = Math.round((completedCount / taskTotal) * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Greeting */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-2xl font-semibold text-stone-900">Good morning, Alex 👋</h1>
          <p className="text-stone-500 text-sm mt-1">{completedCount} of {taskTotal} tasks done today</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 border border-amber-200 bg-amber-50 rounded-xl px-4 py-2.5 flex-shrink-0">
          <Flame size={14} className="text-amber-500" />
          <span className="text-sm font-semibold text-amber-700">{userStats.currentStreak} days</span>
          <span className="text-xs text-amber-500">streak</span>
        </div>
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
            <div className={`text-2xl font-semibold ${s.valueCls}`}>{s.value}</div>
            <div className="text-sm text-stone-600 mt-1">{s.label}</div>
            <div className="text-xs text-stone-400 mt-0.5">{s.change}</div>
          </div>
        ))}
      </div>

      {/* Next therapy session */}
      {nextCall && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 flex items-center gap-4 text-white shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Video size={18} className="text-white" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-200 uppercase tracking-widest mb-0.5">Upcoming Session</p>
            <p className="text-sm font-semibold text-white">{nextCall.therapistName}</p>
            <p className="text-xs text-blue-200 mt-0.5">{nextCall.date} · {nextCall.time} · {nextCall.duration}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] border border-white/30 text-white/80 px-2 py-0.5 rounded-md font-medium">Confirmed</span>
            <button
              onClick={() => setCallOpen(true)}
              className="text-sm font-semibold bg-white text-blue-700 px-3.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1.5"
            >
              <Video size={13} />
              Join
            </button>
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
                  <h2 className="text-sm font-semibold text-stone-900">Today's Tasks</h2>
                  <p className="text-xs text-stone-400 mt-0.5">{completedCount} of {taskTotal} completed</p>
                </div>
              </div>
              <Link href="/dashboard/missions" className="text-xs text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-stone-50">
              {todayMissions.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 transition-colors group">
                  <button
                    onClick={() => m.completed && uncomplete(m.id)}
                    className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                      m.completed
                        ? "bg-sage-600 border-sage-600 hover:bg-sage-500 cursor-pointer"
                        : "border-stone-200 cursor-default"
                    }`}
                    title={m.completed ? "Undo" : undefined}
                  >
                    {m.completed && <Check size={8} strokeWidth={3} className="text-white" />}
                  </button>
                  <button
                    onClick={() => !m.completed && setActiveTask(m)}
                    disabled={m.completed}
                    className="flex-1 flex items-center gap-3 text-left min-w-0 disabled:cursor-default"
                  >
                    <span className={`text-sm flex-1 truncate transition-colors ${m.completed ? "line-through text-stone-400" : "text-stone-700 group-hover:text-stone-900"}`}>
                      {m.title}
                    </span>
                    <span className="text-xs text-stone-400 flex-shrink-0">{m.duration}</span>
                    {!m.completed && (
                      <ArrowRight size={12} className="text-stone-300 group-hover:text-stone-500 flex-shrink-0 transition-colors" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            {/* Coloured progress bar */}
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
                          <div
                            className={`h-1.5 rounded-full bg-gradient-to-r ${COURSE_COLORS[i % COURSE_COLORS.length]}`}
                            style={{ width: `${c.progress}%` }}
                          />
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
                <h2 className="text-sm font-semibold text-stone-900">This Week</h2>
              </div>
              <Link href="/dashboard/schedule" className="text-xs text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1">
                Full schedule <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-stone-50">
              {scheduleItems.slice(0, 4).map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="text-center w-10 flex-shrink-0">
                    <div className="text-[10px] text-stone-400 uppercase font-medium">{s.day}</div>
                    <div className="text-sm font-semibold text-stone-700">{s.time.split(" ")[0]}</div>
                    <div className="text-[10px] text-stone-400">{s.time.split(" ")[1]}</div>
                  </div>
                  <div className="w-px h-8 bg-stone-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-stone-700 truncate">{s.title}</div>
                    <div className="text-xs text-stone-400">{s.duration}</div>
                  </div>
                  <div className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md font-medium flex-shrink-0 ${SCHEDULE_COLORS[s.type]}`}>
                    {SCHEDULE_ICONS[s.type]}
                    <span className="capitalize">{s.type}</span>
                  </div>
                </div>
              ))}
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
                {moodNote && <p className="text-white/40 text-xs mt-2 italic">"{moodNote}"</p>}
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
                        moodScore === m.score
                          ? "bg-white/25 ring-1 ring-white/50 scale-105"
                          : "hover:bg-white/10"
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
        </div>
      </div>

      {callOpen && nextCall && (
        <VideoCallModal
          clientName={nextCall.therapistName}
          sessionType={nextCall.type}
          duration={nextCall.duration}
          onEnd={() => setCallOpen(false)}
        />
      )}
      {activeTask && (
        <TaskActivityModal
          mission={activeTask}
          onComplete={(id) => { complete(id); setActiveTask(null); }}
          onClose={() => setActiveTask(null)}
        />
      )}
    </div>
  );
}
