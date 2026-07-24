"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { SPECIALIZATION_LABELS, MODALITY_SUGGESTIONS } from "@/lib/specializations";
import { LANGUAGE_SUGGESTIONS } from "@/lib/languages";
import { AGE_GROUPS } from "@/lib/ageGroups";
import { AFFIRMING_CARE_TAGS } from "@/lib/affirmingCare";
import Logo from "@/components/Logo";

type Step = "about" | "specializations" | "demographics" | "affirming" | "review";

const STEPS: Step[] = ["about", "specializations", "demographics", "affirming", "review"];

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

function ProgressBar({ step }: { step: Step }) {
  const index = STEPS.indexOf(step);
  const pct = ((index + 1) / STEPS.length) * 100;
  return (
    <div className="mb-6">
      <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
        <div className="h-full bg-sage-600 transition-all duration-500 ease-out rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mt-2">
        Step {index + 1} of {STEPS.length}
      </p>
    </div>
  );
}

export default function TherapistOnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("about");

  const [bio, setBio] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [gender, setGender] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [modalities, setModalities] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [ageGroupsServed, setAgeGroupsServed] = useState<string[]>([]);
  const [affirmingCareTags, setAffirmingCareTags] = useState<string[]>([]);

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
          setAffirmingCareTags(d.profile.affirmingCareTags ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function submit() {
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
        affirmingCareTags,
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
          <ProgressBar step={step} />

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {step === "about" && (
            <>
              <h1 className="text-2xl font-bold text-stone-900 mb-2">Tell clients about yourself</h1>
              <p className="text-stone-500 text-sm mb-6">This shows up on your public profile.</p>

              <div className="mb-5">
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tell clients a bit about your approach and experience…"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500 bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
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

              <div className="mb-8">
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

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setStep("specializations")}
                  className="bg-sage-700 text-white font-semibold text-sm py-2.5 px-6 rounded-xl hover:bg-sage-800 transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === "specializations" && (
            <>
              <h1 className="text-2xl font-bold text-stone-900 mb-2">What you work on, and how</h1>
              <p className="text-xs text-sage-700 bg-sage-50 border border-sage-100 rounded-lg px-3 py-2 mb-6">
                Clients search and filter by these exact tags to find you — the more accurate this is, the better your matches.
              </p>

              <div className="mb-6">
                <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                  Specializations
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SPECIALIZATION_LABELS.map((s) => (
                    <Chip key={s} label={s} active={specializations.includes(s)} onClick={() => toggle(specializations, setSpecializations, s)} />
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                  Therapy modalities
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MODALITY_SUGGESTIONS.map((m) => (
                    <Chip key={m} label={m} active={modalities.includes(m)} onClick={() => toggle(modalities, setModalities, m)} />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setStep("about")} className="text-stone-500 text-sm font-medium hover:text-stone-700 transition-colors">
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep("demographics")}
                  className="bg-sage-700 text-white font-semibold text-sm py-2.5 px-6 rounded-xl hover:bg-sage-800 transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === "demographics" && (
            <>
              <h1 className="text-2xl font-bold text-stone-900 mb-2">Who you work with</h1>
              <p className="text-xs text-sage-700 bg-sage-50 border border-sage-100 rounded-lg px-3 py-2 mb-6">
                This directly affects who gets matched with you — clients pick an age bracket and language preference during sign-up.
              </p>

              <div className="mb-6">
                <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                  Age groups you work with
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AGE_GROUPS.map((g) => (
                    <Chip key={g.id} label={g.label} active={ageGroupsServed.includes(g.id)} onClick={() => toggle(ageGroupsServed, setAgeGroupsServed, g.id)} />
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                  Languages
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGE_SUGGESTIONS.map((l) => (
                    <Chip key={l} label={l} active={languages.includes(l)} onClick={() => toggle(languages, setLanguages, l)} />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setStep("specializations")} className="text-stone-500 text-sm font-medium hover:text-stone-700 transition-colors">
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep("affirming")}
                  className="bg-sage-700 text-white font-semibold text-sm py-2.5 px-6 rounded-xl hover:bg-sage-800 transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === "affirming" && (
            <>
              <h1 className="text-2xl font-bold text-stone-900 mb-2">Affirming &amp; culturally-competent care</h1>
              <p className="text-stone-500 text-sm mb-6">
                Optional. Clients can request a therapist who offers this kind of care — add any that genuinely describe your practice. You are your own expert here; only pick what&apos;s real for how you work.
              </p>

              <div className="grid grid-cols-1 gap-2 mb-8">
                {AFFIRMING_CARE_TAGS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggle(affirmingCareTags, setAffirmingCareTags, t.id)}
                    className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                      affirmingCareTags.includes(t.id)
                        ? "border-sage-600 bg-sage-50"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <span>
                      <span className={`block text-xs font-semibold leading-tight ${affirmingCareTags.includes(t.id) ? "text-sage-800" : "text-stone-700"}`}>
                        {t.label}
                      </span>
                      <span className="block text-[10px] text-stone-400 leading-tight mt-0.5">{t.description}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setStep("demographics")} className="text-stone-500 text-sm font-medium hover:text-stone-700 transition-colors">
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep("review")}
                  className="bg-sage-700 text-white font-semibold text-sm py-2.5 px-6 rounded-xl hover:bg-sage-800 transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === "review" && (
            <>
              <h1 className="text-2xl font-bold text-stone-900 mb-2">Ready to go</h1>
              <p className="text-stone-500 text-sm mb-6">
                You can always refine any of this later in Settings — nothing here is permanent.
              </p>

              <div className="space-y-3 mb-8 text-sm">
                <div className="flex justify-between border-b border-stone-100 pb-2">
                  <span className="text-stone-400">Specializations</span>
                  <span className="text-stone-700 font-medium text-right max-w-[65%]">{specializations.length > 0 ? specializations.join(", ") : "None yet"}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-2">
                  <span className="text-stone-400">Modalities</span>
                  <span className="text-stone-700 font-medium text-right max-w-[65%]">{modalities.length > 0 ? modalities.join(", ") : "None yet"}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-2">
                  <span className="text-stone-400">Age groups</span>
                  <span className="text-stone-700 font-medium text-right max-w-[65%]">{ageGroupsServed.length > 0 ? ageGroupsServed.join(", ") : "None yet"}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-2">
                  <span className="text-stone-400">Languages</span>
                  <span className="text-stone-700 font-medium text-right max-w-[65%]">{languages.length > 0 ? languages.join(", ") : "None yet"}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-stone-400">Affirming care</span>
                  <span className="text-stone-700 font-medium text-right max-w-[65%]">{affirmingCareTags.length > 0 ? `${affirmingCareTags.length} selected` : "None yet"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setStep("affirming")} className="text-stone-500 text-sm font-medium hover:text-stone-700 transition-colors">
                  Back
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={saving}
                  className="bg-sage-700 text-white font-semibold text-sm py-2.5 px-6 rounded-xl hover:bg-sage-800 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Enter my portal"}
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-stone-400 text-xs font-medium mt-6 hover:text-stone-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
