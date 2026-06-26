import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — MindEase",
  description: "We started MindEase because we believe mental health support should be accessible, personal, and human.",
};

const team = [
  {
    name: "Dr. Sarah Chen",
    role: "CEO & Co-Founder",
    bio: "Clinical psychologist with 14 years of practice. Sarah left her private practice to build the tool she always wished existed for her patients.",
    avatar: "SC",
    color: "bg-sage-100 text-sage-800",
  },
  {
    name: "Marcus Webb",
    role: "CTO & Co-Founder",
    bio: "Former senior engineer at Headspace and Google. Marcus has spent his career building products that improve how people feel every day.",
    avatar: "MW",
    color: "bg-amber-100 text-amber-800",
  },
  {
    name: "Dr. Priya Patel",
    role: "Chief Clinical Officer",
    bio: "Psychiatrist and researcher specialising in digital mental health interventions. Priya leads our clinical oversight and evidence-based content.",
    avatar: "PP",
    color: "bg-rose-100 text-rose-800",
  },
  {
    name: "Jordan Liu",
    role: "Head of Design",
    bio: "Designed products at Calm and Notion. Jordan believes that how something feels is just as important as what it does.",
    avatar: "JL",
    color: "bg-blue-100 text-blue-800",
  },
  {
    name: "Nina Okafor",
    role: "Head of Community",
    bio: "Lived experience advocate and former peer support specialist. Nina ensures our community spaces remain truly safe and inclusive.",
    avatar: "NO",
    color: "bg-purple-100 text-purple-800",
  },
  {
    name: "Tom Walsh",
    role: "Head of Research",
    bio: "PhD in cognitive-behavioural science from Oxford. Tom leads our research partnerships and outcome measurement programs.",
    avatar: "TW",
    color: "bg-teal-100 text-teal-800",
  },
];

const values = [
  {
    icon: "🔬",
    title: "Evidence first",
    desc: "Everything we build is grounded in peer-reviewed research. We partner with universities and clinical researchers to validate that what we ship actually helps.",
  },
  {
    icon: "🔒",
    title: "Privacy as a right",
    desc: "Mental health data is the most sensitive data there is. We never sell data, never use it for ads, and give you complete control to delete it.",
  },
  {
    icon: "🤝",
    title: "Human at the core",
    desc: "Technology supports — it never replaces — human connection. Every feature we build is designed to strengthen your relationship with yourself and others.",
  },
  {
    icon: "🌍",
    title: "Accessible by design",
    desc: "Mental health care shouldn't be a luxury. We offer a generous free tier, subsidised plans for low-income users, and content in 14 languages.",
  },
];

const stats = [
  { value: "280,000+", label: "people supported" },
  { value: "94%", label: "report reduced anxiety in 8 weeks" },
  { value: "1,200+", label: "verified therapists on the network" },
  { value: "14", label: "languages supported" },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-sage-800 text-white">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 text-sage-300 text-sm font-medium mb-6 bg-sage-700/50 px-4 py-1.5 rounded-full">
            <span>🌿</span> Our story
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Mental health care that actually fits your life
          </h1>
          <p className="text-sage-200 text-lg leading-relaxed max-w-2xl mx-auto">
            We started MindEase in 2021 because we kept hearing the same thing from therapists and clients alike: the system was broken. Waitlists were months long. Sessions were expensive. Progress happened once a week and was forgotten by the next.
          </p>
          <p className="text-sage-300 text-lg leading-relaxed max-w-2xl mx-auto mt-4">
            We believed you deserved support between sessions, not just during them.
          </p>
        </div>
      </section>

      {/* Origin story */}
      <section className="bg-stone-50 border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <h2 className="text-2xl font-bold text-stone-900 mb-5">How it started</h2>
              <div className="space-y-4 text-stone-600 text-[15px] leading-relaxed">
                <p>
                  Dr. Sarah Chen had been a clinical psychologist for over a decade when she noticed a pattern: her patients were making breakthroughs in session but struggling to carry them into their week. They had no way to track their mood, no structured way to practise techniques, and no safe place to process between appointments.
                </p>
                <p>
                  She teamed up with Marcus Webb, who'd spent years building wellness tech, to answer one question: <em className="text-stone-800 not-italic font-medium">"What if the support didn't stop when the session ended?"</em>
                </p>
                <p>
                  MindEase launched in private beta in 2021. Within six months, 50 therapists had joined the network. Within a year, 50,000 people were using it every day. Today we support over 280,000 people across 34 countries.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-6">
              <div className="text-stone-400 text-xs uppercase tracking-widest font-medium mb-2">Timeline</div>
              {[
                { year: "2021", event: "Founded in London. Private beta with 12 therapists." },
                { year: "2022", event: "Series A funding. Launched public app in the UK & US." },
                { year: "2023", event: "Reached 100,000 users. Launched therapist portal." },
                { year: "2024", event: "Expanded to 34 countries. 1,200+ therapists on network." },
                { year: "2025", event: "Launched AI-assisted care planning for therapists." },
              ].map(({ year, event }) => (
                <div key={year} className="flex gap-4">
                  <div className="text-xs font-bold text-sage-700 w-10 pt-0.5 flex-shrink-0">{year}</div>
                  <div className="flex-1">
                    <div className="w-full h-px bg-stone-100 mb-3" />
                    <p className="text-sm text-stone-600">{event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">{s.value}</div>
                <div className="text-sm text-stone-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-stone-50 border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-stone-900 mb-3">What we believe</h2>
            <p className="text-stone-500 text-[15px] max-w-xl mx-auto">
              These aren't marketing values. They're the principles every product decision is measured against.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white border border-stone-100 rounded-2xl p-6">
                <div className="text-2xl mb-3">{v.icon}</div>
                <h3 className="text-sm font-semibold text-stone-900 mb-2">{v.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-stone-900 mb-3">The team</h2>
            <p className="text-stone-500 text-[15px]">Clinicians, engineers, designers, and researchers — all with one goal.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {team.map((member) => (
              <div key={member.name} className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold mb-4 ${member.color}`}>
                  {member.avatar}
                </div>
                <div className="text-sm font-semibold text-stone-900">{member.name}</div>
                <div className="text-xs text-stone-400 mb-3">{member.role}</div>
                <p className="text-xs text-stone-500 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/careers" className="text-sm font-medium text-sage-700 hover:text-sage-800 transition-colors">
              Join the team → See open roles
            </Link>
          </div>
        </div>
      </section>

      {/* Clinical advisory */}
      <section className="bg-sage-800 text-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Backed by a clinical advisory board</h2>
          <p className="text-sage-200 text-[15px] leading-relaxed max-w-2xl mx-auto mb-8">
            Everything on MindEase is reviewed by our Clinical Advisory Board — senior practitioners and researchers from Oxford, Johns Hopkins, and the University of Melbourne — before it reaches users.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {["Oxford University", "Johns Hopkins", "Univ. of Melbourne", "NHS Digital", "APA Member"].map((org) => (
              <span key={org} className="text-xs text-sage-300 border border-sage-600 px-4 py-2 rounded-full">{org}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-4">Ready to start?</h2>
          <p className="text-stone-500 text-[15px] mb-8">Free to use, no credit card needed. Cancel anytime.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="bg-sage-700 text-white font-semibold px-8 py-3 rounded-full hover:bg-sage-800 transition-colors text-sm">
              Get started free
            </Link>
            <Link href="/contact" className="border border-stone-200 text-stone-700 font-semibold px-8 py-3 rounded-full hover:bg-stone-50 transition-colors text-sm">
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
