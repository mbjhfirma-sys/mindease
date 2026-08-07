"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { MindoAvatar } from "@/components/dashboard/MindoAvatar";
import { MindoGreeting } from "@/components/dashboard/MindoGreeting";
import { useMindoAnimator } from "@/lib/mindo/useMindoAnimator";
import type { MindoState } from "@/lib/mindo/animation";

const STATES: { state: MindoState; label: string; description: string }[] = [
  { state: "idle", label: "Idle", description: "Relaxed neutral. Subtle float + breathing, natural blinking." },
  { state: "happy", label: "Happy", description: "Small smile, eyebrow lift, tiny settling bounce." },
  { state: "excited", label: "Excited", description: "Bigger smile, wider eyes, anticipation + jump." },
  { state: "thinking", label: "Thinking", description: "Eyes drift slightly up, subtle brow movement." },
  { state: "listening", label: "Listening", description: "Slight head tilt, attentive eyes." },
  { state: "curious", label: "Curious", description: "One eyebrow raised, tiny head tilt." },
  { state: "calm", label: "Calm", description: "Relaxed eyes, slow breathing, gentle floating." },
  { state: "encouraging", label: "Encouraging", description: "Warm smile with a small nod." },
  { state: "celebrating", label: "Celebrating", description: "Small jump, smile, sparkle burst, secondary bounce." },
  { state: "gentle", label: "Gentle", description: "Softer eyes, slightly lowered brows, sympathetic lean." },
  { state: "surprised", label: "Surprised", description: "Eyes widen briefly, eyebrows raise, then settles." },
  { state: "breathing", label: "Breathing", description: "Eyes closed, slow deep breathing cycle." },
];

export default function MindoAnimationDemoPage() {
  const mindo = useMindoAnimator("idle");
  const [greetingKey, setGreetingKey] = useState(0);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors mb-3">
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-stone-900">Mindo animation preview</h1>
        <p className="text-sm text-stone-500 mt-1">
          Internal review tool for the Mindo character animation system — not linked from navigation.
        </p>
      </div>

      {/* Primary interaction */}
      <section className="bg-white border border-stone-100 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-stone-800">Primary interaction</h2>
          <button
            onClick={() => setGreetingKey((k) => k + 1)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-700 hover:text-sage-800 transition-colors"
          >
            <RotateCcw size={12} /> Replay
          </button>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-7 max-w-sm mx-auto">
          <MindoGreeting key={greetingKey} textClassName="text-xl font-extrabold text-stone-900 mb-2" />
        </div>
      </section>

      {/* All states */}
      <section className="bg-white border border-stone-100 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-stone-800 mb-4">All states</h2>
        <div className="flex flex-col items-center gap-2 mb-6 py-4 bg-sage-50 rounded-xl">
          <MindoAvatar size="lg" state={mindo.state} replayKey={mindo.replayKey} />
          <span className="text-xs font-medium text-sage-700 uppercase tracking-widest mt-1">{mindo.state}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STATES.map((s) => (
            <button
              key={s.state}
              onClick={() => mindo.animate(s.state)}
              className={`text-left border rounded-xl px-3.5 py-2.5 transition-colors ${
                mindo.state === s.state
                  ? "border-sage-400 bg-sage-50"
                  : "border-stone-100 hover:border-stone-200 hover:bg-stone-50"
              }`}
            >
              <div className="text-sm font-semibold text-stone-800">{s.label}</div>
              <div className="text-xs text-stone-500 mt-0.5">{s.description}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
