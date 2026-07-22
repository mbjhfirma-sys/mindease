"use client";

import { useState, useEffect } from "react";
import { Check, Plus, X } from "lucide-react";
import { SPECIALIZATION_LABELS, MODALITY_SUGGESTIONS } from "@/lib/specializations";
import { PROFESSION_TYPES } from "@/lib/professionTypes";
import { LANGUAGE_SUGGESTIONS } from "@/lib/languages";
import { AGE_GROUPS } from "@/lib/ageGroups";

type Profile = {
  title: string;
  bio: string;
  approach: string;
  yearsOfExperience: string;
  licenseNumber: string;
  specializations: string[];
  modalities: string[];
  education: string[];
  languages: string[];
  maxClients: string;
  professionType: string;
  gender: string;
  ageGroupsServed: string[];
};

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
        active
          ? "border-sage-600 bg-sage-50 text-sage-800"
          : "border-stone-200 hover:border-stone-300 bg-white text-stone-600"
      }`}
    >
      {label}
    </button>
  );
}

function TagInput({
  label, values, onChange, suggestions, placeholder,
}: {
  label: string; values: string[]; onChange: (v: string[]) => void;
  suggestions?: string[]; placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const lower = input.toLowerCase();
  const filtered = suggestions?.filter(
    (s) => s.toLowerCase().includes(lower) && !values.includes(s)
  ) ?? [];

  function add(val: string) {
    const v = val.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  }
  function remove(v: string) { onChange(values.filter((x) => x !== v)); }

  return (
    <div>
      <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 text-xs font-medium bg-stone-100 text-stone-700 pl-2.5 pr-1.5 py-1 rounded-full">
            {v}
            <button type="button" onClick={() => remove(v)} className="text-stone-400 hover:text-stone-700 transition-colors">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(input); } }}
            placeholder={placeholder ?? `Type and press Enter…`}
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
          />
          <button
            type="button"
            onClick={() => add(input)}
            disabled={!input.trim()}
            className="px-3 py-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 disabled:opacity-30 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        {input && filtered.length > 0 && (
          <div className="absolute z-10 top-full left-0 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
            {filtered.slice(0, 6).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListInput({ label, values, onChange, placeholder }: {
  label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  function update(i: number, val: string) {
    const next = [...values];
    next[i] = val;
    onChange(next);
  }
  function remove(i: number) { onChange(values.filter((_, j) => j !== i)); }
  function add() { onChange([...values, ""]); }

  return (
    <div>
      <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">{label}</label>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={v}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
            />
            <button type="button" onClick={() => remove(i)} className="text-stone-300 hover:text-red-500 transition-colors px-2">
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors mt-1"
        >
          <Plus size={13} /> Add entry
        </button>
      </div>
    </div>
  );
}

export default function TherapistSettingsPage() {
  const [profile, setProfile] = useState<Profile>({
    title: "", bio: "", approach: "", yearsOfExperience: "",
    licenseNumber: "", specializations: [], modalities: [], education: [], languages: [], maxClients: "",
    professionType: "", gender: "", ageGroupsServed: [],
  });
  const [activeClients, setActiveClients] = useState(0);
  const [loading, setSaving_] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch("/api/therapist/profile")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => {
        if (d.profile) {
          setProfile({
            title:             d.profile.title ?? "",
            bio:               d.profile.bio ?? "",
            approach:          d.profile.approach ?? "",
            yearsOfExperience: d.profile.yearsOfExperience?.toString() ?? "",
            licenseNumber:     d.profile.licenseNumber ?? "",
            specializations:   d.profile.specializations ?? [],
            modalities:        d.profile.modalities ?? [],
            education:         d.profile.education ?? [],
            languages:         d.profile.languages ?? [],
            maxClients:        d.profile.maxClients?.toString() ?? "",
            professionType:    d.profile.professionType ?? "",
            gender:            d.profile.gender ?? "",
            ageGroupsServed:   d.profile.ageGroupsServed ?? [],
          });
          setActiveClients(d.profile.activeClients ?? 0);
        }
      })
      .catch(() => {})
      .finally(() => setSaving_(false));
  }, []);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/therapist/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:             profile.title || undefined,
          bio:               profile.bio   || undefined,
          approach:          profile.approach || undefined,
          yearsOfExperience: (() => { const n = parseInt(profile.yearsOfExperience); return isNaN(n) ? undefined : n; })(),
          licenseNumber:     profile.licenseNumber || undefined,
          specializations:   profile.specializations,
          modalities:        profile.modalities,
          education:         profile.education.filter(Boolean),
          languages:         profile.languages,
          maxClients:        (() => { if (!profile.maxClients.trim()) return null; const n = parseInt(profile.maxClients); return isNaN(n) ? undefined : n; })(),
          professionType:    profile.professionType || undefined,
          gender:            profile.gender || undefined,
          ageGroupsServed:   profile.ageGroupsServed,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ? `Save failed: ${JSON.stringify(body.error)}` : "Failed to save. Please try again.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        {[1,2,3].map((i) => <div key={i} className="h-24 bg-white border border-stone-100 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Profile</h1>
        <p className="text-sm text-stone-500 mt-1">This information is shown to your clients on their &quot;My Therapist&quot; page.</p>
      </div>

      <div className="bg-white border border-stone-100 rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-900">Basic Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Profession</label>
            <select
              value={profile.professionType}
              onChange={(e) => set("professionType", e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors bg-white"
            >
              <option value="">Not specified</option>
              {PROFESSION_TYPES.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Professional Title</label>
            <input
              type="text"
              value={profile.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Licensed Clinical Psychologist"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Gender <span className="font-normal normal-case text-stone-300">(optional, used only for client matching preferences)</span></label>
            <select
              value={profile.gender}
              onChange={(e) => set("gender", e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors bg-white"
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">License Number</label>
            <input
              type="text"
              value={profile.licenseNumber}
              onChange={(e) => set("licenseNumber", e.target.value)}
              placeholder="e.g. LMHC-12345"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Years of Experience</label>
            <input
              type="number"
              min={0}
              max={60}
              value={profile.yearsOfExperience}
              onChange={(e) => set("yearsOfExperience", e.target.value)}
              placeholder="e.g. 8"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Max Clients</label>
            <input
              type="number"
              min={1}
              max={500}
              value={profile.maxClients}
              onChange={(e) => set("maxClients", e.target.value)}
              placeholder="Leave blank for unlimited"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
            />
            <p className="text-[11px] text-stone-400 mt-1">{activeClients} active {activeClients === 1 ? "client" : "clients"}. New clients join a waitlist once you're full.</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">About You</label>
          <textarea
            value={profile.bio}
            onChange={(e) => set("bio", e.target.value)}
            rows={4}
            placeholder="Describe your background, approach, and what clients can expect from working with you…"
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Therapeutic Approach</label>
          <textarea
            value={profile.approach}
            onChange={(e) => set("approach", e.target.value)}
            rows={3}
            placeholder="e.g. I use an integrative approach combining CBT and mindfulness techniques…"
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors resize-none"
          />
        </div>
      </div>

      <div className="bg-white border border-stone-100 rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-900">Specialisations &amp; Skills</h2>

        <TagInput
          label="Specialisations"
          values={profile.specializations}
          onChange={(v) => set("specializations", v)}
          suggestions={SPECIALIZATION_LABELS}
          placeholder="e.g. Anxiety"
        />

        <TagInput
          label="Therapy Modalities"
          values={profile.modalities}
          onChange={(v) => set("modalities", v)}
          suggestions={MODALITY_SUGGESTIONS}
          placeholder="e.g. CBT"
        />

        <div>
          <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
            Age Groups You Work With
          </label>
          <div className="flex flex-wrap gap-1.5">
            {AGE_GROUPS.map((g) => (
              <Chip
                key={g.id}
                label={g.label}
                active={profile.ageGroupsServed.includes(g.id)}
                onClick={() => set(
                  "ageGroupsServed",
                  profile.ageGroupsServed.includes(g.id)
                    ? profile.ageGroupsServed.filter((v) => v !== g.id)
                    : [...profile.ageGroupsServed, g.id]
                )}
              />
            ))}
          </div>
        </div>

        <TagInput
          label="Languages Spoken"
          values={profile.languages}
          onChange={(v) => set("languages", v)}
          suggestions={LANGUAGE_SUGGESTIONS}
          placeholder="e.g. English"
        />
      </div>

      <div className="bg-white border border-stone-100 rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-900">Education &amp; Qualifications</h2>
        <ListInput
          label="Degrees &amp; Certifications"
          values={profile.education}
          onChange={(v) => set("education", v)}
          placeholder="e.g. MSc Clinical Psychology, University of Edinburgh (2013)"
        />
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            saved ? "bg-stone-100 text-stone-600" : "bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50"
          }`}
        >
          {saving ? "Saving…" : saved ? <><Check size={14} /> Saved</> : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
