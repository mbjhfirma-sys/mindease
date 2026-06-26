"use client";

import { useState } from "react";
import { upcomingMissions, userStats, type Mission } from "@/lib/mockData";
import { useTasks } from "@/lib/useTasks";
import TaskActivityModal from "@/components/dashboard/TaskActivityModal";
import { Brain, Dumbbell, PenLine, Wind, Users, Repeat, Flame, Check, ArrowRight } from "lucide-react";

const CATEGORY_LABELS: Record<Mission["category"], string> = {
  mindfulness: "Mindfulness",
  movement:    "Movement",
  journaling:  "Journaling",
  breathing:   "Breathing",
  social:      "Social",
  habit:       "Habit",
};

const CATEGORY_ICONS: Record<Mission["category"], React.ReactNode> = {
  mindfulness: <Brain size={12} strokeWidth={1.5} />,
  movement:    <Dumbbell size={12} strokeWidth={1.5} />,
  journaling:  <PenLine size={12} strokeWidth={1.5} />,
  breathing:   <Wind size={12} strokeWidth={1.5} />,
  social:      <Users size={12} strokeWidth={1.5} />,
  habit:       <Repeat size={12} strokeWidth={1.5} />,
};

export default function MissionsPage() {
  const { tasks, complete, uncomplete, completedCount, total } = useTasks();
  const [activeTask, setActiveTask] = useState<Mission | null>(null);

  const pct = Math.round((completedCount / total) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-2xl font-semibold text-stone-900">Daily Tasks</h1>
        <p className="text-sm text-stone-500 mt-1 flex items-center gap-1.5">
          Assigned by Dr. Sarah Chen
          <span className="text-stone-300">·</span>
          <Flame size={13} className="text-stone-400" strokeWidth={1.5} />
          {userStats.currentStreak}-day streak
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-stone-700">Today's progress</span>
          <span className="text-sm font-semibold text-stone-900">{completedCount} / {total}</span>
        </div>
        <div className="w-full bg-stone-100 rounded-full h-1.5 mb-4">
          <div
            className="bg-stone-900 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Completed", value: completedCount },
            { label: "Remaining",  value: total - completedCount },
            { label: "Streak",     value: `${userStats.currentStreak}d` },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-xl font-bold text-stone-900">{s.value}</div>
              <div className="text-xs text-stone-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div>
        <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3">Today</h2>
        <div className="space-y-2.5">
          {tasks.map((mission) => (
            <div
              key={mission.id}
              className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                mission.completed
                  ? "border-stone-100 opacity-75"
                  : "border-stone-200 hover:border-stone-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start gap-4 p-4">
                {/* Checkmark — only for undoing */}
                <button
                  onClick={() => mission.completed && uncomplete(mission.id)}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    mission.completed
                      ? "bg-stone-900 border-stone-900 hover:bg-stone-700 cursor-pointer"
                      : "border-stone-200 cursor-default"
                  }`}
                  title={mission.completed ? "Undo completion" : undefined}
                >
                  {mission.completed && <Check size={9} strokeWidth={3} className="text-white" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm font-semibold leading-snug ${mission.completed ? "line-through text-stone-400" : "text-stone-800"}`}>
                      {mission.title}
                    </p>
                    {mission.dueTime && (
                      <span className="text-xs text-stone-400 flex-shrink-0 mt-0.5">{mission.dueTime}</span>
                    )}
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${mission.completed ? "text-stone-300" : "text-stone-500"}`}>
                    {mission.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-stone-400">{mission.duration}</span>
                    <span className="text-stone-200">·</span>
                    <span className="flex items-center gap-1 text-xs text-stone-400">
                      {CATEGORY_ICONS[mission.category]}
                      {CATEGORY_LABELS[mission.category]}
                    </span>
                  </div>
                </div>

                {/* Action */}
                {mission.completed ? (
                  <span className="text-xs font-medium text-stone-400 flex-shrink-0 mt-0.5 self-center">Done</span>
                ) : (
                  <button
                    onClick={() => setActiveTask(mission)}
                    className="flex items-center gap-1 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-colors flex-shrink-0 self-center"
                  >
                    Start <ArrowRight size={11} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3">Coming Up</h2>
        <div className="bg-white border border-stone-100 rounded-2xl divide-y divide-stone-50">
          {upcomingMissions.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-stone-600 font-medium truncate">{m.title}</div>
                <div className="text-xs text-stone-400 mt-0.5">{m.description.slice(0, 60)}…</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-stone-500 font-medium">{m.date}</div>
                <div className="text-xs text-stone-400 capitalize mt-0.5">{m.category}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-stone-900 mb-4">Consistency Milestones</h2>
        <div className="space-y-3">
          {[
            { days: 7,  label: "7-day consistency",  reached: userStats.currentStreak >= 7 },
            { days: 14, label: "Two-week habit",      reached: userStats.currentStreak >= 14 },
            { days: 30, label: "Monthly practice",    reached: userStats.currentStreak >= 30 },
            { days: 90, label: "90-day foundation",   reached: userStats.currentStreak >= 90 },
          ].map((m) => (
            <div key={m.days} className="flex items-center gap-4">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${m.reached ? "bg-stone-900 border-stone-900" : "border-stone-200"}`}>
                {m.reached && <Check size={9} strokeWidth={3} className="text-white" />}
              </div>
              <div className="flex-1">
                <div className={`text-sm ${m.reached ? "text-stone-700 line-through" : "text-stone-600"}`}>{m.label}</div>
              </div>
              <div className="text-xs font-medium text-stone-400">
                {m.reached ? "Complete" : `Day ${m.days}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task activity modal */}
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
