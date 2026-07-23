"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard, CheckSquare, PenLine, LifeBuoy, BookOpen,
  ClipboardList, Users, MessageCircle, Calendar, Stethoscope, BarChart2,
} from "lucide-react";
import type { TourStep } from "./types";

// ── Embedded interactive widgets, shown inside specific tour steps ──────────

function TodaysTasksPreview() {
  const [state, setState] = useState<{ loading: boolean; titles: string[] }>({ loading: true, titles: [] });

  useEffect(() => {
    fetch("/api/missions")
      .then((r) => r.json())
      .then((d) => setState({ loading: false, titles: (d.missions ?? []).map((m: { title: string }) => m.title) }))
      .catch(() => setState({ loading: false, titles: [] }));
  }, []);

  return (
    <div className="bg-stone-50 border border-stone-100 rounded-xl p-3">
      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Your 5 tasks today</p>
      {state.loading ? (
        <div className="space-y-1.5 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-3 bg-stone-200 rounded w-full" />)}
        </div>
      ) : state.titles.length === 0 ? (
        <p className="text-xs text-stone-400">Your tasks will appear here in a moment.</p>
      ) : (
        <ul className="space-y-1.5">
          {state.titles.map((t, i) => (
            <li key={i} className="text-xs text-stone-600 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-sage-500 flex-shrink-0" /> {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const MOODS = [
  { score: 1, emoji: "😞", label: "Very low" },
  { score: 2, emoji: "😕", label: "Low" },
  { score: 3, emoji: "😐", label: "Okay" },
  { score: 4, emoji: "🙂", label: "Good" },
  { score: 5, emoji: "😄", label: "Great" },
];

function MoodQuickCheckin() {
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [picked, setPicked] = useState<number | null>(null);

  async function log(score: number) {
    if (status !== "idle") return;
    setPicked(score);
    setStatus("saving");
    try {
      await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      });
      setStatus("done");
    } catch {
      setStatus("idle");
      setPicked(null);
    }
  }

  return (
    <div className="bg-stone-50 border border-stone-100 rounded-xl p-3">
      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
        Try it — how are you feeling right now?
      </p>
      <div className="flex items-center justify-between gap-1.5">
        {MOODS.map((m) => (
          <button
            key={m.score}
            type="button"
            onClick={() => log(m.score)}
            disabled={status !== "idle"}
            aria-label={m.label}
            className={`flex-1 text-xl py-2 rounded-lg transition-all ${
              picked === m.score ? "bg-sage-100 scale-110" : "hover:bg-stone-100"
            } disabled:cursor-default`}
          >
            {m.emoji}
          </button>
        ))}
      </div>
      {status === "done" && (
        <p className="text-xs text-sage-700 font-medium mt-2 text-center">Logged — that&apos;s your first real check-in. 🎉</p>
      )}
    </div>
  );
}

function ProgressPreview() {
  const [stats, setStats] = useState<{ xp: number; level: number } | null>(null);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => { if (d.user) setStats({ xp: d.user.xp ?? 0, level: d.user.level ?? 1 }); })
      .catch(() => {});
  }, []);

  if (!stats) return null;
  return (
    <div className="bg-stone-50 border border-stone-100 rounded-xl p-3 flex items-center justify-around text-center">
      <div>
        <p className="text-lg font-bold text-stone-900">{stats.level}</p>
        <p className="text-[10px] text-stone-400 uppercase tracking-wide">Level</p>
      </div>
      <div className="w-px h-8 bg-stone-200" />
      <div>
        <p className="text-lg font-bold text-stone-900">{stats.xp}</p>
        <p className="text-[10px] text-stone-400 uppercase tracking-wide">XP earned</p>
      </div>
    </div>
  );
}

// ── The tour itself ──────────────────────────────────────────────────────────

export const CLIENT_TOUR: TourStep[] = [
  {
    Icon: LayoutDashboard,
    title: "Today's Tasks",
    body: "You'll always have exactly 5 tasks here, every day — a mix picked for you, or set by your therapist once they've built out your plan. Complete them for XP.",
    accent: "bg-sage-50 text-sage-700",
    route: "/dashboard",
    targetTour: "/dashboard",
    Extra: TodaysTasksPreview,
  },
  {
    Icon: CheckSquare,
    title: "Daily Tasks Library",
    body: "Beyond today's 5, this is the full library — breathing exercises, journalling prompts, movement, mindfulness. Some repeat daily, some are one-off.",
    accent: "bg-amber-50 text-amber-700",
    route: "/dashboard/missions",
    targetTour: "/dashboard/missions",
  },
  {
    Icon: PenLine,
    title: "Journal & Mood",
    body: "A private space to write, with mood, sleep, and trigger tagging your therapist can see patterns in over time (only if you choose to share it).",
    accent: "bg-rose-50 text-rose-700",
    route: "/dashboard/journal",
    targetTour: "/dashboard/journal",
    Extra: MoodQuickCheckin,
  },
  {
    Icon: LifeBuoy,
    title: "Safety Plan",
    body: "A plan you write yourself, in your own words, for hard moments — your warning signs, what's helped before, and who to call. Worth setting up while things feel calm, not during a crisis. Crisis resources are always one tap away from here too.",
    accent: "bg-red-50 text-red-700",
    route: "/dashboard/safety-plan",
    targetTour: "/dashboard/safety-plan",
  },
  {
    Icon: BookOpen,
    title: "My Courses",
    body: "Structured, multi-lesson courses on things like anxiety, sleep, and self-esteem — often recommended based on your assessment results.",
    accent: "bg-blue-50 text-blue-700",
    route: "/dashboard/courses",
    targetTour: "/dashboard/courses",
  },
  {
    Icon: ClipboardList,
    title: "Assessments",
    body: "Periodic check-ins (like PHQ-9 / GAD-7 style questionnaires) that track how you're doing over time and help shape what gets recommended to you.",
    accent: "bg-violet-50 text-violet-700",
    route: "/dashboard/assessment",
    targetTour: "/dashboard/assessment",
  },
  {
    Icon: Users,
    title: "Community",
    body: "Moderated peer support groups organised around goals, not diagnoses — 'better sleep,' 'managing panic,' that kind of thing. Anonymous by default.",
    accent: "bg-teal-50 text-teal-700",
    route: "/dashboard/community",
    targetTour: "/dashboard/community",
  },
  {
    Icon: MessageCircle,
    title: "Messages",
    body: "Direct, secure messaging with your therapist between sessions — for a quick update or a question that can't wait for your next appointment.",
    accent: "bg-pink-50 text-pink-700",
    route: "/dashboard/messages",
    targetTour: "/dashboard/messages",
  },
  {
    Icon: Calendar,
    title: "Schedule",
    body: "Book, reschedule, or join your sessions from here — including video calls, right when it's time, no extra app needed.",
    accent: "bg-indigo-50 text-indigo-700",
    route: "/dashboard/schedule",
    targetTour: "/dashboard/schedule",
  },
  {
    Icon: Stethoscope,
    title: "My Therapist",
    body: "The therapist you were matched with, and why — based on what you shared during sign-up. You can see their profile, or request a different match here any time.",
    accent: "bg-cyan-50 text-cyan-700",
    route: "/dashboard/my-therapist",
    targetTour: "/dashboard/my-therapist",
  },
  {
    Icon: BarChart2,
    title: "Progress",
    body: "Every task you complete earns XP and builds your streak. This is where it all adds up — levels, streaks, and badges for real consistency.",
    accent: "bg-emerald-50 text-emerald-700",
    route: "/dashboard/achievements",
    targetTour: "/dashboard/achievements",
    Extra: ProgressPreview,
  },
];
