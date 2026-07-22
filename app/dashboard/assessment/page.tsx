"use client";

import { useState, useEffect } from "react";
import { Info, AlertTriangle, Phone, ChevronLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { matchesAssessmentKeywords } from "@/lib/courseRecommendations";

type RecommendedCourse = { id: string; title: string; category: string; tags: string[]; thumbnail: string; color: string };

// ── Option sets ──────────────────────────────────────────────────────────────

const OPT_FREQ4 = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

const OPT_STRESS = [
  { label: "Never", value: 0 },
  { label: "Almost never", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Fairly often", value: 3 },
  { label: "Very often", value: 4 },
];

const OPT_BURNOUT = [
  { label: "Never / almost never", value: 0 },
  { label: "Rarely", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Often", value: 3 },
  { label: "Always / almost always", value: 4 },
];

const OPT_SEVERITY5 = [
  { label: "None", value: 0 },
  { label: "Mild", value: 1 },
  { label: "Moderate", value: 2 },
  { label: "Severe", value: 3 },
  { label: "Very severe", value: 4 },
];

const OPT_WEMWBS = [
  { label: "None of the time", value: 1 },
  { label: "Rarely", value: 2 },
  { label: "Some of the time", value: 3 },
  { label: "Often", value: 4 },
  { label: "All of the time", value: 5 },
];

// ── Types ────────────────────────────────────────────────────────────────────

type Opt = { label: string; value: number };

type QDef = {
  text: string;
  options: Opt[];
  reverse?: boolean;
  safety?: boolean;
};

type ScoreRange = {
  min: number;
  max: number;
  label: string;
  detail: string;
};

type ToolDef = {
  id: string;
  shortName: string;
  title: string;
  description: string;
  timeframe: string;
  questions: QDef[];
  maxScore: number;
  minScore: number;
  scoring: ScoreRange[];
  citation: string;
};

type HistoryEntry = {
  id: string;
  toolId: string;
  toolName: string;
  score: number;
  maxScore: number;
  label: string;
  date: string;
  safetyFlagged: boolean;
};

// ── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS: Record<string, ToolDef> = {
  a1: {
    id: "a1",
    shortName: "GAD-7",
    title: "Generalised Anxiety Disorder",
    description: "A 7-item scale measuring the severity of generalised anxiety over the past two weeks.",
    timeframe: "Over the past 2 weeks, how often have you been bothered by the following problems?",
    minScore: 0,
    maxScore: 21,
    questions: [
      { text: "Feeling nervous, anxious, or on edge", options: OPT_FREQ4 },
      { text: "Not being able to stop or control worrying", options: OPT_FREQ4 },
      { text: "Worrying too much about different things", options: OPT_FREQ4 },
      { text: "Trouble relaxing", options: OPT_FREQ4 },
      { text: "Being so restless that it is hard to sit still", options: OPT_FREQ4 },
      { text: "Becoming easily annoyed or irritable", options: OPT_FREQ4 },
      { text: "Feeling afraid, as if something awful might happen", options: OPT_FREQ4 },
    ],
    scoring: [
      { min: 0, max: 4, label: "Minimal anxiety", detail: "Little to no anxiety symptoms detected. Continue your current wellness practices and consider regular check-ins with your care team." },
      { min: 5, max: 9, label: "Mild anxiety", detail: "Some anxiety symptoms are present. Self-monitoring, relaxation techniques, and discussion with your therapist are recommended." },
      { min: 10, max: 14, label: "Moderate anxiety", detail: "Moderate anxiety symptoms detected. Speaking with your therapist about treatment options — including CBT or mindfulness-based approaches — is strongly recommended." },
      { min: 15, max: 21, label: "Severe anxiety", detail: "Significant anxiety symptoms present. Please reach out to your therapist or a mental health professional as soon as possible." },
    ],
    citation: "Spitzer RL, Kroenke K, Williams JBW, Löwe B. A brief measure for assessing generalized anxiety disorder. Arch Intern Med. 2006;166(10):1092–1097.",
  },

  a2: {
    id: "a2",
    shortName: "PHQ-9",
    title: "Patient Health Questionnaire",
    description: "A 9-item scale that scores depression severity and screens for major depressive disorder.",
    timeframe: "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
    minScore: 0,
    maxScore: 27,
    questions: [
      { text: "Little interest or pleasure in doing things", options: OPT_FREQ4 },
      { text: "Feeling down, depressed, or hopeless", options: OPT_FREQ4 },
      { text: "Trouble falling or staying asleep, or sleeping too much", options: OPT_FREQ4 },
      { text: "Feeling tired or having little energy", options: OPT_FREQ4 },
      { text: "Poor appetite or overeating", options: OPT_FREQ4 },
      { text: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down", options: OPT_FREQ4 },
      { text: "Trouble concentrating on things, such as reading or watching television", options: OPT_FREQ4 },
      { text: "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual", options: OPT_FREQ4 },
      {
        text: "Thoughts that you would be better off dead, or of hurting yourself in some way",
        options: OPT_FREQ4,
        safety: true,
      },
    ],
    scoring: [
      { min: 0, max: 4, label: "Minimal depression", detail: "Minimal depressive symptoms detected. Continue monitoring your mood and maintain your current wellness routines." },
      { min: 5, max: 9, label: "Mild depression", detail: "Mild depressive symptoms present. Watchful waiting, self-care strategies, and regular check-ins with your therapist are appropriate." },
      { min: 10, max: 14, label: "Moderate depression", detail: "Moderate depression detected. Treatment planning — including CBT or other therapeutic approaches — and discussion with your therapist is recommended." },
      { min: 15, max: 19, label: "Moderately severe depression", detail: "Significant depressive symptoms. Active treatment including therapy and possible medication consultation is strongly recommended." },
      { min: 20, max: 27, label: "Severe depression", detail: "Severe depressive symptoms detected. Please contact your therapist or a mental health professional immediately." },
    ],
    citation: "Kroenke K, Spitzer RL, Williams JB. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med. 2001;16(9):606–613.",
  },

  a3: {
    id: "a3",
    shortName: "CBI",
    title: "Copenhagen Burnout Inventory",
    description: "A 12-item scale measuring personal, work, and client-related burnout.",
    timeframe: "How often do you experience the following?",
    minScore: 0,
    maxScore: 40,
    questions: [
      { text: "How often do you feel tired?", options: OPT_BURNOUT },
      { text: "How often do you feel physically exhausted?", options: OPT_BURNOUT },
      { text: "How often do you feel emotionally exhausted?", options: OPT_BURNOUT },
      { text: "How often do you think: 'I can't take it anymore'?", options: OPT_BURNOUT },
      { text: "How often do you feel worn out?", options: OPT_BURNOUT },
      { text: "How often do you feel weak and susceptible to illness?", options: OPT_BURNOUT },
      { text: "Is your work emotionally exhausting?", options: OPT_BURNOUT },
      { text: "Do you feel burnt out because of your work?", options: OPT_BURNOUT },
      { text: "Does your work frustrate you?", options: OPT_BURNOUT },
      { text: "Does every working hour feel tiring to you?", options: OPT_BURNOUT },
    ],
    scoring: [
      { min: 0, max: 13, label: "Low burnout", detail: "Your burnout levels appear low. Maintain your current self-care and work-life balance practices." },
      { min: 14, max: 24, label: "Moderate burnout", detail: "Moderate burnout symptoms are present. Consider discussing workload and self-care strategies with your therapist." },
      { min: 25, max: 32, label: "High burnout", detail: "High levels of burnout detected. This warrants attention — please discuss with your therapist and consider meaningful workload adjustments." },
      { min: 33, max: 40, label: "Severe burnout", detail: "Severe burnout symptoms. Immediate steps to reduce demands and seek professional support are strongly recommended." },
    ],
    citation: "Kristensen TS, Borritz M, Villadsen E, Christensen KB. The Copenhagen Burnout Inventory: a new tool for the assessment of burnout. Work & Stress. 2005;19(3):192–207.",
  },

  a4: {
    id: "a4",
    shortName: "PSS-10",
    title: "Perceived Stress Scale",
    description: "A 10-item scale measuring your perception of stress over the past month.",
    timeframe: "In the last month, how often have you…",
    minScore: 0,
    maxScore: 40,
    questions: [
      { text: "Been upset because of something that happened unexpectedly?", options: OPT_STRESS },
      { text: "Felt that you were unable to control the important things in your life?", options: OPT_STRESS },
      { text: "Felt nervous and stressed?", options: OPT_STRESS },
      { text: "Felt confident about your ability to handle your personal problems?", options: OPT_STRESS, reverse: true },
      { text: "Felt that things were going your way?", options: OPT_STRESS, reverse: true },
      { text: "Found that you could not cope with all the things you had to do?", options: OPT_STRESS },
      { text: "Been able to control irritations in your life?", options: OPT_STRESS, reverse: true },
      { text: "Felt that you were on top of things?", options: OPT_STRESS, reverse: true },
      { text: "Been angered because of things that were outside of your control?", options: OPT_STRESS },
      { text: "Felt difficulties were piling up so high that you could not overcome them?", options: OPT_STRESS },
    ],
    scoring: [
      { min: 0, max: 13, label: "Low perceived stress", detail: "Your stress levels appear manageable. Continue your current coping strategies and wellness practices." },
      { min: 14, max: 26, label: "Moderate perceived stress", detail: "Moderate stress is present. Consider stress management techniques and discuss with your therapist if symptoms persist." },
      { min: 27, max: 40, label: "High perceived stress", detail: "High stress levels detected. Please speak with your therapist about coping strategies, boundary-setting, and workload management." },
    ],
    citation: "Cohen S, Kamarck T, Mermelstein R. A global measure of perceived stress. J Health Soc Behav. 1983;24(4):385–396.",
  },

  a5: {
    id: "a5",
    shortName: "ISI",
    title: "Insomnia Severity Index",
    description: "A 7-item scale that evaluates the nature, severity, and impact of insomnia.",
    timeframe: "For each question, please rate your current sleep situation.",
    minScore: 0,
    maxScore: 28,
    questions: [
      { text: "How severe is your difficulty falling asleep?", options: OPT_SEVERITY5 },
      { text: "How severe is your difficulty staying asleep?", options: OPT_SEVERITY5 },
      { text: "How severe is your problem waking up too early?", options: OPT_SEVERITY5 },
      {
        text: "How satisfied or dissatisfied are you with your current sleep pattern?",
        options: [
          { label: "Very satisfied", value: 0 },
          { label: "Satisfied", value: 1 },
          { label: "Neutral", value: 2 },
          { label: "Dissatisfied", value: 3 },
          { label: "Very dissatisfied", value: 4 },
        ],
      },
      {
        text: "To what extent does your sleep problem interfere with your daily functioning (e.g. daytime fatigue, concentration, mood, work performance)?",
        options: [
          { label: "Not at all", value: 0 },
          { label: "A little", value: 1 },
          { label: "Somewhat", value: 2 },
          { label: "Much", value: 3 },
          { label: "Very much", value: 4 },
        ],
      },
      {
        text: "How noticeable to others do you think your sleep problem is in terms of impairing the quality of your life?",
        options: [
          { label: "Not at all noticeable", value: 0 },
          { label: "Barely noticeable", value: 1 },
          { label: "Somewhat noticeable", value: 2 },
          { label: "Much noticeable", value: 3 },
          { label: "Very much noticeable", value: 4 },
        ],
      },
      {
        text: "How worried or distressed are you about your current sleep problem?",
        options: [
          { label: "Not at all", value: 0 },
          { label: "A little", value: 1 },
          { label: "Somewhat", value: 2 },
          { label: "Much", value: 3 },
          { label: "Very much", value: 4 },
        ],
      },
    ],
    scoring: [
      { min: 0, max: 7, label: "No clinically significant insomnia", detail: "Your sleep appears within normal range. Continue practising good sleep hygiene." },
      { min: 8, max: 14, label: "Subthreshold insomnia", detail: "Some sleep difficulties are present but below clinical threshold. Sleep hygiene improvements and monitoring are recommended." },
      { min: 15, max: 21, label: "Moderate clinical insomnia", detail: "Moderate insomnia detected. Cognitive Behavioural Therapy for Insomnia (CBT-I) and discussion with your therapist or physician is recommended." },
      { min: 22, max: 28, label: "Severe clinical insomnia", detail: "Severe insomnia symptoms present. Please consult your therapist and/or physician about treatment options including CBT-I and sleep medicine." },
    ],
    citation: "Morin CM, Belleville G, Bélanger L, Ivers H. The Insomnia Severity Index: psychometric indicators to detect insomnia cases and evaluate treatment response. Sleep. 2011;34(5):601–608.",
  },

  a6: {
    id: "a6",
    shortName: "WEMWBS",
    title: "Warwick–Edinburgh Mental Wellbeing Scale",
    description: "A 14-item scale capturing positive mental wellbeing over the past two weeks.",
    timeframe: "Below are some statements about feelings and thoughts. Please indicate how often you have felt this way over the last 2 weeks.",
    minScore: 14,
    maxScore: 70,
    questions: [
      { text: "I've been feeling optimistic about the future", options: OPT_WEMWBS },
      { text: "I've been feeling useful", options: OPT_WEMWBS },
      { text: "I've been feeling relaxed", options: OPT_WEMWBS },
      { text: "I've been feeling interested in other people", options: OPT_WEMWBS },
      { text: "I've had energy to spare", options: OPT_WEMWBS },
      { text: "I've been dealing with problems well", options: OPT_WEMWBS },
      { text: "I've been thinking clearly", options: OPT_WEMWBS },
      { text: "I've been feeling good about myself", options: OPT_WEMWBS },
      { text: "I've been feeling close to other people", options: OPT_WEMWBS },
      { text: "I've been feeling confident", options: OPT_WEMWBS },
      { text: "I've been able to make up my own mind about things", options: OPT_WEMWBS },
      { text: "I've been feeling loved", options: OPT_WEMWBS },
      { text: "I've been interested in new things", options: OPT_WEMWBS },
      { text: "I've been feeling cheerful", options: OPT_WEMWBS },
    ],
    scoring: [
      { min: 14, max: 40, label: "Very low wellbeing", detail: "Your responses suggest very low wellbeing, which may indicate significant distress. Please share these results with your therapist." },
      { min: 41, max: 52, label: "Below average wellbeing", detail: "Your wellbeing is currently below average. Discussing this with your therapist can help identify areas for growth and support." },
      { min: 53, max: 62, label: "Moderate wellbeing", detail: "Your wellbeing is in the moderate range. There may be specific areas worth exploring with your therapist to further strengthen your mental health." },
      { min: 63, max: 70, label: "High wellbeing", detail: "You are experiencing high levels of wellbeing. Keep building on these strengths with your therapist." },
    ],
    citation: "Tennant R, et al. The Warwick-Edinburgh Mental Well-being Scale (WEMWBS): development and UK validation. Health Qual Life Outcomes. 2007;5:63.",
  },
};


// ── Scoring helper ────────────────────────────────────────────────────────────

function computeScore(tool: ToolDef, rawAnswers: Record<number, number>): number {
  return tool.questions.reduce((sum, q, i) => {
    const raw = rawAnswers[i] ?? q.options[0].value;
    if (q.reverse) {
      const maxVal = Math.max(...q.options.map((o) => o.value));
      const minVal = Math.min(...q.options.map((o) => o.value));
      return sum + (maxVal - raw + minVal);
    }
    return sum + raw;
  }, 0);
}

function getRange(tool: ToolDef, score: number): ScoreRange {
  return tool.scoring.find((r) => score >= r.min && score <= r.max) ?? tool.scoring[tool.scoring.length - 1];
}

// ── Component ────────────────────────────────────────────────────────────────

type View = "list" | "quiz" | "result";

export default function AssessmentPage() {
  const [view, setView] = useState<View>("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [safetyFlagged, setSafetyFlagged] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([]);

  const tool = activeId ? TOOLS[activeId] : null;

  useEffect(() => {
    if (view !== "result" || !activeId) return;
    fetch("/api/courses")
      .then((r) => r.json())
      .then((d) => {
        const courses: RecommendedCourse[] = d.courses ?? [];
        setRecommendedCourses(courses.filter((c) => matchesAssessmentKeywords(activeId, c)).slice(0, 3));
      })
      .catch(() => setRecommendedCourses([]));
  }, [view, activeId]);

  useEffect(() => {
    fetch("/api/assessments")
      .then((r) => r.json())
      .then((d) => {
        const entries: HistoryEntry[] = (d.results ?? []).map((r: { id: string; assessmentId: string; score: number; label: string; createdAt: string; safetyFlagged: boolean }) => {
          const t = TOOLS[r.assessmentId];
          return {
            id: r.id,
            toolId: r.assessmentId,
            toolName: t?.shortName ?? r.assessmentId,
            score: r.score,
            maxScore: t?.maxScore ?? 100,
            label: r.label,
            date: new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            safetyFlagged: r.safetyFlagged,
          };
        });
        setHistory(entries);
      });
  }, []);

  function start(id: string) {
    setActiveId(id);
    setAnswers({});
    setCurrentQ(0);
    setFinalScore(null);
    setSafetyFlagged(false);
    setView("quiz");
  }

  function goBack() {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    } else {
      setView("list");
      setActiveId(null);
    }
  }

  function pickAnswer(qIndex: number, value: number) {
    if (!tool) return;
    const updated = { ...answers, [qIndex]: value };
    setAnswers(updated);

    const triggered = tool.questions[qIndex].safety && value > 0;
    if (triggered) setSafetyFlagged(true);

    if (qIndex < tool.questions.length - 1) {
      setCurrentQ(qIndex + 1);
    } else {
      const score = computeScore(tool, updated);
      const range = getRange(tool, score);
      const didFlag = triggered || safetyFlagged;
      const answersArr = tool.questions.map((_, i) => updated[i] ?? 0);

      setFinalScore(score);
      const entry: HistoryEntry = {
        id: `h${Date.now()}`,
        toolId: tool.id,
        toolName: tool.shortName,
        score,
        maxScore: tool.maxScore,
        label: range.label,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        safetyFlagged: didFlag,
      };
      setHistory((prev) => [entry, ...prev]);

      fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: tool.id, score, label: range.label, answers: answersArr, safetyFlagged: didFlag }),
      });

      setView("result");
    }
  }

  function reset() {
    setView("list");
    setActiveId(null);
    setAnswers({});
    setCurrentQ(0);
    setFinalScore(null);
    setSafetyFlagged(false);
  }

  // ── Quiz view ─────────────────────────────────────────────────────────────

  if (view === "quiz" && tool) {
    const q = tool.questions[currentQ];
    const total = tool.questions.length;
    const pct = (currentQ / total) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors">
            <ChevronLeft size={16} strokeWidth={1.5} />
            {currentQ === 0 ? "All assessments" : "Previous question"}
          </button>
          <span className="text-xs text-stone-400 font-medium">
            {tool.shortName} · {currentQ + 1} of {total}
          </span>
        </div>

        {/* Progress */}
        <div className="w-full bg-stone-100 rounded-full h-1">
          <div
            className="bg-stone-900 h-1 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Question */}
        <div className="bg-white border border-stone-100 rounded-xl p-6 space-y-5">
          <div>
            <p className="text-xs text-stone-400 leading-relaxed mb-3">{tool.timeframe}</p>
            {q.reverse && (
              <p className="text-[10px] text-stone-300 mb-2 italic">Higher frequency = lower stress for this item</p>
            )}
            <p className="text-base font-medium text-stone-900 leading-relaxed">{q.text}</p>
          </div>

          <div className="space-y-2">
            {q.options.map((opt) => {
              const selected = answers[currentQ] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => pickAnswer(currentQ, opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 border rounded-xl text-sm text-left transition-all ${
                    selected
                      ? "bg-stone-900 border-stone-900 text-white"
                      : "border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50"
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className={`text-xs font-mono ${selected ? "text-stone-400" : "text-stone-300"}`}>
                    {opt.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Safety notice on item 9 (PHQ-9) */}
        {q.safety && (
          <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <Phone size={13} className="text-stone-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-xs text-stone-500 leading-relaxed">
              If you are in crisis or having thoughts of harming yourself, please call{" "}
              <a href="tel:988" className="font-semibold text-stone-800 underline">988</a> (Suicide &amp; Crisis Lifeline) or go to your nearest emergency room.
            </p>
          </div>
        )}

        <p className="text-[10px] text-stone-400 text-center">Your responses are confidential and shared only with your care team.</p>
      </div>
    );
  }

  // ── Result view ───────────────────────────────────────────────────────────

  if (view === "result" && tool && finalScore !== null) {
    const range = getRange(tool, finalScore);
    const pct = ((finalScore - tool.minScore) / (tool.maxScore - tool.minScore)) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={reset} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors">
            <ChevronLeft size={16} strokeWidth={1.5} /> All assessments
          </button>
          <span className="text-xs text-stone-400">
            {tool?.title} · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {/* Score card */}
        <div className="bg-white border border-stone-200 rounded-xl p-7 text-center">
          <div className="text-5xl font-light text-stone-900 mb-1 tabular-nums">{finalScore}</div>
          <div className="text-sm text-stone-400 mb-5">
            out of {tool.maxScore}
            {tool.minScore > 0 && <span className="text-stone-300"> (min {tool.minScore})</span>}
          </div>

          <div className="w-full max-w-xs mx-auto bg-stone-100 rounded-full h-1.5 mb-5">
            <div className="bg-stone-900 h-1.5 rounded-full transition-all" style={{ width: `${Math.max(4, pct)}%` }} />
          </div>

          <div className="text-base font-semibold text-stone-900 mb-2">{range.label}</div>
          <p className="text-sm text-stone-500 leading-relaxed max-w-sm mx-auto">{range.detail}</p>
        </div>

        {/* Safety alert */}
        {safetyFlagged && (
          <div className="bg-white border border-stone-200 rounded-xl p-5 flex gap-3">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={15} className="text-red-500" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 mb-1">You endorsed thoughts of self-harm</p>
              <p className="text-xs text-stone-500 leading-relaxed">
                Your therapist will be notified. If you need immediate support, call{" "}
                <a href="tel:988" className="font-semibold text-stone-800 underline">988</a> or go to your nearest emergency room. You are not alone.
              </p>
            </div>
          </div>
        )}

        {/* Score ranges */}
        <div className="bg-white border border-stone-100 rounded-xl p-5">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3">Score ranges</p>
          <div className="space-y-1.5">
            {tool.scoring.map((r) => {
              const active = finalScore >= r.min && finalScore <= r.max;
              return (
                <div
                  key={r.label}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active ? "bg-stone-900 text-white" : "text-stone-500"
                  }`}
                >
                  <span>{r.label}</span>
                  <span className={`text-xs font-mono ${active ? "text-stone-400" : "text-stone-300"}`}>
                    {r.min}–{r.max}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommended courses */}
        {recommendedCourses.length > 0 && (
          <div className="bg-white border border-stone-100 rounded-xl p-5">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3">Recommended for you</p>
            <div className="space-y-2">
              {recommendedCourses.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/courses/${c.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-stone-100 hover:border-stone-300 transition-colors"
                >
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${c.color || "bg-stone-100"}`}>
                    {c.thumbnail || "📘"}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-stone-800 truncate">{c.title}</div>
                    <div className="text-xs text-stone-400 truncate">{c.category}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Citation */}
        <div className="bg-white border border-stone-100 rounded-xl px-5 py-4 flex items-start gap-2.5">
          <BookOpen size={13} className="text-stone-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="text-[10px] text-stone-400 leading-relaxed">
            <span className="font-medium text-stone-500">{tool.shortName} — </span>
            {tool.citation}
          </p>
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <button onClick={reset} className="flex-1 py-2.5 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
            All assessments
          </button>
          <button onClick={() => start(tool.id)} className="flex-1 py-2.5 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
            Retake
          </button>
          <button className="flex-1 py-2.5 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors">
            Message therapist
          </button>
        </div>

        <p className="text-[10px] text-stone-400 text-center leading-relaxed">
          These results are a screening tool, not a clinical diagnosis. Your therapist will review them and discuss next steps with you.
        </p>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Assessments</h1>
        <p className="text-sm text-stone-500 mt-1">Clinically validated screening tools</p>
      </div>

      <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
        <Info size={13} className="text-stone-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-xs text-stone-500 leading-relaxed">
          These are validated screening instruments used by mental health professionals. They are not a substitute for clinical diagnosis. Results are private and shared with your therapist only if you choose to. In crisis, call <strong className="text-stone-700">988</strong>.
        </p>
      </div>

      <div className="space-y-2.5">
        {Object.values(TOOLS).map((a) => {
          const toolHistory = history.filter((h) => h.toolId === a.id);
          const lastResult = toolHistory[0];
          return (
            <div key={a.id} className="bg-white border border-stone-100 rounded-xl p-5 hover:border-stone-200 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-stone-900">{a.title}</h3>
                    {lastResult && (
                      <span className="text-[10px] text-stone-500 border border-stone-200 px-1.5 py-0.5 rounded">
                        {lastResult.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed">{a.description}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-stone-400">{a.questions.length} items</span>
                    <span className="text-stone-200">·</span>
                    <span className="text-xs text-stone-400">~{Math.ceil(a.questions.length * 0.5)} min</span>
                    {lastResult && (
                      <>
                        <span className="text-stone-200">·</span>
                        <span className="text-xs text-stone-400">Last taken {lastResult.date}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => start(a.id)}
                  className="bg-stone-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors flex-shrink-0"
                >
                  {lastResult ? "Retake" : "Start"}
                </button>
              </div>

              {lastResult && (
                <div className="mt-4 pt-3 border-t border-stone-50">
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-1.5">
                    <span>Last score</span>
                    <span className="font-medium text-stone-600">{lastResult.score} / {lastResult.maxScore}</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1">
                    <div
                      className="bg-stone-900 h-1 rounded-full"
                      style={{ width: `${(lastResult.score / lastResult.maxScore) * 100}%` }}
                    />
                  </div>
                  {toolHistory.length >= 2 && (
                    <div className="mt-3 pt-3 border-t border-stone-50">
                      <div className="text-[10px] text-stone-400 mb-1.5">Score over time</div>
                      <div className="flex items-end gap-1 h-8">
                        {[...toolHistory].reverse().map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t-sm bg-stone-300"
                            style={{ height: `${Math.max(4, (h.score / lastResult.maxScore) * 32)}px` }}
                            title={`${h.score} · ${h.date}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-stone-900">Assessment History</h2>
          </div>
          <div className="divide-y divide-stone-50">
            {history.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  {r.safetyFlagged && (
                    <AlertTriangle size={12} className="text-red-400 flex-shrink-0" strokeWidth={1.5} />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-stone-800">{r.toolName}</div>
                    <div className="text-xs text-stone-400 mt-0.5">{r.date}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium text-stone-900 tabular-nums">{r.score} / {r.maxScore}</div>
                  <div className="text-xs text-stone-400">{r.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
