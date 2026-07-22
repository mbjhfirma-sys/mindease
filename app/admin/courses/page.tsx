"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { AdminCourseItem } from "@/lib/types";

const COLOR_OPTIONS = ["bg-sage-100", "bg-blue-100", "bg-purple-100", "bg-amber-100", "bg-yellow-100", "bg-peach-100"];

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourseItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState("");
  const [instructor, setInstructor] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("Beginner");

  function load() {
    fetch("/api/admin/courses")
      .then((r) => r.json())
      .then((d) => setCourses(d.courses ?? []))
      .catch(() => setError("Failed to load courses."));
  }

  useEffect(() => { load(); }, []);

  async function createCourse(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, instructor, category, level,
        color: COLOR_OPTIONS[0],
      }),
    });
    setCreating(false);
    if (res.ok) {
      const data = await res.json();
      window.location.href = `/admin/courses/${data.course.id}`;
    } else {
      setError("Failed to create course.");
    }
  }

  const filtered = (courses ?? []).filter((c) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Courses</h1>
          <p className="text-sm text-stone-500 mt-1">{courses?.length ?? 0} course{(courses?.length ?? 0) !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors"
        >
          {showForm ? "Cancel" : "+ New course"}
        </button>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      {showForm && (
        <form onSubmit={createCourse} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Instructor</label>
              <input value={instructor} onChange={(e) => setInstructor(e.target.value)} required className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} required className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm">
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>All Levels</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={creating} className="bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50">
            {creating ? "Creating…" : "Create course"}
          </button>
        </form>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by title or instructor…"
        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
      />

      <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
        {!courses ? (
          <div className="divide-y divide-stone-50 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 px-5 py-4" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-400">No courses found.</div>
        ) : (
          <div className="divide-y divide-stone-50">
            {filtered.map((c) => (
              <Link key={c.id} href={`/admin/courses/${c.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors group">
                <div className={`w-10 h-10 ${c.color ?? "bg-stone-100"} rounded-lg flex items-center justify-center text-lg flex-shrink-0`}>
                  {c.thumbnail ?? "📘"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-medium text-stone-900 group-hover:text-stone-700">{c.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${c.published ? "border-sage-200 text-sage-600" : "border-stone-200 text-stone-400"}`}>
                      {c.published ? "published" : "draft"}
                    </span>
                  </div>
                  <div className="text-xs text-stone-400 truncate">{c.instructor} · {c.category} · {c.level}</div>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <div className="text-xs text-stone-500">Lessons</div>
                  <div className="text-xs font-medium text-stone-700">{c.lessonCount}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
