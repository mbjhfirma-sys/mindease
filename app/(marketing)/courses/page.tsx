"use client";

import Link from "next/link";
import { useState } from "react";

const steps = [
  {
    num: "1",
    title: "Pick a course",
    desc: "Browse by topic, or start with the ones matched to your assessment results.",
  },
  {
    num: "2",
    title: "Learn in short lessons",
    desc: "Video, audio, and reading — each lesson is 10–15 minutes, built for real life, not a lecture hall.",
  },
  {
    num: "3",
    title: "Practice as you go",
    desc: "Every lesson pairs with a real exercise, not just theory — the same tools that show up in your daily tasks.",
  },
  {
    num: "4",
    title: "Pick up where you left off",
    desc: "Progress saves automatically. Come back in five minutes or five weeks — it's exactly where you left it.",
  },
];

const topics = [
  { icon: "😟", label: "Anxiety" },
  { icon: "🌧️", label: "Depression" },
  { icon: "🌙", label: "Sleep" },
  { icon: "💗", label: "Self-Esteem" },
  { icon: "🤝", label: "Relationships" },
  { icon: "🔥", label: "Stress" },
];

const highlights = [
  { icon: "🎓", title: "Written by clinicians", desc: "Every course is developed with our clinical advisory board — grounded in real evidence-based practice, not generic self-help." },
  { icon: "🧩", title: "Matched to you", desc: "Your assessment results shape which courses get recommended first, so you're not guessing where to start." },
  { icon: "⏱️", title: "Genuinely self-paced", desc: "No deadlines, no live sessions to schedule around. Pause a course for a month — it'll be right there when you're ready." },
  { icon: "🔗", title: "Connected to your plan", desc: "Course exercises feed into the same tasks, journal, and progress tracking as the rest of YouMindo — nothing lives in isolation." },
];

const faqs = [
  {
    q: "Do I need a therapist to take a course?",
    a: "No — courses stand on their own and don't require a match with a therapist. If you do have one, they can see which courses you're working through and recommend others.",
  },
  {
    q: "Are courses free?",
    a: "Some courses are free to start. Deeper, multi-week courses are part of a paid plan — see Pricing for what's included at each tier.",
  },
  {
    q: "How long does a course take?",
    a: "Most courses are 4–8 lessons, 10–15 minutes each. You can move through one in a sitting or spread it across weeks — there's no clock running.",
  },
  {
    q: "How do courses get recommended to me?",
    a: "Your periodic assessments (things like mood, sleep, and anxiety check-ins) shape a short list of courses most relevant to what you're working through right now.",
  },
];

export default function CoursesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Header */}
      <section className="py-20 px-6 bg-cream text-center">
        <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">Courses</span>
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mt-2 mb-4">
          Structured Courses for Lasting Change
        </h1>
        <p className="text-stone-500 text-lg max-w-xl mx-auto">
          Multi-lesson programs on anxiety, sleep, self-esteem, and more — written by clinicians, matched to your assessment results, and built to fit around your actual life.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link
            href="/register"
            className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-full hover:bg-sage-800 transition-colors"
          >
            Start a Course Free
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
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2">From Lesson to Real Change</h2>
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

      {/* Topics */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">Course Topics</span>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2 mb-10">Wherever You&apos;re Starting From</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {topics.map((t) => (
              <div key={t.label} className="bg-white rounded-2xl p-5 border border-stone-100">
                <div className="text-2xl mb-2">{t.icon}</div>
                <div className="text-xs font-semibold text-stone-700">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">Why Our Courses</span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2">Not Just Another Self-Help Feed</h2>
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

      {/* Courses vs coaching callout */}
      <section className="py-16 px-6 bg-cream">
        <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-3xl p-8 md:p-10 text-center">
          <div className="text-3xl mb-4">💡</div>
          <h2 className="text-xl font-bold text-stone-900 mb-3">Courses vs. Daily Tasks</h2>
          <p className="text-stone-500 text-sm leading-relaxed max-w-xl mx-auto">
            Courses go deep on one topic, lesson by lesson. Your daily tasks are the shorter, day-to-day habit layer that sits alongside them &mdash; see how the two work together in{" "}
            <Link href="/coaching" className="text-sage-700 font-semibold hover:underline">Wellness Coaching</Link>.
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
            &ldquo;I started the sleep course expecting generic tips. Four lessons in, I actually understood why my anxiety and my insomnia were feeding each other — and had something to do about it.&rdquo;
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center text-lg">🧑🏻</div>
            <div className="text-left">
              <div className="text-sm font-semibold text-stone-800">Daniel P.</div>
              <div className="text-xs text-stone-400">Sleep &amp; Anxiety course</div>
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
          <div className="text-5xl mb-6">📚</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Your First Course Free</h2>
          <p className="text-sage-200 text-lg mb-8 leading-relaxed">
            No credit card required — pick a topic and start the first lesson today.
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
