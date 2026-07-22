"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CATEGORIES = [
  "All", "Anxiety & Worry", "Depression & Mood", "Stress Management", "Sleep & Rest",
  "Mindfulness", "Self-Esteem & Compassion", "Relationships", "Emotional Regulation",
  "Habits & Motivation", "Resilience & Coping",
];

type Article = {
  id: string; slug: string; title: string; category: string; summary: string;
  readTime: string; icon: string; color: string; tags: string[]; completed: boolean;
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    if (debouncedSearch) params.set("q", debouncedSearch);
    fetch(`/api/articles?${params}`)
      .then((r) => r.json())
      .then((d) => { setArticles(d.articles); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category, debouncedSearch]);

  const completedCount = articles.filter((a) => a.completed).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-900">Articles</h1>
          <p className="text-stone-500 mt-0.5 text-sm">Bite-sized, interactive lessons on mental wellbeing</p>
        </div>
        {!loading && articles.length > 0 && (
          <div className="text-right flex-shrink-0 hidden sm:block">
            <div className="text-lg font-bold text-sage-700">{completedCount}/{articles.length}</div>
            <div className="text-xs text-stone-400">read</div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">🔍</span>
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-stone-200 rounded-2xl pl-11 pr-5 py-3 text-sm focus:outline-none focus:border-sage-400 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-sm">✕</button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 text-sm font-medium px-4 py-2 rounded-full border transition-all ${
              category === cat
                ? "bg-sage-700 text-white border-sage-700"
                : "bg-white text-stone-600 border-stone-200 hover:border-sage-400 hover:text-sage-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden border border-stone-100 animate-pulse">
              <div className="h-24 bg-stone-100" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-stone-100 rounded w-1/3" />
                <div className="h-4 bg-stone-100 rounded w-3/4" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="text-stone-400 text-sm">{articles.length} article{articles.length !== 1 ? "s" : ""} found</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/articles/${a.id}`}
                className="bg-white rounded-3xl overflow-hidden border border-stone-100 hover:shadow-lg transition-all group relative"
              >
                {a.completed && (
                  <span className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full bg-sage-600 text-white text-xs flex items-center justify-center font-bold">✓</span>
                )}
                <div className={`${a.color} h-24 flex items-center justify-center text-4xl`}>{a.icon}</div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-sage-700 bg-sage-50 px-2.5 py-0.5 rounded-full truncate min-w-0">{a.category}</span>
                    <span className="text-xs text-stone-400 flex-shrink-0">⏱️ {a.readTime}</span>
                  </div>
                  <h3 className="font-bold text-stone-800 text-sm mb-1 group-hover:text-sage-700 transition-colors leading-snug line-clamp-2">{a.title}</h3>
                  <p className="text-stone-400 text-xs leading-relaxed line-clamp-2">{a.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
