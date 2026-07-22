"use client";

import { useEffect, useRef, useState } from "react";
import { X, Check, ChevronLeft, RefreshCw } from "lucide-react";

type Mission = {
  id: string; title: string; description: string;
  category: string; duration: number | string; xp: number;
  completed?: boolean; dueTime?: string | null; assignedBy?: string; activityType?: string;
};

type OnDone = (data?: Record<string, unknown>) => void;

// ── Main modal ────────────────────────────────────────────────────────────────
export default function TaskActivityModal({ mission, onComplete, onClose }: {
  mission: Mission; onComplete: (id: string, responseData?: Record<string, unknown>) => void; onClose: () => void;
}) {
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  function done(data?: Record<string, unknown>) { onComplete(mission.id, data); onClose(); }
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={handleBackdrop}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-stone-50 flex items-start justify-between px-6 pt-6 pb-4 rounded-t-3xl">
          <div className="flex-1 pr-4">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1">
              {mission.assignedBy ?? "YouMindo"} · {typeof mission.duration === "number" ? `${mission.duration} min` : mission.duration}
            </p>
            <h2 className="text-lg font-bold text-stone-900 leading-tight">{mission.title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-all flex-shrink-0">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 pb-8 pt-5">
          <ActivityContent mission={mission} onDone={done} />
        </div>
      </div>
    </div>
  );
}

// ── Activity router ───────────────────────────────────────────────────────────
function ActivityContent({ mission, onDone }: { mission: Mission; onDone: OnDone }) {
  const dur = typeof mission.duration === "number" ? mission.duration : parseInt(mission.duration as string) || 10;
  switch (mission.activityType) {
    case "gratitude":       return <GratitudeActivity onDone={onDone} />;
    case "reflection":      return <ReflectionActivity onDone={onDone} />;
    case "checkin":         return <CheckinActivity onDone={onDone} />;
    case "worry":           return <WorryActivity onDone={onDone} />;
    case "self_compassion": return <SelfCompassionActivity onDone={onDone} />;
    case "strength":        return <StrengthActivity onDone={onDone} />;
    case "values":          return <ValuesActivity onDone={onDone} />;
    case "breathing":       return <BreathingActivity onDone={onDone} />;
    case "timer":           return <TimerActivity minutes={dur} instruction={mission.description} onDone={onDone} />;
    case "walk":            return <WalkActivity minutes={dur} onDone={onDone} />;
    case "bodyscan":        return <BodyScanActivity onDone={onDone} />;
    case "social":          return <SocialActivity onDone={onDone} />;
    case "stretch":         return <StretchActivity onDone={onDone} />;
    default:                return <GenericActivity mission={mission} onDone={onDone} />;
  }
}

// ── Gratitude journal ─────────────────────────────────────────────────────────
const GRATITUDE_CHIPS = [
  { label: "People",   emoji: "👥" },
  { label: "Moments",  emoji: "✨" },
  { label: "Health",   emoji: "💪" },
  { label: "Nature",   emoji: "🌿" },
  { label: "Growth",   emoji: "📈" },
  { label: "Kindness", emoji: "❤️" },
];

function GratitudeActivity({ onDone }: { onDone: OnDone }) {
  const [items, setItems] = useState(["", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);
  const filled = items.filter((s) => s.trim().length > 0).length;
  const placeholders = [
    "Something that made you smile today…",
    "Someone who helped or supported you…",
    "A small moment you appreciated…",
  ];

  function update(i: number, val: string) {
    setItems((prev) => prev.map((v, j) => (j === i ? val : v)));
  }

  function addChip(chip: { label: string; emoji: string }) {
    const empty = items.findIndex((v) => !v.trim());
    if (empty === -1) return;
    update(empty, `${chip.emoji} ${chip.label}: `);
    setTimeout(() => inputRefs.current[empty]?.focus(), 0);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500 leading-relaxed">
        Write three things you&apos;re grateful for. Tap a chip for inspiration.
      </p>
      <div className="flex flex-wrap gap-2">
        {GRATITUDE_CHIPS.map((chip) => (
          <button key={chip.label} onClick={() => addChip(chip)}
            className="flex items-center gap-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-full text-xs font-medium text-stone-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all active:scale-95">
            {chip.emoji} {chip.label}
          </button>
        ))}
      </div>
      {items.map((item, i) => {
        const isDone = item.trim().length > 0;
        return (
          <div key={i} className={`rounded-2xl border-2 transition-all duration-300 ${isDone ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-stone-50"}`}>
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">#{i + 1} — I&apos;m grateful for…</label>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${isDone ? "bg-amber-400" : "bg-stone-200"}`}>
                <Check size={10} strokeWidth={3} className={isDone ? "text-white" : "text-stone-400"} />
              </div>
            </div>
            <input ref={(el) => { inputRefs.current[i] = el; }} type="text" value={item}
              onChange={(e) => update(i, e.target.value)} placeholder={placeholders[i]}
              className="w-full bg-transparent px-4 pb-3 pt-0.5 text-sm text-stone-700 placeholder-stone-300 focus:outline-none" />
          </div>
        );
      })}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`text-xl transition-all duration-300 ${i < filled ? "text-amber-400" : "text-stone-200"}`}>★</span>
            ))}
          </div>
          <span className="text-xs text-stone-400">{filled} of 3</span>
        </div>
        <button onClick={() => onDone({ items })} disabled={filled < 3}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          {filled < 3 ? `${3 - filled} more to go…` : "Save & Complete ✓"}
        </button>
      </div>
    </div>
  );
}

// ── Evening reflection ────────────────────────────────────────────────────────
const REFLECTION_PROMPTS = [
  "What challenged me today, and how did I respond?",
  "What am I proud of myself for today?",
  "What would I do differently if I could replay today?",
  "Who showed up for me today, and in what way?",
  "What emotion showed up most today, and what triggered it?",
];

const QUICK_MOODS = ["😞", "😕", "😐", "🙂", "😊"];

function ReflectionActivity({ onDone }: { onDone: OnDone }) {
  const [mood, setMood] = useState<number | null>(null);
  const [promptIdx, setPromptIdx] = useState(0);
  const [text, setText] = useState("");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const target = 20;
  const ready = mood !== null && wordCount >= target;
  const progress = Math.min(wordCount / target, 1);

  return (
    <div className="space-y-4">
      {/* Mood row */}
      <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">How are you feeling right now?</p>
        <div className="flex justify-around">
          {QUICK_MOODS.map((emoji, i) => (
            <button key={i} onClick={() => setMood(i)}
              className={`text-2xl transition-all duration-200 active:scale-90 ${mood === i ? "scale-125 drop-shadow-sm" : "opacity-50 hover:opacity-90 hover:scale-110"}`}>
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Rotating prompt */}
      <div className="bg-sage-50 rounded-2xl px-4 py-3 border border-sage-100 flex items-start gap-3">
        <p className="text-sm text-stone-700 italic leading-relaxed flex-1">&ldquo;{REFLECTION_PROMPTS[promptIdx]}&rdquo;</p>
        <button onClick={() => setPromptIdx((i) => (i + 1) % REFLECTION_PROMPTS.length)}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-sage-100 flex items-center justify-center hover:bg-sage-200 transition-colors mt-0.5" title="New prompt">
          <RefreshCw size={12} className="text-sage-700" />
        </button>
      </div>

      <textarea value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Write freely — this is just for you…" rows={6}
        className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm bg-stone-50 focus:bg-white focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all resize-none leading-relaxed" />

      {/* Word count bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-stone-400">
          <span>{wordCount} words</span>
          <span>{wordCount >= target ? "✓ enough to reflect" : `${target - wordCount} more words to go`}</span>
        </div>
        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${progress >= 1 ? "bg-sage-500" : "bg-stone-400"}`} style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <button onClick={() => onDone({ mood: mood !== null ? QUICK_MOODS[mood] : null, prompt: REFLECTION_PROMPTS[promptIdx], text })} disabled={!ready}
        className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        {mood === null ? "Pick a mood to start" : !ready ? "Keep writing…" : "Save & Complete ✓"}
      </button>
    </div>
  );
}

// ── Daily check-in ────────────────────────────────────────────────────────────
const CHECKIN_MOODS = [
  { emoji: "😞", label: "Very low" },
  { emoji: "😟", label: "Low" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😁", label: "Great" },
];
const BODY_OPTIONS = ["Stiff & tense", "Pretty normal", "Relaxed & good"];

function CheckinActivity({ onDone }: { onDone: OnDone }) {
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState(3);
  const [body, setBody] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const STEPS = 4;

  return (
    <div className="space-y-5">
      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: STEPS }).map((_, i) => (
          <div key={i} className={`rounded-full transition-all duration-300 ${i === step ? "w-5 h-2 bg-stone-900" : i < step ? "w-2 h-2 bg-stone-400" : "w-2 h-2 bg-stone-200"}`} />
        ))}
      </div>

      {/* Step 0: mood */}
      {step === 0 && (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-base font-semibold text-stone-800">How are you feeling today?</p>
            <p className="text-xs text-stone-400 mt-1">Tap the emoji that matches</p>
          </div>
          <div className="flex justify-between px-2">
            {CHECKIN_MOODS.map((m, i) => (
              <button key={i} onClick={() => { setMood(i); setTimeout(() => setStep(1), 320); }}
                className={`flex flex-col items-center gap-1.5 transition-all duration-200 active:scale-90 ${mood === i ? "scale-125" : "opacity-60 hover:opacity-100 hover:scale-110"}`}>
                <span className="text-4xl">{m.emoji}</span>
                <span className="text-[10px] text-stone-400 font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: energy */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-base font-semibold text-stone-800 mb-1">What&apos;s your energy level?</p>
            <p className="text-4xl font-bold text-stone-900 tabular-nums">{energy}<span className="text-stone-400 text-xl">/5</span></p>
            <p className="text-sm text-stone-400 mt-1">{["Drained", "Low", "Moderate", "Good", "Energised"][energy - 1]}</p>
          </div>
          <input type="range" min={1} max={5} step={1} value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full h-2 accent-stone-900 cursor-pointer" />
          <div className="flex justify-between text-[10px] text-stone-400 px-1">
            <span>Drained</span><span>Energised</span>
          </div>
          <button onClick={() => setStep(2)} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">Next →</button>
          <button onClick={() => setStep(0)} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 mx-auto transition-colors"><ChevronLeft size={12} /> Back</button>
        </div>
      )}

      {/* Step 2: body */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-base font-semibold text-stone-800">How does your body feel?</p>
            <p className="text-xs text-stone-400 mt-1">Tune in for a moment</p>
          </div>
          <div className="space-y-2.5">
            {BODY_OPTIONS.map((opt) => (
              <button key={opt} onClick={() => { setBody(opt); setTimeout(() => setStep(3), 300); }}
                className={`w-full px-4 py-3.5 rounded-2xl text-sm font-medium border-2 transition-all text-left ${body === opt ? "bg-stone-900 text-white border-stone-900" : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"}`}>
                {opt}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 mx-auto transition-colors"><ChevronLeft size={12} /> Back</button>
        </div>
      )}

      {/* Step 3: note */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-base font-semibold text-stone-800">Anything on your mind?</p>
            <p className="text-xs text-stone-400 mt-1">Optional — one thought or intention</p>
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="One thought, feeling, or intention for today…" rows={4}
            className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm bg-stone-50 focus:bg-white focus:outline-none focus:border-sage-400 transition-all resize-none" />
          <button onClick={() => onDone({ mood: mood !== null ? CHECKIN_MOODS[mood].label : null, energy, body, note })} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">Complete Check-in ✓</button>
          <button onClick={() => onDone({ mood: mood !== null ? CHECKIN_MOODS[mood].label : null, energy, body, note, skipped: true })} className="w-full text-xs text-stone-400 hover:text-stone-600 transition-colors py-1">Skip &amp; complete</button>
          <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 mx-auto transition-colors"><ChevronLeft size={12} /> Back</button>
        </div>
      )}
    </div>
  );
}

// ── Worry journal ─────────────────────────────────────────────────────────────
const CONTROL_OPTIONS = [
  { label: "Yes — it&apos;s in my control",  value: "yes",     style: "border-sage-200 text-sage-800 bg-sage-50" },
  { label: "Partially in my control",         value: "partial", style: "border-amber-200 text-amber-800 bg-amber-50" },
  { label: "Out of my control",               value: "no",      style: "border-red-200 text-red-700 bg-red-50" },
];

function WorryActivity({ onDone }: { onDone: OnDone }) {
  const [step, setStep]       = useState(0);
  const [worry, setWorry]     = useState("");
  const [control, setControl] = useState<string | null>(null);
  const [action, setAction]   = useState("");
  const worryWords = worry.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Step pills */}
      <div className="flex gap-2">
        {["Name it", "Reality check", "Take action"].map((label, i) => (
          <div key={i} className={`flex-1 text-center text-[10px] font-semibold py-1 rounded-full transition-all ${i === step ? "bg-stone-900 text-white" : i < step ? "bg-stone-200 text-stone-600" : "bg-stone-100 text-stone-300"}`}>
            {label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-stone-500 leading-relaxed">Writing your worry out helps your brain process it as something real and manageable — not a looming cloud.</p>
          <textarea value={worry} onChange={(e) => setWorry(e.target.value)}
            placeholder="What's worrying me right now is…" rows={5}
            className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm bg-stone-50 focus:bg-white focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all resize-none" />
          <button onClick={() => setStep(1)} disabled={worryWords < 3}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            Next →
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Your worry</p>
            <p className="text-sm text-stone-700 italic">&ldquo;{worry.slice(0, 100)}{worry.length > 100 ? "…" : ""}&rdquo;</p>
          </div>
          <p className="text-sm font-semibold text-stone-800">Is this in your control?</p>
          <div className="space-y-2">
            {CONTROL_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => { setControl(opt.value); setTimeout(() => setStep(2), 300); }}
                className={`w-full px-4 py-3 rounded-2xl text-sm font-medium border-2 transition-all text-left ${control === opt.value ? opt.style : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"}`}>
                {opt.label.replace(/&apos;/g, "'")}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(0)} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 mx-auto transition-colors"><ChevronLeft size={12} /> Back</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3">
            <p className="text-sm text-stone-600 leading-relaxed">
              {control === "no"
                ? "Since this is outside your control, focus on releasing it. What's one self-care act you can do right now?"
                : "Great — it's at least partly in your hands. What's one small, concrete step you can take today?"}
            </p>
          </div>
          <textarea value={action} onChange={(e) => setAction(e.target.value)}
            placeholder={control === "no" ? "e.g. Take a walk, call a friend, rest…" : "e.g. Send that email, make the call, plan it out…"}
            rows={4}
            className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm bg-stone-50 focus:bg-white focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all resize-none" />
          <button onClick={() => onDone({ worry, control, action })} disabled={action.trim().length < 3}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            I&apos;ve got a plan ✓
          </button>
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 mx-auto transition-colors"><ChevronLeft size={12} /> Back</button>
        </div>
      )}
    </div>
  );
}

// ── Self-compassion break ─────────────────────────────────────────────────────
function SelfCompassionActivity({ onDone }: { onDone: OnDone }) {
  const [step, setStep]           = useState(0);
  const [pain, setPain]           = useState("");
  const [affirmed, setAffirmed]   = useState(false);
  const [kindWords, setKindWords] = useState("");
  const kindWordCount = kindWords.trim().split(/\s+/).filter(Boolean).length;

  const ICONS = ["💙", "🤝", "💌"];
  const TITLES = ["Acknowledge", "Common Humanity", "Self-Kindness"];

  return (
    <div className="space-y-4">
      {/* Step header */}
      <div className="flex gap-2">
        {TITLES.map((t, i) => (
          <div key={i} className={`flex-1 text-center text-[10px] font-semibold py-1 rounded-full transition-all ${i === step ? "bg-stone-900 text-white" : i < step ? "bg-stone-200 text-stone-600" : "bg-stone-100 text-stone-300"}`}>{t}</div>
        ))}
      </div>

      <div className="text-center pt-1">
        <span className="text-4xl">{ICONS[step]}</span>
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-stone-500 text-center leading-relaxed">Name what&apos;s hurting. You can&apos;t heal what you don&apos;t acknowledge.</p>
          <textarea value={pain} onChange={(e) => setPain(e.target.value)}
            placeholder="Right now I'm struggling with…" rows={4}
            className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm bg-stone-50 focus:bg-white focus:outline-none focus:border-sage-400 transition-all resize-none" />
          <button onClick={() => setStep(1)} disabled={pain.trim().length < 5}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 transition-colors">Next →</button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 space-y-3">
            <p className="text-sm text-stone-700 leading-relaxed">Struggle is part of the shared human experience. You are not alone in this.</p>
            <p className="text-sm text-stone-500 italic leading-relaxed">&ldquo;Just like me, many others are facing this kind of pain right now. My suffering connects me to all of humanity.&rdquo;</p>
            <button onClick={() => setAffirmed(true)}
              className={`w-full py-2.5 rounded-2xl text-sm font-medium border-2 transition-all ${affirmed ? "bg-sage-50 border-sage-300 text-sage-800" : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"}`}>
              {affirmed ? "✓ I receive this" : "I receive this"}
            </button>
          </div>
          <button onClick={() => setStep(2)} disabled={!affirmed}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 transition-colors">Next →</button>
          <button onClick={() => setStep(0)} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 mx-auto transition-colors"><ChevronLeft size={12} /> Back</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-stone-500 text-center leading-relaxed">What would you say to a close friend going through exactly this?</p>
          <textarea value={kindWords} onChange={(e) => setKindWords(e.target.value)}
            placeholder="Dear friend, I see you're having a hard time. I want you to know…" rows={5}
            className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm bg-stone-50 focus:bg-white focus:outline-none focus:border-sage-400 transition-all resize-none" />
          <div className="flex justify-between text-xs text-stone-400">
            <span>{kindWordCount} words</span>
            {kindWordCount >= 10 && <span className="text-sage-600">✓ Beautiful</span>}
          </div>
          <button onClick={() => onDone({ pain, kindWords })} disabled={kindWordCount < 5}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 transition-colors">Complete ✓</button>
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 mx-auto transition-colors"><ChevronLeft size={12} /> Back</button>
        </div>
      )}
    </div>
  );
}

// ── Strength spotting ─────────────────────────────────────────────────────────
const STRENGTHS = [
  { id: "courage",      label: "Courage",           emoji: "🦁" },
  { id: "creativity",   label: "Creativity",         emoji: "🎨" },
  { id: "kindness",     label: "Kindness",           emoji: "❤️" },
  { id: "curiosity",    label: "Curiosity",          emoji: "🔍" },
  { id: "honesty",      label: "Honesty",            emoji: "🤝" },
  { id: "humour",       label: "Humour",             emoji: "😄" },
  { id: "perseverance", label: "Perseverance",       emoji: "💪" },
  { id: "gratitude",    label: "Gratitude",          emoji: "🙏" },
  { id: "leadership",   label: "Leadership",         emoji: "⭐" },
  { id: "teamwork",     label: "Teamwork",           emoji: "🤜" },
  { id: "wisdom",       label: "Wisdom",             emoji: "🦉" },
  { id: "hope",         label: "Hope",               emoji: "🌅" },
  { id: "fairness",     label: "Fairness",           emoji: "⚖️" },
  { id: "forgiveness",  label: "Forgiveness",        emoji: "🕊️" },
  { id: "self-control", label: "Self-Control",       emoji: "🧘" },
  { id: "zest",         label: "Zest",               emoji: "⚡" },
];

function StrengthActivity({ onDone }: { onDone: OnDone }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500 leading-relaxed">Which strengths did you use today? Tap all that apply.</p>
      <div className="grid grid-cols-4 gap-2">
        {STRENGTHS.map((s) => {
          const on = selected.has(s.id);
          return (
            <button key={s.id} onClick={() => toggle(s.id)}
              className={`flex flex-col items-center gap-1 py-3 px-1 rounded-2xl border-2 text-center transition-all active:scale-95 ${on ? "border-stone-900 bg-stone-900" : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-stone-100"}`}>
              <span className="text-xl">{s.emoji}</span>
              <span className={`text-[9px] font-semibold leading-tight ${on ? "text-white" : "text-stone-500"}`}>{s.label}</span>
            </button>
          );
        })}
      </div>
      {selected.size > 0 && (
        <div className="bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-stone-500">
            Today you showed: <span className="font-semibold text-stone-800">{[...selected].map((id) => STRENGTHS.find((s) => s.id === id)?.label).join(", ")}</span>
          </p>
        </div>
      )}
      <button onClick={() => onDone({ strengths: [...selected].map((id) => STRENGTHS.find((s) => s.id === id)?.label) })} disabled={selected.size === 0}
        className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        {selected.size === 0 ? "Select at least one strength" : `I showed ${selected.size} strength${selected.size > 1 ? "s" : ""} today ✓`}
      </button>
    </div>
  );
}

// ── Values clarification ──────────────────────────────────────────────────────
const VALUES = [
  { id: "freedom",       label: "Freedom",       emoji: "🗽" },
  { id: "connection",    label: "Connection",    emoji: "🔗" },
  { id: "growth",        label: "Growth",        emoji: "🌱" },
  { id: "health",        label: "Health",        emoji: "💚" },
  { id: "family",        label: "Family",        emoji: "🏠" },
  { id: "creativity",    label: "Creativity",    emoji: "🎨" },
  { id: "service",       label: "Service",       emoji: "🤲" },
  { id: "security",      label: "Security",      emoji: "🛡️" },
  { id: "achievement",   label: "Achievement",   emoji: "🏆" },
  { id: "adventure",     label: "Adventure",     emoji: "🌍" },
  { id: "authenticity",  label: "Authenticity",  emoji: "💎" },
  { id: "balance",       label: "Balance",       emoji: "⚖️" },
  { id: "compassion",    label: "Compassion",    emoji: "❤️" },
  { id: "courage",       label: "Courage",       emoji: "🦁" },
  { id: "gratitude",     label: "Gratitude",     emoji: "🙏" },
  { id: "integrity",     label: "Integrity",     emoji: "⭐" },
  { id: "justice",       label: "Justice",       emoji: "⚖️" },
  { id: "love",          label: "Love",          emoji: "💕" },
  { id: "mindfulness",   label: "Mindfulness",   emoji: "🧘" },
  { id: "wisdom",        label: "Wisdom",        emoji: "🦉" },
];
const MAX_VALUES = 3;

function ValuesActivity({ onDone }: { onDone: OnDone }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reflection, setReflection] = useState("");

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      if (next.size >= MAX_VALUES) return prev;
      next.add(id);
      return next;
    });
  }

  const done = selected.size === MAX_VALUES;

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500 leading-relaxed">
        Pick your top <strong>3 values</strong> — the things that matter most to you right now.{" "}
        <span className="text-stone-400">({MAX_VALUES - selected.size} left)</span>
      </p>
      <div className="grid grid-cols-4 gap-2">
        {VALUES.map((v) => {
          const on = selected.has(v.id);
          const locked = !on && selected.size >= MAX_VALUES;
          return (
            <button key={v.id} onClick={() => toggle(v.id)} disabled={locked}
              className={`flex flex-col items-center gap-1 py-3 px-1 rounded-2xl border-2 text-center transition-all active:scale-95 ${on ? "border-stone-900 bg-stone-900" : locked ? "border-stone-100 bg-stone-50 opacity-30 cursor-not-allowed" : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-stone-100"}`}>
              <span className="text-xl">{v.emoji}</span>
              <span className={`text-[9px] font-semibold leading-tight ${on ? "text-white" : "text-stone-500"}`}>{v.label}</span>
            </button>
          );
        })}
      </div>

      {done && (
        <div className="space-y-3">
          <div className="bg-sage-50 border border-sage-100 rounded-2xl px-4 py-3">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Your top 3 values</p>
            <p className="text-sm font-semibold text-stone-800">
              {[...selected].map((id) => VALUES.find((v) => v.id === id)?.label).join(" · ")}
            </p>
          </div>
          <textarea value={reflection} onChange={(e) => setReflection(e.target.value)}
            placeholder="Why these three? How well are you living by them today? (optional)"
            rows={3}
            className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm bg-stone-50 focus:bg-white focus:outline-none focus:border-sage-400 transition-all resize-none" />
        </div>
      )}

      <button onClick={() => onDone({ values: [...selected].map((id) => VALUES.find((v) => v.id === id)?.label), reflection })} disabled={!done}
        className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        {!done ? `Choose ${MAX_VALUES - selected.size} more…` : "Save My Values ✓"}
      </button>
    </div>
  );
}

// ── 4-7-8 Breathing with animated orb ────────────────────────────────────────
const PHASES = [
  { label: "Inhale",  seconds: 4, color: "#84a98c", instruction: "Breathe in slowly through your nose" },
  { label: "Hold",    seconds: 7, color: "#d4a574", instruction: "Hold your breath gently" },
  { label: "Exhale",  seconds: 8, color: "#7aacbe", instruction: "Breathe out fully through your mouth" },
];
const CYCLE = 4 + 7 + 8;
const TOTAL_ROUNDS = 2;
const TOTAL_TIME = CYCLE * TOTAL_ROUNDS;

function BreathingActivity({ onDone }: { onDone: OnDone }) {
  const [elapsed, setElapsed]   = useState(0);
  const [running, setRunning]   = useState(false);
  const [orbScale, setOrbScale] = useState(0.55);
  const [orbTransition, setOrbTransition] = useState("none");
  const started = elapsed > 0 || running;
  const done    = elapsed >= TOTAL_TIME;

  useEffect(() => {
    if (!running || done) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= TOTAL_TIME) { setRunning(false); return TOTAL_TIME; }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, done]);

  const round      = Math.min(Math.floor(elapsed / CYCLE) + 1, TOTAL_ROUNDS);
  const posInCycle = elapsed % CYCLE;
  const phaseIdx   = posInCycle < 4 ? 0 : posInCycle < 11 ? 1 : 2;
  const phase      = PHASES[phaseIdx];
  const phaseStart = [0, 4, 11][phaseIdx];
  const secondsLeft = phase.seconds - (posInCycle - phaseStart);

  // Update orb target scale when phase changes
  const prevPhaseRef = useRef(-1);
  useEffect(() => {
    if (!running) return;
    if (phaseIdx === prevPhaseRef.current) return;
    prevPhaseRef.current = phaseIdx;
    if (phaseIdx === 0) { setOrbTransition(`transform ${PHASES[0].seconds}s ease-in`); setOrbScale(1.35); }
    else if (phaseIdx === 1) { setOrbTransition("none"); }
    else { setOrbTransition(`transform ${PHASES[2].seconds}s ease-out`); setOrbScale(0.55); }
  }, [phaseIdx, running]);

  if (done) return (
    <div className="text-center py-6 space-y-4">
      <div className="w-20 h-20 bg-sage-50 border border-sage-100 rounded-full flex items-center justify-center mx-auto">
        <Check size={30} className="text-sage-600" />
      </div>
      <div>
        <h3 className="font-semibold text-stone-800">Well done!</h3>
        <p className="text-sm text-stone-500 mt-1">You completed {TOTAL_ROUNDS} rounds of 4-7-8 breathing.</p>
      </div>
      <button onClick={() => onDone({ roundsCompleted: TOTAL_ROUNDS })} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">Mark Complete ✓</button>
    </div>
  );

  if (!started) return (
    <div className="text-center py-4 space-y-5">
      <div className="w-32 h-32 rounded-full border-2 border-stone-200 flex items-center justify-center mx-auto">
        <span className="text-6xl">🌬️</span>
      </div>
      <div>
        <h3 className="font-semibold text-stone-800 mb-1">4-7-8 Breathing</h3>
        <p className="text-sm text-stone-500 mb-1">Inhale 4 · Hold 7 · Exhale 8</p>
        <p className="text-xs text-stone-400">{TOTAL_ROUNDS} rounds · {TOTAL_TIME}s total</p>
      </div>
      <button onClick={() => { prevPhaseRef.current = -1; setRunning(true); }}
        className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">Begin</button>
    </div>
  );

  return (
    <div className="text-center py-4 space-y-4">
      {/* Animated orb */}
      <div className="relative flex items-center justify-center" style={{ height: 180 }}>
        {/* Glow ring */}
        <div className="absolute rounded-full opacity-20 w-36 h-36"
          style={{ backgroundColor: phase.color, transform: `scale(${orbScale * 1.15})`, transition: orbTransition }} />
        {/* Orb */}
        <div className="w-36 h-36 rounded-full flex flex-col items-center justify-center"
          style={{ backgroundColor: phase.color + "28", border: `3px solid ${phase.color}`, transform: `scale(${orbScale})`, transition: orbTransition }}>
          <span className="text-4xl font-bold text-stone-800 tabular-nums leading-none">{secondsLeft}</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-600 mt-1">{phase.label}</span>
        </div>
      </div>
      <p className="text-sm text-stone-600">{phase.instruction}</p>
      <p className="text-xs text-stone-400">Round {round} of {TOTAL_ROUNDS}</p>
      <button onClick={() => setRunning((r) => !r)}
        className="w-full border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium py-2.5 rounded-2xl text-sm transition-colors">
        {running ? "Pause" : "Resume"}
      </button>
    </div>
  );
}

// ── Meditation timer ──────────────────────────────────────────────────────────
const TIMER_TIPS = [
  "Notice your breath without trying to change it.",
  "If your mind wanders, gently return to now.",
  "Soften your shoulders and jaw.",
  "Each exhale is a chance to release tension.",
  "You don't need to clear your mind — just observe it.",
];

function TimerActivity({ minutes, instruction, onDone }: { minutes: number; instruction: string; onDone: OnDone }) {
  const totalSeconds = minutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [running, setRunning]         = useState(false);
  const [tipIdx, setTipIdx]           = useState(0);
  const [pulse, setPulse]             = useState(false);
  const timerDone = secondsLeft === 0;
  const started   = secondsLeft < totalSeconds || running;
  const progress  = (totalSeconds - secondsLeft) / totalSeconds;
  const circumference = 2 * Math.PI * 44;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => { if (s <= 1) { setRunning(false); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // Rotate tip every 30s
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTipIdx((i) => (i + 1) % TIMER_TIPS.length), 30000);
    return () => clearInterval(id);
  }, [running]);

  // Pulse ring every 4s (simulates breath)
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => { setPulse(true); setTimeout(() => setPulse(false), 2000); }, 4000);
    return () => clearInterval(id);
  }, [running]);

  const displayMin = Math.floor(secondsLeft / 60);
  const displaySec = secondsLeft % 60;

  return (
    <div className="text-center py-4 space-y-5">
      <div className="bg-stone-50 rounded-2xl px-4 py-3 border border-stone-100 text-left">
        <p className="text-xs text-stone-500 leading-relaxed">{instruction}</p>
      </div>

      {/* Timer with pulsing ring */}
      <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
        {/* Pulse ring */}
        <div className={`absolute inset-0 rounded-full border-2 border-stone-200 transition-all duration-[2000ms] ${pulse ? "scale-110 opacity-0" : "scale-100 opacity-100"}`} />
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#e7e5e4" strokeWidth="5" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="#1c1917" strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <div className="flex flex-col items-center justify-center">
          <span className="text-3xl font-mono font-bold text-stone-800">
            {String(displayMin).padStart(2, "0")}:{String(displaySec).padStart(2, "0")}
          </span>
          <span className="text-xs text-stone-400 mt-1">{timerDone ? "Finished!" : running ? "in progress" : started ? "paused" : `${minutes} min`}</span>
        </div>
      </div>

      {/* Rotating tip */}
      {running && (
        <div className="bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 min-h-[52px] flex items-center">
          <p className="text-xs text-stone-500 italic leading-relaxed w-full">&ldquo;{TIMER_TIPS[tipIdx]}&rdquo;</p>
        </div>
      )}

      {timerDone ? (
        <div className="space-y-3">
          <p className="text-sm text-stone-600">Time&apos;s up — great job! 🎉</p>
          <button onClick={() => onDone({ secondsSpent: totalSeconds })} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">Mark Complete ✓</button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button onClick={() => setRunning((r) => !r)} className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">
            {running ? "Pause" : started ? "Resume" : "Start Timer"}
          </button>
          {started && (
            <button onClick={() => onDone({ secondsSpent: totalSeconds - secondsLeft })} className="px-5 py-3 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-2xl text-sm font-medium transition-colors">Done Early</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Mindful walk + 5-4-3-2-1 ─────────────────────────────────────────────────
const SENSORY_ITEMS = [
  { sense: "👁️ See",   count: 5, prompts: ["A colour you love", "Something moving", "A pattern", "Something tiny", "Something far away"] },
  { sense: "👂 Hear",  count: 4, prompts: ["Background sounds", "Something close", "Something rhythmic", "Silence or near-silence"] },
  { sense: "✋ Touch",  count: 3, prompts: ["The ground beneath you", "Air on your skin", "Something in your pocket"] },
  { sense: "👃 Smell",  count: 2, prompts: ["Fresh air", "Any scent at all"] },
  { sense: "👅 Taste",  count: 1, prompts: ["Any taste in your mouth right now"] },
];

function WalkActivity({ minutes, onDone }: { minutes: number; onDone: OnDone }) {
  const totalSeconds = minutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [running, setRunning]         = useState(false);
  const [checked, setChecked]         = useState<Set<string>>(new Set());
  const started   = secondsLeft < totalSeconds || running;
  const timerDone = secondsLeft === 0;
  const totalItems = SENSORY_ITEMS.reduce((s, g) => s + g.count, 0);
  const allChecked = checked.size >= totalItems;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => { if (s <= 1) { setRunning(false); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  function toggleItem(key: string) {
    setChecked((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  }

  const displayMin = Math.floor(secondsLeft / 60);
  const displaySec = secondsLeft % 60;
  const canComplete = timerDone || (allChecked && started);

  return (
    <div className="space-y-4">
      {/* Compact timer */}
      <div className="flex items-center justify-between bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3">
        <div>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Walk timer</p>
          <p className="text-2xl font-mono font-bold text-stone-900 tabular-nums">
            {String(displayMin).padStart(2, "0")}:{String(displaySec).padStart(2, "0")}
          </p>
        </div>
        <button onClick={() => setRunning((r) => !r)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${running ? "bg-stone-200 text-stone-700" : "bg-stone-900 text-white hover:bg-stone-800"}`}>
          {running ? "Pause" : started ? "Resume" : "Start Walk"}
        </button>
      </div>

      {/* 5-4-3-2-1 grounding checklist */}
      <p className="text-sm font-semibold text-stone-700">5-4-3-2-1 Sensory Grounding</p>
      <p className="text-xs text-stone-400 -mt-2">Check off each thing as you notice it</p>

      <div className="space-y-3">
        {SENSORY_ITEMS.map((group) => (
          <div key={group.sense}>
            <p className="text-xs font-bold text-stone-500 mb-1.5">{group.sense}</p>
            <div className="space-y-1.5">
              {group.prompts.map((prompt, j) => {
                const key = `${group.sense}-${j}`;
                const done = checked.has(key);
                return (
                  <button key={key} onClick={() => toggleItem(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-[0.98] ${done ? "border-sage-200 bg-sage-50" : "border-stone-200 bg-stone-50 hover:bg-stone-100"}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${done ? "bg-sage-500 border-sage-500" : "border-stone-300"}`}>
                      {done && <Check size={10} strokeWidth={3} className="text-white" />}
                    </div>
                    <span className={`text-sm transition-colors ${done ? "text-stone-400 line-through" : "text-stone-700"}`}>{prompt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-1">
        <div className="flex justify-between text-xs text-stone-400 mb-2">
          <span>{checked.size}/{totalItems} noticed</span>
          {allChecked && <span className="text-sage-600 font-medium">All found ✓</span>}
        </div>
        <button onClick={() => onDone({ itemsNoticed: checked.size, secondsSpent: totalSeconds - secondsLeft })} disabled={!canComplete}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          {canComplete ? "Complete Walk ✓" : started ? "Keep walking…" : "Start your walk first"}
        </button>
      </div>
    </div>
  );
}

// ── Body scan ─────────────────────────────────────────────────────────────────
const BODY_REGIONS = [
  { id: "head",      label: "Head & Scalp",     emoji: "🧠", cue: "Notice any tension around your forehead, jaw, and scalp. Let your face soften." },
  { id: "eyes",      label: "Eyes & Face",       emoji: "👁️", cue: "Gently close your eyes. Release any tension around your cheeks and mouth." },
  { id: "neck",      label: "Neck & Throat",     emoji: "🦒", cue: "Let your neck lengthen. Relax any tightness in your throat." },
  { id: "shoulders", label: "Shoulders",         emoji: "🏋️", cue: "Let your shoulders drop away from your ears with each exhale." },
  { id: "arms",      label: "Arms & Hands",      emoji: "🤲", cue: "Feel the weight of your arms. Uncurl your fingers and let them rest." },
  { id: "chest",     label: "Chest",             emoji: "💓", cue: "Notice your breath moving through your chest. No need to change it." },
  { id: "belly",     label: "Belly",             emoji: "🌊", cue: "Let your belly soften and expand on each inhale. Release on exhale." },
  { id: "back",      label: "Lower Back & Hips", emoji: "🪑", cue: "Feel the support beneath you. Allow your lower back to relax." },
  { id: "legs",      label: "Legs",              emoji: "🦵", cue: "Scan from your thighs down. Let your leg muscles release." },
  { id: "feet",      label: "Feet",              emoji: "🦶", cue: "Feel the ground or surface beneath your feet. Root yourself here." },
];
const REGION_SECONDS = 20;

function BodyScanActivity({ onDone }: { onDone: OnDone }) {
  const [regionIdx, setRegionIdx] = useState(-1); // -1 = intro
  const [timeLeft, setTimeLeft]   = useState(REGION_SECONDS);
  const [running, setRunning]     = useState(false);
  const regionIdxRef = useRef(regionIdx);
  regionIdxRef.current = regionIdx;
  const allDone = regionIdx >= BODY_REGIONS.length;
  const region  = regionIdx >= 0 && !allDone ? BODY_REGIONS[regionIdx] : null;

  useEffect(() => {
    if (!running || allDone) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t > 1) return t - 1;
        const next = regionIdxRef.current + 1;
        if (next >= BODY_REGIONS.length) { setRunning(false); setRegionIdx(BODY_REGIONS.length); return 0; }
        setRegionIdx(next);
        return REGION_SECONDS;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, allDone]);

  const circumference = 2 * Math.PI * 28;
  const pct = regionIdx >= 0 ? Math.min(regionIdx / BODY_REGIONS.length, 1) : 0;

  if (allDone) return (
    <div className="text-center py-6 space-y-4">
      <div className="text-5xl">🕊️</div>
      <div>
        <h3 className="font-semibold text-stone-800 text-lg">Scan complete</h3>
        <p className="text-sm text-stone-500 mt-1">You&apos;ve visited every part of your body with kind attention.</p>
      </div>
      <button onClick={() => onDone({ regionsCompleted: BODY_REGIONS.length })} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">Mark Complete ✓</button>
    </div>
  );

  if (regionIdx === -1) return (
    <div className="space-y-5">
      <p className="text-sm text-stone-500 leading-relaxed text-center">
        Scan through 10 body regions, spending {REGION_SECONDS}s on each. Sit or lie comfortably.
      </p>
      <div className="bg-stone-50 border border-stone-100 rounded-2xl divide-y divide-stone-100">
        {BODY_REGIONS.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-base">{r.emoji}</span>
            <span className="text-sm text-stone-600 flex-1">{r.label}</span>
            <span className="text-xs text-stone-400">{REGION_SECONDS}s</span>
          </div>
        ))}
      </div>
      <button onClick={() => { setRegionIdx(0); setTimeLeft(REGION_SECONDS); setRunning(true); }}
        className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">
        Begin Body Scan
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Overall progress bar */}
      <div className="w-full bg-stone-100 rounded-full h-1.5">
        <div className="bg-stone-900 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct * 100}%` }} />
      </div>

      {/* Region pills */}
      <div className="flex flex-wrap gap-1 justify-center">
        {BODY_REGIONS.map((r, i) => (
          <span key={r.id} className={`text-base transition-all ${i < regionIdx ? "opacity-40" : i === regionIdx ? "opacity-100 scale-125" : "opacity-20"}`}>
            {r.emoji}
          </span>
        ))}
      </div>

      {/* Countdown ring + region */}
      <div className="text-center space-y-2">
        <div className="relative w-24 h-24 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#e7e5e4" strokeWidth="5" />
            <circle cx="32" cy="32" r="28" fill="none" stroke="#1c1917" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (timeLeft / REGION_SECONDS)}
              style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold font-mono text-stone-800 tabular-nums">{timeLeft}</span>
          </div>
        </div>
        <p className="text-base font-semibold text-stone-800">{region!.emoji} {region!.label}</p>
        <p className="text-sm text-stone-500 leading-relaxed max-w-xs mx-auto">{region!.cue}</p>
        <p className="text-xs text-stone-400">Region {regionIdx + 1} of {BODY_REGIONS.length}</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setRunning((r) => !r)}
          className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">
          {running ? "Pause" : "Resume"}
        </button>
        <button onClick={() => {
          const next = regionIdx + 1;
          if (next >= BODY_REGIONS.length) { setRunning(false); setRegionIdx(BODY_REGIONS.length); return; }
          setRegionIdx(next); setTimeLeft(REGION_SECONDS);
        }} className="px-5 py-3 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-2xl text-sm font-medium transition-colors">
          Skip
        </button>
      </div>
    </div>
  );
}

// ── Social check-in ───────────────────────────────────────────────────────────
const WHO_OPTIONS = ["Friend", "Family", "Partner", "Colleague", "Therapist"];
const MESSAGE_TEMPLATES = [
  "Hey, I've been thinking about you. How are you doing?",
  "Just wanted to check in and say I'm thinking of you. 💙",
  "It's been a while — I'd love to catch up soon.",
  "Sending you some love today. Hope you're doing well!",
];

function SocialActivity({ onDone }: { onDone: OnDone }) {
  const [who, setWho]         = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sent, setSent]       = useState(false);

  if (sent) return (
    <div className="text-center py-6 space-y-4">
      <div className="text-5xl">💌</div>
      <div>
        <h3 className="font-semibold text-stone-800">Message sent!</h3>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">Reaching out is a powerful act of self-care. You&apos;re nurturing your support network.</p>
      </div>
      <button onClick={() => onDone({ who, message })} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">Mark Complete ✓</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500 leading-relaxed">Send a genuine message to someone who matters. Even a short note counts.</p>

      {/* Who */}
      <div>
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Who will you reach out to?</p>
        <div className="flex flex-wrap gap-2">
          {WHO_OPTIONS.map((opt) => (
            <button key={opt} onClick={() => setWho(opt)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all active:scale-95 ${who === opt ? "bg-stone-900 text-white border-stone-900" : "bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300"}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Template chips */}
      <div>
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Quick templates</p>
        <div className="space-y-1.5">
          {MESSAGE_TEMPLATES.map((t) => (
            <button key={t} onClick={() => setMessage(t)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition-all ${message === t ? "border-stone-400 bg-stone-100" : "border-stone-200 bg-stone-50 hover:bg-stone-100"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <textarea value={message} onChange={(e) => setMessage(e.target.value)}
        placeholder="Or write your own message…" rows={4}
        className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm bg-stone-50 focus:bg-white focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all resize-none" />

      <div className="flex gap-3">
        <button onClick={() => setSent(true)} disabled={message.trim().length < 5}
          className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          I sent it ✓
        </button>
        <button onClick={() => onDone({ who, message, skipped: true })} className="px-5 py-3 border border-stone-200 text-stone-500 hover:bg-stone-50 rounded-2xl text-sm font-medium transition-colors">Skip</button>
      </div>
    </div>
  );
}

// ── Morning stretch ───────────────────────────────────────────────────────────
const STRETCH_STEPS = [
  { id: "neck-left",  label: "Neck Roll — Left",  cue: "Slowly tilt your left ear toward your left shoulder. Breathe into the stretch on the right side of your neck.", seconds: 20 },
  { id: "neck-mid",   label: "Back to Centre",    cue: "Gently return to centre. Take a slow, full breath.",                                                              seconds: 5  },
  { id: "neck-right", label: "Neck Roll — Right", cue: "Tilt your right ear toward your right shoulder. Hold and breathe steadily.",                                      seconds: 20 },
  { id: "shrug",      label: "Shoulder Shrugs",   cue: "Lift both shoulders up to your ears, hold 2 seconds, then let them drop. Repeat slowly.",                        seconds: 40 },
  { id: "fold",       label: "Forward Fold",      cue: "Feet hip-width apart. Slowly roll your spine forward and down — head and arms hanging heavy.",                    seconds: 30 },
  { id: "fold-hold",  label: "Hold & Breathe",    cue: "Stay here. With each exhale, release a little more. Soft knees. Let gravity do the work.",                       seconds: 25 },
] as const;

type StretchStepId = typeof STRETCH_STEPS[number]["id"];

function StretchFigure({ stepId, shrugUp }: { stepId: StretchStepId | "idle"; shrugUp: boolean }) {
  const headTilt     = stepId === "neck-left" ? -24 : stepId === "neck-right" ? 24 : 0;
  const shoulderShift = stepId === "shrug" && shrugUp ? -8 : 0;
  const folding      = stepId === "fold" || stepId === "fold-hold";
  const stroke = "#1c1917";
  const sw = 3.5;
  const shY = 57 + shoulderShift;
  return (
    <svg viewBox="0 0 100 162" aria-hidden
      style={{ width: 136, height: 192, display: "block", margin: "0 auto", overflow: "visible" }}>
      <line x1="50" y1="102" x2="33" y2="150" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <line x1="50" y1="102" x2="67" y2="150" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <g style={{ transformBox: "fill-box", transformOrigin: "50% 100%", transform: folding ? "rotate(82deg)" : "rotate(0deg)", transition: "transform 0.8s ease" }}>
        <line x1="50" y1="102" x2="50" y2={shY} stroke={stroke} strokeWidth={sw} strokeLinecap="round" style={{ transition: "all 0.4s ease" }} />
        <line x1="21" y1={shY} x2="79" y2={shY} stroke={stroke} strokeWidth={sw} strokeLinecap="round" style={{ transition: "all 0.4s ease" }} />
        <line x1="21" y1={shY} x2="8"  y2={shY + 28} stroke={stroke} strokeWidth={sw} strokeLinecap="round" style={{ transition: "all 0.4s ease" }} />
        <line x1="79" y1={shY} x2="92" y2={shY + 28} stroke={stroke} strokeWidth={sw} strokeLinecap="round" style={{ transition: "all 0.4s ease" }} />
        <line x1="50" y1={shY} x2="50" y2="37" stroke={stroke} strokeWidth={sw - 0.5} strokeLinecap="round" style={{ transition: "all 0.4s ease" }} />
        <g style={{ transformBox: "fill-box", transformOrigin: "50% 100%", transform: `rotate(${headTilt}deg)`, transition: "transform 0.6s ease" }}>
          <circle cx="50" cy="22" r="14" fill="white" stroke={stroke} strokeWidth={sw - 0.5} />
          <circle cx="44" cy="20" r="1.8" fill={stroke} />
          <circle cx="56" cy="20" r="1.8" fill={stroke} />
          <path d="M 44 27 Q 50 31 56 27" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

function StretchActivity({ onDone }: { onDone: OnDone }) {
  const [stepIdx, setStepIdx]   = useState(-1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning]   = useState(false);
  const [shrugUp, setShrugUp]   = useState(false);
  const stepIdxRef = useRef(stepIdx);
  stepIdxRef.current = stepIdx;

  const allDone = stepIdx >= STRETCH_STEPS.length;
  const step    = stepIdx >= 0 && !allDone ? STRETCH_STEPS[stepIdx] : null;
  const totalSeconds = STRETCH_STEPS.reduce((s, st) => s + st.seconds, 0);

  useEffect(() => {
    if (!running || allDone) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t > 1) return t - 1;
        const next = stepIdxRef.current + 1;
        if (next >= STRETCH_STEPS.length) { setRunning(false); setStepIdx(STRETCH_STEPS.length); return 0; }
        setStepIdx(next);
        return STRETCH_STEPS[next].seconds;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, allDone]);

  useEffect(() => {
    if (!running || step?.id !== "shrug") { setShrugUp(false); return; }
    const id = setInterval(() => setShrugUp((v) => !v), 1800);
    return () => clearInterval(id);
  }, [running, step?.id]);

  const completedS = STRETCH_STEPS.slice(0, Math.max(stepIdx, 0)).reduce((s, st) => s + st.seconds, 0) + (step ? step.seconds - timeLeft : 0);
  const pct = Math.min(completedS / totalSeconds, 1);

  function start() { setStepIdx(0); setTimeLeft(STRETCH_STEPS[0].seconds); setRunning(true); }
  function skipStep() {
    const next = stepIdxRef.current + 1;
    if (next >= STRETCH_STEPS.length) { setRunning(false); setStepIdx(STRETCH_STEPS.length); return; }
    setStepIdx(next); setTimeLeft(STRETCH_STEPS[next].seconds);
  }

  if (allDone) return (
    <div className="text-center py-6 space-y-4">
      <div className="w-20 h-20 bg-sage-50 border border-sage-100 rounded-full flex items-center justify-center mx-auto">
        <Check size={30} className="text-sage-600" />
      </div>
      <div>
        <h3 className="font-semibold text-stone-800 text-lg">Great stretch!</h3>
        <p className="text-sm text-stone-500 mt-1">You released the overnight tension.</p>
      </div>
      <button onClick={() => onDone({ stepsCompleted: STRETCH_STEPS.length })} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">Mark Complete ✓</button>
    </div>
  );

  if (stepIdx === -1) return (
    <div className="space-y-5">
      <div className="text-center pt-2">
        <StretchFigure stepId="idle" shrugUp={false} />
        <p className="text-sm text-stone-500 mt-4 leading-relaxed max-w-xs mx-auto">Follow the animated figure through each stretch. Total time: ~2.5 minutes.</p>
      </div>
      <div className="bg-stone-50 border border-stone-100 rounded-2xl divide-y divide-stone-100">
        {STRETCH_STEPS.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-300 flex-shrink-0" />
            <span className="text-stone-600 flex-1">{s.label}</span>
            <span className="text-stone-400">{s.seconds}s</span>
          </div>
        ))}
      </div>
      <button onClick={start} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">Start Stretching</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="w-full bg-stone-100 rounded-full h-1">
        <div className="bg-stone-900 h-1 rounded-full transition-all duration-1000" style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="flex gap-1.5 flex-wrap justify-center">
        {STRETCH_STEPS.map((s, i) => (
          <span key={s.id} className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${i < stepIdx ? "bg-stone-900 text-white" : i === stepIdx ? "bg-stone-200 text-stone-700 ring-1 ring-stone-300" : "bg-stone-100 text-stone-400"}`}>
            {s.label}
          </span>
        ))}
      </div>
      <div className="py-1">
        <StretchFigure stepId={step!.id} shrugUp={shrugUp} />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-stone-800">{step!.label}</p>
        <p className="text-xs text-stone-500 leading-relaxed">{step!.cue}</p>
      </div>
      <div className="flex items-center justify-center">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#e7e5e4" strokeWidth="5" />
            <circle cx="32" cy="32" r="28" fill="none" stroke="#1c1917" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (timeLeft / step!.seconds)}
              style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold font-mono text-stone-800 tabular-nums">{timeLeft}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setRunning((r) => !r)}
          className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">
          {running ? "Pause" : "Resume"}
        </button>
        <button onClick={skipStep} className="px-5 py-3 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-2xl text-sm font-medium transition-colors">Skip</button>
      </div>
    </div>
  );
}

// ── Generic fallback ──────────────────────────────────────────────────────────
function GenericActivity({ mission, onDone }: { mission: Mission; onDone: OnDone }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="space-y-5">
      <div className="bg-stone-50 rounded-2xl px-4 py-4 border border-stone-100">
        <p className="text-sm text-stone-600 leading-relaxed">{mission.description}</p>
      </div>
      <button onClick={() => setChecked((c) => !c)}
        className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 transition-all ${checked ? "border-stone-900 bg-stone-900" : "border-stone-200 bg-stone-50 hover:bg-stone-100"}`}>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? "bg-white border-white" : "border-stone-400"}`}>
          {checked && <Check size={12} strokeWidth={3} className="text-stone-900" />}
        </div>
        <span className={`text-sm font-medium ${checked ? "text-white" : "text-stone-700"}`}>
          {checked ? "Marked as done ✓" : "Mark as completed"}
        </span>
      </button>
      <button onClick={() => onDone({ completed: true })} disabled={!checked}
        className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        Complete ✓
      </button>
    </div>
  );
}
