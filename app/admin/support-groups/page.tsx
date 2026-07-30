"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { AdminSupportGroupItem } from "@/lib/types";

const COLOR_OPTIONS = ["bg-sage-100", "bg-blue-100", "bg-purple-100", "bg-amber-100", "bg-yellow-100", "bg-peach-100"];

export default function AdminSupportGroupsPage() {
  const [groups, setGroups] = useState<AdminSupportGroupItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  function load() {
    fetch("/api/admin/support-groups")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => setError("Failed to load support groups."));
  }

  useEffect(() => { load(); }, []);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/support-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, category, color: COLOR_OPTIONS[0] }),
    });
    setCreating(false);
    if (res.ok) {
      const data = await res.json();
      window.location.href = `/admin/support-groups/${data.group.id}`;
    } else {
      setError("Failed to create support group.");
    }
  }

  const filtered = (groups ?? []).filter((g) =>
    !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Support Groups</h1>
          <p className="text-sm text-stone-500 mt-1">{groups?.length ?? 0} group{(groups?.length ?? 0) !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors"
        >
          {showForm ? "Cancel" : "+ New group"}
        </button>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      {showForm && (
        <form onSubmit={createGroup} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="e.g. Anxiety, Grief, Sleep" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={2} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <p className="text-xs text-stone-400">Identity tags and age group can be set after creating the group.</p>
          <button type="submit" disabled={creating} className="bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50">
            {creating ? "Creating…" : "Create group"}
          </button>
        </form>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or category…"
        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
      />

      <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
        {!groups ? (
          <div className="divide-y divide-stone-50 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 px-5 py-4" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-400">No support groups found.</div>
        ) : (
          <div className="divide-y divide-stone-50">
            {filtered.map((g) => (
              <Link key={g.id} href={`/admin/support-groups/${g.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors group">
                <div className={`w-10 h-10 ${g.color} rounded-lg flex items-center justify-center text-lg flex-shrink-0`}>
                  {g.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-medium text-stone-900 group-hover:text-stone-700">{g.name}</span>
                    {g.ageGroup && <span className="text-[10px] px-1.5 py-0.5 rounded border border-stone-200 text-stone-500">{g.ageGroup}</span>}
                    {g.identityTags.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-stone-200 text-stone-500">{g.identityTags.length} identity tag{g.identityTags.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                  <div className="text-xs text-stone-400 truncate">{g.category}</div>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <div className="text-xs text-stone-500">Members</div>
                  <div className="text-xs font-medium text-stone-700">{g.memberCount}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
