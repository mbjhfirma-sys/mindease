"use client";

import { useState, useRef } from "react";
import { X, Upload, Check } from "lucide-react";

type Role = {
  id: string;
  title: string;
  dept: string;
  location: string;
  type: string;
  salary: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
};

const roles: Role[] = [
  {
    id: "r1",
    title: "Senior Full-Stack Engineer",
    dept: "Engineering",
    location: "Remote (EU / UK)",
    type: "Full-time",
    salary: "£90,000 – £120,000",
    summary: "Own full product features end-to-end — React / Next.js on the front, Node on the back, Postgres underneath. You'll work directly with clinical staff to ship tools that genuinely improve lives.",
    responsibilities: [
      "Design, build, and ship product features across the full stack",
      "Collaborate with clinical staff to translate research into real product decisions",
      "Review code and mentor junior engineers",
      "Help shape the engineering culture — what we build and how we build it",
      "Contribute to architecture decisions and technical roadmap",
    ],
    requirements: [
      "5+ years of professional software development experience",
      "Strong proficiency in TypeScript, React, and Node.js",
      "Experience with PostgreSQL and data-modelling at scale",
      "A track record of shipping high-quality products, not just prototypes",
      "Comfortable working async and in writing — you document your decisions",
    ],
  },
  {
    id: "r2",
    title: "Clinical Content Writer",
    dept: "Clinical",
    location: "Remote (Worldwide)",
    type: "Full-time",
    salary: "£45,000 – £58,000",
    summary: "Translate evidence-based clinical research into content our users actually read and remember. You'll work alongside our CCO to review, write, and quality-gate everything we publish.",
    responsibilities: [
      "Write and edit articles, in-app copy, and guided exercises grounded in clinical research",
      "Work with clinical advisors to ensure accuracy and safety of all published content",
      "Develop content guidelines and a style guide for mental health writing",
      "Research emerging topics in mental health and propose new content",
      "Review user feedback and iterate based on what's actually landing",
    ],
    requirements: [
      "Background in psychology, mental health, or clinical writing (degree or equivalent experience)",
      "Exceptional writing ability — you can make complex ideas feel simple and human",
      "Familiarity with CBT, DBT, ACT, or other evidence-based frameworks",
      "Experience writing for a health or wellness audience",
      "High standard of accuracy and a zero-tolerance approach to misinformation",
    ],
  },
  {
    id: "r3",
    title: "Licensed Therapist — Network Partner",
    dept: "Network",
    location: "Remote (UK, US, AU)",
    type: "Part-time / Contractor",
    salary: "£75 – £110 per session",
    summary: "Grow your private practice through YouMindo while offering your clients continuity of care between sessions. We handle scheduling, infrastructure, and billing so you can focus entirely on the work.",
    responsibilities: [
      "Provide individual therapy sessions via the YouMindo platform (video, phone, or text)",
      "Use our therapist portal to review client journals, assign tasks, and track progress",
      "Collaborate with our clinical team on content and feature feedback",
      "Maintain appropriate clinical documentation within the platform",
      "Be available for a minimum of 5 client hours per week",
    ],
    requirements: [
      "Licensed or accredited therapist (BACP, UKCP, HCPC in UK; state-licensed in US/AU)",
      "Minimum 3 years of post-qualification clinical experience",
      "Experience with CBT or at least one evidence-based modality",
      "Comfortable delivering therapy via video and text-based formats",
      "Professional indemnity insurance (we can advise on providers)",
    ],
  },
  {
    id: "r4",
    title: "Product Designer",
    dept: "Design",
    location: "Remote (EU / UK)",
    type: "Full-time",
    salary: "£65,000 – £85,000",
    summary: "Design for the most sensitive context imaginable: someone struggling with their mental health at 2 am. Every pixel should feel calm, clear, and deeply considered.",
    responsibilities: [
      "Own the design of core product flows from discovery through to shipped",
      "Run user research sessions with real clients and therapists",
      "Build and maintain a living design system in Figma",
      "Work closely with engineers to ensure quality implementation",
      "Champion accessibility and inclusive design across every surface",
    ],
    requirements: [
      "4+ years of product design experience, ideally in health, wellness, or consumer apps",
      "A portfolio that demonstrates thoughtful, user-centred process — not just beautiful outputs",
      "Proficiency in Figma, including component libraries and auto-layout",
      "Experience conducting user interviews and synthesising research into design decisions",
      "Strong written communication — you can articulate the 'why' behind every design choice",
    ],
  },
  {
    id: "r5",
    title: "Customer Success Manager",
    dept: "Operations",
    location: "Remote (UK)",
    type: "Full-time",
    salary: "£38,000 – £50,000",
    summary: "Be the bridge between our users and the product team. Identify patterns, solve problems proactively, and make sure every person who comes to us for help actually finds it.",
    responsibilities: [
      "Own the onboarding and ongoing relationship for YouMindo users and therapist partners",
      "Identify churn signals early and intervene with empathy and practical solutions",
      "Document user feedback and surface patterns to the product team weekly",
      "Create and maintain help centre content, tutorials, and FAQs",
      "Handle escalations calmly, including sensitive mental health situations",
    ],
    requirements: [
      "2+ years in a customer success, account management, or support role",
      "Exceptional written and verbal communication — warm, clear, and professional",
      "Empathetic by nature; you genuinely care about the people you're helping",
      "Organised and process-driven — you build systems, not just solve one-off problems",
      "Experience with CRM tools (Intercom, HubSpot, or similar)",
    ],
  },
  {
    id: "r6",
    title: "Research Scientist — Mental Health AI",
    dept: "Research",
    location: "London or Remote",
    type: "Full-time",
    salary: "£75,000 – £100,000",
    summary: "Work on how AI can responsibly augment clinical care — from outcome prediction to care-plan personalisation. You'll publish your work, collaborate with universities, and keep us clinically honest.",
    responsibilities: [
      "Design and run studies to evaluate the effectiveness of YouMindo features",
      "Build and validate predictive models for mood, risk, and intervention response",
      "Publish research in peer-reviewed journals and present at conferences",
      "Partner with NHS trusts and universities on joint research programs",
      "Act as an internal critic — raise concerns when a product direction outpaces the evidence",
    ],
    requirements: [
      "PhD in a relevant field (psychology, computational psychiatry, ML, or related)",
      "Hands-on experience with NLP, time-series modelling, or clinical ML",
      "Rigorous statistical skills and a track record of peer-reviewed publication",
      "Ability to communicate research findings to non-technical stakeholders",
      "Deep commitment to ethical AI — you think hard about what we shouldn't build",
    ],
  },
];

const perks = [
  { icon: "🏥", title: "Full mental health cover", desc: "Therapy sessions, psychiatry, and mental health days — fully covered for you and your family." },
  { icon: "🌍", title: "Work from anywhere", desc: "Fully remote with optional offices in London and New York. Work from wherever you do your best thinking." },
  { icon: "📚", title: "£2,000 learning budget", desc: "Annual budget for courses, books, conferences, or anything that makes you better at your craft." },
  { icon: "🏖️", title: "35 days holiday", desc: "More than the UK minimum. We mean it — use them. Unused days roll over once." },
  { icon: "💰", title: "Equity for everyone", desc: "Every full-time employee gets meaningful equity from day one. When YouMindo succeeds, you do too." },
  { icon: "👶", title: "Generous parental leave", desc: "26 weeks fully paid for all parents, regardless of gender or how your family was formed." },
];

const depts = ["All", "Engineering", "Clinical", "Design", "Research", "Operations", "Network"];

const referralSources = [
  "LinkedIn",
  "Job board (Indeed, Glassdoor, etc.)",
  "Twitter / X",
  "From a friend or colleague",
  "YouMindo website",
  "Press or media article",
  "Other",
];

type FormData = {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  referral: string;
  coverLetter: string;
  cvFile: File | null;
};

const EMPTY_FORM: FormData = {
  name: "", email: "", phone: "", linkedin: "", referral: referralSources[0], coverLetter: "", cvFile: null,
};

type ModalState =
  | { type: "closed" }
  | { type: "role"; role: Role }
  | { type: "speculative" };

export default function CareersPage() {
  const [activeDept, setActiveDept] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: "closed" });
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = roles.filter((r) => activeDept === "All" || r.dept === activeDept);

  function openApply(role: Role) {
    setForm(EMPTY_FORM);
    setSubmitted(false);
    setModal({ type: "role", role });
  }

  function openSpeculative() {
    setForm(EMPTY_FORM);
    setSubmitted(false);
    setModal({ type: "speculative" });
  }

  function closeModal() {
    setModal({ type: "closed" });
    setSubmitted(false);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setForm((p) => ({ ...p, cvFile: file }));
    e.target.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.coverLetter.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1200);
  }

  const modalTitle = modal.type === "role"
    ? modal.role.title
    : modal.type === "speculative"
    ? "Speculative application"
    : "";

  const isOpen = modal.type !== "closed";

  return (
    <div>
      {/* Hero */}
      <section className="bg-sage-800 text-white">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 text-sage-300 text-sm font-medium mb-6 bg-sage-700/50 px-4 py-1.5 rounded-full">
            We're hiring
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Work that actually matters
          </h1>
          <p className="text-sage-200 text-[17px] leading-relaxed max-w-2xl mx-auto">
            Every engineer, designer, and clinician at YouMindo is working on the same thing: making mental health support accessible to everyone who needs it. If that sounds like the kind of problem you want to spend your career on, read on.
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="bg-stone-50 border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-stone-900 mb-3">Why people join us</h2>
            <p className="text-stone-500 text-[15px]">And why they stay.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {perks.map((perk) => (
              <div key={perk.title} className="bg-white border border-stone-100 rounded-2xl p-6">
                <div className="text-2xl mb-3">{perk.icon}</div>
                <h3 className="text-sm font-semibold text-stone-900 mb-2">{perk.title}</h3>
                <p className="text-xs text-stone-500 leading-relaxed">{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">Open roles</h2>
              <p className="text-stone-500 text-sm mt-1">{roles.length} positions · all remote-friendly</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {depts.map((d) => (
                <button
                  key={d}
                  onClick={() => setActiveDept(d)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                    activeDept === d ? "bg-stone-900 text-white" : "border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-sm">No open roles in this department right now.</div>
            ) : (
              filtered.map((role) => {
                const isExpanded = expanded === role.id;
                return (
                  <div key={role.id} className={`border rounded-2xl overflow-hidden transition-colors ${isExpanded ? "border-stone-300" : "border-stone-100"}`}>
                    {/* Role header — always visible */}
                    <button
                      className="w-full text-left px-6 py-5 hover:bg-stone-50 transition-colors"
                      onClick={() => setExpanded(isExpanded ? null : role.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-sage-700 bg-sage-50 px-2 py-0.5 rounded-full">{role.dept}</span>
                            <span className="text-[10px] text-stone-400">{role.type}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-stone-900">{role.title}</h3>
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
                            <span className="text-xs text-stone-400">📍 {role.location}</span>
                            <span className="text-xs text-stone-400">💷 {role.salary}</span>
                          </div>
                        </div>
                        <span className={`text-stone-400 text-lg flex-shrink-0 mt-0.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                          ↓
                        </span>
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-stone-100 bg-stone-50 px-6 py-6">
                        <p className="text-sm text-stone-600 leading-relaxed mb-6">{role.summary}</p>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <h4 className="text-xs font-semibold text-stone-800 uppercase tracking-wider mb-3">What you'll do</h4>
                            <ul className="space-y-2">
                              {role.responsibilities.map((r, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-stone-600 leading-relaxed">
                                  <span className="text-sage-600 mt-0.5 flex-shrink-0">✓</span>
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-stone-800 uppercase tracking-wider mb-3">What we're looking for</h4>
                            <ul className="space-y-2">
                              {role.requirements.map((r, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-stone-600 leading-relaxed">
                                  <span className="text-stone-400 mt-0.5 flex-shrink-0">→</span>
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-stone-200">
                          <button
                            onClick={() => openApply(role)}
                            className="bg-sage-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-sage-800 transition-colors"
                          >
                            Apply for this role
                          </button>
                          <div className="flex items-center gap-2 text-xs text-stone-400">
                            <span>💷 {role.salary}</span>
                            <span>·</span>
                            <span>{role.location}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Speculative card */}
          <div className="mt-8 bg-stone-50 border border-stone-200 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-stone-900 mb-1">Don't see your role?</p>
                <p className="text-xs text-stone-500">We hire for character and capability as much as for a specific spec. Tell us what you'd build.</p>
              </div>
              <button
                onClick={openSpeculative}
                className="flex-shrink-0 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 px-5 py-2.5 rounded-full transition-colors"
              >
                Send a speculative application
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Culture */}
      <section className="bg-sage-800 text-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">How we work</h2>
              <div className="space-y-4 text-sage-200 text-[15px] leading-relaxed">
                <p>We're fully remote and async-first. No required standups. No performance theatre. We measure output, not hours.</p>
                <p>We write more than we meet. Every significant decision has a written proposal that's open for comment before anything moves.</p>
                <p>We ship fast and fix fast. We're not reckless — we're careful with clinical quality — but we've never been slowed down by bureaucracy.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { stat: "4.9/5", label: "Glassdoor rating" },
                { stat: "~60", label: "team members globally" },
                { stat: "12", label: "countries represented" },
                { stat: "87%", label: "employee retention" },
              ].map((s) => (
                <div key={s.label} className="bg-sage-700/50 rounded-2xl p-5 text-center">
                  <div className="text-2xl font-bold text-white mb-1">{s.stat}</div>
                  <div className="text-xs text-sage-300">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Application modal ───────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />

          {/* Panel */}
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl z-10 flex flex-col max-h-[96dvh] sm:max-h-[90dvh] rounded-t-2xl">

            {/* Modal header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-stone-100 flex-shrink-0">
              <div>
                {modal.type === "speculative" ? (
                  <>
                    <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-1">Speculative application</p>
                    <h2 className="text-base font-bold text-stone-900">Tell us about yourself</h2>
                  </>
                ) : modal.type === "role" ? (
                  <>
                    <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-1">Applying for</p>
                    <h2 className="text-base font-bold text-stone-900">{modal.role.title}</h2>
                    <p className="text-xs text-stone-400 mt-0.5">{modal.role.location} · {modal.role.type}</p>
                  </>
                ) : null}
              </div>
              <button onClick={closeModal} className="text-stone-400 hover:text-stone-700 transition-colors p-1 -mr-1 flex-shrink-0">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1">
              {submitted ? (
                <div className="flex flex-col items-center justify-center text-center px-8 py-12">
                  <div className="w-14 h-14 bg-sage-100 rounded-full flex items-center justify-center mb-4">
                    <Check size={24} className="text-sage-700" strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-bold text-stone-900 mb-2">Application sent!</h3>
                  <p className="text-sm text-stone-500 leading-relaxed max-w-xs">
                    Thanks, <strong>{form.name.trim().split(" ")[0]}</strong>. We've received your application for{" "}
                    <strong>{modal.type === "role" ? modal.role.title : "a position at YouMindo"}</strong> and will be in touch at <strong>{form.email}</strong>.
                  </p>
                  <p className="text-xs text-stone-400 mt-3">We aim to respond within 5 business days.</p>
                  <button
                    onClick={closeModal}
                    className="mt-6 bg-stone-900 text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-stone-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
                  {/* Name + Email */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1.5">
                        Full name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Alex Johnson"
                        className="w-full border border-stone-200 text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-100 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1.5">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="alex@example.com"
                        className="w-full border border-stone-200 text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-100 transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone + LinkedIn */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1.5">
                        Phone <span className="text-stone-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+44 7700 900000"
                        className="w-full border border-stone-200 text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-100 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1.5">
                        LinkedIn / Portfolio <span className="text-stone-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="url"
                        value={form.linkedin}
                        onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))}
                        placeholder="https://linkedin.com/in/you"
                        className="w-full border border-stone-200 text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-100 transition-all"
                      />
                    </div>
                  </div>

                  {/* CV Upload */}
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">
                      CV / Résumé <span className="text-stone-400 font-normal">(PDF, DOC — max 10 MB)</span>
                    </label>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFile}
                    />
                    {form.cvFile ? (
                      <div className="flex items-center gap-3 border border-sage-200 bg-sage-50 rounded-xl px-4 py-2.5">
                        <span className="text-base flex-shrink-0">📄</span>
                        <span className="text-xs text-stone-700 font-medium flex-1 min-w-0 truncate">{form.cvFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, cvFile: null }))}
                          className="text-stone-400 hover:text-stone-700 transition-colors flex-shrink-0 text-sm"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="w-full border-2 border-dashed border-stone-200 hover:border-sage-400 rounded-xl px-4 py-4 flex flex-col items-center gap-1.5 transition-colors group"
                      >
                        <Upload size={18} className="text-stone-300 group-hover:text-sage-500 transition-colors" strokeWidth={1.5} />
                        <span className="text-xs text-stone-400 group-hover:text-stone-600 transition-colors">Click to upload your CV</span>
                      </button>
                    )}
                  </div>

                  {/* How did you hear */}
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">How did you hear about us?</label>
                    <select
                      value={form.referral}
                      onChange={(e) => setForm((p) => ({ ...p, referral: e.target.value }))}
                      className="w-full border border-stone-200 text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-100 transition-all bg-white"
                    >
                      {referralSources.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Cover letter */}
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">
                      {modal.type === "speculative"
                        ? <>Tell us what you'd love to work on <span className="text-red-400">*</span></>
                        : <>Why this role? <span className="text-red-400">*</span></>
                      }
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.coverLetter}
                      onChange={(e) => setForm((p) => ({ ...p, coverLetter: e.target.value }))}
                      placeholder={
                        modal.type === "speculative"
                          ? "Tell us what you'd build, what you care about, and what kind of work lights you up…"
                          : "Tell us why this role and why YouMindo. No template answers — we want to hear how you actually think…"
                      }
                      className="w-full border border-stone-200 text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-100 transition-all resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <div className="pt-1 pb-2">
                    <button
                      type="submit"
                      disabled={submitting || !form.name.trim() || !form.email.trim() || !form.coverLetter.trim()}
                      className="w-full bg-sage-700 hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending…
                        </>
                      ) : (
                        "Submit application"
                      )}
                    </button>
                    <p className="text-center text-xs text-stone-400 mt-3">
                      We read every application. Spam-free — your details are only used for this application.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
