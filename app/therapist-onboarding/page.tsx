"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { SPECIALIZATION_LABELS, MODALITY_SUGGESTIONS } from "@/lib/specializations";
import { LANGUAGE_SUGGESTIONS } from "@/lib/languages";
import { AGE_GROUPS } from "@/lib/ageGroups";
import Logo from "@/components/Logo";

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

export default function TherapistOnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [bio, setBio] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [gender, setGender] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [modalities, setModalities] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [ageGroupsServed, setAgeGroupsServed] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/therapist/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setBio(d.profile.bio ?? "");
          setYearsOfExperience(d.profile.yearsOfExperience?.toString() ?? "");
          setLicenseNumber(d.profile.licenseNumber ?? "");
          setGender(d.profile.gender ?? "");
          setSpecializations(d.profile.specializations ?? []);
          setModalities(d.profile.modalities ?? []);
          setLanguages(d.profile.languages ?? []);
          setAgeGroupsServed(d.profile.ageGroupsServed ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/therapist/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bio: bio.trim() || undefined,
        yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        gender: gender || undefined,
        specializations,
        modalities,
        languages,
        ageGroupsServed,
        completeOnboarding: true,
      }),
    });

    setSaving(false);
    const data = await res.json();

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Something went wrong. Please try again.");
      return;
    }

    // A hard navigation, not router.push — profileCompleted just flipped server-side
    // and the proxy gates /therapist on it. A client-side push can reuse a cached
    // redirect from before this mutation (e.g. the initial login bounce to this
    // wizard), so force a fresh request through the proxy with the new DB state.
    window.location.href = "/therapist";
  }

  if (loading) {
    return <div className="min-h-screen bg-cream flex items-center justify-center text-stone-400 text-sm">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <Link href="/" className="inline-flex items-center mb-8">
          <Logo height={24} />
        </Link>

        <div className="bg-white rounded-2xl border border-stone-200 p-8">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Complete your profile</h1>
          <p className="text-stone-500 text-sm mb-6">
            A few details help us match you with the right clients. You can always refine this later in Settings.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell clients a bit about your approach and experience…"
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500 bg-white resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                Specializations
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SPECIALIZATION_LABELS.map((s) => (
                  <Chip key={s} label={s} active={specializations.includes(s)} onClick={() => toggle(specializations, setSpecializations, s)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                Therapy modalities
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MODALITY_SUGGESTIONS.map((m) => (
                  <Chip key={m} label={m} active={modalities.includes(m)} onClick={() => toggle(modalities, setModalities, m)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                Age groups you work with
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AGE_GROUPS.map((g) => (
                  <Chip key={g.id} label={g.label} active={ageGroupsServed.includes(g.id)} onClick={() => toggle(ageGroupsServed, setAgeGroupsServed, g.id)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                Languages
              </label>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGE_SUGGESTIONS.map((l) => (
                  <Chip key={l} label={l} active={languages.includes(l)} onClick={() => toggle(languages, setLanguages, l)} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Years of experience</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Gender <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500 bg-white"
                >
                  <option value="">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                License number <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-sage-700 text-white font-semibold text-sm py-3 rounded-xl hover:bg-sage-800 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Enter my portal"}
            </button>
          </form>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-stone-400 text-xs font-medium mt-4 hover:text-stone-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
