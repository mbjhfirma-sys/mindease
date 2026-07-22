"use client";

import Link from "next/link";
import { use, useState, useEffect, useMemo, useCallback } from "react";
import QuizLesson from "@/components/dashboard/QuizLesson";
import ReflectionLesson from "@/components/dashboard/ReflectionLesson";
import ExerciseLesson from "@/components/dashboard/ExerciseLesson";
import AudioLesson from "@/components/dashboard/AudioLesson";
import { useAchievementCheck } from "@/components/dashboard/AchievementToast";

type LessonType = "video" | "quiz" | "reflection" | "exercise" | "audio";
type QuizQuestion = { q: string; options: string[]; correct: number; explanation: string };
type Lesson = {
  id: string; module: string; title: string; duration: string; type: LessonType;
  videoUrl?: string | null; audioUrl?: string | null;
  questions?: QuizQuestion[]; prompt?: string; exerciseType?:
    | "breathing" | "bodyscan" | "gratitude" | "grounding"
    | "pmr" | "boxbreathing" | "reframe" | "values" | "feelingswheel"
    | "worryjar" | "lovingkindness" | "cbttriangle" | "urgesurf" | "selfcompassion";
};
type Course = {
  id: string; title: string; instructor: string; category: string; level: string;
  duration: string; enrolled: number; rating: number; thumbnail: string; color: string; description: string;
};

const TYPE_ICON: Record<string, string> = { video: "▶", quiz: "❓", reflection: "📝", exercise: "🌬️", audio: "🎧" };
const TYPE_LABEL: Record<string, string> = { video: "Video Lesson", quiz: "Knowledge Check", reflection: "Reflection", exercise: "Exercise", audio: "Guided Audio" };
const TYPE_BADGE: Record<string, string> = {
  video: "bg-stone-100 text-stone-600",
  quiz: "bg-blue-100 text-blue-700",
  reflection: "bg-amber-100 text-amber-700",
  exercise: "bg-sage-100 text-sage-700",
  audio: "bg-purple-100 text-purple-700",
};
const HEADER_COLOR: Record<string, string> = {
  video: "bg-sage-800 text-white",
  quiz: "bg-blue-600 text-white",
  reflection: "bg-amber-50 text-amber-800 border-b border-amber-100",
  exercise: "bg-sage-50 text-sage-800 border-b border-sage-100",
  audio: "bg-purple-700 text-white",
};

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const checkAchievements = useAchievementCheck();
  const { id } = use(params);

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<string | undefined>(undefined);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [sidebarTab, setSidebarTab] = useState<"lessons" | "overview">("lessons");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/courses/${id}`).then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch(`/api/progress?courseId=${id}`).then((r) => (r.ok ? r.json() : { completedLessonIds: [] })),
    ])
      .then(([courseData, progressData]) => {
        setCourse(courseData.course);
        setLessons(courseData.lessons ?? []);
        const completed: Set<string> = new Set(progressData.completedLessonIds ?? []);
        setCompletedIds(completed);
        const firstIncomplete = (courseData.lessons ?? []).find((l: Lesson) => !completed.has(l.id));
        setActiveLessonId(firstIncomplete?.id ?? courseData.lessons?.[0]?.id);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const activeLesson = lessons.find((l) => l.id === activeLessonId);

  const modules = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const l of lessons) {
      if (!map.has(l.module)) map.set(l.module, []);
      map.get(l.module)!.push(l);
    }
    return map;
  }, [lessons]);

  const markComplete = useCallback(async () => {
    if (!activeLessonId || !activeLesson) return;
    setCompletedIds((prev) => new Set([...prev, activeLessonId]));
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: activeLessonId, courseId: id, completed: true }),
    }).then(() => checkAchievements()).catch(() => {});
    const idx = lessons.findIndex((l) => l.id === activeLessonId);
    const next = lessons.slice(idx + 1).find((l) => !completedIds.has(l.id) && l.id !== activeLessonId);
    if (next) setActiveLessonId(next.id);
  }, [activeLessonId, activeLesson, completedIds, id, lessons, checkAchievements]);

  const completedCount = completedIds.size;
  const progress = Math.round((completedCount / Math.max(lessons.length, 1)) * 100);

  if (loading) {
    return <div className="max-w-7xl mx-auto animate-pulse h-96 bg-white rounded-3xl border border-stone-100" />;
  }

  if (notFound || !course) {
    return (
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard/courses" className="inline-flex items-center gap-1.5 text-stone-500 text-sm mb-4 hover:text-sage-700 transition-colors">
          ← Back to Courses
        </Link>
        <div className="bg-white rounded-3xl border border-stone-100 p-12 text-center text-stone-400 text-sm">
          Course not found.
        </div>
      </div>
    );
  }

  // Lesson list content (shared between sidebar + mobile drawer)
  const LessonList = (
    <div className="overflow-y-auto flex-1 min-h-0">
      {[...modules.entries()].map(([modName, modLessons]) => (
        <div key={modName}>
          <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100 sticky top-0 z-10">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wide truncate">{modName}</div>
            <div className="text-[10px] text-stone-400 mt-0.5">
              {modLessons.filter((l) => completedIds.has(l.id)).length}/{modLessons.length} complete
            </div>
          </div>
          {modLessons.map((lesson) => {
            const isActive = lesson.id === activeLessonId;
            const isDone = completedIds.has(lesson.id);
            return (
              <button
                key={lesson.id}
                onClick={() => { setActiveLessonId(lesson.id); setDrawerOpen(false); }}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-stone-50 last:border-0 transition-colors ${
                  isActive ? "bg-sage-50 border-l-2 border-l-sage-600" : "hover:bg-stone-50"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                  isDone ? "bg-sage-100 text-sage-700 font-bold" :
                  isActive ? "bg-sage-700 text-white font-bold" :
                  "bg-stone-100 text-stone-400"
                }`}>
                  {isDone ? "✓" : <span className="text-[10px]">{TYPE_ICON[lesson.type]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium truncate leading-tight ${
                    isActive ? "text-sage-700" : isDone ? "text-stone-400" : "text-stone-700"
                  }`}>
                    {lesson.title}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${TYPE_BADGE[lesson.type]}`}>{lesson.type}</span>
                    <span className="text-[10px] text-stone-300">{lesson.duration}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back */}
      <Link href="/dashboard/courses" className="inline-flex items-center gap-1.5 text-stone-500 text-sm mb-4 hover:text-sage-700 transition-colors">
        ← Back to Courses
      </Link>

      {/* Mobile: lesson drawer trigger */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-full flex items-center justify-between bg-white border border-stone-200 rounded-2xl px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs">
              {TYPE_ICON[activeLesson?.type ?? "video"]}
            </div>
            <div className="text-left">
              <div className="text-xs text-stone-400">Now: {TYPE_LABEL[activeLesson?.type ?? "video"]}</div>
              <div className="text-sm font-semibold text-stone-800 line-clamp-1">{activeLesson?.title ?? "Select a lesson"}</div>
            </div>
          </div>
          <span className="text-stone-400 text-sm">📋 {completedCount}/{lessons.length}</span>
        </button>
      </div>

      <div className="flex gap-5 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Content card */}
          <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden">
            {/* Type header */}
            {activeLesson && (
              <div className={`px-5 py-3 flex items-center gap-3 ${HEADER_COLOR[activeLesson.type]}`}>
                <span className="text-lg">{TYPE_ICON[activeLesson.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-70">{TYPE_LABEL[activeLesson.type]}</div>
                  <div className="font-semibold text-sm truncate">{activeLesson.title}</div>
                </div>
                <span className="text-xs opacity-60 flex-shrink-0">{activeLesson.duration}</span>
              </div>
            )}

            <div className="p-4 md:p-6">
              {!activeLesson && (
                <div className="flex items-center justify-center h-64 text-stone-400 text-sm">Select a lesson to begin</div>
              )}

              {activeLesson?.type === "video" && (
                <div>
                  {activeLesson.videoUrl ? (
                    <video controls src={activeLesson.videoUrl} className="w-full rounded-2xl mb-4 bg-black" />
                  ) : (
                    <div className="bg-sage-800 rounded-2xl overflow-hidden mb-4">
                      <div className="aspect-video flex items-center justify-center">
                        <div className="text-center text-white px-4">
                          <div className="text-6xl md:text-7xl mb-4">{course.thumbnail}</div>
                          <h2 className="text-base md:text-lg font-semibold mb-1 line-clamp-2">{activeLesson.title}</h2>
                          <p className="text-sage-300 text-sm">Video coming soon</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {!completedIds.has(activeLesson.id) ? (
                    <button onClick={markComplete} className="w-full bg-sage-700 text-white font-semibold py-3 rounded-xl hover:bg-sage-800 transition-colors text-sm">
                      Mark as Complete & Continue →
                    </button>
                  ) : (
                    <div className="w-full bg-sage-50 border border-sage-200 text-sage-700 font-semibold py-3 rounded-xl text-center text-sm">✓ Completed</div>
                  )}
                </div>
              )}

              {activeLesson?.type === "quiz" && activeLesson.questions && (
                <QuizLesson title={activeLesson.title} questions={activeLesson.questions} onComplete={markComplete} />
              )}
              {activeLesson?.type === "reflection" && activeLesson.prompt && (
                <ReflectionLesson title={activeLesson.title} prompt={activeLesson.prompt} onComplete={markComplete} />
              )}
              {activeLesson?.type === "exercise" && activeLesson.exerciseType && (
                <ExerciseLesson title={activeLesson.title} exerciseType={activeLesson.exerciseType} onComplete={markComplete} />
              )}
              {activeLesson?.type === "audio" && (
                <AudioLesson title={activeLesson.title} duration={activeLesson.duration} audioUrl={activeLesson.audioUrl} onComplete={markComplete} />
              )}
            </div>
          </div>

          {/* Course meta + progress */}
          <div className="bg-white rounded-2xl p-4 md:p-5 border border-stone-100">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 ${course.color} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{course.thumbnail}</div>
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-stone-900 text-sm md:text-base">{course.title}</h1>
                <p className="text-stone-400 text-xs mt-0.5">{course.instructor} · {course.category} · {course.level}</p>
              </div>
              <div className="flex items-center gap-1 bg-sage-100 text-sage-700 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0">
                <span className="text-amber-400">★</span> {course.rating}
              </div>
            </div>
            <p className="text-stone-500 text-sm mt-3 leading-relaxed hidden md:block">{course.description}</p>
            <div className="mt-4 pt-4 border-t border-stone-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-600">Progress</span>
                <span className="text-stone-400 text-xs">{completedCount}/{lessons.length} lessons · {progress}%</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2">
                <div className="bg-sage-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(["video","quiz","reflection","exercise","audio"] as const).map((type) => {
                  const count = lessons.filter((l) => l.type === type).length;
                  if (!count) return null;
                  return (
                    <span key={type} className={`text-[10px] px-2 py-0.5 rounded-full ${TYPE_BADGE[type]}`}>
                      {TYPE_ICON[type]} {count} {type}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex flex-col w-72 flex-shrink-0 bg-white rounded-3xl border border-stone-100 overflow-hidden sticky top-4 max-h-[calc(100vh-80px)]">
          {/* Tabs */}
          <div className="flex flex-shrink-0 border-b border-stone-100">
            {(["lessons","overview"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                className={`flex-1 py-3 text-xs font-semibold transition-colors capitalize ${
                  sidebarTab === tab ? "text-sage-700 border-b-2 border-sage-700" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {tab === "lessons" ? `Lessons (${lessons.length})` : "Overview"}
              </button>
            ))}
          </div>

          {sidebarTab === "overview" && (
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {[["📖", lessons.length, "Lessons"],["⏱️", course.duration, ""],["👥", course.enrolled.toLocaleString(), "Enrolled"],["⭐", course.rating, "Rating"]].map(([icon, val, label]) => (
                  <div key={String(label)} className="bg-stone-50 rounded-xl p-3 text-center">
                    <div className="text-lg">{icon}</div>
                    <div className="font-bold text-stone-800 text-sm">{val}</div>
                    {label && <div className="text-stone-400 text-[10px]">{label}</div>}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-semibold text-stone-600 mb-2">Modules:</div>
                <div className="space-y-1.5">
                  {[...modules.keys()].map((mod) => (
                    <div key={mod} className="text-[11px] text-stone-500 flex items-start gap-2">
                      <div className="w-1 h-1 bg-sage-300 rounded-full flex-shrink-0 mt-1.5" />
                      {mod}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {sidebarTab === "lessons" && LessonList}
        </div>
      </div>

      {/* Mobile: lesson drawer overlay */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          <div className="flex-1 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="bg-white rounded-t-3xl flex flex-col" style={{ maxHeight: "80vh" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 flex-shrink-0">
              <h3 className="font-bold text-stone-800">Course Content · {completedCount}/{lessons.length}</h3>
              <button onClick={() => setDrawerOpen(false)} className="text-stone-400 hover:text-stone-600 text-xl">✕</button>
            </div>
            <div className="w-full bg-stone-100 h-1 flex-shrink-0">
              <div className="bg-sage-500 h-1 transition-all" style={{ width: `${progress}%` }} />
            </div>
            {LessonList}
          </div>
        </div>
      )}
    </div>
  );
}
