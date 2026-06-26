"use client";

import Link from "next/link";
import { useState } from "react";
import { faqs } from "@/lib/mockData";

const services = [
  {
    icon: "🧘",
    title: "Mindfulness & Meditation",
    description:
      "Develop a sustainable practice with guided sessions for every level. Reduce stress and find calm in your daily life.",
    color: "bg-sage-100",
    link: "/dashboard/courses",
  },
  {
    icon: "💬",
    title: "One-on-One Therapy",
    description:
      "Connect with a certified therapist or wellness coach for personalized guidance tailored to your needs.",
    color: "bg-peach-100",
    link: "/pricing",
  },
  {
    icon: "🌱",
    title: "Wellness Coaching",
    description:
      "Build lasting habits with structured programs designed by mental health professionals to help you thrive.",
    color: "bg-amber-100",
    link: "/dashboard/courses",
  },
];

const partners = ["Psychology Today", "Mindful", "Headspace", "BetterHelp", "NAMI", "MindUP"];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Hero */}
      <section className="bg-cream pt-16 pb-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 text-sm font-medium px-3 py-1.5 rounded-full mb-6">
                🌿 Mental health made accessible
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 leading-tight mb-6">
                Support for Your{" "}
                <span className="text-sage-700">Mental Health</span>{" "}
                Journey
              </h1>
              <p className="text-stone-500 text-lg leading-relaxed mb-8 max-w-md">
                Evidence-based courses, guided meditations, and one-on-one coaching — all in one calm, welcoming space.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="bg-sage-700 text-white font-semibold px-6 py-3 rounded-full hover:bg-sage-800 transition-colors"
                >
                  Start for Free
                </Link>
                <Link
                  href="/stories"
                  className="bg-white text-stone-700 font-semibold px-6 py-3 rounded-full border border-stone-200 hover:border-sage-400 transition-colors"
                >
                  Read Stories
                </Link>
              </div>
              <p className="text-stone-400 text-sm mt-4">No credit card required · Cancel anytime</p>
            </div>

            {/* Illustration panel */}
            <div className="relative">
              <div className="bg-sage-700 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sage-600 rounded-full -translate-y-8 translate-x-8 opacity-50" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400 rounded-full translate-y-8 -translate-x-6 opacity-30" />
                <div className="relative z-10">
                  <div className="text-6xl mb-4">🧠</div>
                  <h3 className="text-xl font-semibold mb-2">Your Path to Well-being</h3>
                  <p className="text-sage-200 text-sm mb-6">
                    Join 50,000+ people who have transformed their mental health with MindEase.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[["50K+", "Members"], ["120+", "Courses"], ["98%", "Feel Better"]].map(([num, label]) => (
                      <div key={label} className="bg-sage-600/50 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold">{num}</div>
                        <div className="text-sage-300 text-xs">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating card */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center text-lg">😌</div>
                <div>
                  <div className="text-xs text-stone-500">Today's check-in</div>
                  <div className="text-sm font-semibold text-stone-800">Feeling calmer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About strip */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="grid grid-cols-2 gap-4">
            {[
              { emoji: "🧘", label: "Mindfulness", bg: "bg-sage-100" },
              { emoji: "💙", label: "Therapy", bg: "bg-blue-50" },
              { emoji: "🌙", label: "Sleep", bg: "bg-purple-50" },
              { emoji: "🌱", label: "Growth", bg: "bg-amber-100" },
            ].map(({ emoji, label, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-6 flex flex-col items-center justify-center gap-2 aspect-square`}>
                <span className="text-4xl">{emoji}</span>
                <span className="text-sm font-medium text-stone-700">{label}</span>
              </div>
            ))}
          </div>
          <div>
            <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">Our Approach</span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2 mb-5 leading-tight">
              We Help You Prioritize Your Mental Health
            </h2>
            <p className="text-stone-500 leading-relaxed mb-5">
              Mental health isn't a destination — it's a daily practice. MindEase brings together expert-led courses, live coaching, and a supportive community to meet you wherever you are.
            </p>
            <p className="text-stone-500 leading-relaxed mb-8">
              Whether you're managing anxiety, rebuilding after burnout, or simply learning to be kinder to yourself, we have a path for you.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-sage-700 text-white font-semibold px-6 py-3 rounded-full hover:bg-sage-800 transition-colors"
            >
              Explore Courses →
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">What We Offer</span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2">Everything You Need to Thrive</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {services.map((s) => (
              <Link
                key={s.title}
                href={s.link}
                className="group bg-white rounded-3xl p-8 border border-stone-100 hover:border-sage-200 hover:shadow-lg transition-all"
              >
                <div className={`w-14 h-14 ${s.color} rounded-2xl flex items-center justify-center text-2xl mb-5`}>
                  {s.icon}
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-3 group-hover:text-sage-700 transition-colors">
                  {s.title}
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed">{s.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2">What Our Members Are Saying</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Emma R.", quote: "MindEase changed how I approach my mental health. I feel calmer and more in control than I have in years.", avatar: "👩", course: "Understanding Anxiety" },
              { name: "James K.", quote: "The mindfulness course transformed my mornings. Six months in and I haven't looked back.", avatar: "👨", course: "Foundations of Mindfulness" },
              { name: "Aisha N.", quote: "Self-compassion used to feel foreign to me. After this course I genuinely feel kinder to myself.", avatar: "👩🏾", course: "Building Self-Compassion" },
            ].map((t) => (
              <div key={t.name} className="bg-cream rounded-3xl p-7 border border-stone-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-stone-700 text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-sage-100 rounded-full flex items-center justify-center text-lg">{t.avatar}</div>
                  <div>
                    <div className="text-sm font-semibold text-stone-800">{t.name}</div>
                    <div className="text-xs text-stone-400">{t.course}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/stories" className="text-sage-700 font-semibold text-sm hover:underline">
              Read all stories →
            </Link>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-12 px-6 bg-cream border-y border-stone-200">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-stone-400 text-sm uppercase tracking-wider mb-8">As featured in</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {partners.map((p) => (
              <span key={p} className="text-stone-400 font-semibold text-sm md:text-base">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Resources preview */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">Free Resources</span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2">Resources for Your Well-being</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "📖", title: "Articles & Guides", desc: "120+ evidence-based articles", color: "bg-sage-100" },
              { icon: "🎧", title: "Guided Meditations", desc: "80+ audio sessions", color: "bg-peach-100" },
              { icon: "📝", title: "Worksheets", desc: "50+ printable exercises", color: "bg-amber-100" },
            ].map((r) => (
              <Link
                key={r.title}
                href="/resources"
                className="group flex items-start gap-4 bg-cream rounded-2xl p-6 border border-stone-100 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 ${r.color} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                  {r.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-stone-800 group-hover:text-sage-700 transition-colors">{r.title}</h3>
                  <p className="text-stone-500 text-sm mt-1">{r.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 border border-sage-600 text-sage-700 font-semibold px-6 py-3 rounded-full hover:bg-sage-50 transition-colors"
            >
              Browse All Resources →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-20 px-6 bg-sage-700">
        <div className="max-w-3xl mx-auto text-center text-white">
          <div className="text-5xl mb-6">🤝</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">You're Not Alone on This Journey</h2>
          <p className="text-sage-200 text-lg mb-8 leading-relaxed">
            Thousands of people just like you have found relief, clarity, and joy through MindEase. Your next step is just a click away.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="bg-white text-sage-800 font-bold px-8 py-3 rounded-full hover:bg-sage-50 transition-colors"
            >
              Join for Free Today
            </Link>
            <Link
              href="/pricing"
              className="border border-sage-400 text-white font-semibold px-8 py-3 rounded-full hover:bg-sage-600 transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2">Frequently Asked Questions</h2>
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
                  <div className="px-6 pb-5 text-stone-500 text-sm leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
