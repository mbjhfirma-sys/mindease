"use client";

import Link from "next/link";
import { useState } from "react";

type Article = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  featured?: boolean;
  cover: string;
};

const categories = ["All", "Research", "Guides", "Product", "Community", "Clinical"];

const articles: Article[] = [
  {
    slug: "consistency-beats-intensity",
    category: "Research",
    title: "Why Consistency Beats Intensity in Mental Health Care",
    excerpt: "A single two-hour session can't compete with five minutes every day. New research explains why habit-based care outperforms intensive bursts — and what it means for how we design support.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    date: "Jun 18, 2026",
    readTime: "6 min",
    featured: true,
    cover: "🧠",
  },
  {
    slug: "mood-tracking-science",
    category: "Product",
    title: "The Science Behind Our Mood Tracking Algorithm",
    excerpt: "We rebuilt our mood model from scratch. Here's what we learned from two years of outcome data, 14 clinical advisors, and a lot of heated debates.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    date: "Jun 12, 2026",
    readTime: "8 min",
    cover: "📊",
  },
  {
    slug: "signs-you-might-benefit-from-therapy",
    category: "Guides",
    title: "5 Signs You Might Benefit From Online Therapy",
    excerpt: "Therapy isn't just for crisis. These five patterns — which often go unnoticed — are reliable signals that professional support could make a real difference.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "Jun 6, 2026",
    readTime: "5 min",
    cover: "💬",
  },
  {
    slug: "cbt-pocket",
    category: "Clinical",
    title: "CBT in Your Pocket: Evidence-Based Therapy for Everyone",
    excerpt: "Cognitive-behavioural therapy has the strongest evidence base of any psychological intervention. But access has always been a barrier. That's what we're changing.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    date: "May 28, 2026",
    readTime: "7 min",
    cover: "🔬",
  },
  {
    slug: "safe-online-communities",
    category: "Community",
    title: "Building Safe Online Communities for Mental Health",
    excerpt: "The internet can be a harmful place for vulnerable people. We spent 18 months designing our community spaces with clinical input to change that. Here's what we built.",
    author: "Nina Okafor",
    authorRole: "Head of Community",
    date: "May 20, 2026",
    readTime: "9 min",
    cover: "🤝",
  },
  {
    slug: "sleep-anxiety-cycle",
    category: "Guides",
    title: "Sleep and Anxiety: Breaking the Cycle",
    excerpt: "Poor sleep worsens anxiety. Anxiety worsens sleep. This evidence-based guide explains the loop and gives you four techniques to interrupt it tonight.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "May 14, 2026",
    readTime: "6 min",
    cover: "🌙",
  },
  {
    slug: "therapist-burnout",
    category: "Clinical",
    title: "Therapist Burnout Is a Patient Safety Issue",
    excerpt: "When therapists burn out, patients suffer. Our new tools for therapists are designed around one insight: clinicians need support too.",
    author: "Marcus Webb",
    authorRole: "CTO & Co-Founder",
    date: "May 5, 2026",
    readTime: "5 min",
    cover: "🏥",
  },
  {
    slug: "peer-support-evidence",
    category: "Research",
    title: "What the Research Says About Peer Support",
    excerpt: "Peer support has been dismissed as soft or unscientific. A growing body of RCTs says otherwise. We review the evidence and explain how MindEase's community is built on it.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    date: "Apr 29, 2026",
    readTime: "10 min",
    cover: "📖",
  },
  {
    slug: "ai-in-mental-health",
    category: "Product",
    title: "How We're Using AI Responsibly in Mental Health Care",
    excerpt: "AI in mental health is genuinely exciting and genuinely risky. Here's exactly what we do — and don't do — and why we've drawn those lines where we have.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "Apr 21, 2026",
    readTime: "7 min",
    cover: "🤖",
  },
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const featured = articles.find((a) => a.featured)!;
  const filtered = articles
    .filter((a) => !a.featured)
    .filter((a) => activeCategory === "All" || a.category === activeCategory);

  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-4">MindEase Blog</div>
          <h1 className="text-4xl font-bold text-stone-900 mb-4">
            Insights on mental health, science, and care
          </h1>
          <p className="text-stone-500 text-[15px] max-w-xl mx-auto">
            Written by clinicians, researchers, and the team building MindEase. No fluff — just things worth reading.
          </p>
        </div>
      </section>

      {/* Featured article */}
      <section className="bg-sage-800 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-xs text-sage-300 uppercase tracking-widest font-medium mb-6">Featured</div>
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-shrink-0 w-24 h-24 bg-sage-700 rounded-2xl flex items-center justify-center text-5xl">
              {featured.cover}
            </div>
            <div className="flex-1">
              <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">{featured.category}</span>
              <h2 className="text-2xl font-bold text-white mt-2 mb-3 leading-snug">{featured.title}</h2>
              <p className="text-sage-200 text-sm leading-relaxed mb-5">{featured.excerpt}</p>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-sage-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {featured.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">{featured.author}</div>
                    <div className="text-[10px] text-sage-400">{featured.date} · {featured.readTime} read</div>
                  </div>
                </div>
                <Link
                  href={`/blog/${featured.slug}`}
                  className="ml-auto text-sm font-semibold text-white border border-sage-500 hover:border-white px-5 py-2 rounded-full transition-colors"
                >
                  Read article →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category filter */}
      <section className="bg-white border-b border-stone-100 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-none py-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 text-xs font-medium px-4 py-1.5 rounded-full transition-all ${
                  activeCategory === cat
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Article grid */}
      <section className="bg-stone-50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-sm">No articles in this category yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((article) => (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="group bg-white border border-stone-100 rounded-2xl overflow-hidden hover:border-stone-300 hover:shadow-sm transition-all"
                >
                  <div className="h-28 bg-stone-50 flex items-center justify-center text-4xl border-b border-stone-100">
                    {article.cover}
                  </div>
                  <div className="p-5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-sage-700">{article.category}</span>
                    <h3 className="text-sm font-semibold text-stone-900 mt-1.5 mb-2 leading-snug group-hover:text-sage-700 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed line-clamp-3">{article.excerpt}</p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-stone-100 rounded-full flex items-center justify-center text-[9px] font-bold text-stone-600">
                          {article.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="text-[10px] text-stone-400">{article.author.replace("Dr. ", "")}</span>
                      </div>
                      <span className="text-[10px] text-stone-400">{article.readTime} read</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-white border-t border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-xl font-bold text-stone-900 mb-3">Get new articles in your inbox</h2>
          <p className="text-stone-500 text-sm mb-6">Weekly, no spam. Unsubscribe any time.</p>
          <form className="flex gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 border border-stone-200 text-sm px-4 py-2.5 rounded-full focus:outline-none focus:border-sage-400"
            />
            <button
              type="submit"
              className="bg-sage-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-sage-800 transition-colors flex-shrink-0"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
