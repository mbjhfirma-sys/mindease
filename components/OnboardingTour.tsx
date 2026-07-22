"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, ClipboardList,
  CalendarDays, BarChart3, MessageCircle, Wrench, ChevronLeft, ChevronRight, PartyPopper,
} from "lucide-react";

type Phase = "welcome" | "tour" | "finish";

type TourStep = {
  Icon: React.ElementType;
  title: string;
  body: string;
  accent: string;
  route: string;
  targetTour: string;
};

const THERAPIST_TOUR: TourStep[] = [
  {
    Icon: Users,
    title: "Client Management",
    body: "Every client's mood history, journal (if shared), and task progress lives here — everything you need before a session, at a glance.",
    accent: "bg-sage-50 text-sage-700",
    route: "/therapist/clients",
    targetTour: "/therapist/clients",
  },
  {
    Icon: Wrench,
    title: "Task Builder",
    body: "Assign real, interactive CBT, DBT, and ACT exercises from a library of 100 templates — clients complete them as guided in-app activities, not checkboxes.",
    accent: "bg-amber-50 text-amber-700",
    route: "/therapist/missions",
    targetTour: "/therapist/missions",
  },
  {
    Icon: CalendarDays,
    title: "Scheduling",
    body: "Confirm session requests, reschedule, and set your weekly availability — all from one calendar.",
    accent: "bg-blue-50 text-blue-700",
    route: "/therapist/appointments",
    targetTour: "/therapist/appointments",
  },
  {
    Icon: MessageCircle,
    title: "Secure Messaging",
    body: "Message any client directly — click Message on their profile and you'll land straight in that conversation.",
    accent: "bg-pink-50 text-pink-700",
    route: "/therapist/messages",
    targetTour: "/therapist/messages",
  },
  {
    Icon: ClipboardList,
    title: "Community Groups",
    body: "Create and moderate peer support spaces for your clients — pin what matters, moderate discussion.",
    accent: "bg-teal-50 text-teal-700",
    route: "/therapist/community",
    targetTour: "/therapist/community",
  },
  {
    Icon: BarChart3,
    title: "Analytics",
    body: "Engagement trends and treatment outcomes across your whole caseload, in one dashboard.",
    accent: "bg-violet-50 text-violet-700",
    route: "/therapist/analytics",
    targetTour: "/therapist/analytics",
  },
];

const CONFETTI_COLORS = ["#52B788", "#FBBF24", "#F4A261", "#7AACBE", "#D4A5A5", "#2D6A4F"];

type ConfettiPiece = { id: number; left: number; delay: number; duration: number; color: string; rotate: number; size: number };

function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: 42 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 1.4,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.round(Math.random() * 360),
        size: 6 + Math.random() * 6,
      }))
    );
  }, []);

  return (
    <div className="fixed inset-0 z-[210] pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-[-12px] rounded-sm animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.4,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function OnboardingTour() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<Phase>("welcome");
  const [tourIndex, setTourIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const steps = THERAPIST_TOUR;
  const totalSteps = steps.length + 2; // welcome + tour steps + finish
  const currentStepNumber = phase === "welcome" ? 1 : phase === "finish" ? totalSteps : tourIndex + 2;

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.name) setName(d.user.name.split(" ")[0]);
        if (d.user && d.user.hasOnboarded === false) setVisible(true);
      })
      .catch(() => {});
  }, []);

  // Navigate the real app to match the active tour step
  useEffect(() => {
    if (!visible || phase !== "tour") return;
    router.push(steps[tourIndex].route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, phase, tourIndex]);

  const finish = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setVisible(false);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasOnboarded: true }),
      });
    } finally {
      setSaving(false);
    }
  }, [saving]);

  const goFinish = useCallback(() => setPhase("finish"), []);

  const next = useCallback(() => {
    if (phase === "welcome") { setPhase("tour"); setTourIndex(0); return; }
    if (phase === "tour") {
      if (tourIndex >= steps.length - 1) { goFinish(); return; }
      setTourIndex((i) => i + 1);
      return;
    }
    finish();
  }, [phase, tourIndex, steps.length, goFinish, finish]);

  const back = useCallback(() => {
    if (phase === "finish") { setPhase("tour"); setTourIndex(steps.length - 1); return; }
    if (phase === "tour") {
      if (tourIndex === 0) { setPhase("welcome"); return; }
      setTourIndex((i) => i - 1);
    }
  }, [phase, tourIndex, steps.length]);

  // Keep the spotlight glued to its target through layout shifts (sidebar collapse, resize, etc.)
  // and let clicking the highlighted nav item itself advance the tour.
  useEffect(() => {
    if (!visible || phase !== "tour") return;
    const targetSelector = steps[tourIndex].targetTour;

    function measure() {
      const el = document.querySelector<HTMLElement>(`[data-tour="${targetSelector}"]`);
      // offsetParent is null for display:none elements (e.g. the sidebar is desktop-only) —
      // skip the spotlight rather than drawing a broken 0x0 highlight box.
      const isVisible = el && el.offsetParent !== null;
      setRect(isVisible ? el.getBoundingClientRect() : null);
    }
    measure();
    const interval = setInterval(measure, 250);
    window.addEventListener("resize", measure);

    const el = document.querySelector<HTMLElement>(`[data-tour="${targetSelector}"]`);
    el?.addEventListener("click", next);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", measure);
      el?.removeEventListener("click", next);
    };
  }, [visible, phase, tourIndex, steps, next]);

  useEffect(() => {
    if (!visible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") back();
      if (e.key === "Escape") finish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, next, back, finish]);

  if (!visible) return null;

  const current = phase === "tour" ? steps[tourIndex] : null;

  return (
    <>
      {/* ── Bookend phases: welcome / finish — full centered card ── */}
      {(phase === "welcome" || phase === "finish") && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-tour-fade-in" />
          {phase === "finish" && <Confetti />}

          <div key={phase} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-tour-panel-in">
            <button onClick={finish} className="absolute top-4 right-4 z-10 text-xs font-medium text-stone-400 hover:text-stone-700 transition-colors">
              Skip
            </button>

            <div className="px-6 pt-10 pb-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-sage-50 flex items-center justify-center mx-auto mb-5 animate-tour-icon-pop">
                {phase === "welcome" ? (
                  <span className="text-3xl">🌿</span>
                ) : (
                  <PartyPopper size={28} className="text-sage-700" strokeWidth={1.5} />
                )}
              </div>
              <h2 className="text-xl font-bold text-stone-900">
                {phase === "welcome" ? (name ? `Welcome, ${name}!` : "Welcome!") : "You're all set!"}
              </h2>
              <p className="text-sm text-stone-500 mt-2 leading-relaxed">
                {phase === "welcome"
                  ? "Let's take a quick, hands-on tour of your therapist portal — we'll walk through the real pages together."
                  : "You know your way around now. Your clients are waiting — let's get to work."}
              </p>
            </div>

            <div className="px-6 pb-6 pt-2">
              <button
                onClick={phase === "welcome" ? next : finish}
                disabled={saving}
                className="w-full bg-sage-700 hover:bg-sage-800 text-white font-semibold text-sm py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {phase === "welcome" ? (
                  <>Take the tour <ChevronRight size={15} /></>
                ) : "Enter my portal"}
              </button>
              {phase === "finish" && (
                <button onClick={back} className="w-full text-xs text-stone-400 hover:text-stone-600 mt-3 transition-colors">
                  ← Back to the tour
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tour phase: spotlight the real nav + floating guide panel ── */}
      {phase === "tour" && current && (
        <>
          {rect && (
            <>
              <div
                className="fixed z-[201] rounded-xl pointer-events-none transition-all duration-300 ease-out"
                style={{
                  top: rect.top - 6,
                  left: rect.left - 6,
                  width: rect.width + 12,
                  height: rect.height + 12,
                  boxShadow: "0 0 0 3000px rgba(28,25,23,0.55)",
                }}
              />
              <div
                className="fixed z-[202] rounded-xl border-2 border-sage-400 pointer-events-none transition-all duration-300 ease-out animate-tour-pulse"
                style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
              />
            </>
          )}

          <div
            key={tourIndex}
            className="fixed z-[203] bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden animate-tour-panel-in"
          >
            <div className="h-1 bg-stone-100">
              <div
                className="h-full bg-sage-600 transition-all duration-500 ease-out"
                style={{ width: `${(currentStepNumber / totalSteps) * 100}%` }}
              />
            </div>
            <div className="p-5">
              <div className="flex items-start gap-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 animate-tour-icon-pop ${current.accent}`}>
                  <current.Icon size={20} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
                    Step {currentStepNumber} of {totalSteps}
                  </p>
                  <h3 className="text-sm font-bold text-stone-900 mt-0.5">{current.title}</h3>
                </div>
              </div>
              <p className="text-sm text-stone-500 mt-3 leading-relaxed">{current.body}</p>

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={back}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors flex-shrink-0"
                  aria-label="Back"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={next}
                  className="flex-1 bg-sage-700 hover:bg-sage-800 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  {tourIndex >= steps.length - 1 ? "Finish" : "Next"} <ChevronRight size={15} />
                </button>
                <button onClick={finish} className="text-xs font-medium text-stone-400 hover:text-stone-700 transition-colors flex-shrink-0 px-1">
                  Skip
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
