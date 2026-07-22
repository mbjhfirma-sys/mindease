"use client";

import { useState } from "react";

const subjects = [
  "General question",
  "Technical support",
  "Billing & subscription",
  "Therapist network enquiry",
  "Press & media",
  "Partnership",
  "Feedback",
  "Other",
];

const channels = [
  {
    icon: "💬",
    title: "Support",
    desc: "Questions about your account, the app, or a subscription.",
    detail: "support@youmindo.com",
    resp: "Response within 4 hours",
    href: "mailto:support@youmindo.com",
  },
  {
    icon: "📰",
    title: "Press & media",
    desc: "Interview requests, press coverage, or media assets.",
    detail: "press@youmindo.com",
    resp: "Response within 24 hours",
    href: "mailto:press@youmindo.com",
  },
  {
    icon: "🤝",
    title: "Partnerships",
    desc: "Integrations, clinical research, or enterprise enquiries.",
    detail: "partners@youmindo.com",
    resp: "Response within 48 hours",
    href: "mailto:partners@youmindo.com",
  },
  {
    icon: "💼",
    title: "Careers",
    desc: "Open roles, speculative applications, or general hiring questions.",
    detail: "careers@youmindo.com",
    resp: "Response within 3–5 days",
    href: "mailto:careers@youmindo.com",
  },
];

const faqs = [
  {
    q: "Is YouMindo free to use?",
    a: "Yes — our core features are free forever with no credit card required. We offer a paid plan for users who want access to therapist sessions, advanced analytics, and the full tools library.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "Go to Settings → Subscription → Cancel anytime. There's no penalty and your data stays accessible on the free tier. You can also email support@youmindo.com and we'll handle it for you.",
  },
  {
    q: "Is my data private?",
    a: "Completely. We never sell data, never use it for advertising, and give you full control to export or delete everything at any time. Read our Privacy Policy for the full picture.",
  },
  {
    q: "How do I find a therapist through YouMindo?",
    a: "After signing up, go to Find a Therapist in the dashboard. You can filter by specialism, language, session format (video/phone/text), and availability. All therapists on our network are licensed and verified.",
  },
  {
    q: "Do you work with the NHS or health insurers?",
    a: "We're an approved digital wellbeing provider for several NHS trusts and are in conversations with major insurers. Contact partnerships@youmindo.com for details.",
  },
  {
    q: "I'm in crisis. Where should I go?",
    a: "If you're in immediate danger, call 999 (UK) or 911 (US). For mental health crisis support, call or text 988 (US) or the Samaritans on 116 123 (UK, free, 24/7). YouMindo is not a crisis service.",
  },
];

export default function ContactPage() {
  const [formState, setFormState] = useState({ name: "", email: "", subject: subjects[0], message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formState.name.trim() || !formState.email.trim() || !formState.message.trim()) return;
    setSubmitted(true);
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-sage-800 text-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Get in touch</h1>
          <p className="text-sage-200 text-[17px] max-w-xl mx-auto">
            We're a small team and we read every message. Whether it's a bug, a question, or a big idea — we'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Crisis notice */}
      <div className="bg-red-50 border-b border-red-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-start gap-3">
          <span className="text-red-500 text-base flex-shrink-0 mt-0.5">🚨</span>
          <p className="text-sm text-red-700">
            <strong>If you're in crisis or in immediate danger</strong>, please don't use this form — call{" "}
            <a href="tel:999" className="underline font-semibold">999</a> (UK) /{" "}
            <a href="tel:911" className="underline font-semibold">911</a> (US), or contact the{" "}
            <a href="tel:988" className="underline font-semibold">988 Suicide & Crisis Lifeline</a> (US) or{" "}
            <a href="tel:116123" className="underline font-semibold">Samaritans on 116 123</a> (UK, free, 24/7).
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12">

          {/* Form */}
          <div>
            <h2 className="text-xl font-bold text-stone-900 mb-6">Send us a message</h2>

            {submitted ? (
              <div className="bg-sage-50 border border-sage-200 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-base font-semibold text-stone-900 mb-2">Message sent</h3>
                <p className="text-sm text-stone-500 leading-relaxed">
                  Thank you, <strong>{formState.name.split(" ")[0]}</strong>. We've received your message and will reply to <strong>{formState.email}</strong> as soon as possible.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setFormState({ name: "", email: "", subject: subjects[0], message: "" }); }}
                  className="mt-5 text-sm font-medium text-sage-700 hover:text-sage-800 transition-colors"
                >
                  Send another message →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">Name</label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Alex Johnson"
                      className="w-full border border-stone-200 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-200 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState((p) => ({ ...p, email: e.target.value }))}
                      placeholder="alex@example.com"
                      className="w-full border border-stone-200 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-200 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">Subject</label>
                  <select
                    value={formState.subject}
                    onChange={(e) => setFormState((p) => ({ ...p, subject: e.target.value }))}
                    className="w-full border border-stone-200 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-200 transition-all bg-white"
                  >
                    {subjects.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">Message</label>
                  <textarea
                    required
                    rows={6}
                    value={formState.message}
                    onChange={(e) => setFormState((p) => ({ ...p, message: e.target.value }))}
                    placeholder="Tell us what's on your mind…"
                    className="w-full border border-stone-200 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-200 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-sage-700 text-white text-sm font-semibold py-3 rounded-xl hover:bg-sage-800 transition-colors"
                >
                  Send message
                </button>
                <p className="text-xs text-stone-400 text-center">
                  We'll respond to the email above. No spam, ever.
                </p>
              </form>
            )}
          </div>

          {/* Channels */}
          <div>
            <h2 className="text-xl font-bold text-stone-900 mb-6">Or reach us directly</h2>
            <div className="space-y-3">
              {channels.map((ch) => (
                <a
                  key={ch.title}
                  href={ch.href}
                  className="flex gap-4 bg-stone-50 border border-stone-100 rounded-2xl p-5 hover:border-stone-300 hover:bg-white transition-all group"
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{ch.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-stone-900 group-hover:text-sage-700 transition-colors">{ch.title}</div>
                    <div className="text-xs text-stone-500 mt-0.5 mb-1.5">{ch.desc}</div>
                    <div className="text-xs font-medium text-stone-700">{ch.detail}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{ch.resp}</div>
                  </div>
                </a>
              ))}
            </div>

            {/* Office */}
            <div className="mt-5 bg-stone-50 border border-stone-100 rounded-2xl p-5">
              <div className="text-sm font-semibold text-stone-900 mb-2">📍 Head office</div>
              <div className="text-xs text-stone-500 leading-relaxed">
                YouMindo Ltd<br />
                30 Cannon Street<br />
                London, EC4M 6XH<br />
                United Kingdom
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-xl font-bold text-stone-900 mb-6">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-stone-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-stone-50 transition-colors"
                >
                  <span className="text-sm font-medium text-stone-800">{faq.q}</span>
                  <span className="text-stone-400 text-sm flex-shrink-0">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-stone-500 leading-relaxed bg-stone-50 border-t border-stone-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
