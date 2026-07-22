"use client";

import Link from "next/link";
import { useState } from "react";

const steps = [
  {
    num: "1",
    title: "Start with an assessment",
    desc: "A quick check-in on where you're at helps shape a plan that actually fits you.",
  },
  {
    num: "2",
    title: "Get a personalized plan",
    desc: "Daily missions across mindfulness, movement, journaling, and more — matched to your goals.",
  },
  {
    num: "3",
    title: "Build momentum",
    desc: "Complete missions to earn XP, build streaks, and unlock achievements as you go.",
  },
  {
    num: "4",
    title: "Grow with support",
    desc: "If you're matched with a therapist, they can personalize your missions and track your progress over time.",
  },
];

const categories = [
  { icon: "🧘", label: "Mindfulness" },
  { icon: "🌿", label: "Movement" },
  { icon: "📔", label: "Journaling" },
  { icon: "🌬️", label: "Breathing" },
  { icon: "🤝", label: "Social" },
  { icon: "✅", label: "Habit" },
];

const highlights = [
  { icon: "🔥", title: "Streaks", desc: "Stay consistent and watch your daily streak grow — a simple, visible sign of progress." },
  { icon: "🏆", title: "Achievements", desc: "Unlock badges as you hit milestones, from your first mission to a 30-day streak." },
  { icon: "📈", title: "Progress tracking", desc: "Mood check-ins and journaling turn day-to-day effort into a picture of real change." },
  { icon: "📚", title: "Courses", desc: "Structured, multi-week programs that pair with your daily missions for deeper learning." },
];

const faqs = [
  {
    q: "Who assigns my missions?",
    a: "You start with a curated set of default missions based on your goals. If you're matched with a therapist, they can personalize your plan further.",
  },
  {
    q: "Do I need a therapist to use coaching features?",
    a: "No — courses, daily missions, and progress tracking are all available on their own, no therapist required.",
  },
  {
    q: "How much time does this take?",
    a: "Most daily missions take 5–20 minutes. You choose how much you take on each day.",
  },
];

export default function CoachingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Header */}
      <section className="py-20 px-6 bg-cream text-center">
        <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">Wellness Coaching</span>
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mt-2 mb-4">
          Build Habits That Actually Stick
        </h1>
        <p className="text-stone-500 text-lg max-w-xl mx-auto">
          Structured daily missions, courses, and progress tracking designed by mental health professionals — a practical, guided path to lasting change.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link
            href="/register"
            className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-full hover:bg-sage-800 transition-colors"
          >
            Start Building Better Habits
          </Link>
          <Link
            href="/pricing"
            className="bg-white text-stone-700 font-semibold px-8 py-3 rounded-full border border-stone-200 hover:border-sage-400 transition-colors"
          >
            See Plans
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2">From Plan to Progress</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-12 h-12 bg-sage-700 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-bold text-stone-900 mb-2 text-sm">{s.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">Mission Categories</span>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2 mb-10">Something for Every Part of Your Day</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((c) => (
              <div key={c.label} className="bg-white rounded-2xl p-5 border border-stone-100">
                <div className="text-2xl mb-2">{c.icon}</div>
                <div className="text-xs font-semibold text-stone-700">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">What Keeps You Going</span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2">Progress You Can See</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {highlights.map((f) => (
              <div key={f.title} className="flex items-start gap-4 bg-cream rounded-2xl p-6 border border-stone-100">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-stone-800 mb-1">{f.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaching vs therapy callout */}
      <section className="py-16 px-6 bg-cream">
        <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-3xl p-8 md:p-10 text-center">
          <div className="text-3xl mb-4">💡</div>
          <h2 className="text-xl font-bold text-stone-900 mb-3">Coaching vs. Therapy</h2>
          <p className="text-stone-500 text-sm leading-relaxed max-w-xl mx-auto">
            Wellness coaching focuses on building daily habits and structure. If you're working through a clinical concern like anxiety, depression, or trauma, our{" "}
            <Link href="/therapy" className="text-sage-700 font-semibold hover:underline">One-on-One Therapy</Link>{" "}
            connects you with a licensed professional instead.
          </p>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-5">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-amber-400 text-lg">★</span>
            ))}
          </div>
          <p className="text-stone-700 text-xl leading-relaxed mb-6 italic">
            "Self-compassion used to feel foreign to me. After building the habit day by day, I genuinely feel kinder to myself."
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center text-lg">👩🏾</div>
            <div className="text-left">
              <div className="text-sm font-semibold text-stone-800">Aisha N.</div>
              <div className="text-xs text-stone-400">Building Self-Compassion</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">FAQ</span>
            <h2 className="text-3xl font-bold text-stone-900 mt-2">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-sage-50 transition-colors"
                >
                  <span className="font-semibold text-stone-800 text-sm">{faq.q}</span>
                  <span className="text-sage-600 flex-shrink-0 text-lg">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-stone-500 text-sm leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-sage-700">
        <div className="max-w-2xl mx-auto text-center text-white">
          <div className="text-5xl mb-6">🌱</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Building Better Habits</h2>
          <p className="text-sage-200 text-lg mb-8 leading-relaxed">
            Free to start — no credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="bg-white text-sage-800 font-bold px-8 py-3 rounded-full hover:bg-sage-50 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="border border-sage-400 text-white font-semibold px-8 py-3 rounded-full hover:bg-sage-600 transition-colors"
            >
              Explore Plans
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
