"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
const CATEGORIES = ["All", "Mindfulness", "Mental Health", "Wellness", "Personal Growth", "Stress Management", "Self-Care"];

type Course = {
  id: string; title: string; instructor: string; category: string; level: string;
  duration: string; lessons: number; enrolled: number; rating: number; progress: number;
  thumbnail: string; color: string; description: string; tags: string[];
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    if (debouncedSearch) params.set("q", debouncedSearch);
    fetch(`/api/courses?${params}`)
      .then((r) => r.json())
      .then((d) => { setCourses(d.courses); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category, debouncedSearch]);

  const inProgress = courses.filter((c) => c.progress > 0 && c.progress < 100);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-stone-900">My Courses</h1>
        <p className="text-stone-500 mt-0.5 text-sm">Expert-led mental health courses</p>
      </div>

      {/* In-progress */}
      {!loading && inProgress.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-stone-600 uppercase tracking-wide mb-3">Continue where you left off</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-2 scrollbar-hide">
            {inProgress.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/courses/${c.id}`}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-stone-100 hover:shadow-md transition-all group flex-shrink-0 min-w-[280px] md:min-w-0"
              >
                <div className={`w-12 h-12 ${c.color} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0`}>{c.thumbnail}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-800 text-sm truncate group-hover:text-sage-700 transition-colors">{c.title}</h3>
                  <p className="text-stone-400 text-xs mb-2">{c.instructor}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-stone-100 rounded-full h-1.5">
                      <div className="bg-sage-500 h-1.5 rounded-full" style={{ width: `${c.progress}%` }} />
                    </div>
                    <span className="text-xs text-stone-400 flex-shrink-0">{c.progress}%</span>
                  </div>
                </div>
                <span className="text-sage-500 flex-shrink-0">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">🔍</span>
        <input
          type="text"
          placeholder="Search courses or instructors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-stone-200 rounded-2xl pl-11 pr-5 py-3 text-sm focus:outline-none focus:border-sage-400 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-sm">✕</button>
        )}
      </div>

      {/* Category chips — horizontal scroll on mobile */}
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

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden border border-stone-100 animate-pulse">
              <div className="h-28 bg-stone-100" />
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
          <p className="text-stone-400 text-sm">{courses.length} course{courses.length !== 1 ? "s" : ""} found</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/courses/${c.id}`}
                className="bg-white rounded-3xl overflow-hidden border border-stone-100 hover:shadow-lg transition-all group"
              >
                <div className={`${c.color} h-28 flex items-center justify-center text-5xl`}>{c.thumbnail}</div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-sage-700 bg-sage-50 px-2.5 py-0.5 rounded-full">{c.category}</span>
                    <span className="text-xs text-stone-400">{c.level}</span>
                  </div>
                  <h3 className="font-bold text-stone-800 text-sm mb-1 group-hover:text-sage-700 transition-colors leading-snug line-clamp-2">{c.title}</h3>
                  <p className="text-stone-400 text-xs mb-2">{c.instructor}</p>
                  <p className="text-stone-400 text-xs leading-relaxed mb-3 line-clamp-2">{c.description}</p>
                  <div className="flex items-center justify-between text-xs text-stone-400 border-t border-stone-50 pt-3">
                    <span>📖 {c.lessons}</span>
                    <span>⏱️ {c.duration}</span>
                    <span className="flex items-center gap-0.5"><span className="text-amber-400">★</span><span className="text-stone-600 font-medium">{c.rating}</span></span>
                  </div>
                  {c.progress > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-stone-100 rounded-full h-1.5">
                        <div className="bg-sage-500 h-1.5 rounded-full" style={{ width: `${c.progress}%` }} />
                      </div>
                      <div className="text-xs text-stone-400 mt-1">{c.progress}% complete</div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
