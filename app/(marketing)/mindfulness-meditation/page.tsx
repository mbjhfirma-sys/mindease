"use client";

import Link from "next/link";
import { useState } from "react";

const practices = [
  {
    icon: "🎧",
    title: "Guided Meditations",
    desc: "80+ audio sessions from 5 to 45 minutes — breath awareness, body scans, loving-kindness, and sleep meditations for any moment of your day.",
    color: "bg-peach-100",
  },
  {
    icon: "🌬️",
    title: "Breathing Exercises",
    desc: "Evidence-based techniques like box breathing and 4-7-8 breathing to calm your nervous system in minutes, anywhere.",
    color: "bg-sage-100",
  },
  {
    icon: "📚",
    title: "Guided Courses",
    desc: "Structured, multi-week courses like Foundations of Mindfulness — video lessons, reflections, and hands-on practice exercises.",
    color: "bg-blue-50",
  },
  {
    icon: "🔥",
    title: "Daily Streaks",
    desc: "Short daily mindfulness missions that build into a sustainable habit, with progress tracking and gentle reminders.",
    color: "bg-amber-100",
  },
];

const steps = [
  {
    num: "1",
    title: "Pick a practice",
    desc: "Start with a 5-minute guided session or dive into a full course — whatever fits your day.",
  },
  {
    num: "2",
    title: "Build a daily habit",
    desc: "Complete short daily mindfulness missions and watch your streak grow, one day at a time.",
  },
  {
    num: "3",
    title: "Track your progress",
    desc: "See your calm build over time with mood check-ins and a full history of your practice.",
  },
];

const stats = [
  { value: "80+", label: "guided sessions" },
  { value: "120+", label: "courses & lessons" },
  { value: "98%", label: "feel calmer" },
];

const faqs = [
  {
    q: "Do I need any experience to start?",
    a: "Not at all. Sessions are grouped by level, and Foundations of Mindfulness is built from the ground up for complete beginners — no prior meditation experience needed.",
  },
  {
    q: "How long are the guided sessions?",
    a: "Anywhere from 5 to 45 minutes, so you can fit a short practice into a busy day or go deeper when you have more time.",
  },
  {
    q: "Is this a replacement for therapy?",
    a: "Mindfulness practice complements therapy but isn't a substitute for clinical support. If you're working through something deeper, our One-on-One Therapy connects you with a licensed professional.",
  },
];

export default function MindfulnessMeditationPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Header */}
      <section className="py-20 px-6 bg-cream text-center">
        <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">Mindfulness & Meditation</span>
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mt-2 mb-4">
          Find Calm, One Breath at a Time
        </h1>
        <p className="text-stone-500 text-lg max-w-xl mx-auto">
          Guided meditations, breathing exercises, and structured courses to help you build a mindfulness practice that actually sticks.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link
            href="/register"
            className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-full hover:bg-sage-800 transition-colors"
          >
            Start for Free
          </Link>
          <Link
            href="/pricing"
            className="bg-white text-stone-700 font-semibold px-8 py-3 rounded-full border border-stone-200 hover:border-sage-400 transition-colors"
          >
            See Plans
          </Link>
        </div>
      </section>

      {/* Practices grid */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">What's Inside</span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2">Everything You Need to Practice</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {practices.map((p) => (
              <div key={p.title} className="bg-cream rounded-3xl p-7 border border-stone-100">
                <div className={`w-14 h-14 ${p.color} rounded-2xl flex items-center justify-center text-2xl mb-5`}>
                  {p.icon}
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">{p.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2">Three Steps to a Calmer Mind</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-12 h-12 bg-sage-700 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-bold text-stone-900 mb-2">{s.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-y border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="grid grid-cols-3 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">{s.value}</div>
                <div className="text-sm text-stone-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-5">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-amber-400 text-lg">★</span>
            ))}
          </div>
          <p className="text-stone-700 text-xl leading-relaxed mb-6 italic">
            "The mindfulness course transformed my mornings. Six months in and I haven't looked back."
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center text-lg">👨</div>
            <div className="text-left">
              <div className="text-sm font-semibold text-stone-800">James K.</div>
              <div className="text-xs text-stone-400">Foundations of Mindfulness</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">FAQ</span>
            <h2 className="text-3xl font-bold text-stone-900 mt-2">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-stone-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-sage-50 transition-colors"
                >
                  <span className="font-semibold text-stone-800 text-sm">{faq.q}</span>
                  <span className="text-sage-600 flex-shrink-0 text-lg">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-stone-500 text-sm leading-relaxed">
                    {faq.q === "Is this a replacement for therapy?" ? (
                      <>
                        Mindfulness practice complements therapy but isn't a substitute for clinical support. If you're working through something deeper, our{" "}
                        <Link href="/therapy" className="text-sage-700 font-semibold hover:underline">One-on-One Therapy</Link> connects you with a licensed professional.
                      </>
                    ) : (
                      faq.a
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-sage-700">
        <div className="max-w-2xl mx-auto text-center text-white">
          <div className="text-5xl mb-6">🧘</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Your Mindfulness Practice</h2>
          <p className="text-sage-200 text-lg mb-8 leading-relaxed">
            Your first session is free — no credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="bg-white text-sage-800 font-bold px-8 py-3 rounded-full hover:bg-sage-50 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/therapy"
              className="border border-sage-400 text-white font-semibold px-8 py-3 rounded-full hover:bg-sage-600 transition-colors"
            >
              Talk to a Therapist Instead
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
