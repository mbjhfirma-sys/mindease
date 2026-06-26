"use client";

import Link from "next/link";
import { useState } from "react";
import { resources } from "@/lib/mockData";

const articles = [
  {
    id: 1,
    title: "How to Start a Daily Mindfulness Practice",
    excerpt: "Even 5 minutes a day can rewire your brain for calm. Here's the no-fluff guide to making it stick.",
    category: "Mindfulness",
    readTime: "5 min",
    emoji: "🧘",
    color: "from-sage-100 to-emerald-50",
    author: "Dr. Sarah Chen",
    authorInitials: "SC",
    trending: true,
    mood: "stressed",
  },
  {
    id: 2,
    title: "Understanding the Anxiety-Sleep Connection",
    excerpt: "Why racing thoughts keep you awake — and the science-backed trick that breaks the cycle for good.",
    category: "Sleep",
    readTime: "7 min",
    emoji: "🌙",
    color: "from-indigo-100 to-purple-50",
    author: "Dr. Amara Johnson",
    authorInitials: "AJ",
    trending: false,
    mood: "anxious",
  },
  {
    id: 3,
    title: "CBT Techniques You Can Use at Home",
    excerpt: "Cognitive behavioral therapy doesn't require a couch. These three exercises work anywhere, anytime.",
    category: "Therapy",
    readTime: "8 min",
    emoji: "🧠",
    color: "from-amber-100 to-yellow-50",
    author: "Dr. Michael Torres",
    authorInitials: "MT",
    trending: true,
    mood: "overwhelmed",
  },
  {
    id: 4,
    title: "The Science of Self-Compassion",
    excerpt: "Turns out being kind to yourself isn't soft — it's one of the most effective things you can do for mental health.",
    category: "Self-Care",
    readTime: "6 min",
    emoji: "💛",
    color: "from-rose-100 to-pink-50",
    author: "Dr. Emma Walsh",
    authorInitials: "EW",
    trending: false,
    mood: "low",
  },
  {
    id: 5,
    title: "10 Grounding Techniques for Acute Anxiety",
    excerpt: "When your nervous system is in overdrive, these quick-fire techniques bring you back to earth fast.",
    category: "Anxiety",
    readTime: "4 min",
    emoji: "🌱",
    color: "from-teal-100 to-cyan-50",
    author: "Dr. Sarah Chen",
    authorInitials: "SC",
    trending: true,
    mood: "anxious",
  },
  {
    id: 6,
    title: "How Stress Affects the Body",
    excerpt: "Stress isn't just in your head — it's in your gut, your immune system, even your DNA. Here's what to do about it.",
    category: "Stress",
    readTime: "9 min",
    emoji: "⚡",
    color: "from-orange-100 to-amber-50",
    author: "Dr. Michael Torres",
    authorInitials: "MT",
    trending: false,
    mood: "stressed",
  },
];

const categories = ["All", "Mindfulness", "Sleep", "Therapy", "Self-Care", "Anxiety", "Stress"];

const moodFilters = [
  { label: "😰 I'm anxious", value: "anxious" },
  { label: "😔 Feeling low", value: "low" },
  { label: "😤 Stressed out", value: "stressed" },
  { label: "🤯 Overwhelmed", value: "overwhelmed" },
];

function ArticleCard({ article, bookmarked, onBookmark }: {
  article: typeof articles[0];
  bookmarked: boolean;
  onBookmark: () => void;
}) {
  const [justSaved, setJustSaved] = useState(false);

  function handleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    onBookmark();
    if (!bookmarked) {
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    }
  }

  return (
    <a
      href={`/resources/articles/${article.id}`}
      className="group relative flex flex-col bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Colourful emoji header */}
      <div className={`bg-gradient-to-br ${article.color} h-28 flex items-center justify-center text-5xl relative`}>
        {article.emoji}
        {article.trending && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-stone-100">
            🔥 Trending
          </span>
        )}
        <button
          onClick={handleBookmark}
          className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-stone-100 shadow-sm hover:scale-110 transition-transform"
        >
          {justSaved ? "✅" : bookmarked ? "🔖" : "🤍"}
        </button>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-sage-100 text-sage-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            {article.category}
          </span>
          <span className="text-stone-300 text-xs">·</span>
          <span className="text-stone-400 text-xs">{article.readTime} read</span>
        </div>

        <h3 className="font-semibold text-stone-800 leading-snug mb-2 group-hover:text-sage-700 transition-colors">
          {article.title}
        </h3>

        <p className="text-stone-500 text-sm leading-relaxed flex-1">
          {article.excerpt}
        </p>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-sage-200 rounded-full flex items-center justify-center text-[10px] font-bold text-sage-800">
              {article.authorInitials}
            </div>
            <span className="text-xs text-stone-400">{article.author}</span>
          </div>
          <span className="text-sage-600 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            Read →
          </span>
        </div>
      </div>
    </a>
  );
}

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());

  const filtered = articles.filter((a) => {
    if (activeMood && a.mood !== activeMood) return false;
    if (activeCategory !== "All" && a.category !== activeCategory) return false;
    return true;
  });

  function toggleBookmark(id: number) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <>
      {/* Header */}
      <section className="py-20 px-6 bg-cream text-center">
        <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">Resources</span>
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mt-2 mb-4">
          Resources for Your Well-being
        </h1>
        <p className="text-stone-500 text-lg max-w-xl mx-auto">
          Free tools, guides, meditations, and more — curated by mental health professionals.
        </p>
      </section>

      {/* Resource categories */}
      <section className="px-6 pb-16 bg-cream">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {resources.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-3xl p-7 border border-stone-100 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className={`w-14 h-14 ${r.color} rounded-2xl flex items-center justify-center text-2xl mb-5`}>
                {r.icon}
              </div>
              <h3 className="font-bold text-stone-800 mb-2 group-hover:text-sage-700 transition-colors">
                {r.title}
              </h3>
              <p className="text-stone-500 text-sm mb-4 leading-relaxed">{r.description}</p>
              <span className="text-sage-600 text-xs font-semibold bg-sage-50 px-3 py-1 rounded-full">
                {r.count}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured articles */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">Latest Articles</h2>
              {bookmarks.size > 0 && (
                <p className="text-xs text-stone-400 mt-0.5">🔖 {bookmarks.size} saved</p>
              )}
            </div>
            <a href="#" className="text-sage-700 text-sm font-semibold hover:underline">View all →</a>
          </div>

          {/* Mood quick-filter */}
          <div className="mb-5">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">How are you feeling?</p>
            <div className="flex flex-wrap gap-2">
              {moodFilters.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setActiveMood(activeMood === m.value ? null : m.value)}
                  className={`text-sm px-4 py-1.5 rounded-full border transition-all ${
                    activeMood === m.value
                      ? "bg-stone-900 text-white border-stone-900"
                      : "border-stone-200 text-stone-600 hover:border-stone-400"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setActiveMood(null); }}
                className={`text-sm px-4 py-1.5 rounded-full font-medium transition-all ${
                  activeCategory === cat && !activeMood
                    ? "bg-sage-700 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Cards */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm">No articles match that filter. Try another!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {filtered.map((a) => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  bookmarked={bookmarks.has(a.id)}
                  onBookmark={() => toggleBookmark(a.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Crisis resources */}
      <section className="py-16 px-6 bg-red-50 border border-red-100">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-3xl mb-4">🆘</div>
          <h2 className="text-2xl font-bold text-stone-900 mb-3">In Crisis? Get Help Now</h2>
          <p className="text-stone-600 mb-6">
            If you're experiencing a mental health crisis, please reach out to a professional immediately.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: "National Suicide Hotline", info: "988 (US)", note: "Call or text 24/7" },
              { name: "Crisis Text Line", info: "Text HOME to 741741", note: "Free, 24/7 support" },
              { name: "International Resources", info: "findahelpline.com", note: "Find local support" },
            ].map((c) => (
              <div key={c.name} className="bg-white rounded-2xl p-5 border border-red-100">
                <div className="font-semibold text-stone-800 text-sm mb-1">{c.name}</div>
                <div className="text-red-600 font-bold mb-1">{c.info}</div>
                <div className="text-stone-400 text-xs">{c.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-cream text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-stone-900 mb-3">Want Personalized Guidance?</h2>
          <p className="text-stone-500 mb-6">Create a free account to track your progress and unlock curated resources.</p>
          <Link
            href="/register"
            className="inline-flex bg-sage-700 text-white font-semibold px-8 py-3 rounded-full hover:bg-sage-800 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </>
  );
}
