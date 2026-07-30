"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import type { AdminSupportGroupItem } from "@/lib/types";
import { IDENTITY_TAGS } from "@/lib/identityTags";
import { AGE_GROUPS } from "@/lib/ageGroups";

const COLOR_OPTIONS = ["bg-sage-100", "bg-blue-100", "bg-purple-100", "bg-amber-100", "bg-yellow-100", "bg-peach-100"];

// No effect-based sync from `value` — callers pass `key={value}` so React remounts
// (and re-seeds local state) whenever the saved value actually changes, e.g. after a
// successful save-and-reload. That's cheaper than an effect and avoids the
// set-state-in-effect purity violation entirely.
function Field({ label, value, onBlurSave }: { label: string; value: string; onBlurSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <div>
      <label className="block text-xs font-medium text-stone-600 mb-1">{label}</label>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { if (v !== value) onBlurSave(v); }}
        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}

function TextField({ value, onBlurSave }: { value: string; onBlurSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <textarea
      rows={3}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { if (v !== value) onBlurSave(v); }}
      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
    />
  );
}

export default function AdminSupportGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [group, setGroup] = useState<AdminSupportGroupItem | null>(null);
  const [error, setError] = useState("");

  function load() {
    fetch(`/api/admin/support-groups/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.group) setGroup(d.group); })
      .catch(() => setError("Failed to load support group."));
  }

  useEffect(() => { load(); }, [id]);

  async function saveDetails(fields: Record<string, unknown>) {
    const res = await fetch(`/api/admin/support-groups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) load();
    else setError("Failed to save support group.");
  }

  function toggleIdentityTag(tagId: string) {
    if (!group) return;
    const next = group.identityTags.includes(tagId)
      ? group.identityTags.filter((t) => t !== tagId)
      : [...group.identityTags, tagId];
    saveDetails({ identityTags: next });
  }

  async function deleteGroup() {
    if (!window.confirm("Permanently delete this support group? This can't be undone.")) return;
    const res = await fetch(`/api/admin/support-groups/${id}`, { method: "DELETE" });
    if (res.ok) window.location.href = "/admin/support-groups";
    else setError("Failed to delete support group.");
  }

  if (!group) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <Link href="/admin/support-groups" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">← Support Groups</Link>
        {error ? (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        ) : (
          <div className="bg-white border border-stone-100 rounded-xl p-5 animate-pulse h-32" />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link href="/admin/support-groups" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">← Support Groups</Link>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      <div className="bg-white border border-stone-100 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-stone-900">Group details</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field key={`name-${group.name}`} label="Name" value={group.name} onBlurSave={(v) => saveDetails({ name: v })} />
          <Field key={`category-${group.category}`} label="Category" value={group.category} onBlurSave={(v) => saveDetails({ category: v })} />
          <Field key={`icon-${group.icon}`} label="Icon (emoji)" value={group.icon} onBlurSave={(v) => saveDetails({ icon: v })} />
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Color</label>
            <select
              value={group.color}
              onChange={(e) => saveDetails({ color: e.target.value })}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
            >
              {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Description</label>
          <TextField key={`description-${group.description}`} value={group.description} onBlurSave={(v) => saveDetails({ description: v })} />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">Age group</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => saveDetails({ ageGroup: null })}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${!group.ageGroup ? "bg-stone-900 border-stone-900 text-white" : "border-stone-200 text-stone-600 hover:border-stone-400"}`}
            >
              Any
            </button>
            {AGE_GROUPS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => saveDetails({ ageGroup: a.id })}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${group.ageGroup === a.id ? "bg-stone-900 border-stone-900 text-white" : "border-stone-200 text-stone-600 hover:border-stone-400"}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">Identity tags</label>
          <div className="flex flex-wrap gap-2">
            {IDENTITY_TAGS.map((t) => {
              const active = group.identityTags.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleIdentityTag(t.id)}
                  title={t.description}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${active ? "bg-stone-900 border-stone-900 text-white" : "border-stone-200 text-stone-600 hover:border-stone-400"}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
          <span className="text-xs text-stone-400">{group.memberCount} member{group.memberCount !== 1 ? "s" : ""}</span>
          <button onClick={deleteGroup} className="text-xs text-red-500 hover:text-red-700 transition-colors">
            Delete group
          </button>
        </div>
      </div>
    </div>
  );
}
