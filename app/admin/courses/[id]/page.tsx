"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import type { AdminCourseDetail, AdminLessonItem, AdminLessonType, AdminQuizQuestionItem } from "@/lib/types";

const COLOR_OPTIONS = ["bg-sage-100", "bg-blue-100", "bg-purple-100", "bg-amber-100", "bg-yellow-100", "bg-peach-100"];
const LESSON_TYPES: AdminLessonType[] = ["video", "quiz", "reflection", "exercise", "audio"];
const EXERCISE_TYPES = [
  "breathing", "bodyscan", "gratitude", "grounding",
  "pmr", "boxbreathing", "reframe", "values", "feelingswheel",
  "worryjar", "lovingkindness", "cbttriangle", "urgesurf", "selfcompassion",
];
const EXERCISE_LABELS: Record<string, string> = {
  breathing: "Breathing (4-7-8)", bodyscan: "Body Scan", gratitude: "Gratitude", grounding: "Grounding (5-4-3-2-1)",
  pmr: "Progressive Muscle Relaxation", boxbreathing: "Box Breathing", reframe: "Thought Reframe",
  values: "Values Card Sort", feelingswheel: "Feelings Wheel", worryjar: "Worry Jar",
  lovingkindness: "Loving-Kindness Meditation", cbttriangle: "Thought-Feeling-Behavior Triangle",
  urgesurf: "Urge Surfing", selfcompassion: "Self-Compassion Break",
};
const TYPE_ICON: Record<AdminLessonType, string> = { video: "🎬", quiz: "📝", reflection: "💭", exercise: "🧘", audio: "🎧" };

type Draft = {
  content: string;
  exerciseType: string;
  questions: (AdminQuizQuestionItem | { id: string; order: number; question: string; options: string[]; correct: number; explanation: string })[];
};

function emptyDraft(lesson: AdminLessonItem): Draft {
  return {
    content: lesson.content ?? "",
    exerciseType: lesson.exerciseType ?? EXERCISE_TYPES[0],
    questions: lesson.questions.length > 0 ? lesson.questions.map((q) => ({ ...q })) : [],
  };
}

export default function AdminCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [course, setCourse] = useState<AdminCourseDetail | null>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newModule, setNewModule] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<AdminLessonType>("video");
  const [newDuration, setNewDuration] = useState("5 min");

  function load() {
    fetch(`/api/admin/courses/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.course) setCourse(d.course); })
      .catch(() => setError("Failed to load course."));
  }

  useEffect(() => { load(); }, [id]);

  async function saveDetails(fields: Partial<AdminCourseDetail>) {
    setSaving(true);
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    setSaving(false);
    if (res.ok) load();
    else setError("Failed to save course details.");
  }

  async function deleteCourse() {
    if (!window.confirm("Permanently delete this course and all its lessons? This can't be undone.")) return;
    const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    if (res.ok) window.location.href = "/admin/courses";
    else setError("Failed to delete course.");
  }

  function expand(lesson: AdminLessonItem) {
    if (expandedId === lesson.id) { setExpandedId(null); setDraft(null); return; }
    setExpandedId(lesson.id);
    setDraft(emptyDraft(lesson));
  }

  async function saveLesson(lessonId: string, fields: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/admin/courses/${id}/lessons/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    setSaving(false);
    if (res.ok) load();
    else setError("Failed to save lesson.");
  }

  async function reorderLesson(lessonId: string, direction: "up" | "down") {
    await fetch(`/api/admin/courses/${id}/lessons/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reorder: direction }),
    });
    load();
  }

  async function deleteLesson(lessonId: string) {
    if (!window.confirm("Delete this lesson? This can't be undone.")) return;
    const res = await fetch(`/api/admin/courses/${id}/lessons/${lessonId}`, { method: "DELETE" });
    if (res.ok) { setExpandedId(null); load(); }
    else setError("Failed to delete lesson.");
  }

  async function addLesson(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/admin/courses/${id}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: newModule, title: newTitle, type: newType, duration: newDuration }),
    });
    if (res.ok) {
      setShowAddLesson(false);
      setNewModule(""); setNewTitle(""); setNewType("video"); setNewDuration("5 min");
      load();
    } else {
      setError("Failed to add lesson.");
    }
  }

  async function uploadMedia(lessonId: string, kind: "video" | "audio", file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("kind", kind);
    form.append("file", file);
    const res = await fetch("/api/admin/courses/upload", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Upload failed.");
      return;
    }
    const d = await res.json();
    await saveLesson(lessonId, kind === "video" ? { videoUrl: d.url } : { audioUrl: d.url });
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <Link href="/admin/courses" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">← Courses</Link>
        {error ? (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        ) : (
          <div className="bg-white border border-stone-100 rounded-xl p-5 animate-pulse h-32" />
        )}
      </div>
    );
  }

  const modules = [...new Set(course.lessons.map((l) => l.module))];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link href="/admin/courses" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">← Courses</Link>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      {/* Course details */}
      <div className="bg-white border border-stone-100 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-900">Course details</h2>
          <label className="flex items-center gap-2 text-xs text-stone-600">
            <input type="checkbox" checked={course.published} onChange={(e) => saveDetails({ published: e.target.checked })} />
            Published
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title" value={course.title} onBlurSave={(v) => saveDetails({ title: v })} />
          <Field label="Instructor" value={course.instructor} onBlurSave={(v) => saveDetails({ instructor: v })} />
          <Field label="Category" value={course.category} onBlurSave={(v) => saveDetails({ category: v })} />
          <Field label="Level" value={course.level} onBlurSave={(v) => saveDetails({ level: v })} />
          <Field label="Duration" value={course.duration ?? ""} onBlurSave={(v) => saveDetails({ duration: v })} />
          <Field label="Thumbnail (emoji)" value={course.thumbnail ?? ""} onBlurSave={(v) => saveDetails({ thumbnail: v })} />
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Color</label>
            <select
              value={course.color ?? COLOR_OPTIONS[0]}
              onChange={(e) => saveDetails({ color: e.target.value })}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
            >
              {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Field label="Tags (comma-separated)" value={course.tags.join(", ")} onBlurSave={(v) => saveDetails({ tags: v.split(",").map((t) => t.trim()).filter(Boolean) })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Description</label>
          <TextField value={course.description ?? ""} onBlurSave={(v) => saveDetails({ description: v })} />
        </div>
        <button onClick={deleteCourse} className="text-xs text-red-500 hover:text-red-700 transition-colors">
          Delete course
        </button>
      </div>

      {/* Lessons */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-900">Lessons ({course.lessons.length})</h2>
          <button
            onClick={() => setShowAddLesson((v) => !v)}
            className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-stone-800 transition-colors"
          >
            {showAddLesson ? "Cancel" : "+ Add lesson"}
          </button>
        </div>

        {showAddLesson && (
          <form onSubmit={addLesson} className="bg-white border border-stone-200 rounded-xl p-4 mb-3 grid grid-cols-2 gap-3">
            <input value={newModule} onChange={(e) => setNewModule(e.target.value)} placeholder="Module (e.g. Module 1: Intro)" required className="col-span-2 border border-stone-200 rounded-lg px-3 py-2 text-sm" />
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Lesson title" required className="border border-stone-200 rounded-lg px-3 py-2 text-sm" />
            <select value={newType} onChange={(e) => setNewType(e.target.value as AdminLessonType)} className="border border-stone-200 rounded-lg px-3 py-2 text-sm capitalize">
              {LESSON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={newDuration} onChange={(e) => setNewDuration(e.target.value)} placeholder="Duration (e.g. 8 min)" className="border border-stone-200 rounded-lg px-3 py-2 text-sm" />
            <button type="submit" className="bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors">Add</button>
          </form>
        )}

        {modules.map((mod) => (
          <div key={mod} className="mb-4">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-2">{mod}</p>
            <div className="space-y-2">
              {course.lessons.filter((l) => l.module === mod).map((lesson) => {
                const isExpanded = expandedId === lesson.id;
                return (
                  <div key={lesson.id} className="bg-white border border-stone-100 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="text-lg flex-shrink-0">{TYPE_ICON[lesson.type]}</span>
                      <button onClick={() => expand(lesson)} className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium text-stone-800 truncate">{lesson.title}</div>
                        <div className="text-xs text-stone-400 capitalize">{lesson.type} · {lesson.duration}</div>
                      </button>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => reorderLesson(lesson.id, "up")} title="Move up" className="p-1 text-stone-400 hover:text-stone-700 transition-colors"><ChevronUp size={15} /></button>
                        <button onClick={() => reorderLesson(lesson.id, "down")} title="Move down" className="p-1 text-stone-400 hover:text-stone-700 transition-colors"><ChevronDown size={15} /></button>
                        <button onClick={() => deleteLesson(lesson.id)} className="text-xs text-stone-400 hover:text-red-500 transition-colors px-1.5">Delete</button>
                        <button onClick={() => expand(lesson)} className="p-1 text-stone-400"><ChevronsUpDown size={15} /></button>
                      </div>
                    </div>

                    {isExpanded && draft && (
                      <div className="px-4 pb-4 border-t border-stone-50 pt-4 space-y-3">
                        {(lesson.type === "video" || lesson.type === "audio") && (
                          <MediaEditor
                            kind={lesson.type}
                            url={lesson.type === "video" ? lesson.videoUrl : lesson.audioUrl}
                            uploading={uploading}
                            onUpload={(file) => uploadMedia(lesson.id, lesson.type as "video" | "audio", file)}
                            onRemove={() => saveLesson(lesson.id, lesson.type === "video" ? { videoUrl: null } : { audioUrl: null })}
                          />
                        )}

                        {lesson.type === "reflection" && (
                          <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1">Reflection prompt</label>
                            <textarea
                              rows={3}
                              value={draft.content}
                              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                            />
                            <button
                              onClick={() => saveLesson(lesson.id, { content: draft.content })}
                              disabled={saving}
                              className="mt-2 text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                            >
                              Save prompt
                            </button>
                          </div>
                        )}

                        {lesson.type === "exercise" && (
                          <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1">Exercise type</label>
                            <select
                              value={draft.exerciseType}
                              onChange={(e) => {
                                const v = e.target.value;
                                setDraft({ ...draft, exerciseType: v });
                                saveLesson(lesson.id, { exerciseType: v });
                              }}
                              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                            >
                              {EXERCISE_TYPES.map((t) => <option key={t} value={t}>{EXERCISE_LABELS[t]}</option>)}
                            </select>
                          </div>
                        )}

                        {lesson.type === "quiz" && (
                          <QuizEditor
                            questions={draft.questions}
                            onChange={(qs) => setDraft({ ...draft, questions: qs })}
                            onSave={() => saveLesson(lesson.id, { questions: draft.questions.map((q) => ({ question: q.question, options: q.options, correct: q.correct, explanation: q.explanation })) })}
                            saving={saving}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onBlurSave }: { label: string; value: string; onBlurSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div>
      <label className="block text-xs font-medium text-stone-600 mb-1">{label}</label>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { if (v !== value) onBlurSave(v); }}
        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}

function TextField({ value, onBlurSave }: { value: string; onBlurSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <textarea
      rows={3}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { if (v !== value) onBlurSave(v); }}
      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
    />
  );
}

function MediaEditor({
  kind, url, uploading, onUpload, onRemove,
}: {
  kind: "video" | "audio";
  url: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-600 mb-1">{kind === "video" ? "Video file" : "Audio file"}</label>
      {url ? (
        <div className="space-y-2">
          {kind === "video" ? (
            <video controls src={url} className="w-full max-w-sm rounded-lg" />
          ) : (
            <audio controls src={url} className="w-full max-w-sm" />
          )}
          <button onClick={onRemove} className="text-xs text-red-500 hover:text-red-700 transition-colors block">Remove file</button>
        </div>
      ) : (
        <p className="text-xs text-stone-400 mb-2">No file uploaded yet.</p>
      )}
      <input
        type="file"
        accept={kind === "video" ? "video/*" : "audio/*"}
        disabled={uploading}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
        className="text-xs mt-2"
      />
      {uploading && <p className="text-xs text-stone-400 mt-1">Uploading…</p>}
    </div>
  );
}

function QuizEditor({
  questions, onChange, onSave, saving,
}: {
  questions: Draft["questions"];
  onChange: (qs: Draft["questions"]) => void;
  onSave: () => void;
  saving: boolean;
}) {
  function addQuestion() {
    onChange([...questions, { id: `new-${Date.now()}`, order: questions.length, question: "", options: ["", ""], correct: 0, explanation: "" }]);
  }
  function removeQuestion(i: number) {
    onChange(questions.filter((_, idx) => idx !== i));
  }
  function updateQuestion(i: number, patch: Partial<Draft["questions"][number]>) {
    onChange(questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }
  function addOption(i: number) {
    updateQuestion(i, { options: [...questions[i].options, ""] });
  }
  function removeOption(i: number, oi: number) {
    const q = questions[i];
    if (q.options.length <= 2) return;
    const options = q.options.filter((_, idx) => idx !== oi);
    updateQuestion(i, { options, correct: q.correct >= options.length ? 0 : q.correct });
  }

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={q.id} className="bg-stone-50 border border-stone-100 rounded-lg p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <input
              value={q.question}
              onChange={(e) => updateQuestion(i, { question: e.target.value })}
              placeholder="Question text"
              className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-sm"
            />
            <button onClick={() => removeQuestion(i)} className="text-xs text-red-500 hover:text-red-700 transition-colors flex-shrink-0 mt-1.5">Remove</button>
          </div>
          <div className="space-y-1.5">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={q.correct === oi}
                  onChange={() => updateQuestion(i, { correct: oi })}
                  title="Correct answer"
                />
                <input
                  value={opt}
                  onChange={(e) => updateQuestion(i, { options: q.options.map((o, idx) => (idx === oi ? e.target.value : o)) })}
                  placeholder={`Option ${oi + 1}`}
                  className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-sm"
                />
                {q.options.length > 2 && (
                  <button onClick={() => removeOption(i, oi)} className="text-stone-300 hover:text-red-400 text-xs">✕</button>
                )}
              </div>
            ))}
            <button onClick={() => addOption(i)} className="text-xs text-stone-500 hover:text-stone-800 transition-colors">+ Add option</button>
          </div>
          <textarea
            rows={2}
            value={q.explanation}
            onChange={(e) => updateQuestion(i, { explanation: e.target.value })}
            placeholder="Explanation (shown after answering)"
            className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
      ))}
      <div className="flex items-center gap-2">
        <button onClick={addQuestion} className="text-xs border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors">+ Add question</button>
        <button onClick={onSave} disabled={saving} className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-50">
          {saving ? "Saving…" : "Save quiz"}
        </button>
      </div>
    </div>
  );
}
