"use client";

import { useState } from "react";
import { X, ExternalLink } from "lucide-react";

type Article = {
  outlet: string;
  logo: string;
  headline: string;
  subheading: string;
  author: string;
  date: string;
  readTime: string;
  quote: string;
  body: string[];
  url: string;
  color: string;
  logoColor: string;
  featured?: boolean;
};

const coverage: Article[] = [
  {
    outlet: "TIME",
    logo: "TIME",
    headline: "The App Bringing Therapy to the Gaps Between Sessions",
    subheading: "YouMindo is quietly doing what hundreds of mental health apps have promised and failed to deliver.",
    author: "Eleanor Marsh",
    date: "May 14, 2026",
    readTime: "8 min read",
    quote: "YouMindo is quietly doing what hundreds of mental health apps have promised and failed to deliver: making evidence-based care genuinely continuous.",
    body: [
      "It's 11:43 on a Tuesday night, and Sarah, 29, is having a panic attack. Her therapist is asleep. Her next appointment isn't until Thursday. Three years ago, she would have been alone with it. Tonight, she opens YouMindo, starts a guided breathing exercise, and begins filling out a thought record she'll share with her therapist in two days.",
      "This is the gap that YouMindo was built to fill — the 166 hours between a weekly therapy session that most mental health apps have promised to address, and almost none have. The idea isn't new. But the execution, built by a team led by Dr. Sarah Chen, a London-based clinical psychologist who walked away from a thriving private practice to build it, is something different.",
      "\"I kept watching my patients make genuine progress in session and then lose it between appointments,\" Dr. Chen told TIME from her office in East London. \"There was no scaffolding. They'd go home, the week would happen to them, and by the time I saw them again, half the work had unravelled. I needed to build the scaffolding.\"",
      "The scaffolding, as YouMindo calls it, is a combination of structured journalling, daily mood tracking, cognitive-behavioural exercises, a peer support community, and a direct line between clients and their therapists — not for messaging, but for data. Therapists see how their clients' week actually went before the session begins. It changes the entire conversation.",
      "The results are striking. In an independent study published in the Journal of Digital Mental Health earlier this year, YouMindo users reported a 47% reduction in anxiety symptoms after eight weeks — more than double the improvement seen in a control group using standard self-help resources. Ninety-four percent said they felt 'more supported between sessions' than they had before.",
      "None of this means apps should replace therapists, and Dr. Chen is emphatic about that. YouMindo's therapist network — over 1,200 licensed practitioners — is central to the product, not optional. \"We're not trying to be therapy,\" she says. \"We're trying to make therapy work better.\"",
    ],
    url: "#",
    color: "bg-red-600",
    logoColor: "text-white",
    featured: true,
  },
  {
    outlet: "TechCrunch",
    logo: "TC",
    headline: "YouMindo Raises $40M Series B to Expand Therapist Network",
    subheading: "The round, led by a16z, values YouMindo at $280M and marks one of the largest mental health tech raises in Europe this year.",
    author: "James Kovacs",
    date: "March 3, 2026",
    readTime: "5 min read",
    quote: "The round, led by Andreessen Horowitz, values YouMindo at $280M and marks one of the largest mental health tech raises in Europe this year.",
    body: [
      "Mental health platform YouMindo has closed a $40 million Series B round led by Andreessen Horowitz, with participation from existing investors LocalGlobe and Balderton Capital. The raise values the London-based company at approximately $280 million — a significant step up from the $75 million valuation it carried after its Series A in 2023.",
      "The funds will be used primarily to expand YouMindo's therapist network, currently at 1,200 licensed practitioners across the UK, US, and Australia, to 5,000 by the end of 2027. A portion will also go toward launching in six new markets, including Canada, Germany, and the Netherlands.",
      "\"We've proved the model works at this scale,\" said YouMindo CEO and co-founder Dr. Sarah Chen in a statement. \"Now we need to build the infrastructure to make it work at ten times the scale. That means more therapists, more languages, and more clinical rigour as we grow.\"",
      "YouMindo currently serves over 280,000 users across 34 countries and has seen revenue grow 180% year-over-year. Unlike many consumer wellness apps, the company generates revenue through a mix of individual subscriptions and B2B contracts with NHS trusts and private insurers, giving it an unusually diversified revenue base for a company at this stage.",
      "Martin Holt, General Partner at Andreessen Horowitz who led the deal, cited YouMindo's clinical outcomes as the key differentiator. \"There are a hundred apps telling people to meditate. YouMindo is actually measuring whether it's working and publishing the results. That's rare, and it matters.\"",
      "The company says it plans to remain profitable at current scale while deploying the new capital for growth — a deliberate choice, according to CTO Marcus Webb, to avoid the trap of growth-at-all-costs that has felled several mental health unicorns in recent years.",
    ],
    url: "#",
    color: "bg-emerald-600",
    logoColor: "text-white",
  },
  {
    outlet: "Forbes",
    logo: "F",
    headline: "How YouMindo Is Closing the Mental Health Access Gap",
    subheading: "At a time when NHS waiting lists stretch past 18 months, YouMindo's hybrid model offers a glimpse of what the future of mental health care could look like.",
    author: "Priya Nair",
    date: "February 18, 2026",
    readTime: "6 min read",
    quote: "At a time when NHS waiting lists stretch past 18 months, YouMindo's hybrid model offers a glimpse of what the future of mental health care could look like.",
    body: [
      "In January 2026, NHS England reported that the average wait time for mental health support had reached 19.3 weeks — a record high. For many patients, especially those with moderate anxiety or depression who don't meet the threshold for urgent care, waiting nearly five months for a first appointment is simply not viable.",
      "YouMindo's hybrid model doesn't solve the supply problem — there aren't suddenly more therapists — but it does something arguably more important: it makes the therapists who do exist dramatically more effective. By giving clinicians real-time data on their clients' mood, sleep, thought patterns, and completed exercises, sessions become more targeted. Therapists report spending less time on \"what happened this week\" and more on the actual therapeutic work.",
      "\"In traditional therapy, the clinician is working half-blind,\" says Dr. Priya Patel, YouMindo's Chief Clinical Officer. \"You see someone for 50 minutes once a week. They're usually presenting their best self, or a curated version of the week. Our data gives the therapist a much more accurate picture.\"",
      "For NHS trusts, this efficiency gain has real financial implications. YouMindo has published data from a partnership with two NHS mental health trusts showing that clients using the platform alongside therapy required, on average, 22% fewer sessions to reach treatment goals. For a service under enormous capacity pressure, that's significant.",
      "The company has also thought carefully about the patients who can't access therapy at all. Its free tier — which includes unlimited mood tracking, a full library of CBT exercises, and access to the peer support community — is used by approximately 60% of its users who have no therapist on the platform. For these users, YouMindo is the only structured mental health support they have.",
      "Whether apps can substitute for therapy is still debated among clinicians. But as waiting lists grow and funding shrinks, the more important question may be: given the alternative is nothing, what role can they play?",
    ],
    url: "#",
    color: "bg-blue-700",
    logoColor: "text-white",
  },
  {
    outlet: "Psychology Today",
    logo: "PT",
    headline: "Digital CBT Tools: A Clinical Perspective",
    subheading: "We put YouMindo's therapeutic features through a rigorous clinical lens. What we found surprised us.",
    author: "Dr. Richard Osei, PhD",
    date: "January 9, 2026",
    readTime: "7 min read",
    quote: "The structured journalling and thought-record features show real clinical sophistication. This isn't gamified wellness — it's a genuine extension of the therapeutic process.",
    body: [
      "As a clinical psychologist who has been practising CBT for over 15 years, I have viewed the proliferation of mental health apps with considerable scepticism. Most are thin wrappers around mindfulness audio tracks or mood emoji — aesthetically pleasing but clinically shallow. I expected YouMindo to be more of the same.",
      "I was wrong. What YouMindo has built in its thought record and behavioural activation tools is a genuine, if simplified, implementation of core CBT techniques. The thought record follows the standard ABC model — Activating event, Beliefs, Consequences — and guides users through cognitive restructuring in a way that, while not a substitute for a trained clinician, is clinically sound.",
      "The sleep module is particularly impressive. It implements a digital version of sleep restriction therapy and sleep hygiene education that closely mirrors published clinical protocols. I would not have expected to see sleep restriction therapy — a technique that requires careful pacing and is genuinely challenging for patients — implemented responsibly in a consumer app. YouMindo manages it.",
      "My primary concern, shared with the company directly, is around the boundary between self-guided tools and clinical intervention. Users in acute distress need to be directed to appropriate human support, not handed another exercise. To their credit, YouMindo has invested significantly in crisis detection and escalation pathways — the app surfaces crisis resources proactively when certain mood patterns are detected.",
      "The therapist integration is where YouMindo genuinely separates itself from competitors. The ability for clinicians to see client data, assign targeted exercises, and review journal entries before sessions is a meaningful clinical tool. I have begun recommending it to clients and, tentatively, to colleagues.",
      "This is not a replacement for therapy. But as digital adjuncts to clinical care go, YouMindo is the most clinically rigorous tool I have reviewed.",
    ],
    url: "#",
    color: "bg-purple-700",
    logoColor: "text-white",
  },
  {
    outlet: "Wired",
    logo: "W",
    headline: "Can an App Actually Make You Mentally Healthier?",
    subheading: "We looked at the evidence. The honest answer, based on YouMindo's published outcome data, is: probably yes — for some people, some of the time.",
    author: "Chloe Winters",
    date: "December 2, 2025",
    readTime: "9 min read",
    quote: "The honest answer, based on YouMindo's published outcome data, appears to be yes — at least for mild to moderate anxiety and depression.",
    body: [
      "The mental health app market is estimated to be worth $6 billion globally and is growing at roughly 16% per year. Nearly all of that value is built on an assumption that has, until recently, received relatively little independent scrutiny: that the apps work.",
      "Most don't, or at least not verifiably. A 2024 review of 494 mental health apps in the App Store found that only 3.4% cited any peer-reviewed evidence for their efficacy. Of those, most studies were funded by the companies themselves, had tiny sample sizes, or had follow-up periods of less than four weeks.",
      "YouMindo is one of the exceptions. The company has published three independent outcome studies in the past two years, the most recent of which appeared in JAMA Psychiatry in November. That study, a randomised controlled trial with 1,200 participants across the UK and US, found statistically significant reductions in GAD-7 and PHQ-9 scores — standard measures of anxiety and depression — after eight and sixteen weeks of use.",
      "The effect sizes are modest by clinical standards: comparable to what you might expect from a guided self-help programme, and meaningfully smaller than face-to-face CBT. But the comparison may be unfair. For the majority of people who can't access therapy at all, 'modest' beats 'nothing' by a significant margin.",
      "The more interesting finding in the JAMA study was the interaction effect between app use and concurrent therapy. Users who were seeing a therapist and using YouMindo showed outcomes roughly 35% better than users who were doing either alone. This is what YouMindo's founders have always claimed the product is for: augmentation, not replacement.",
      "The study is not without limitations. All participants were self-selected, which likely means they were more motivated than average. And eight weeks is still a short window for measuring mental health outcomes. But in a market full of unsubstantiated claims, publishing an RCT in JAMA is a meaningful act of intellectual honesty.",
    ],
    url: "#",
    color: "bg-stone-900",
    logoColor: "text-white",
  },
  {
    outlet: "The Guardian",
    logo: "G",
    headline: "YouMindo and the Quest to Democratise Therapy",
    subheading: "What's striking about YouMindo's approach is the refusal to pretend that technology alone is the answer.",
    author: "Amara Diallo",
    date: "October 21, 2025",
    readTime: "7 min read",
    quote: "What's striking about YouMindo's approach is the refusal to pretend that technology alone is the answer. It positions itself as a bridge, not a replacement.",
    body: [
      "In the summer of 2023, Nina Okafor was referred to an NHS mental health service after a period of severe depression. She was told the waiting time for therapy would be approximately 14 months. \"I cried when I heard that,\" she tells me over coffee in Hackney. \"Not because I was surprised, but because I was. I knew it was bad but I didn't think it was that bad.\"",
      "Today, Okafor is the Head of Community at YouMindo — a turn of events she describes as the kind of thing that only makes sense in retrospect. During her wait for NHS therapy, she found YouMindo through a friend. She started using it daily. \"It wasn't therapy,\" she says carefully. \"But it was structure when I had none. It was somewhere to put the thoughts.\" When her appointment finally came, she was, by her account, significantly further along in her recovery than she would have been otherwise.",
      "YouMindo's origin story is not unusual in the mental health space. What distinguishes it is the care with which the founders have thought about what technology can and cannot do. Dr. Sarah Chen, who left a successful private practice to start the company, is almost anxiously precise about the limits of her product. \"I've seen what good therapy looks like,\" she says. \"We're not that. We're trying to be the thing that makes the therapy work better, or that fills the gap when therapy isn't available. Those are two different things, and we try to be honest about which one we're doing for which user.\"",
      "This clarity of purpose runs through the product in ways that are easy to miss. Unlike most wellness apps, YouMindo has a crisis detection system that actively monitors for language and mood patterns associated with suicidal ideation and escalates to human support. It has a formal clinical advisory board that reviews all content before publication. Its free tier is genuinely full-featured — not a funnel.",
      "The company is not without tensions. Scaling a mental health service inevitably involves trade-offs between clinical rigour and commercial growth. The therapist network, currently 1,200 strong, is growing faster than the company's capacity to verify credentials to its own standards. Chen acknowledges this. \"We are being stretched,\" she says. \"We know it.\"",
      "But in a sector where most companies have outsourced their conscience to the marketing department, YouMindo's willingness to say it out loud feels significant.",
    ],
    url: "#",
    color: "bg-blue-600",
    logoColor: "text-white",
  },
];

const awards = [
  { title: "Best Mental Health App 2025", body: "App Store Editorial", icon: "🏆" },
  { title: "Digital Health Innovation Award", body: "NHS Digital — 2025", icon: "🥇" },
  { title: "Top Startup to Watch", body: "Forbes Europe — 2024", icon: "⭐" },
  { title: "Editor's Choice", body: "Google Play — 2024", icon: "🎖️" },
];

export default function PressPage() {
  const [active, setActive] = useState<Article | null>(null);

  const featured = coverage.find((a) => a.featured)!;
  const rest = coverage.filter((a) => !a.featured);

  return (
    <div>
      {/* Hero */}
      <section className="bg-sage-800 text-white">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="max-w-xl">
            <div className="text-xs text-sage-300 uppercase tracking-widest font-medium mb-4">Press & Media</div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
              YouMindo in the news
            </h1>
            <p className="text-sage-200 text-[17px] leading-relaxed mb-8">
              We're building in the open. For press enquiries, interview requests, or appearances — reach out to our press team directly.
            </p>
            <a
              href="mailto:press@youmindo.com"
              className="inline-flex items-center justify-center gap-2 bg-white text-stone-900 text-sm font-semibold px-6 py-3 rounded-full hover:bg-stone-100 transition-colors"
            >
              ✉️ press@youmindo.com
            </a>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "280,000+", label: "Users worldwide" },
              { value: "$40M", label: "Total funding" },
              { value: "34", label: "Countries" },
              { value: "2021", label: "Founded" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-bold text-stone-900 mb-1">{s.value}</div>
                <div className="text-xs text-stone-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="bg-stone-50 border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="text-xl font-bold text-stone-900 mb-8">Recent coverage</h2>

          {/* Featured */}
          <button
            onClick={() => setActive(featured)}
            className="w-full text-left group mb-5"
          >
            <div className="bg-white border border-stone-100 rounded-2xl overflow-hidden hover:border-stone-300 hover:shadow-md transition-all">
              <div className={`${featured.color} px-6 py-5 flex items-center gap-4`}>
                <div className={`text-lg font-black tracking-tight ${featured.logoColor}`}>{featured.logo}</div>
                <div className={`h-4 w-px bg-white/30`} />
                <div className={`text-xs font-medium ${featured.logoColor} opacity-80`}>{featured.date} · {featured.readTime}</div>
                <span className={`ml-auto text-xs font-semibold ${featured.logoColor} opacity-70 border border-white/30 px-2.5 py-1 rounded-full`}>Featured</span>
              </div>
              <div className="px-6 py-6">
                <h3 className="text-lg font-bold text-stone-900 mb-2 leading-snug group-hover:text-sage-700 transition-colors">
                  {featured.headline}
                </h3>
                <p className="text-sm text-stone-500 leading-relaxed mb-4">{featured.subheading}</p>
                <blockquote className="border-l-2 border-stone-200 pl-4 text-sm text-stone-500 italic leading-relaxed">
                  "{featured.quote}"
                </blockquote>
                <div className="flex items-center gap-2 mt-5">
                  <span className="text-xs text-stone-400">By {featured.author}</span>
                  <span className="text-xs text-stone-300">·</span>
                  <span className="text-xs text-sage-700 font-medium group-hover:underline">Read full article →</span>
                </div>
              </div>
            </div>
          </button>

          {/* Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map((item) => (
              <button
                key={item.headline}
                onClick={() => setActive(item)}
                className="text-left group"
              >
                <div className="bg-white border border-stone-100 rounded-2xl overflow-hidden hover:border-stone-300 hover:shadow-sm transition-all h-full flex flex-col">
                  <div className={`${item.color} px-4 py-3 flex items-center gap-3`}>
                    <span className={`text-sm font-black tracking-tight ${item.logoColor}`}>{item.logo}</span>
                    <span className={`text-[10px] font-medium ${item.logoColor} opacity-70`}>{item.date}</span>
                  </div>
                  <div className="px-5 py-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-semibold text-stone-900 mb-2.5 leading-snug group-hover:text-sage-700 transition-colors">
                      {item.headline}
                    </h3>
                    <p className="text-xs text-stone-400 leading-relaxed italic flex-1">"{item.quote.slice(0, 120)}…"</p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-50">
                      <span className="text-[10px] text-stone-400">{item.readTime}</span>
                      <span className="text-[10px] text-sage-700 font-medium group-hover:underline">Read →</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Awards */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="text-xl font-bold text-stone-900 mb-8">Recognition</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {awards.map((award) => (
              <div key={award.title} className="bg-stone-50 border border-stone-100 rounded-2xl p-5 text-center">
                <div className="text-3xl mb-3">{award.icon}</div>
                <div className="text-xs font-semibold text-stone-800 mb-1">{award.title}</div>
                <div className="text-[10px] text-stone-400">{award.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-sage-800 text-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">Press contact</h2>
              <p className="text-sage-200 text-[15px] leading-relaxed mb-6">
                We aim to respond to all press enquiries within 24 hours on business days. For urgent requests, please mark your subject line URGENT.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sage-400">✉️</span>
                  <a href="mailto:press@youmindo.com" className="text-white text-sm hover:text-sage-200 transition-colors">press@youmindo.com</a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sage-400">📞</span>
                  <span className="text-sage-200 text-sm">+44 20 7946 0958</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sage-400">📍</span>
                  <span className="text-sage-200 text-sm">YouMindo Ltd · 30 Cannon Street · London · EC4M 6XH</span>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Spokesperson availability</h2>
              <div className="space-y-4">
                {[
                  { name: "Dr. Sarah Chen", role: "CEO & Co-Founder", topics: "Company strategy, mental health access, digital therapeutics" },
                  { name: "Dr. Priya Patel", role: "Chief Clinical Officer", topics: "Clinical research, CBT, evidence-based digital care" },
                  { name: "Tom Walsh", role: "Head of Research", topics: "Outcome data, AI in mental health, peer support research" },
                ].map((s) => (
                  <div key={s.name} className="bg-sage-700/40 rounded-xl p-4">
                    <div className="text-sm font-semibold text-white">{s.name}</div>
                    <div className="text-xs text-sage-300 mb-1">{s.role}</div>
                    <div className="text-xs text-sage-400">Topics: {s.topics}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Article reader modal ───────────────────────────────────────── */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setActive(null)} />
          <div className="relative bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 flex flex-col max-h-[92dvh] sm:max-h-[88dvh]">

            {/* Outlet header */}
            <div className={`${active.color} px-6 py-4 flex items-center gap-4 rounded-t-2xl flex-shrink-0`}>
              <span className={`text-base font-black tracking-tight ${active.logoColor}`}>{active.logo}</span>
              <div className={`h-4 w-px bg-white/30`} />
              <span className={`text-xs font-medium ${active.logoColor} opacity-80`}>{active.outlet}</span>
              <span className={`text-xs ${active.logoColor} opacity-60`}>·</span>
              <span className={`text-xs ${active.logoColor} opacity-70`}>{active.date}</span>
              <span className={`text-xs ${active.logoColor} opacity-60`}>·</span>
              <span className={`text-xs ${active.logoColor} opacity-70`}>{active.readTime}</span>
              <button
                onClick={() => setActive(null)}
                className={`ml-auto ${active.logoColor} opacity-70 hover:opacity-100 transition-opacity`}
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Scrollable article content */}
            <div className="overflow-y-auto flex-1 px-6 py-6">
              <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-3">
                By {active.author}
              </p>
              <h2 className="text-xl font-bold text-stone-900 leading-snug mb-2">{active.headline}</h2>
              <p className="text-stone-500 text-sm leading-relaxed mb-6 italic">{active.subheading}</p>

              {/* Pull quote */}
              <blockquote className="bg-stone-50 border-l-4 border-stone-900 rounded-r-xl px-5 py-4 mb-6">
                <p className="text-sm text-stone-700 italic leading-relaxed">"{active.quote}"</p>
              </blockquote>

              {/* Body paragraphs */}
              <div className="space-y-4">
                {active.body.map((para, i) => (
                  <p key={i} className="text-[15px] text-stone-700 leading-relaxed">{para}</p>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-stone-100 px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0 bg-white rounded-b-2xl">
              <span className="text-xs text-stone-400">Originally published in {active.outlet} · {active.date}</span>
              <a
                href={active.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage-700 hover:text-sage-800 transition-colors flex-shrink-0"
              >
                Read original <ExternalLink size={12} strokeWidth={2} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
