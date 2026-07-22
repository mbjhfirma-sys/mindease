"use client";

import { useState, useRef } from "react";

interface Props {
  title: string;
  duration: string;
  audioUrl?: string | null;
  onComplete: () => void;
}

export default function AudioLesson({ title, duration, audioUrl, onComplete }: Props) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(0);
  const [completed, setCompleted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const progress = total > 0 ? elapsed / total : 0;

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else el.play();
  }

  function seekTo(pct: number) {
    const el = audioRef.current;
    if (!el || !total) return;
    el.currentTime = Math.max(0, Math.min(total, pct * total));
  }

  const chapters = [
    { label: "Opening settle & breath", at: "0:00" },
    { label: "Body relaxation", at: "2:00" },
    { label: "Deepening the practice", at: "5:00" },
    { label: "Core guidance", at: "10:00" },
    { label: "Integration & return", at: `${Math.max(parseInt(duration) - 2, 0)}:00` },
  ];

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="text-6xl mb-5">🎧</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Session complete</h3>
        <p className="text-stone-500 mb-2 text-sm">You listened to the full {duration} guided session.</p>
        <p className="text-stone-400 text-sm mb-8">Take a moment before moving on — notice how you feel in your body right now.</p>
        <button onClick={onComplete} className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sage-800 transition-colors">
          Continue →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">🎧</div>
        <div>
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Guided Audio</div>
          <h2 className="font-bold text-stone-800">{title}</h2>
        </div>
      </div>

      {/* Player card */}
      <div className="bg-gradient-to-b from-sage-800 to-sage-900 rounded-3xl p-8 text-white text-center mb-6">
        {/* Album art */}
        <div className={`w-28 h-28 bg-sage-600/50 rounded-full mx-auto flex items-center justify-center text-5xl mb-6 transition-all duration-300 ${playing ? "animate-pulse" : ""}`}>
          🧘
        </div>
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-sage-300 text-sm mb-6">{duration} · Guided session</p>

        {audioUrl ? (
          <>
            <audio
              ref={audioRef}
              src={audioUrl}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onLoadedMetadata={(e) => setTotal(e.currentTarget.duration)}
              onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
              onEnded={() => { setPlaying(false); setCompleted(true); }}
            />

            {/* Progress bar */}
            <div
              className="w-full bg-sage-600 rounded-full h-1.5 mb-2 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                seekTo((e.clientX - rect.left) / rect.width);
              }}
            >
              <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="flex justify-between text-xs text-sage-400 mb-6">
              <span>{formatTime(elapsed)}</span>
              <span>{total ? formatTime(total) : duration}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <button onClick={() => seekTo(Math.max(0, (elapsed - 10) / total))} className="text-sage-300 hover:text-white text-xl transition-colors">⏮</button>
              <button
                onClick={togglePlay}
                className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-sage-800 hover:scale-105 transition-all shadow-lg"
              >
                <span className="text-2xl ml-0.5">{playing ? "⏸" : "▶"}</span>
              </button>
              <button onClick={() => seekTo(Math.min(total, (elapsed + 10) / total))} className="text-sage-300 hover:text-white text-xl transition-colors">⏭</button>
            </div>
          </>
        ) : (
          <p className="text-sage-300 text-sm">Audio coming soon</p>
        )}
      </div>

      {/* Tips while listening */}
      <div className="bg-sage-50 border border-sage-100 rounded-2xl p-5 mb-5">
        <h4 className="font-semibold text-stone-700 text-sm mb-3">Prepare for your session:</h4>
        <ul className="space-y-2">
          {["Find a quiet, comfortable place to sit or lie down", "Use headphones if possible for the best experience", "Set a do-not-disturb on your phone", "Keep your eyes closed throughout"].map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-xs text-stone-500">
              <span className="text-sage-500 mt-0.5 flex-shrink-0">✦</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Chapter markers */}
      {audioUrl && (
        <div>
          <h4 className="font-semibold text-stone-700 text-sm mb-3">Session chapters:</h4>
          <div className="space-y-2">
            {chapters.map((c) => (
              <div key={c.label} className="flex items-center gap-3 text-sm">
                <span className="text-stone-400 text-xs w-12 flex-shrink-0">{c.at}</span>
                <div className="w-1.5 h-1.5 bg-sage-300 rounded-full flex-shrink-0" />
                <span className="text-stone-600">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onComplete} className="w-full mt-6 border border-stone-200 text-stone-500 text-sm py-2.5 rounded-xl hover:bg-stone-50 transition-colors">
        Mark as complete and continue →
      </button>
    </div>
  );
}
