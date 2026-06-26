"use client";

import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import type { Mission } from "@/lib/mockData";

// ── Main modal ────────────────────────────────────────────────────────────────

export default function TaskActivityModal({
  mission,
  onComplete,
  onClose,
}: {
  mission: Mission;
  onComplete: (id: string) => void;
  onClose: () => void;
}) {
  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function done() {
    onComplete(mission.id);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-50 flex items-start justify-between px-6 pt-6 pb-4 rounded-t-3xl sm:rounded-t-3xl">
          <div className="flex-1 pr-4">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1">
              {mission.assignedBy} · {mission.duration}
            </p>
            <h2 className="text-lg font-bold text-stone-900 leading-tight">{mission.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-all flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Activity body */}
        <div className="px-6 pb-8 pt-5">
          <ActivityContent mission={mission} onDone={done} />
        </div>
      </div>
    </div>
  );
}

// ── Activity router ───────────────────────────────────────────────────────────

function ActivityContent({ mission, onDone }: { mission: Mission; onDone: () => void }) {
  switch (mission.id) {
    case "dm2": return <GratitudeActivity onDone={onDone} />;
    case "dm5": return <ReflectionActivity onDone={onDone} />;
    case "dm3": return <BreathingActivity onDone={onDone} />;
    case "dm1": return <TimerActivity minutes={10} instruction="Sit comfortably, close your eyes, and focus on your breath." onDone={onDone} />;
    case "dm4": return <TimerActivity minutes={15} instruction="Walk at a comfortable pace. Notice 5 things you see, 4 you hear, 3 you can touch." onDone={onDone} />;
    case "dm6": return <SocialActivity onDone={onDone} />;
    default:    return <GenericActivity mission={mission} onDone={onDone} />;
  }
}

// ── Gratitude journal ─────────────────────────────────────────────────────────

function GratitudeActivity({ onDone }: { onDone: () => void }) {
  const [items, setItems] = useState(["", "", ""]);
  const filled = items.filter((s) => s.trim().length > 0).length;

  const placeholders = [
    "Something that made you smile today…",
    "Someone who helped or supported you…",
    "A small moment you appreciated…",
  ];

  function update(i: number, val: string) {
    setItems((prev) => prev.map((v, j) => (j === i ? val : v)));
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-stone-500 leading-relaxed">
        Write three things you're grateful for today — big or small. Gratitude practice
        rewires the brain toward positivity over time.
      </p>
      {items.map((item, i) => (
        <div key={i}>
          <label className="block text-xs font-semibold text-stone-500 mb-1.5">
            #{i + 1} — I'm grateful for…
          </label>
          <input
            type="text"
            value={item}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholders[i]}
            className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm bg-stone-50 focus:bg-white focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all"
          />
        </div>
      ))}
      <div className="pt-1">
        <div className="flex justify-between text-xs text-stone-400 mb-2">
          <span>{filled} of 3 filled</span>
          {filled === 3 && <span className="text-sage-600 font-medium">Ready to save ✓</span>}
        </div>
        <button
          onClick={onDone}
          disabled={filled < 3}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {filled < 3 ? `Add ${3 - filled} more to complete` : "Save & Complete ✓"}
        </button>
      </div>
    </div>
  );
}

// ── Evening reflection ────────────────────────────────────────────────────────

function ReflectionActivity({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const ready = wordCount >= 10;

  return (
    <div className="space-y-4">
      <div className="bg-stone-50 rounded-2xl px-4 py-3.5 border border-stone-100">
        <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1">
          Today's reflection prompt
        </p>
        <p className="text-sm text-stone-700 italic leading-relaxed">
          "What challenged me today, and how did I respond?"
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write freely — this is just for you…"
        rows={7}
        className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm bg-stone-50 focus:bg-white focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all resize-none leading-relaxed"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-stone-400">{wordCount} words</span>
        <button
          onClick={onDone}
          disabled={!ready}
          className="bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2.5 px-6 rounded-2xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {ready ? "Save & Complete ✓" : `Write a bit more…`}
        </button>
      </div>
    </div>
  );
}

// ── 4-7-8 Breathing ──────────────────────────────────────────────────────────

const PHASES = [
  { label: "Inhale",  seconds: 4, color: "#84a98c", instruction: "Breathe in slowly through your nose" },
  { label: "Hold",    seconds: 7, color: "#d4a574", instruction: "Hold your breath gently" },
  { label: "Exhale",  seconds: 8, color: "#7aacbe", instruction: "Breathe out fully through your mouth" },
];
const CYCLE = 4 + 7 + 8; // 19s
const TOTAL_ROUNDS = 2;
const TOTAL_TIME = CYCLE * TOTAL_ROUNDS; // 38s

function BreathingActivity({ onDone }: { onDone: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const started = elapsed > 0 || running;
  const done = elapsed >= TOTAL_TIME;

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

  const round = Math.min(Math.floor(elapsed / CYCLE) + 1, TOTAL_ROUNDS);
  const posInCycle = elapsed % CYCLE;
  const phaseIdx = posInCycle < 4 ? 0 : posInCycle < 11 ? 1 : 2;
  const phase = PHASES[phaseIdx];
  const phaseStart = [0, 4, 11][phaseIdx];
  const secondsInPhase = posInCycle - phaseStart;
  const secondsLeft = phase.seconds - secondsInPhase;
  const circleProgress = secondsInPhase / phase.seconds;
  const circumference = 2 * Math.PI * 44;

  if (done) {
    return (
      <div className="text-center py-6">
        <div className="w-20 h-20 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-sage-100">
          <Check size={30} className="text-sage-600" />
        </div>
        <h3 className="font-semibold text-stone-800 mb-1">Well done!</h3>
        <p className="text-sm text-stone-500 mb-6">You completed {TOTAL_ROUNDS} rounds of 4-7-8 breathing.</p>
        <button onClick={onDone} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">
          Mark Complete ✓
        </button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="text-center py-4">
        <div className="w-28 h-28 rounded-full border-2 border-stone-200 flex items-center justify-center mx-auto mb-5">
          <span className="text-5xl">🌬️</span>
        </div>
        <h3 className="font-semibold text-stone-800 mb-1">4-7-8 Breathing</h3>
        <p className="text-sm text-stone-500 mb-1.5">
          Inhale for 4 · Hold for 7 · Exhale for 8
        </p>
        <p className="text-xs text-stone-400 mb-7">{TOTAL_ROUNDS} rounds · {TOTAL_TIME} seconds total</p>
        <button
          onClick={() => setRunning(true)}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors"
        >
          Begin
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      {/* Circular progress */}
      <div className="relative w-36 h-36 mx-auto mb-5">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#e7e5e4" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="44" fill="none"
            stroke={phase.color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - circleProgress)}
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-stone-800 leading-none">{secondsLeft}</span>
          <span className="text-xs font-semibold text-stone-500 mt-1.5 uppercase tracking-wide">{phase.label}</span>
        </div>
      </div>

      <p className="text-sm text-stone-600 mb-1">{phase.instruction}</p>
      <p className="text-xs text-stone-400 mb-5">Round {round} of {TOTAL_ROUNDS}</p>

      <button
        onClick={() => setRunning((r) => !r)}
        className="w-full border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium py-2.5 rounded-2xl text-sm transition-colors"
      >
        {running ? "Pause" : "Resume"}
      </button>
    </div>
  );
}

// ── Timer (meditation + walk) ─────────────────────────────────────────────────

function TimerActivity({
  minutes,
  instruction,
  onDone,
}: {
  minutes: number;
  instruction: string;
  onDone: () => void;
}) {
  const totalSeconds = minutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const timerDone = secondsLeft === 0;
  const started = secondsLeft < totalSeconds || running;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { setRunning(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const progress = (totalSeconds - secondsLeft) / totalSeconds;
  const circumference = 2 * Math.PI * 44;
  const displayMin = Math.floor(secondsLeft / 60);
  const displaySec = secondsLeft % 60;

  return (
    <div className="text-center py-4">
      <div className="bg-stone-50 rounded-2xl px-4 py-3 mb-6 border border-stone-100">
        <p className="text-xs text-stone-500 leading-relaxed">{instruction}</p>
      </div>

      {/* Circular timer */}
      <div className="relative w-40 h-40 mx-auto mb-5">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#e7e5e4" strokeWidth="5" />
          <circle
            cx="50" cy="50" r="44" fill="none"
            stroke="#1c1917"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-mono font-bold text-stone-800">
            {String(displayMin).padStart(2, "0")}:{String(displaySec).padStart(2, "0")}
          </span>
          <span className="text-xs text-stone-400 mt-1.5">
            {timerDone ? "Finished!" : running ? "in progress" : started ? "paused" : `${minutes} min`}
          </span>
        </div>
      </div>

      {timerDone ? (
        <div>
          <p className="text-sm text-stone-600 mb-5">Time's up — great job! 🎉</p>
          <button onClick={onDone} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">
            Mark Complete ✓
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => setRunning((r) => !r)}
            className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors"
          >
            {running ? "Pause" : started ? "Resume" : "Start Timer"}
          </button>
          {started && (
            <button
              onClick={onDone}
              className="px-5 py-3 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-2xl text-sm font-medium transition-colors"
              title="Mark complete without finishing the timer"
            >
              Done Early
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Social check-in ───────────────────────────────────────────────────────────

function SocialActivity({ onDone }: { onDone: () => void }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-4">💌</div>
        <h3 className="font-semibold text-stone-800 mb-1.5">Message sent!</h3>
        <p className="text-sm text-stone-500 mb-7 leading-relaxed">
          Reaching out is a powerful act of self-care. You're nurturing your support network.
        </p>
        <button onClick={onDone} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">
          Mark Complete ✓
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500 leading-relaxed">
        Send a genuine message to someone in your support network. It can be short — even a
        "thinking of you" counts.
      </p>
      <div>
        <label className="block text-xs font-semibold text-stone-500 mb-1.5">Your message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hey, I've been thinking about you. How are you doing?"
          rows={5}
          className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm bg-stone-50 focus:bg-white focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all resize-none leading-relaxed"
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setSent(true)}
          disabled={message.trim().length < 5}
          className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          I sent it ✓
        </button>
        <button
          onClick={onDone}
          className="px-5 py-3 border border-stone-200 text-stone-500 hover:bg-stone-50 rounded-2xl text-sm font-medium transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// ── Generic fallback ──────────────────────────────────────────────────────────

function GenericActivity({ mission, onDone }: { mission: Mission; onDone: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="space-y-5">
      <div className="bg-stone-50 rounded-2xl px-4 py-4 border border-stone-100">
        <p className="text-sm text-stone-600 leading-relaxed">{mission.description}</p>
      </div>
      <label className="flex items-start gap-3 cursor-pointer group">
        <div
          onClick={() => setChecked((c) => !c)}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            checked ? "bg-stone-900 border-stone-900" : "border-stone-300 group-hover:border-stone-600"
          }`}
        >
          {checked && <Check size={10} strokeWidth={3} className="text-white" />}
        </div>
        <span className="text-sm text-stone-700">I have completed this task</span>
      </label>
      <button
        onClick={onDone}
        disabled={!checked}
        className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Mark Complete ✓
      </button>
    </div>
  );
}
