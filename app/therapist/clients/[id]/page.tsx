"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { therapistClients, journalEntries, dailyMissions } from "@/lib/mockData";
import { ChevronDown, ChevronUp, X } from "lucide-react";

type Tab = "overview" | "journal" | "missions" | "notes" | "plan";

type SessionType = "individual" | "group" | "assessment" | "crisis" | "phone" | "email";
type RiskLevel = "low" | "medium" | "high";

type TreatmentPlan = {
  diagnosis: string;
  approach: string;
  frequency: string;
  shortTermGoals: string;
  longTermGoals: string;
  phase: string;
  riskLevel: RiskLevel;
  safetyPlan: boolean;
  emergencyContacts: boolean;
  lastAssessed: string;
};

type ClinicalNote = {
  id: string;
  date: string;
  sessionType: SessionType;
  content: string;
  affect: string;
  riskLevel: RiskLevel;
  nextSteps: string;
  tags: string[];
};

const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "group", label: "Group" },
  { value: "assessment", label: "Assessment" },
  { value: "crisis", label: "Crisis" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
];

const COMMON_TAGS = ["CBT", "EMDR", "Exposure", "Safety plan", "Homework", "Mindfulness", "Medication", "Family"];

const SEED_NOTES: ClinicalNote[] = [
  {
    id: "cn1",
    date: "2026-06-16",
    sessionType: "individual",
    content:
      "CBT homework reviewed — client completed thought records on 4 of 7 days. Sleep improving; averaging 6.5 hrs vs 5 last week. Introduced 4-7-8 breathing technique. Client responded positively. GAD-7 score down to 9 from 12 at intake.",
    affect: "Calm, engaged",
    riskLevel: "low",
    nextSteps: "Continue sleep log. Assign 5-4-3-2-1 grounding exercise for anxiety spikes.",
    tags: ["CBT", "Homework", "Mindfulness"],
  },
  {
    id: "cn2",
    date: "2026-06-09",
    sessionType: "individual",
    content:
      "Discussed avoidance patterns around social situations. Client identified coffee shops and group gatherings as primary triggers. Set graduated exposure task: 10 minutes in a low-demand café next week. Explored safety behaviours and their maintenance function.",
    affect: "Anxious at start, more open by session end",
    riskLevel: "low",
    nextSteps: "Exposure task: 10 min café visit. Debrief next session.",
    tags: ["CBT", "Exposure"],
  },
  {
    id: "cn3",
    date: "2026-06-02",
    sessionType: "assessment",
    content:
      "Initial assessment. Client presented with generalised anxiety and low mood. GAD-7: 12 (moderate). PHQ-9: 8 (mild). No current suicidal ideation. Safety plan completed and signed. History: previous CBT episode in 2023, partial response. Family history of anxiety disorder (mother).",
    affect: "Nervous, cooperative",
    riskLevel: "medium",
    nextSteps: "Begin CBT formulation. Psychoeducation re: anxiety cycle for next session.",
    tags: ["CBT", "Safety plan"],
  },
];

function todayIso() {
  return new Date(2026, 5, 24).toISOString().slice(0, 10);
}

function formatNoteDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const client = therapistClients.find((c) => c.id === id) ?? therapistClients[0];
  const [tab, setTab] = useState<Tab>(initialTab);

  // Treatment plan state
  const [plan, setPlan] = useState<TreatmentPlan>({
    diagnosis: client.condition.join(", "),
    approach: "Cognitive Behavioural Therapy (CBT) with mindfulness components",
    frequency: "Weekly, 50-minute individual sessions",
    shortTermGoals: "Reduce GAD-7 by 3+ points. Establish consistent sleep routine. Complete 70%+ of daily tasks.",
    longTermGoals: "Develop autonomous anxiety management toolkit. Reduce avoidance behaviours. Improve social confidence.",
    phase: "Phase 2: Skill Building & Application",
    riskLevel: client.riskLevel as RiskLevel,
    safetyPlan: true,
    emergencyContacts: true,
    lastAssessed: "Jun 16",
  });
  const [planDraft, setPlanDraft] = useState<TreatmentPlan | null>(null);
  const editingPlan = planDraft !== null;
  const [planSaved, setPlanSaved] = useState(false);

  function startEditPlan() { setPlanDraft({ ...plan }); }
  function cancelEditPlan() { setPlanDraft(null); }
  function savePlan() {
    if (!planDraft) return;
    const now = new Date();
    const stamp = now.toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    setPlan({ ...planDraft, lastAssessed: stamp });
    setPlanDraft(null);
    setPlanSaved(true);
    setTimeout(() => setPlanSaved(false), 2500);
  }

  // Missions state (shared between overview and missions tab)
  const [clientMissions, setClientMissions] = useState(dailyMissions);
  function removeMission(id: string) {
    setClientMissions((prev) => prev.filter((m) => m.id !== id));
  }
  function toggleMissionComplete(id: string) {
    setClientMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  }
  const completedCount = clientMissions.filter((m) => m.completed).length;
  const completionRate = clientMissions.length > 0
    ? Math.round((completedCount / clientMissions.length) * 100)
    : 0;

  // Overview: mood chart
  const [moodHistory, setMoodHistory] = useState(client.moodHistory);
  const [hoveredMoodDay, setHoveredMoodDay] = useState<number | null>(null);
  const [editingMoodDay, setEditingMoodDay] = useState<number | null>(null);
  const moodAvg = moodHistory.length
    ? parseFloat((moodHistory.reduce((s, v) => s + v, 0) / moodHistory.length).toFixed(1))
    : 0;

  // Overview: courses
  type CourseStatus = "In progress" | "Completed" | "Paused";
  const COURSE_CYCLE: CourseStatus[] = ["In progress", "Completed", "Paused"];
  const [courses, setCourses] = useState<{ name: string; status: CourseStatus }[]>(
    client.coursesEnrolled.map((c) => ({ name: c, status: "In progress" }))
  );
  const [showCourseMenu, setShowCourseMenu] = useState(false);
  const AVAILABLE_COURSES = [
    "Managing Anxiety", "CBT Fundamentals", "Sleep & Recovery", "Stress Resilience",
    "Mindfulness Basics", "Emotional Regulation", "Building Self-Compassion",
  ];
  function addCourse(name: string) {
    if (!courses.find((c) => c.name === name)) {
      setCourses((prev) => [...prev, { name, status: "In progress" }]);
    }
    setShowCourseMenu(false);
  }
  function removeCourse(name: string) {
    setCourses((prev) => prev.filter((c) => c.name !== name));
  }
  function cycleCourseStatus(name: string) {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.name !== name) return c;
        const idx = COURSE_CYCLE.indexOf(c.status);
        return { ...c, status: COURSE_CYCLE[(idx + 1) % COURSE_CYCLE.length] };
      })
    );
  }

  // Journal state
  const [expandedJournalId, setExpandedJournalId] = useState<string | null>(null);
  const expandedJournalEntry = journalEntries.find((e) => e.id === expandedJournalId) ?? null;

  // Clinical notes state
  const [notes, setNotes] = useState<ClinicalNote[]>(SEED_NOTES);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  // Form state
  const [formDate, setFormDate] = useState(todayIso());
  const [formType, setFormType] = useState<SessionType>("individual");
  const [formContent, setFormContent] = useState("");
  const [formAffect, setFormAffect] = useState("");
  const [formRisk, setFormRisk] = useState<RiskLevel>("low");
  const [formNextSteps, setFormNextSteps] = useState("");
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formTagInput, setFormTagInput] = useState("");
  const [saveConfirm, setSaveConfirm] = useState(false);

  function resetForm() {
    setFormDate(todayIso());
    setFormType("individual");
    setFormContent("");
    setFormAffect("");
    setFormRisk("low");
    setFormNextSteps("");
    setFormTags([]);
    setFormTagInput("");
  }

  function handleSaveNote() {
    if (!formContent.trim()) return;
    const newNote: ClinicalNote = {
      id: `cn${Date.now()}`,
      date: formDate,
      sessionType: formType,
      content: formContent.trim(),
      affect: formAffect.trim(),
      riskLevel: formRisk,
      nextSteps: formNextSteps.trim(),
      tags: formTags,
    };
    setNotes((prev) => [newNote, ...prev]);
    resetForm();
    setShowNoteForm(false);
    setSaveConfirm(true);
    setTimeout(() => setSaveConfirm(false), 2500);
  }

  function toggleTag(tag: string) {
    setFormTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function addCustomTag() {
    const t = formTagInput.trim();
    if (t && !formTags.includes(t)) setFormTags((prev) => [...prev, t]);
    setFormTagInput("");
  }

  const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link href="/therapist/clients" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">← Clients</Link>

      {/* Client header */}
      <div className="bg-white border border-stone-100 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-lg font-semibold text-stone-600">
              {client.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-stone-900">{client.name}</h1>
                <span className={`text-[10px] border px-1.5 py-0.5 rounded font-medium ${
                  client.riskLevel === "high" ? "border-red-200 text-red-600" :
                  client.riskLevel === "medium" ? "border-amber-200 text-amber-600" :
                  "border-stone-200 text-stone-400"
                }`}>{client.riskLevel} risk</span>
              </div>
              <div className="text-xs text-stone-500 mt-0.5">{client.age} · {client.condition.join(", ")} · {client.plan}</div>
              <div className="text-xs text-stone-400 mt-0.5">Since {client.startDate}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="bg-stone-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors">
              Start video
            </button>
            <Link href="/therapist/messages" className="border border-stone-200 text-stone-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors">
              Message
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-stone-100">
          {[
            { label: "Avg mood", value: client.moodAvg.toFixed(1) },
            { label: "Missions", value: `${client.missionCompletion}%` },
            { label: "Streak", value: `${client.streak}d` },
            { label: "Last session", value: client.lastSession ?? "—" },
            { label: "Next session", value: client.nextSession ?? "—" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-sm font-semibold text-stone-900">{s.value}</div>
              <div className="text-[10px] text-stone-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-100 overflow-x-auto">
        {(["overview", "journal", "missions", "notes", "plan"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            {t === "notes" ? `Clinical notes${notes.length > 0 ? ` (${notes.length})` : ""}` : t === "plan" ? "Treatment plan" : t}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="space-y-4">

          {/* Mood chart */}
          <div className="bg-white border border-stone-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-stone-900">7-Day Mood Trend</h3>
              <span className="text-xs text-stone-400">Click a bar to edit</span>
            </div>
            <div className="flex items-end gap-2 h-20">
              {moodHistory.map((score, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 relative group">
                  {/* Tooltip */}
                  {hoveredMoodDay === i && editingMoodDay !== i && (
                    <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                      {DAYS[i]} · {score}/5
                    </div>
                  )}
                  {/* Inline score editor */}
                  {editingMoodDay === i ? (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1">
                      <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-1.5 flex gap-1">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <button
                            key={v}
                            onClick={() => {
                              setMoodHistory((prev) => prev.map((s, j) => j === i ? v : s));
                              setEditingMoodDay(null);
                            }}
                            className={`w-6 h-6 text-[10px] font-semibold rounded transition-colors ${
                              v === score
                                ? "bg-stone-900 text-white"
                                : "text-stone-500 hover:bg-stone-100"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <button
                    className="w-full rounded-t-sm transition-colors"
                    style={{
                      height: `${(score / 5) * 60}px`,
                      backgroundColor: hoveredMoodDay === i ? "#44403c" : "#1c1917",
                      minHeight: "4px",
                    }}
                    onMouseEnter={() => setHoveredMoodDay(i)}
                    onMouseLeave={() => setHoveredMoodDay(null)}
                    onClick={() => setEditingMoodDay(editingMoodDay === i ? null : i)}
                  />
                  <span className="text-[9px] text-stone-400">{DAYS[i]}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-stone-400 mt-3 pt-3 border-t border-stone-50">
              <span>Min: {Math.min(...moodHistory)} / 5</span>
              <span>Avg: {moodAvg} / 5</span>
              <span>Max: {Math.max(...moodHistory)} / 5</span>
            </div>
          </div>

          {/* Mission completion */}
          <div className="bg-white border border-stone-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-900">Mission completion</h3>
              <span className="text-sm font-semibold text-stone-900">
                {completionRate}%
                <span className="text-xs font-normal text-stone-400 ml-1">
                  ({completedCount}/{clientMissions.length})
                </span>
              </span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-1.5 mb-4 overflow-hidden">
              <div
                className="bg-stone-900 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            {clientMissions.length === 0 ? (
              <p className="text-xs text-stone-400">No tasks assigned.</p>
            ) : (
              <div className="space-y-2">
                {clientMissions.slice(0, 5).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toggleMissionComplete(m.id)}
                    className="w-full flex items-center gap-3 text-left group"
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      m.completed
                        ? "bg-stone-900 border-stone-900"
                        : "border-stone-300 group-hover:border-stone-500"
                    }`}>
                      {m.completed && <span className="text-[8px] text-white font-bold">✓</span>}
                    </div>
                    <span className={`text-xs flex-1 text-left transition-colors ${
                      m.completed ? "line-through text-stone-400" : "text-stone-700 group-hover:text-stone-900"
                    }`}>
                      {m.title}
                    </span>
                    <span className="text-[10px] text-stone-400 flex-shrink-0">{m.duration}</span>
                  </button>
                ))}
                {clientMissions.length > 5 && (
                  <button
                    onClick={() => setTab("missions")}
                    className="text-xs text-stone-500 hover:text-stone-900 transition-colors pt-1"
                  >
                    +{clientMissions.length - 5} more → view all
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Enrolled courses */}
          <div className="bg-white border border-stone-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-900">Enrolled courses</h3>
              <div className="relative">
                <button
                  onClick={() => setShowCourseMenu((v) => !v)}
                  className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
                >
                  + Assign
                </button>
                {showCourseMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-20 w-52 overflow-hidden">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Available courses</p>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-stone-50">
                      {AVAILABLE_COURSES.filter((c) => !courses.find((ec) => ec.name === c)).map((c) => (
                        <button
                          key={c}
                          onClick={() => addCourse(c)}
                          className="w-full text-left px-3 py-2.5 text-xs text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                          {c}
                        </button>
                      ))}
                      {AVAILABLE_COURSES.filter((c) => !courses.find((ec) => ec.name === c)).length === 0 && (
                        <p className="px-3 py-3 text-xs text-stone-400">All courses assigned</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {courses.length === 0 ? (
              <p className="text-xs text-stone-400">No courses assigned. Click &quot;+ Assign&quot; to add one.</p>
            ) : (
              <div className="divide-y divide-stone-50">
                {courses.map((course) => (
                  <div key={course.name} className="flex items-center gap-3 py-2.5 first:pt-0 group">
                    <span className="text-xs text-stone-700 flex-1 truncate">{course.name}</span>
                    <button
                      onClick={() => cycleCourseStatus(course.name)}
                      className={`text-[10px] font-medium border px-2 py-0.5 rounded transition-colors ${
                        course.status === "Completed"
                          ? "border-stone-300 text-stone-500 hover:border-stone-400"
                          : course.status === "Paused"
                          ? "border-amber-200 text-amber-600 hover:border-amber-300"
                          : "border-stone-200 text-stone-500 hover:border-stone-400"
                      }`}
                      title="Click to change status"
                    >
                      {course.status}
                    </button>
                    <button
                      onClick={() => removeCourse(course.name)}
                      className="text-stone-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs ml-1"
                      title="Remove course"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── Journal ── */}
      {tab === "journal" && (
        <div className="space-y-3">
          <div className="bg-white border border-stone-100 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-stone-500">Client has given permission for therapist journal review.</span>
            <Link
              href="/dashboard/journal"
              className="text-xs font-medium text-stone-600 border border-stone-200 px-2.5 py-1 rounded-lg hover:bg-stone-50 transition-colors whitespace-nowrap ml-4"
            >
              Open patient journal →
            </Link>
          </div>

          {journalEntries.map((entry) => (
            <div key={entry.id} className="bg-white border border-stone-100 rounded-xl p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-medium text-stone-800">{entry.title}</span>
                    {entry.type !== "text" && (
                      <span className="text-[10px] border border-stone-200 text-stone-400 px-1.5 py-0.5 rounded capitalize">
                        {entry.type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400">{entry.date} · {entry.time}</span>
                    {entry.wordCount && (
                      <span className="text-xs text-stone-300">{entry.wordCount} words</span>
                    )}
                  </div>
                </div>
                {/* Mood score */}
                <div className="flex-shrink-0 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <div
                      key={v}
                      className={`w-2 h-2 rounded-full ${v <= entry.mood ? "bg-stone-700" : "bg-stone-100"}`}
                    />
                  ))}
                  <span className="text-[10px] text-stone-400 ml-1">{entry.mood}/5</span>
                </div>
              </div>

              {/* Emotion tags */}
              <div className="flex gap-1.5 flex-wrap mb-3">
                {entry.emotions.map((e) => (
                  <span key={e} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-md">{e}</span>
                ))}
              </div>

              {/* Content preview */}
              {entry.type === "voice" ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-lg mb-3">
                  <div className="flex gap-0.5 items-center h-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-stone-400 rounded-full"
                        style={{ height: `${4 + Math.sin(i * 1.3) * 8}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-stone-500">Voice recording</span>
                </div>
              ) : (
                entry.content && (
                  <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 mb-3">
                    {entry.content.replace(/\n+/g, " ")}
                  </p>
                )
              )}

              {/* Footer actions */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-50">
                <button
                  onClick={() => setExpandedJournalId(entry.id)}
                  className="text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Read full entry →
                </button>
                <button
                  onClick={() => setTab("notes")}
                  className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
                >
                  Add clinical note
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Journal full-entry modal ── */}
      {expandedJournalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setExpandedJournalId(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-stone-100 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-base font-semibold text-stone-900">{expandedJournalEntry.title}</h2>
                  {expandedJournalEntry.type !== "text" && (
                    <span className="text-[10px] border border-stone-200 text-stone-400 px-1.5 py-0.5 rounded capitalize">
                      {expandedJournalEntry.type}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-stone-400">
                    {expandedJournalEntry.date} · {expandedJournalEntry.time}
                  </span>
                  {expandedJournalEntry.wordCount && (
                    <span className="text-xs text-stone-300">{expandedJournalEntry.wordCount} words</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setExpandedJournalId(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Mood + emotions */}
            <div className="px-6 py-3 border-b border-stone-50 flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-stone-400 uppercase font-medium tracking-wider">Mood</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <div
                      key={v}
                      className={`w-2.5 h-2.5 rounded-full ${v <= expandedJournalEntry.mood ? "bg-stone-800" : "bg-stone-100"}`}
                    />
                  ))}
                  <span className="text-xs text-stone-500 ml-1">{expandedJournalEntry.mood}/5</span>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {expandedJournalEntry.emotions.map((e) => (
                  <span key={e} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-md">{e}</span>
                ))}
              </div>
            </div>

            {/* Full content — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {expandedJournalEntry.type === "voice" ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4 text-stone-400">
                  <div className="flex gap-1 items-center h-8">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-stone-300 rounded-full"
                        style={{ height: `${6 + Math.abs(Math.sin(i * 0.9)) * 22}px` }}
                      />
                    ))}
                  </div>
                  <p className="text-sm">Voice recording — playback not available in preview</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {expandedJournalEntry.content
                    .split(/\n{2,}/)
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i} className="text-sm text-stone-700 leading-relaxed">
                        {para.replace(/\n/g, " ")}
                      </p>
                    ))}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-stone-50 flex-shrink-0">
              <button
                onClick={() => setExpandedJournalId(null)}
                className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { setExpandedJournalId(null); setTab("notes"); }}
                className="text-sm bg-stone-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-stone-800 transition-colors"
              >
                Add clinical note →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Missions ── */}
      {tab === "missions" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-stone-500">Assigned tasks</p>
            <Link href="/therapist/missions" className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-stone-800 transition-colors">
              + Assign task
            </Link>
          </div>
          <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
            {clientMissions.length === 0 ? (
              <div className="py-12 text-center text-sm text-stone-400">
                No tasks assigned. Use &quot;+ Assign task&quot; to add one.
              </div>
            ) : (
              <div className="divide-y divide-stone-50">
                {clientMissions.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 px-5 py-4">
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${m.completed ? "bg-stone-900 border-stone-900" : "border-stone-300"}`}>
                      {m.completed && <span className="text-[8px] text-white font-bold">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-800">{m.title}</div>
                      <div className="text-xs text-stone-400 mt-0.5 truncate">{m.description}</div>
                      <div className="flex gap-3 mt-1 text-xs text-stone-400">
                        <span>{m.duration}</span>
                        {m.dueTime && <span>Due {m.dueTime}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => removeMission(m.id)}
                      className="text-xs text-stone-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Clinical notes ── */}
      {tab === "notes" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-400">
              {notes.length} note{notes.length !== 1 ? "s" : ""} · Encrypted · Visible to assigned clinicians only
            </p>
            <div className="flex items-center gap-2">
              {saveConfirm && (
                <span className="text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">Note saved</span>
              )}
              <button
                onClick={() => { setShowNoteForm((v) => !v); if (!showNoteForm) resetForm(); }}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                  showNoteForm
                    ? "border border-stone-200 text-stone-600 hover:bg-stone-50"
                    : "bg-stone-900 text-white hover:bg-stone-800"
                }`}
              >
                {showNoteForm ? "Cancel" : "+ New note"}
              </button>
            </div>
          </div>

          {/* ── New note form ── */}
          {showNoteForm && (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100 bg-stone-50">
                <h3 className="text-sm font-semibold text-stone-900">New clinical note</h3>
                <p className="text-xs text-stone-400 mt-0.5">This note is private and will not be visible to the client.</p>
              </div>

              <div className="p-5 space-y-5">
                {/* Date + session type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-stone-700">Session date</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-stone-700">Session type</label>
                    <div className="flex flex-wrap gap-1.5">
                      {SESSION_TYPES.map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setFormType(value)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                            formType === value
                              ? "bg-stone-900 text-white border-stone-900"
                              : "border-stone-200 text-stone-600 hover:border-stone-400"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Note content */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone-700">
                    Session notes <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={6}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Describe the session content, client presentation, interventions used, client response…"
                    className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 text-stone-900 placeholder:text-stone-300 leading-relaxed focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-colors resize-none"
                  />
                </div>

                {/* Affect + Risk */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-stone-700">
                      Affect / presentation <span className="text-stone-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formAffect}
                      onChange={(e) => setFormAffect(e.target.value)}
                      placeholder="e.g. Calm, engaged"
                      className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-stone-700">Risk level</label>
                    <div className="flex gap-1.5">
                      {(["low", "medium", "high"] as RiskLevel[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => setFormRisk(r)}
                          className={`flex-1 text-xs py-2 rounded-lg border font-medium capitalize transition-all ${
                            formRisk === r
                              ? r === "high"
                                ? "bg-red-600 text-white border-red-600"
                                : r === "medium"
                                ? "bg-amber-500 text-white border-amber-500"
                                : "bg-stone-900 text-white border-stone-900"
                              : "border-stone-200 text-stone-500 hover:border-stone-400"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Next steps */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone-700">
                    Next steps / actions <span className="text-stone-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formNextSteps}
                    onChange={(e) => setFormNextSteps(e.target.value)}
                    placeholder="e.g. Assign exposure task. Review sleep log next session."
                    className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-colors resize-none"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-700">Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                          formTags.includes(tag)
                            ? "bg-stone-900 text-white border-stone-900"
                            : "border-stone-200 text-stone-500 hover:border-stone-400"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {/* Custom tag input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formTagInput}
                      onChange={(e) => setFormTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); }}}
                      placeholder="Add custom tag…"
                      className="flex-1 text-xs border border-stone-200 rounded-lg px-3 py-1.5 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors"
                    />
                    <button
                      onClick={addCustomTag}
                      disabled={!formTagInput.trim()}
                      className="text-xs border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                  {/* Selected custom tags */}
                  {formTags.filter((t) => !COMMON_TAGS.includes(t)).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {formTags
                        .filter((t) => !COMMON_TAGS.includes(t))
                        .map((t) => (
                          <span key={t} className="flex items-center gap-1 text-xs bg-stone-100 text-stone-600 pl-2.5 pr-1.5 py-0.5 rounded-full">
                            {t}
                            <button onClick={() => setFormTags((prev) => prev.filter((x) => x !== t))}>
                              <X size={10} className="text-stone-400 hover:text-stone-700" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-stone-100 bg-stone-50">
                <button
                  onClick={() => setShowNoteForm(false)}
                  className="text-sm border border-stone-200 text-stone-600 px-4 py-2 rounded-lg hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={!formContent.trim()}
                  className="text-sm bg-stone-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save note
                </button>
              </div>
            </div>
          )}

          {/* ── Notes list ── */}
          {notes.length === 0 ? (
            <div className="bg-white border border-stone-100 rounded-xl py-16 text-center text-sm text-stone-400">
              No clinical notes yet. Click &quot;+ New note&quot; to add one.
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => {
                const isExpanded = expandedNoteId === note.id;
                return (
                  <div key={note.id} className="bg-white border border-stone-100 rounded-xl overflow-hidden">
                    {/* Note header */}
                    <button
                      onClick={() => setExpandedNoteId(isExpanded ? null : note.id)}
                      className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-stone-50 transition-colors"
                    >
                      {/* Date block */}
                      <div className="flex-shrink-0 text-center bg-stone-50 rounded-lg px-3 py-2 min-w-[60px]">
                        <div className="text-[10px] text-stone-400 uppercase font-medium">
                          {new Date(note.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
                        </div>
                        <div className="text-sm font-semibold text-stone-900">
                          {new Date(note.date + "T12:00:00").getDate()}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {new Date(note.date + "T12:00:00").getFullYear()}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-medium text-stone-600 capitalize border border-stone-200 px-1.5 py-0.5 rounded">
                            {note.sessionType}
                          </span>
                          <span className={`text-[10px] border px-1.5 py-0.5 rounded font-medium capitalize ${
                            note.riskLevel === "high"
                              ? "border-red-200 text-red-600"
                              : note.riskLevel === "medium"
                              ? "border-amber-200 text-amber-600"
                              : "border-stone-200 text-stone-400"
                          }`}>
                            {note.riskLevel} risk
                          </span>
                          {note.tags.map((t) => (
                            <span key={t} className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                        <p className={`text-xs text-stone-600 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                          {note.content}
                        </p>
                        {note.affect && !isExpanded && (
                          <p className="text-[11px] text-stone-400 mt-1">Affect: {note.affect}</p>
                        )}
                      </div>

                      <div className="flex-shrink-0 text-stone-400 mt-1">
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-4 border-t border-stone-50">
                        <div className="pt-4">
                          <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Full session notes</div>
                          <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                        </div>
                        {note.affect && (
                          <div>
                            <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Affect / presentation</div>
                            <p className="text-sm text-stone-700">{note.affect}</p>
                          </div>
                        )}
                        {note.nextSteps && (
                          <div>
                            <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Next steps</div>
                            <p className="text-sm text-stone-700 leading-relaxed">{note.nextSteps}</p>
                          </div>
                        )}
                        <div className="pt-2 border-t border-stone-50 flex items-center justify-between">
                          <p className="text-[11px] text-stone-400">{formatNoteDate(note.date)}</p>
                          <button
                            onClick={() => {
                              setNotes((prev) => prev.filter((n) => n.id !== note.id));
                              setExpandedNoteId(null);
                            }}
                            className="text-xs text-stone-400 hover:text-red-500 transition-colors"
                          >
                            Delete note
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Treatment plan ── */}
      {tab === "plan" && (
        <div className="space-y-4">
          {/* Plan card */}
          <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <h3 className="text-sm font-semibold text-stone-900">Treatment plan</h3>
              <div className="flex items-center gap-2">
                {planSaved && (
                  <span className="text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">Saved</span>
                )}
                {editingPlan ? (
                  <>
                    <button
                      onClick={cancelEditPlan}
                      className="text-xs border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={savePlan}
                      className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-stone-800 transition-colors"
                    >
                      Save changes
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEditPlan}
                    className="text-xs border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    Edit →
                  </button>
                )}
              </div>
            </div>

            <div className="divide-y divide-stone-50">
              {/* Primary diagnosis */}
              <PlanField
                label="Primary diagnosis"
                value={editingPlan ? planDraft!.diagnosis : plan.diagnosis}
                editing={editingPlan}
                onChange={(v) => setPlanDraft((d) => d && { ...d, diagnosis: v })}
              />
              {/* Treatment approach */}
              <PlanField
                label="Treatment approach"
                value={editingPlan ? planDraft!.approach : plan.approach}
                editing={editingPlan}
                multiline
                onChange={(v) => setPlanDraft((d) => d && { ...d, approach: v })}
              />
              {/* Session frequency */}
              <PlanField
                label="Session frequency"
                value={editingPlan ? planDraft!.frequency : plan.frequency}
                editing={editingPlan}
                onChange={(v) => setPlanDraft((d) => d && { ...d, frequency: v })}
              />
              {/* Short-term goals */}
              <PlanField
                label="Short-term goals (4 weeks)"
                value={editingPlan ? planDraft!.shortTermGoals : plan.shortTermGoals}
                editing={editingPlan}
                multiline
                onChange={(v) => setPlanDraft((d) => d && { ...d, shortTermGoals: v })}
              />
              {/* Long-term goals */}
              <PlanField
                label="Long-term goals (12 weeks)"
                value={editingPlan ? planDraft!.longTermGoals : plan.longTermGoals}
                editing={editingPlan}
                multiline
                onChange={(v) => setPlanDraft((d) => d && { ...d, longTermGoals: v })}
              />
              {/* Current phase */}
              <PlanField
                label="Current phase"
                value={editingPlan ? planDraft!.phase : plan.phase}
                editing={editingPlan}
                onChange={(v) => setPlanDraft((d) => d && { ...d, phase: v })}
              />
            </div>
          </div>

          {/* Risk assessment card */}
          <div className={`bg-white border rounded-xl overflow-hidden ${plan.riskLevel === "high" ? "border-red-200" : "border-stone-100"}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <h3 className="text-sm font-semibold text-stone-900">Risk assessment</h3>
              {editingPlan && (
                <div className="flex gap-1.5">
                  {(["low", "medium", "high"] as RiskLevel[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setPlanDraft((d) => d && { ...d, riskLevel: r })}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium capitalize transition-all ${
                        planDraft!.riskLevel === r
                          ? r === "high"
                            ? "bg-red-600 text-white border-red-600"
                            : r === "medium"
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-stone-900 text-white border-stone-900"
                          : "border-stone-200 text-stone-500 hover:border-stone-400"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs border px-2 py-0.5 rounded font-medium capitalize ${
                  plan.riskLevel === "high" ? "border-red-200 text-red-600" :
                  plan.riskLevel === "medium" ? "border-amber-200 text-amber-600" :
                  "border-stone-200 text-stone-500"
                }`}>{plan.riskLevel} risk</span>
                <span className="text-xs text-stone-400">Last assessed {plan.lastAssessed}</span>
              </div>

              {/* Checklist items */}
              {[
                {
                  key: "safetyPlan" as const,
                  text: "Safety plan in place and reviewed",
                },
                {
                  key: "emergencyContacts" as const,
                  text: "Emergency contacts documented",
                },
              ].map(({ key, text }) => {
                const done = editingPlan ? planDraft![key] : plan[key];
                return (
                  <div key={key} className="flex items-start gap-2 text-xs text-stone-600">
                    {editingPlan ? (
                      <button
                        onClick={() => setPlanDraft((d) => d && { ...d, [key]: !d[key] })}
                        className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          planDraft![key]
                            ? "bg-stone-900 border-stone-900"
                            : "border-stone-300 hover:border-stone-500"
                        }`}
                      >
                        {planDraft![key] && <span className="text-[8px] text-white font-bold">✓</span>}
                      </button>
                    ) : (
                      <span className={`mt-0.5 flex-shrink-0 ${done ? "text-stone-400" : "text-red-400"}`}>
                        {done ? "✓" : "!"}
                      </span>
                    )}
                    <span>{text}</span>
                  </div>
                );
              })}

              {/* Crisis protocol — derived from risk level */}
              <div className="flex items-start gap-2 text-xs text-stone-600">
                <span className={`mt-0.5 flex-shrink-0 ${plan.riskLevel !== "high" ? "text-stone-400" : "text-red-400"}`}>
                  {plan.riskLevel !== "high" ? "✓" : "!"}
                </span>
                <span>
                  Crisis protocol{" "}
                  {plan.riskLevel === "high" ? "activated — monitor closely" : "not required"}
                </span>
              </div>
            </div>
          </div>

          {editingPlan && (
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelEditPlan}
                className="text-sm border border-stone-200 text-stone-600 px-4 py-2 rounded-lg hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePlan}
                className="text-sm bg-stone-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-stone-800 transition-colors"
              >
                Save changes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlanField({
  label,
  value,
  editing,
  multiline = false,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  multiline?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="px-5 py-4">
      <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1.5">{label}</div>
      {editing ? (
        multiline ? (
          <textarea
            rows={3}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-colors resize-none"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-colors"
          />
        )
      ) : (
        <p className="text-sm text-stone-700 leading-relaxed">{value}</p>
      )}
    </div>
  );
}
