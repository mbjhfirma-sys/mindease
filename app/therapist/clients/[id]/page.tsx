"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { AGE_GROUPS } from "@/lib/ageGroups";

type Tab = "overview" | "journal" | "missions" | "notes" | "plan";

type ApiJournalEntry = { id: string; title: string; content: string; mood: number; emotions: string[]; createdAt: string };
type ApiMission = {
  id: string; completedAt: string; responseData: Record<string, unknown> | null;
  mission: { id: string; title: string; category: string; xp: number; activityType: string };
};
type ApiAppt = { id: string; date: string; duration: number; type: string; status: string };
type ApiAssessmentResult = { id: string; assessmentId: string; score: number; label: string; createdAt: string };
type ApiIntake = {
  concerns: string[]; languagePreference: string | null; genderPreference: string | null;
  ageRange: string | null; priorTherapyExperience: string | null; goals: string | null; modalityPreference: string | null;
} | null;

type ClientData = {
  id: string; name: string; email: string; plan: string; level: number; xp: number;
  memberSince: string; moodHistory: { score: number; date: string }[]; moodAvg: number;
  journalEntries: ApiJournalEntry[]; missionCompletions: ApiMission[]; appointments: ApiAppt[];
  assessmentResults: ApiAssessmentResult[]; intake: ApiIntake;
};

const AGE_GROUP_LABELS: Record<string, string> = Object.fromEntries(AGE_GROUPS.map((g) => [g.id, g.label]));
const PRIOR_EXPERIENCE_LABELS: Record<string, string> = { yes: "Yes", no: "No", unsure: "Not sure" };

const ASSESSMENT_TOOL_NAMES: Record<string, string> = {
  a1: "GAD-7", a2: "PHQ-9", a3: "CBI", a4: "PSS-10", a5: "ISI", a6: "WEMWBS",
};

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

type ApiTreatmentPlan = {
  diagnosis: string; approach: string; frequency: string; shortTermGoals: string; longTermGoals: string;
  phase: string; riskLevel: RiskLevel; safetyPlan: boolean; emergencyContacts: boolean; lastAssessed: string | null;
};

type ClinicalNote = {
  id: string;
  date: string;
  sessionType: SessionType;
  content: string;
  noteFormat: "freeform" | "soap";
  subjective: string;
  objective: string;
  clinicalAssessment: string;
  affect: string;
  riskLevel: RiskLevel;
  nextSteps: string;
  tags: string[];
};

type Enrollment = { id: string; courseName: string; status: "in_progress" | "completed" | "paused" };
const COURSE_STATUS_LABEL: Record<Enrollment["status"], string> = {
  in_progress: "In progress", completed: "Completed", paused: "Paused",
};

type ApiClinicalNote = {
  id: string; date: string; sessionType: SessionType; content: string;
  noteFormat?: "freeform" | "soap"; subjective?: string | null; objective?: string | null; clinicalAssessment?: string | null;
  affect: string | null; riskLevel: RiskLevel; nextSteps: string | null; tags: string[];
};

function fromApiNote(n: ApiClinicalNote): ClinicalNote {
  return {
    id: n.id, date: n.date, sessionType: n.sessionType, content: n.content,
    noteFormat: n.noteFormat ?? "freeform",
    subjective: n.subjective ?? "", objective: n.objective ?? "", clinicalAssessment: n.clinicalAssessment ?? "",
    affect: n.affect ?? "", riskLevel: n.riskLevel, nextSteps: n.nextSteps ?? "", tags: n.tags ?? [],
  };
}

const DEFAULT_PLAN: TreatmentPlan = {
  diagnosis: "",
  approach: "Cognitive Behavioural Therapy (CBT) with mindfulness components",
  frequency: "Weekly, 50-minute individual sessions",
  shortTermGoals: "Reduce GAD-7 by 3+ points. Establish consistent sleep routine. Complete 70%+ of daily tasks.",
  longTermGoals: "Develop autonomous anxiety management toolkit. Reduce avoidance behaviours. Improve social confidence.",
  phase: "Phase 2: Skill Building & Application",
  riskLevel: "low",
  safetyPlan: true,
  emergencyContacts: true,
  lastAssessed: "Not yet",
};

function fromApiPlan(p: ApiTreatmentPlan): TreatmentPlan {
  return {
    diagnosis: p.diagnosis, approach: p.approach, frequency: p.frequency,
    shortTermGoals: p.shortTermGoals, longTermGoals: p.longTermGoals, phase: p.phase,
    riskLevel: p.riskLevel, safetyPlan: p.safetyPlan, emergencyContacts: p.emergencyContacts,
    lastAssessed: p.lastAssessed
      ? new Date(p.lastAssessed).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "Not yet",
  };
}

const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "group", label: "Group" },
  { value: "assessment", label: "Assessment" },
  { value: "crisis", label: "Crisis" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
];

const COMMON_TAGS = ["CBT", "EMDR", "Exposure", "Safety plan", "Homework", "Mindfulness", "Medication", "Family"];

function todayIso() {
  return new Date(2026, 5, 24).toISOString().slice(0, 10);
}

function formatNoteDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

const RESPONSE_FIELD_LABELS: Record<string, string> = {
  items: "Gratitude items", mood: "Mood", text: "Reflection", prompt: "Prompt",
  energy: "Energy (1-5)", body: "Body tension", note: "Note", worry: "Worry",
  control: "In their control?", action: "Action / plan", pain: "What's hurting",
  kindWords: "Words of kindness", strengths: "Strengths noticed", values: "Top values",
  reflection: "Reflection", roundsCompleted: "Breathing rounds completed",
  secondsSpent: "Time spent (s)", itemsNoticed: "Grounding items noticed",
  regionsCompleted: "Body regions scanned", who: "Reached out to", message: "Message",
  stepsCompleted: "Stretch steps completed", completed: "Marked done", skipped: "Skipped",
};

function formatResponseValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function ResponseDataPreview({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (entries.length === 0) return null;
  return (
    <div className="mt-2 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2.5 space-y-1.5">
      {entries.map(([key, value]) => (
        <div key={key} className="text-xs">
          <span className="text-stone-400 font-medium">{RESPONSE_FIELD_LABELS[key] ?? key}: </span>
          <span className="text-stone-700 whitespace-pre-wrap">{formatResponseValue(value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [startingConversation, setStartingConversation] = useState(false);

  async function messageClient() {
    if (startingConversation) return;
    setStartingConversation(true);
    try {
      const r = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: id }),
      });
      const d = await r.json();
      if (r.ok && d.conversationId) {
        router.push(`/therapist/messages?open=${d.conversationId}`);
      } else {
        router.push("/therapist/messages");
      }
    } finally {
      setStartingConversation(false);
    }
  }

  useEffect(() => {
    fetch(`/api/therapist/clients/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.client) setClientData(d.client); })
      .finally(() => setLoadingClient(false));
  }, [id]);

  const client = clientData;

  // Treatment plan state
  const [plan, setPlan] = useState<TreatmentPlan>(DEFAULT_PLAN);
  const [planDraft, setPlanDraft] = useState<TreatmentPlan | null>(null);
  const editingPlan = planDraft !== null;
  const [planSaved, setPlanSaved] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/therapist/clients/${id}/plan`)
      .then((r) => r.json())
      .then((d: { plan: ApiTreatmentPlan | null }) => {
        if (d.plan) setPlan(fromApiPlan(d.plan));
      });
  }, [id]);

  type SafetyPlanContact = { name: string; phone?: string; note?: string };
  type ClientSafetyPlan = {
    warningSigns: string[]; copingStrategies: string[]; distractionContacts: SafetyPlanContact[];
    supportContacts: SafetyPlanContact[]; professionalContacts: SafetyPlanContact[]; safeEnvironmentSteps: string[];
  };
  const [safetyPlan, setSafetyPlan] = useState<ClientSafetyPlan | null>(null);
  const [safetyPlanShared, setSafetyPlanShared] = useState(false);

  useEffect(() => {
    fetch(`/api/therapist/clients/${id}/safety-plan`)
      .then((r) => r.json())
      .then((d: { plan: ClientSafetyPlan | null; shared: boolean }) => {
        setSafetyPlan(d.plan);
        setSafetyPlanShared(d.shared);
      });
  }, [id]);

  function startEditPlan() { setPlanDraft({ ...plan }); }
  function cancelEditPlan() { setPlanDraft(null); }
  async function savePlan() {
    if (!planDraft || planSaving) return;
    setPlanSaving(true);
    try {
      const r = await fetch(`/api/therapist/clients/${id}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis: planDraft.diagnosis, approach: planDraft.approach, frequency: planDraft.frequency,
          shortTermGoals: planDraft.shortTermGoals, longTermGoals: planDraft.longTermGoals, phase: planDraft.phase,
          riskLevel: planDraft.riskLevel, safetyPlan: planDraft.safetyPlan, emergencyContacts: planDraft.emergencyContacts,
        }),
      });
      const d = await r.json();
      if (r.ok && d.plan) setPlan(fromApiPlan(d.plan));
      setPlanDraft(null);
      setPlanSaved(true);
      setTimeout(() => setPlanSaved(false), 2500);
    } finally {
      setPlanSaving(false);
    }
  }

  // Missions state — completed missions from API
  const [hoveredMoodDay, setHoveredMoodDay] = useState<number | null>(null);
  const [editingMoodDay, setEditingMoodDay] = useState<number | null>(null);

  const moodScores = (clientData?.moodHistory ?? []).map((m) => m.score);
  const moodAvg = moodScores.length
    ? parseFloat((moodScores.reduce((s, v) => s + v, 0) / moodScores.length).toFixed(1))
    : 0;

  const completedMissions = clientData?.missionCompletions ?? [];
  const completedCount = completedMissions.length;

  // Overview: enrolled courses
  const COURSE_CYCLE: Enrollment["status"][] = ["in_progress", "completed", "paused"];
  const [courses, setCourses] = useState<Enrollment[]>([]);
  const [showCourseMenu, setShowCourseMenu] = useState(false);
  const AVAILABLE_COURSES = [
    "Managing Anxiety", "CBT Fundamentals", "Sleep & Recovery", "Stress Resilience",
    "Mindfulness Basics", "Emotional Regulation", "Building Self-Compassion",
  ];

  useEffect(() => {
    fetch(`/api/therapist/clients/${id}/courses`)
      .then((r) => r.json())
      .then((d) => setCourses(d.enrollments ?? []));
  }, [id]);

  async function addCourse(name: string) {
    setShowCourseMenu(false);
    if (courses.find((c) => c.courseName === name)) return;
    const r = await fetch(`/api/therapist/clients/${id}/courses`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseName: name }),
    });
    const d = await r.json();
    if (r.ok && d.enrollment) setCourses((prev) => [...prev, d.enrollment]);
  }
  async function removeCourse(enrollmentId: string) {
    setCourses((prev) => prev.filter((c) => c.id !== enrollmentId));
    await fetch(`/api/therapist/clients/${id}/courses`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enrollmentId }),
    });
  }
  async function cycleCourseStatus(enrollmentId: string) {
    const current = courses.find((c) => c.id === enrollmentId);
    if (!current) return;
    const next = COURSE_CYCLE[(COURSE_CYCLE.indexOf(current.status) + 1) % COURSE_CYCLE.length];
    setCourses((prev) => prev.map((c) => c.id === enrollmentId ? { ...c, status: next } : c));
    await fetch(`/api/therapist/clients/${id}/courses`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enrollmentId, status: next }),
    });
  }

  // Journal state
  const [expandedJournalId, setExpandedJournalId] = useState<string | null>(null);
  const journalEntries = clientData?.journalEntries ?? [];
  const expandedJournalEntry = journalEntries.find((e) => e.id === expandedJournalId) ?? null;

  // Clinical notes state
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/therapist/clients/${id}/notes`)
      .then((r) => r.json())
      .then((d: { notes?: ApiClinicalNote[] }) => setNotes((d.notes ?? []).map(fromApiNote)));
  }, [id]);

  // Form state
  const [formDate, setFormDate] = useState(todayIso());
  const [formType, setFormType] = useState<SessionType>("individual");
  const [formNoteFormat, setFormNoteFormat] = useState<"freeform" | "soap">("freeform");
  const [formContent, setFormContent] = useState("");
  const [formSubjective, setFormSubjective] = useState("");
  const [formObjective, setFormObjective] = useState("");
  const [formClinicalAssessment, setFormClinicalAssessment] = useState("");
  const [formAffect, setFormAffect] = useState("");
  const [formRisk, setFormRisk] = useState<RiskLevel>("low");
  const [formNextSteps, setFormNextSteps] = useState("");
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formTagInput, setFormTagInput] = useState("");
  const [saveConfirm, setSaveConfirm] = useState(false);

  function resetForm() {
    setFormDate(todayIso());
    setFormType("individual");
    setFormNoteFormat("freeform");
    setFormContent("");
    setFormSubjective("");
    setFormObjective("");
    setFormClinicalAssessment("");
    setFormAffect("");
    setFormRisk("low");
    setFormNextSteps("");
    setFormTags([]);
    setFormTagInput("");
  }

  async function handleSaveNote() {
    const isSoap = formNoteFormat === "soap";
    const composedContent = isSoap
      ? [
          formSubjective.trim() && `Subjective: ${formSubjective.trim()}`,
          formObjective.trim() && `Objective: ${formObjective.trim()}`,
          formClinicalAssessment.trim() && `Assessment: ${formClinicalAssessment.trim()}`,
          formNextSteps.trim() && `Plan: ${formNextSteps.trim()}`,
        ].filter(Boolean).join("\n\n")
      : formContent.trim();
    if (!composedContent || savingNote) return;
    setSavingNote(true);
    try {
      const r = await fetch(`/api/therapist/clients/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date(`${formDate}T12:00:00`).toISOString(),
          sessionType: formType,
          content: composedContent,
          noteFormat: formNoteFormat,
          subjective: isSoap ? formSubjective.trim() || undefined : undefined,
          objective: isSoap ? formObjective.trim() || undefined : undefined,
          clinicalAssessment: isSoap ? formClinicalAssessment.trim() || undefined : undefined,
          affect: formAffect.trim() || undefined,
          riskLevel: formRisk,
          nextSteps: formNextSteps.trim() || undefined,
          tags: formTags,
        }),
      });
      const d = await r.json();
      if (r.ok && d.note) setNotes((prev) => [fromApiNote(d.note), ...prev]);
      resetForm();
      setShowNoteForm(false);
      setSaveConfirm(true);
      setTimeout(() => setSaveConfirm(false), 2500);
    } finally {
      setSavingNote(false);
    }
  }

  async function deleteNote(noteId: string) {
    setDeletingNoteId(noteId);
    try {
      await fetch(`/api/therapist/clients/${id}/notes/${noteId}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setExpandedNoteId(null);
    } finally {
      setDeletingNoteId(null);
    }
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

  if (loadingClient) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <Link href="/therapist/clients" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">← Clients</Link>
        <div className="bg-white border border-stone-100 rounded-xl p-5 animate-pulse">
          <div className="h-12 bg-stone-100 rounded-lg w-1/2 mb-4" />
          <div className="h-4 bg-stone-100 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <Link href="/therapist/clients" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">← Clients</Link>
        <div className="bg-white border border-stone-100 rounded-xl p-8 text-center text-stone-400 text-sm">
          Client not found or not assigned to you.
        </div>
      </div>
    );
  }

  const lastSession = client.appointments
    .filter((a) => a.status === "completed")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const nextSession = client.appointments
    .filter((a) => a.status === "confirmed" && new Date(a.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const fmtApptDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

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
                <span className="text-[10px] border border-stone-200 text-stone-400 px-1.5 py-0.5 rounded font-medium">
                  Level {client.level}
                </span>
              </div>
              <div className="text-xs text-stone-500 mt-0.5">{client.plan} · {client.email}</div>
              <div className="text-xs text-stone-400 mt-0.5">
                Member since {new Date(client.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="bg-stone-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors">
              Start video
            </button>
            <button
              onClick={messageClient}
              disabled={startingConversation}
              className="border border-stone-200 text-stone-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              {startingConversation ? "Opening…" : "Message"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-stone-100">
          {[
            { label: "Avg mood", value: moodAvg > 0 ? moodAvg.toFixed(1) : "—" },
            { label: "Completed tasks", value: String(completedCount) },
            { label: "XP earned", value: `${client.xp} xp` },
            { label: "Last session", value: lastSession ? fmtApptDate(lastSession.date) : "—" },
            { label: "Next session", value: nextSession ? fmtApptDate(nextSession.date) : "—" },
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

          {/* Intake */}
          {client.intake && (
            <div className="bg-white border border-stone-100 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-stone-900 mb-4">Intake</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1">Age range</div>
                  <div className="text-sm text-stone-700">{client.intake.ageRange ? AGE_GROUP_LABELS[client.intake.ageRange] ?? client.intake.ageRange : "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1">Prior therapy</div>
                  <div className="text-sm text-stone-700">{client.intake.priorTherapyExperience ? PRIOR_EXPERIENCE_LABELS[client.intake.priorTherapyExperience] ?? client.intake.priorTherapyExperience : "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1">Language pref.</div>
                  <div className="text-sm text-stone-700">{client.intake.languagePreference ?? "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1">Modality pref.</div>
                  <div className="text-sm text-stone-700">{client.intake.modalityPreference && client.intake.modalityPreference !== "no_preference" ? client.intake.modalityPreference : "—"}</div>
                </div>
              </div>
              {client.intake.concerns.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1.5">What brought them here</div>
                  <div className="flex flex-wrap gap-1.5">
                    {client.intake.concerns.map((c) => (
                      <span key={c} className="text-xs font-medium bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {client.intake.goals && (
                <div>
                  <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1.5">Goals</div>
                  <p className="text-sm text-stone-600 leading-relaxed">{client.intake.goals}</p>
                </div>
              )}
            </div>
          )}

          {/* Mood chart */}
          <div className="bg-white border border-stone-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-stone-900">7-Day Mood Trend</h3>
              <span className="text-xs text-stone-400">Click a bar to edit</span>
            </div>
            {moodScores.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400">No mood data recorded yet.</div>
            ) : (
              <>
                <div className="flex items-end gap-2 h-20">
                  {moodScores.map((score, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 relative group">
                      {hoveredMoodDay === i && editingMoodDay !== i && (
                        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                          Day {i + 1} · {score}/5
                        </div>
                      )}
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
                      <span className="text-[9px] text-stone-400">{DAYS[i % 7]}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-stone-400 mt-3 pt-3 border-t border-stone-50">
                  <span>Min: {Math.min(...moodScores)} / 5</span>
                  <span>Avg: {moodAvg} / 5</span>
                  <span>Max: {Math.max(...moodScores)} / 5</span>
                </div>
              </>
            )}
          </div>

          {/* Assessment score trends */}
          {(client.assessmentResults?.length ?? 0) > 0 && (
            <div className="bg-white border border-stone-100 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-stone-900 mb-4">Assessment Score Trends</h3>
              <div className="space-y-5">
                {Object.entries(
                  client.assessmentResults.reduce<Record<string, ApiAssessmentResult[]>>((acc, r) => {
                    (acc[r.assessmentId] ??= []).push(r);
                    return acc;
                  }, {})
                ).map(([toolId, results]) => {
                  const max = Math.max(...results.map((r) => r.score), 1);
                  return (
                    <div key={toolId}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-stone-700">{ASSESSMENT_TOOL_NAMES[toolId] ?? toolId}</span>
                        <span className="text-xs text-stone-400">{results[results.length - 1].label} (latest)</span>
                      </div>
                      <div className="flex items-end gap-1.5 h-14">
                        {results.map((r) => (
                          <div key={r.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div
                              className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[9px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                            >
                              {r.score} · {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </div>
                            <div
                              className="w-full rounded-t-sm bg-stone-900 transition-colors group-hover:bg-stone-700"
                              style={{ height: `${Math.max(4, (r.score / max) * 56)}px` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mission completion */}
          <div className="bg-white border border-stone-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-900">Completed tasks</h3>
              <span className="text-sm font-semibold text-stone-900">{completedCount} total</span>
            </div>
            {completedMissions.length === 0 ? (
              <p className="text-xs text-stone-400">No tasks completed yet.</p>
            ) : (
              <div className="space-y-2">
                {completedMissions.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-stone-900 border-2 border-stone-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] text-white font-bold">✓</span>
                    </div>
                    <span className="text-xs flex-1 text-stone-700 line-through truncate">{m.mission.title}</span>
                    <span className="text-[10px] text-stone-400 flex-shrink-0 capitalize">{m.mission.category}</span>
                  </div>
                ))}
                {completedMissions.length > 5 && (
                  <button
                    onClick={() => setTab("missions")}
                    className="text-xs text-stone-500 hover:text-stone-900 transition-colors pt-1"
                  >
                    +{completedMissions.length - 5} more → view all
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
                      {AVAILABLE_COURSES.filter((c) => !courses.find((ec) => ec.courseName === c)).map((c) => (
                        <button
                          key={c}
                          onClick={() => addCourse(c)}
                          className="w-full text-left px-3 py-2.5 text-xs text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                          {c}
                        </button>
                      ))}
                      {AVAILABLE_COURSES.filter((c) => !courses.find((ec) => ec.courseName === c)).length === 0 && (
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
                  <div key={course.id} className="flex items-center gap-3 py-2.5 first:pt-0 group">
                    <span className="text-xs text-stone-700 flex-1 truncate">{course.courseName}</span>
                    <button
                      onClick={() => cycleCourseStatus(course.id)}
                      className={`text-[10px] font-medium border px-2 py-0.5 rounded transition-colors ${
                        course.status === "completed"
                          ? "border-stone-300 text-stone-500 hover:border-stone-400"
                          : course.status === "paused"
                          ? "border-amber-200 text-amber-600 hover:border-amber-300"
                          : "border-stone-200 text-stone-500 hover:border-stone-400"
                      }`}
                      title="Click to change status"
                    >
                      {COURSE_STATUS_LABEL[course.status]}
                    </button>
                    <button
                      onClick={() => removeCourse(course.id)}
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
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400">
                      {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}
                      {new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
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
              {entry.content && (
                <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 mb-3">
                  {entry.content.replace(/\n+/g, " ")}
                </p>
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
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-stone-400">
                    {new Date(expandedJournalEntry.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    {" · "}
                    {new Date(expandedJournalEntry.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
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
            <p className="text-sm text-stone-500">Completed tasks ({completedMissions.length})</p>
            <Link href="/therapist/missions" className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-stone-800 transition-colors">
              + Assign task
            </Link>
          </div>
          <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
            {completedMissions.length === 0 ? (
              <div className="py-12 text-center text-sm text-stone-400">
                No tasks completed yet.
              </div>
            ) : (
              <div className="divide-y divide-stone-50">
                {completedMissions.map((m) => {
                  const hasResponse = !!m.responseData && Object.values(m.responseData).some((v) => v !== null && v !== undefined && v !== "");
                  const isExpanded = expandedMissionId === m.id;
                  return (
                    <div key={m.id} className="px-5 py-4">
                      <button
                        onClick={() => hasResponse && setExpandedMissionId(isExpanded ? null : m.id)}
                        className={`w-full flex items-start gap-3 text-left ${hasResponse ? "cursor-pointer" : "cursor-default"}`}
                      >
                        <div className="mt-0.5 w-4 h-4 rounded-full border-2 bg-stone-900 border-stone-900 flex items-center justify-center flex-shrink-0">
                          <span className="text-[8px] text-white font-bold">✓</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-stone-800 line-through text-stone-400">{m.mission.title}</div>
                          <div className="flex gap-3 mt-1 text-xs text-stone-400">
                            <span className="capitalize">{m.mission.category}</span>
                            <span>+{m.mission.xp} xp</span>
                            <span>{new Date(m.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            {hasResponse && <span className="text-stone-500 font-medium">Response recorded</span>}
                          </div>
                        </div>
                        {hasResponse && (isExpanded ? <ChevronUp size={14} className="text-stone-400 mt-0.5" /> : <ChevronDown size={14} className="text-stone-400 mt-0.5" />)}
                      </button>
                      {isExpanded && m.responseData && <ResponseDataPreview data={m.responseData} />}
                    </div>
                  );
                })}
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
              <div className="px-5 py-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">New clinical note</h3>
                  <p className="text-xs text-stone-400 mt-0.5">This note is private and will not be visible to the client.</p>
                </div>
                <div className="flex bg-stone-100 rounded-lg p-0.5 gap-0.5 flex-shrink-0">
                  {(["freeform", "soap"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormNoteFormat(f)}
                      className={`text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                        formNoteFormat === f ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                      }`}
                    >
                      {f === "freeform" ? "Free text" : "SOAP"}
                    </button>
                  ))}
                </div>
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
                {formNoteFormat === "freeform" ? (
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
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-stone-700">Subjective</label>
                      <textarea
                        rows={3}
                        value={formSubjective}
                        onChange={(e) => setFormSubjective(e.target.value)}
                        placeholder="Client's reported experience, in their own words…"
                        className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 text-stone-900 placeholder:text-stone-300 leading-relaxed focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-colors resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-stone-700">Objective</label>
                      <textarea
                        rows={3}
                        value={formObjective}
                        onChange={(e) => setFormObjective(e.target.value)}
                        placeholder="Observable facts: affect, behavior, mental status…"
                        className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 text-stone-900 placeholder:text-stone-300 leading-relaxed focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-colors resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-stone-700">Assessment</label>
                      <textarea
                        rows={3}
                        value={formClinicalAssessment}
                        onChange={(e) => setFormClinicalAssessment(e.target.value)}
                        placeholder="Clinical interpretation, progress toward goals…"
                        className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 text-stone-900 placeholder:text-stone-300 leading-relaxed focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-colors resize-none"
                      />
                    </div>
                  </div>
                )}

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

                {/* Next steps / Plan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone-700">
                    {formNoteFormat === "soap" ? "Plan" : "Next steps / actions"} <span className="text-stone-400 font-normal">(optional)</span>
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
                  disabled={
                    (formNoteFormat === "soap"
                      ? !(formSubjective.trim() || formObjective.trim() || formClinicalAssessment.trim() || formNextSteps.trim())
                      : !formContent.trim()) || savingNote
                  }
                  className="text-sm bg-stone-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {savingNote ? "Saving…" : "Save note"}
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
                          {new Date(note.date).toLocaleDateString("en-US", { month: "short" })}
                        </div>
                        <div className="text-sm font-semibold text-stone-900">
                          {new Date(note.date).getDate()}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {new Date(note.date).getFullYear()}
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
                        {note.noteFormat === "soap" ? (
                          <div className="pt-4 space-y-3">
                            {note.subjective && (
                              <div>
                                <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Subjective</div>
                                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{note.subjective}</p>
                              </div>
                            )}
                            {note.objective && (
                              <div>
                                <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Objective</div>
                                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{note.objective}</p>
                              </div>
                            )}
                            {note.clinicalAssessment && (
                              <div>
                                <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Assessment</div>
                                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{note.clinicalAssessment}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="pt-4">
                            <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Full session notes</div>
                            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                          </div>
                        )}
                        {note.affect && (
                          <div>
                            <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Affect / presentation</div>
                            <p className="text-sm text-stone-700">{note.affect}</p>
                          </div>
                        )}
                        {note.nextSteps && (
                          <div>
                            <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">{note.noteFormat === "soap" ? "Plan" : "Next steps"}</div>
                            <p className="text-sm text-stone-700 leading-relaxed">{note.nextSteps}</p>
                          </div>
                        )}
                        <div className="pt-2 border-t border-stone-50 flex items-center justify-between">
                          <p className="text-[11px] text-stone-400">{formatNoteDate(note.date)}</p>
                          <button
                            onClick={() => deleteNote(note.id)}
                            disabled={deletingNoteId === note.id}
                            className="text-xs text-stone-400 hover:text-red-500 transition-colors disabled:opacity-40"
                          >
                            {deletingNoteId === note.id ? "Deleting…" : "Delete note"}
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
          {/* Client's safety plan (read-only) */}
          <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <h3 className="text-sm font-semibold text-stone-900">Client&apos;s safety plan</h3>
            </div>
            {!safetyPlanShared || !safetyPlan ? (
              <div className="px-5 py-6 text-center text-sm text-stone-400">
                {safetyPlanShared ? "Client hasn't created a safety plan yet." : "Client hasn't shared a safety plan with you."}
              </div>
            ) : (
              <div className="divide-y divide-stone-50">
                {[
                  ["Warning signs", safetyPlan.warningSigns],
                  ["Coping strategies", safetyPlan.copingStrategies],
                  ["Making environment safer", safetyPlan.safeEnvironmentSteps],
                ].map(([label, items]) => (items as string[]).length > 0 && (
                  <div key={label as string} className="px-5 py-3">
                    <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1.5">{label}</div>
                    <ul className="space-y-1">
                      {(items as string[]).map((item, i) => <li key={i} className="text-sm text-stone-700">• {item}</li>)}
                    </ul>
                  </div>
                ))}
                {(
                  [
                    ["People/places for distraction", safetyPlan.distractionContacts],
                    ["People to ask for help", safetyPlan.supportContacts],
                    ["Professional contacts", safetyPlan.professionalContacts],
                  ] as [string, SafetyPlanContact[]][]
                ).map(([label, contacts]) => contacts.length > 0 && (
                  <div key={label} className="px-5 py-3">
                    <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1.5">{label}</div>
                    <div className="space-y-0.5">
                      {contacts.map((c, i) => (
                        <div key={i} className="text-sm text-stone-700">{c.name}{c.phone ? ` · ${c.phone}` : ""}{c.note ? ` — ${c.note}` : ""}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                      disabled={planSaving}
                      className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-40"
                    >
                      {planSaving ? "Saving…" : "Save changes"}
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
                disabled={planSaving}
                className="text-sm bg-stone-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-40"
              >
                {planSaving ? "Saving…" : "Save changes"}
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
