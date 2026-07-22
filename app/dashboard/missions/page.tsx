"use client";

import { useState, useEffect } from "react";
import TaskActivityModal from "@/components/dashboard/TaskActivityModal";
import { useAchievementCheck } from "@/components/dashboard/AchievementToast";
import { Flame, Check, ArrowRight } from "lucide-react";

type Category = "mindfulness" | "movement" | "journaling" | "breathing" | "social" | "habit";

type Mission = {
  id: string; title: string; description: string; category: Category;
  duration: number; xp: number; completed: boolean; dueTime?: string | null; activityType?: string;
};

const CATEGORY_LABELS: Record<Category, string> = {
  mindfulness: "Mindfulness", movement: "Movement", journaling: "Journaling",
  breathing: "Breathing",    social: "Social",      habit: "Habit",
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

const CATEGORY_EMOJIS: Record<Category, string> = {
  mindfulness: "🧘", movement: "🚶", journaling: "📝",
  breathing:   "🌬️", social:   "💌", habit:      "✨",
};

// Full pool used as fallback when API is unavailable (client-side rotation)
const ALL_MISSIONS: Mission[] = [
  { id: "default_breathing",     title: "4-7-8 Breathing",              description: "Complete two rounds of 4-7-8 breathing to activate your parasympathetic nervous system and reduce stress.",       category: "breathing",   duration: 5,  xp: 10, completed: false, activityType: "breathing" },
  { id: "default_journal",       title: "Daily Gratitude Entry",        description: "Write down three things you're grateful for today — no matter how small. Builds a positive thinking habit.",        category: "journaling",  duration: 5,  xp: 15, completed: false, activityType: "gratitude" },
  { id: "default_meditation",    title: "Morning Mindfulness",          description: "Spend 10 minutes in guided breath-awareness meditation to start your day with clarity and calm.",                    category: "mindfulness", duration: 10, xp: 25, completed: false, activityType: "timer" },
  { id: "default_walk",          title: "Mindful Walk",                 description: "Take a 15-minute walk outside. Notice 5 things you see, 4 you hear, 3 you can touch — a grounding exercise.",      category: "movement",    duration: 15, xp: 20, completed: false, activityType: "walk" },
  { id: "default_checkin",       title: "Evening Check-in",            description: "Answer one reflection question: What challenged me today and how did I respond? Write freely for 5 minutes.",        category: "journaling",  duration: 5,  xp: 15, completed: false, activityType: "reflection" },
  { id: "default_bodyscan",      title: "Body Scan Meditation",         description: "Slowly scan from head to toe, noticing sensations without judgment. Helps release tension.",                       category: "mindfulness", duration: 15, xp: 20, completed: false, activityType: "bodyscan" },
  { id: "default_affirmations",  title: "Daily Affirmations",           description: "Read three affirmations aloud in front of a mirror. Counter your self-critical inner voice.",                       category: "habit",       duration: 5,  xp: 10, completed: false, activityType: "generic" },
  { id: "default_stretch",       title: "Morning Stretch Routine",      description: "10 minutes of gentle neck rolls, shoulder shrugs, and forward folds to release overnight tension.",                 category: "movement",    duration: 10, xp: 15, completed: false, activityType: "stretch" },
  { id: "default_grounding",     title: "5-4-3-2-1 Grounding",         description: "Name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste. Anchors you to the present moment.", category: "mindfulness", duration: 5,  xp: 10, completed: false, activityType: "walk" },
  { id: "default_social",        title: "Reach Out to Someone",        description: "Send a genuine message to a friend or family member. Social connection is one of the strongest predictors of wellbeing.", category: "social", duration: 15, xp: 25, completed: false, activityType: "social" },
  { id: "default_progressive",   title: "Progressive Muscle Relaxation",description: "Tense and release each muscle group from feet to face. 15 minutes that reduce physical anxiety symptoms.",          category: "breathing",   duration: 15, xp: 20, completed: false, activityType: "bodyscan" },
  { id: "default_worry",         title: "Worry Dump Journal",           description: "Write every worry on your mind without filtering. Then review: which are in your control?",                         category: "journaling",  duration: 10, xp: 15, completed: false, activityType: "worry" },
  { id: "default_screen",        title: "Tech-Free Break",             description: "Step away from all screens for 30 minutes. Read, draw, stretch, or sit in silence.",                                 category: "habit",       duration: 30, xp: 30, completed: false, activityType: "timer" },
  { id: "default_hydration",     title: "Mindful Hydration",           description: "Drink a full glass of water slowly, focusing on the sensation. Hydration directly impacts mood.",                    category: "habit",       duration: 5,  xp: 5,  completed: false, activityType: "generic" },
  { id: "default_selfcompassion",title: "Self-Compassion Moment",       description: "Write one paragraph treating yourself as you'd treat a struggling friend.",                                          category: "journaling",  duration: 10, xp: 20, completed: false, activityType: "self_compassion" },
  { id: "default_creative",      title: "Creative Expression",          description: "Spend 20 minutes drawing, colouring, writing poetry, or playing music — no goal or judgment.",                      category: "habit",       duration: 20, xp: 25, completed: false, activityType: "generic" },
  { id: "default_nature",        title: "Connect with Nature",         description: "Sit outside for 20 minutes without your phone. Natural settings lower cortisol.",                                    category: "movement",    duration: 20, xp: 20, completed: false, activityType: "timer" },
  { id: "default_strength",      title: "Positive Strengths List",      description: "Write 5 personal strengths or recent wins. Regularly recognizing competence builds resilience.",                     category: "journaling",  duration: 5,  xp: 15, completed: false, activityType: "strength" },
  { id: "default_sleep",         title: "Sleep Hygiene Wind-Down",      description: "30 minutes before bed: dim lights, stop screens, do gentle stretching to signal your body it's time to rest.",     category: "habit",       duration: 30, xp: 20, completed: false, activityType: "timer" },
  { id: "default_values",        title: "Values Reflection",            description: "Name one core value important to you and write how you will honor it in today's actions.",                          category: "journaling",  duration: 10, xp: 20, completed: false, activityType: "values" },
];

// Client-side daily rotation (mirrors server logic — used only when API is unavailable)
function clientSeededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  function rand() { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0x100000000; }
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function clientHashSeed(str: string): number {
  let h = 0;
  for (const c of str) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return h >>> 0;
}
function getTodayFallbackMissions(): Mission[] {
  const day = Math.floor(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) / 86400000);
  const seed = clientHashSeed(`anon-${day}`);
  return clientSeededShuffle(ALL_MISSIONS, seed).slice(0, 5);
}

function fmtDuration(min: number) {
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60 ? `${min % 60}m` : ""}`.trim();
}

function todayKey() {
  const d = new Date();
  return `me_done_${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function loadDone(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(todayKey()) ?? "[]")); }
  catch { return new Set(); }
}
function saveDone(id: string) {
  try {
    const s = loadDone(); s.add(id);
    localStorage.setItem(todayKey(), JSON.stringify([...s]));
  } catch {}
}
function removeDone(id: string) {
  try {
    const s = loadDone(); s.delete(id);
    localStorage.setItem(todayKey(), JSON.stringify([...s]));
  } catch {}
}

export default function MissionsPage() {
  const checkAchievements = useAchievementCheck();
  const [missions,    setMissions]    = useState<Mission[]>([]);
  const [streak,      setStreak]      = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [activeTask,  setActiveTask]  = useState<Mission | null>(null);

  useEffect(() => {
    fetch("/api/missions")
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => {
        const apiMissions: Mission[] = d.missions ?? [];
        const done = loadDone();
        if (apiMissions.length > 0) {
          // Merge DB state with localStorage — localStorage wins if DB missed the completion
          setMissions(apiMissions.map((m) => ({ ...m, completed: m.completed || done.has(m.id) })));
        } else {
          setMissions(getTodayFallbackMissions().map((m) => ({ ...m, completed: done.has(m.id) })));
        }
      })
      .catch(() => {
        const done = loadDone();
        setMissions(getTodayFallbackMissions().map((m) => ({ ...m, completed: done.has(m.id) })));
      })
      .finally(() => setLoading(false));

    fetch("/api/achievements")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setStreak(d.stats?.streak ?? 0))
      .catch(() => {});
  }, []);

  async function completeMission(id: string, responseData?: Record<string, unknown>) {
    saveDone(id);
    setMissions((p) => p.map((m) => m.id === id ? { ...m, completed: true } : m));
    fetch("/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId: id, responseData }),
    }).then(() => checkAchievements()).catch(() => {});
  }

  async function uncompleteMission(id: string) {
    removeDone(id);
    setMissions((p) => p.map((m) => m.id === id ? { ...m, completed: false } : m));
  }

  const completedCount = missions.filter((m) => m.completed).length;
  const total = missions.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-2xl font-semibold text-stone-900">Daily Tasks</h1>
        <p className="text-sm text-stone-500 mt-1 flex items-center gap-1.5">
          {streak > 0 && (
            <>
              <Flame size={13} className="text-stone-400" strokeWidth={1.5} />
              {streak}-day streak
            </>
          )}
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-stone-700">Today's progress</span>
          <span className="text-sm font-semibold text-stone-900">{completedCount} / {total}</span>
        </div>
        <div className="w-full bg-stone-100 rounded-full h-1.5 mb-4">
          <div className="bg-stone-900 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Completed", value: completedCount },
            { label: "Remaining", value: total - completedCount },
            { label: "Streak",    value: `${streak}d` },
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

        {loading && (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white border border-stone-100 rounded-2xl" />)}
          </div>
        )}

        {!loading && missions.length === 0 && (
          <div className="bg-white border border-stone-100 rounded-2xl p-10 text-center">
            <p className="text-stone-400 text-sm">No missions available right now.</p>
            <p className="text-stone-300 text-xs mt-1">Check back soon — your daily tasks will appear here.</p>
          </div>
        )}

        <div className="space-y-2.5">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                mission.completed ? "border-stone-100 opacity-75" : "border-stone-200 hover:border-stone-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3 p-4">
                {/* Emoji tile */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-opacity ${mission.completed ? "opacity-40" : ""} bg-stone-50`}>
                  {MISSION_EMOJIS[mission.id] ?? CATEGORY_EMOJIS[mission.category]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm font-semibold leading-snug ${mission.completed ? "line-through text-stone-400" : "text-stone-800"}`}>
                      {mission.title}
                    </p>
                    {mission.dueTime && (
                      <span className="text-xs text-stone-400 flex-shrink-0 mt-0.5">{mission.dueTime}</span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 leading-relaxed truncate ${mission.completed ? "text-stone-300" : "text-stone-500"}`}>
                    {mission.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-stone-400">{fmtDuration(mission.duration)}</span>
                    <span className="text-stone-200">·</span>
                    <span className="text-xs text-stone-400">{CATEGORY_LABELS[mission.category]}</span>
                  </div>
                </div>

                {mission.completed ? (
                  <button
                    onClick={() => uncompleteMission(mission.id)}
                    className="w-6 h-6 rounded-full bg-stone-900 border-stone-900 flex items-center justify-center flex-shrink-0 hover:bg-stone-700 transition-colors"
                    title="Undo completion"
                  >
                    <Check size={10} strokeWidth={3} className="text-white" />
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTask(mission)}
                    className="flex items-center gap-1 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-colors flex-shrink-0"
                  >
                    Start <ArrowRight size={11} />
                  </button>
                )}
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
            { days: 7,  label: "7-day consistency",  reached: streak >= 7 },
            { days: 14, label: "Two-week habit",      reached: streak >= 14 },
            { days: 30, label: "Monthly practice",    reached: streak >= 30 },
            { days: 90, label: "90-day foundation",   reached: streak >= 90 },
          ].map((m) => (
            <div key={m.days} className="flex items-center gap-4">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${m.reached ? "bg-stone-900 border-stone-900" : "border-stone-200"}`}>
                {m.reached && <Check size={9} strokeWidth={3} className="text-white" />}
              </div>
              <div className="flex-1">
                <div className={`text-sm ${m.reached ? "text-stone-700 line-through" : "text-stone-600"}`}>{m.label}</div>
              </div>
              <div className="text-xs font-medium text-stone-400">{m.reached ? "Complete" : `Day ${m.days}`}</div>
            </div>
          ))}
        </div>
      </div>

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
