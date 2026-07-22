"use client";

import Link from "next/link";
import { useState } from "react";

const steps = [
  {
    num: "1",
    title: "Take a short intake quiz",
    desc: "Tell us what brings you here, your preferences, and your goals. Takes about 5 minutes.",
  },
  {
    num: "2",
    title: "Get matched automatically",
    desc: "We match you with the therapist whose expertise and availability best fit your needs.",
  },
  {
    num: "3",
    title: "Book a session",
    desc: "Choose a time from your therapist's real availability — no back-and-forth required.",
  },
  {
    num: "4",
    title: "Meet securely",
    desc: "Connect over encrypted video or messaging, whenever you need support between sessions.",
  },
];

const professionals = [
  { icon: "🧑‍⚕️", label: "Licensed Therapist" },
  { icon: "💊", label: "Psychiatrist" },
  { icon: "🧠", label: "Psychologist" },
  { icon: "🤝", label: "Clinical Social Worker" },
  { icon: "💑", label: "Marriage & Family Therapist" },
  { icon: "🔗", label: "Addiction Counselor" },
];

const included = [
  { icon: "🎥", title: "Live video sessions", desc: "Secure, encrypted video calls with your therapist — no extra software needed." },
  { icon: "💬", title: "Messaging between sessions", desc: "Reach out to your therapist whenever something comes up, not just once a week." },
  { icon: "📋", title: "Personalized treatment plans", desc: "Goals and progress tracked collaboratively with your therapist over time." },
  { icon: "🆘", title: "Built-in crisis support", desc: "A personal safety plan and 24/7 crisis resources, with real support if you ever need it urgently." },
];

const concerns = [
  { id: "Anxiety", emoji: "😰" }, { id: "Depression", emoji: "💙" }, { id: "Trauma & PTSD", emoji: "🛡️" },
  { id: "ADHD", emoji: "⚡" }, { id: "Addiction", emoji: "🔗" }, { id: "Grief & Loss", emoji: "🌧️" },
  { id: "Relationships", emoji: "💑" }, { id: "Eating Disorders", emoji: "🌱" }, { id: "OCD", emoji: "🔄" },
  { id: "Anger Management", emoji: "🌋" }, { id: "Stress & Burnout", emoji: "🔥" }, { id: "Bipolar Disorder", emoji: "🌊" },
  { id: "Sleep Issues", emoji: "🌙" }, { id: "Self-Esteem", emoji: "🌟" }, { id: "Couples Therapy", emoji: "💞" },
  { id: "Family Therapy", emoji: "👪" },
];

const faqs = [
  {
    q: "How is my therapist chosen?",
    a: "Automatically, based on the concerns, language, gender preference, and age group you share in the intake quiz — matched against therapists' real specialties and availability, so a therapist with relevant expertise always comes first.",
  },
  {
    q: "What if it's not the right fit?",
    a: "You're never locked in. You can message your care team to be rematched with a different therapist at any time.",
  },
  {
    q: "Is this therapy or coaching?",
    a: "This is clinical, one-on-one therapy with a licensed professional. If you're looking for structured daily habit-building instead, take a look at our Wellness Coaching.",
  },
];

export default function TherapyPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Header */}
      <section className="py-20 px-6 bg-cream text-center">
        <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">One-on-One Therapy</span>
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mt-2 mb-4">
          Real Support From a Real Therapist
        </h1>
        <p className="text-stone-500 text-lg max-w-xl mx-auto">
          Get matched with a licensed therapist based on your concerns and preferences, then connect through secure video and messaging — on a schedule that works for you.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link
            href="/register"
            className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-full hover:bg-sage-800 transition-colors"
          >
            Get Matched With a Therapist
          </Link>
          <Link
            href="/pricing"
            className="bg-white text-stone-700 font-semibold px-8 py-3 rounded-full border border-stone-200 hover:border-sage-400 transition-colors"
          >
            See Plans
          </Link>
        </div>
      </section>

      {/* How matching works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2">From Sign-Up to Session</h2>
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

      {/* Types of professionals */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">Our Network</span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2">Licensed Professionals, Every Specialty</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {professionals.map((p) => (
              <div key={p.label} className="bg-white rounded-2xl p-6 border border-stone-100 text-center">
                <div className="text-3xl mb-2">{p.icon}</div>
                <div className="text-sm font-semibold text-stone-800">{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">What's Included</span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2">Everything Around Your Sessions</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {included.map((f) => (
              <div key={f.title} className="flex items-start gap-4 bg-cream rounded-2xl p-6 border border-stone-100">
                <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
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

      {/* Concerns */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">We Help With</span>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-2 mb-10">Whatever You're Facing</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {concerns.map((c) => (
              <span key={c.id} className="bg-white border border-stone-200 rounded-full px-4 py-2 text-sm text-stone-700 font-medium">
                {c.emoji} {c.id}
              </span>
            ))}
          </div>
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
            "YouMindo changed how I approach my mental health. I feel calmer and more in control than I have in years."
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center text-lg">👩</div>
            <div className="text-left">
              <div className="text-sm font-semibold text-stone-800">Emma R.</div>
              <div className="text-xs text-stone-400">Matched with a therapist in 2 days</div>
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
                  <div className="px-6 pb-5 text-stone-500 text-sm leading-relaxed">
                    {faq.q === "Is this therapy or coaching?" ? (
                      <>
                        This is clinical, one-on-one therapy with a licensed professional. If you're looking for structured daily habit-building instead, take a look at our{" "}
                        <Link href="/coaching" className="text-sage-700 font-semibold hover:underline">Wellness Coaching</Link>.
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
          <div className="text-5xl mb-6">💬</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Talk to Someone?</h2>
          <p className="text-sage-200 text-lg mb-8 leading-relaxed">
            Most people are matched with a therapist within 48 hours.
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
              View Plans
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
