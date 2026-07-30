"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { SPECIALIZATIONS, MODALITY_SUGGESTIONS } from "@/lib/specializations";
import { LANGUAGE_SUGGESTIONS } from "@/lib/languages";
import { AGE_GROUPS } from "@/lib/ageGroups";
import { AFFIRMING_CARE_TAGS } from "@/lib/affirmingCare";
import Logo from "@/components/Logo";
import { MatchFactorsList } from "@/components/MatchFactorsList";
import type { MatchReasonFactor } from "@/lib/matching";

type Step = "concerns" | "about" | "identity" | "preferences" | "finding" | "result";

const QUESTION_STEPS: Step[] = ["concerns", "about", "identity", "preferences"];

type MatchedTherapistInfo = { name: string; title: string; specializations: string[]; yearsOfExperience: number | null };

type Result =
  | { matched: true; therapist: MatchedTherapistInfo; score: number; factors: MatchReasonFactor[] }
  | { matched: false }
  | { alreadyAssigned: true; therapist: MatchedTherapistInfo | null };

const GENDER_OPTIONS: { id: string; label: string }[] = [
  { id: "no_preference", label: "No preference" },
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
];

const PRIOR_EXPERIENCE_OPTIONS: { id: string; label: string }[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
  { id: "unsure", label: "Not sure" },
];

const GENDER_IDENTITY_OPTIONS: { id: string; label: string }[] = [
  { id: "woman", label: "Woman" },
  { id: "man", label: "Man" },
  { id: "non_binary", label: "Non-binary" },
  { id: "prefer_not_to_say", label: "Prefer not to say" },
];

const RELATIONSHIP_OPTIONS: { id: string; label: string }[] = [
  { id: "single", label: "Single" },
  { id: "relationship", label: "In a relationship" },
  { id: "married", label: "Married" },
  { id: "divorced", label: "Divorced/Separated" },
  { id: "widowed", label: "Widowed" },
  { id: "prefer_not_to_say", label: "Prefer not to say" },
];

const COMMUNICATION_OPTIONS: { id: string; label: string }[] = [
  { id: "video", label: "Video calls" },
  { id: "messaging", label: "Messaging" },
  { id: "both", label: "Both" },
];

const MEDICATION_OPTIONS: { id: string; label: string }[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
  { id: "prefer_not_to_say", label: "Prefer not to say" },
];

function ProgressBar({ step }: { step: Step }) {
  const index = QUESTION_STEPS.indexOf(step);
  if (index === -1) return null;
  const pct = ((index + 1) / QUESTION_STEPS.length) * 100;
  return (
    <div className="mb-6">
      <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
        <div className="h-full bg-sage-600 transition-all duration-500 ease-out rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mt-2">
        Question {index + 1} of {QUESTION_STEPS.length}
      </p>
    </div>
  );
}

export default function OnboardingPage() {
  const { update } = useSession();
  const [step, setStep] = useState<Step>("concerns");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState("");
  const [priorTherapyExperience, setPriorTherapyExperience] = useState("");
  const [goals, setGoals] = useState("");
  const [genderIdentity, setGenderIdentity] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [affirmingCare, setAffirmingCare] = useState<string[]>([]);
  const [language, setLanguage] = useState("");
  const [gender, setGender] = useState("no_preference");
  const [modalityPreference, setModalityPreference] = useState("no_preference");
  const [preferredCommunication, setPreferredCommunication] = useState("");
  const [takingMedication, setTakingMedication] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [skipping, setSkipping] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  function toggleConcern(id: string) {
    setConcerns((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function toggleAffirmingCare(id: string) {
    setAffirmingCare((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function skip() {
    setSkipping(true);
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hasOnboarded: true }),
    });
    // hasOnboarded just flipped server-side, but the JWT the proxy reads caches it
    // for up to 30s (see auth.ts's STATUS_TTL_MS) — update() forces a refresh so the
    // proxy doesn't bounce back here on a stale token. Hard navigation (not
    // router.push) then re-runs the proxy against the fresh cookie. Must pass a
    // payload (even {}) — a zero-arg call sends a GET, which Auth.js does not
    // treat as trigger:"update" (see @auth/core/lib/actions/session.js).
    await update({});
    window.location.href = "/dashboard";
  }

  async function submit() {
    setStep("finding");
    const res = await fetch("/api/onboarding/client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        concerns,
        ageRange: ageRange || undefined,
        priorTherapyExperience: priorTherapyExperience || undefined,
        goals: goals.trim() || undefined,
        genderIdentity: genderIdentity || undefined,
        relationshipStatus: relationshipStatus || undefined,
        affirmingCarePreferences: affirmingCare,
        languagePreference: language || undefined,
        genderPreference: gender,
        modalityPreference,
        preferredCommunication: preferredCommunication || undefined,
        takingMedication: takingMedication || undefined,
      }),
    });
    const data = await res.json();
    setResult(res.ok ? data : { matched: false });
    setStep("result");
  }

  const matchedTherapist: MatchedTherapistInfo | null =
    result && "matched" in result && result.matched ? result.therapist
    : result && "alreadyAssigned" in result ? result.therapist
    : null;

  const sharedSpecializations = matchedTherapist
    ? matchedTherapist.specializations.filter((s) => concerns.includes(s)).slice(0, 3)
    : [];

  const matchFactors: MatchReasonFactor[] = result && "matched" in result && result.matched ? result.factors : [];

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <Link href="/" className="inline-flex items-center mb-8">
          <Logo height={24} />
        </Link>

        {step === "concerns" && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8">
            <ProgressBar step={step} />
            <h1 className="text-2xl font-bold text-stone-900 mb-2">What brings you here?</h1>
            <p className="text-stone-500 text-sm mb-4">
              Select what applies — we&apos;ll use this to match you with the right professional.
            </p>
            <p className="text-xs text-sage-700 bg-sage-50 border border-sage-100 rounded-lg px-3 py-2 mb-6">
              Every therapist on YouMindo is licensed and reviewed before they join — you&apos;re never guessing who you&apos;re talking to.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-8">
              {SPECIALIZATIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleConcern(s.id)}
                  className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                    concerns.includes(s.id)
                      ? "border-sage-600 bg-sage-50"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                  }`}
                >
                  <span className="text-lg leading-none">{s.emoji}</span>
                  <span>
                    <span className={`block text-xs font-semibold leading-tight ${concerns.includes(s.id) ? "text-sage-800" : "text-stone-700"}`}>
                      {s.id}
                    </span>
                    <span className="block text-[10px] text-stone-400 leading-tight mt-0.5">{s.description}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={skip}
                disabled={skipping}
                className="text-stone-400 text-sm font-medium hover:text-stone-600 transition-colors disabled:opacity-50"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => setStep("about")}
                disabled={concerns.length === 0}
                className="bg-sage-700 text-white font-semibold text-sm py-2.5 px-6 rounded-xl hover:bg-sage-800 transition-colors disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === "about" && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8">
            <ProgressBar step={step} />
            <h1 className="text-2xl font-bold text-stone-900 mb-2">A little about you</h1>
            <p className="text-stone-500 text-sm mb-6">All optional — this helps us match you more precisely.</p>

            <div className="mb-6">
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                Age range
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AGE_GROUPS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setAgeRange(ageRange === g.id ? "" : g.id)}
                    className={`p-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                      ageRange === g.id
                        ? "border-sage-600 bg-sage-50 text-sage-800"
                        : "border-stone-200 hover:border-stone-300 bg-white text-stone-700"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                Have you been to therapy before?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRIOR_EXPERIENCE_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setPriorTherapyExperience(priorTherapyExperience === o.id ? "" : o.id)}
                    className={`p-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                      priorTherapyExperience === o.id
                        ? "border-sage-600 bg-sage-50 text-sage-800"
                        : "border-stone-200 hover:border-stone-300 bg-white text-stone-700"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                Your gender identity
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_IDENTITY_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setGenderIdentity(genderIdentity === o.id ? "" : o.id)}
                    className={`p-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                      genderIdentity === o.id
                        ? "border-sage-600 bg-sage-50 text-sage-800"
                        : "border-stone-200 hover:border-stone-300 bg-white text-stone-700"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                Relationship status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {RELATIONSHIP_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setRelationshipStatus(relationshipStatus === o.id ? "" : o.id)}
                    className={`p-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                      relationshipStatus === o.id
                        ? "border-sage-600 bg-sage-50 text-sage-800"
                        : "border-stone-200 hover:border-stone-300 bg-white text-stone-700"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                What would you like to work on?
              </label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={3}
                placeholder="Share as much or as little as you'd like…"
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500 bg-white resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={skip}
                disabled={skipping}
                className="text-stone-400 text-sm font-medium hover:text-stone-600 transition-colors disabled:opacity-50"
              >
                Skip for now
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("concerns")}
                  className="text-stone-500 text-sm font-medium hover:text-stone-700 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep("identity")}
                  className="bg-sage-700 text-white font-semibold text-sm py-2.5 px-6 rounded-xl hover:bg-sage-800 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "identity" && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8">
            <ProgressBar step={step} />
            <h1 className="text-2xl font-bold text-stone-900 mb-2">Who matters to you in a therapist</h1>
            <p className="text-stone-500 text-sm mb-6">
              Optional — helps us match you with someone who really gets it. You&apos;re not sharing anything about yourself here, just what you&apos;d value in the person you work with.
            </p>

            <div className="grid grid-cols-1 gap-2 mb-8">
              {AFFIRMING_CARE_TAGS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleAffirmingCare(t.id)}
                  className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                    affirmingCare.includes(t.id)
                      ? "border-sage-600 bg-sage-50"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                  }`}
                >
                  <span>
                    <span className={`block text-xs font-semibold leading-tight ${affirmingCare.includes(t.id) ? "text-sage-800" : "text-stone-700"}`}>
                      {t.label}
                    </span>
                    <span className="block text-[10px] text-stone-400 leading-tight mt-0.5">{t.description}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={skip}
                disabled={skipping}
                className="text-stone-400 text-sm font-medium hover:text-stone-600 transition-colors disabled:opacity-50"
              >
                Skip for now
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("about")}
                  className="text-stone-500 text-sm font-medium hover:text-stone-700 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep("preferences")}
                  className="bg-sage-700 text-white font-semibold text-sm py-2.5 px-6 rounded-xl hover:bg-sage-800 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "preferences" && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8">
            <ProgressBar step={step} />
            <h1 className="text-2xl font-bold text-stone-900 mb-2">A couple more preferences</h1>
            <p className="text-stone-500 text-sm mb-6">Optional, but helps us find the best fit.</p>

            <div className="mb-6">
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                Preferred language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500 bg-white"
              >
                <option value="">No preference</option>
                {LANGUAGE_SUGGESTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                Therapist gender preference
              </label>
              <div className="grid grid-cols-3 gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGender(g.id)}
                    className={`p-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                      gender === g.id
                        ? "border-sage-600 bg-sage-50 text-sage-800"
                        : "border-stone-200 hover:border-stone-300 bg-white text-stone-700"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                How would you prefer to connect?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {COMMUNICATION_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setPreferredCommunication(preferredCommunication === c.id ? "" : c.id)}
                    className={`p-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                      preferredCommunication === c.id
                        ? "border-sage-600 bg-sage-50 text-sage-800"
                        : "border-stone-200 hover:border-stone-300 bg-white text-stone-700"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                Are you currently taking medication for your mental or emotional health?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MEDICATION_OPTIONS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTakingMedication(takingMedication === m.id ? "" : m.id)}
                    className={`p-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                      takingMedication === m.id
                        ? "border-sage-600 bg-sage-50 text-sage-800"
                        : "border-stone-200 hover:border-stone-300 bg-white text-stone-700"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
                Therapy approach preference
              </label>
              <select
                value={modalityPreference}
                onChange={(e) => setModalityPreference(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500 bg-white"
              >
                <option value="no_preference">No preference</option>
                {MODALITY_SUGGESTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={skip}
                disabled={skipping}
                className="text-stone-400 text-sm font-medium hover:text-stone-600 transition-colors disabled:opacity-50"
              >
                Skip for now
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("identity")}
                  className="text-stone-500 text-sm font-medium hover:text-stone-700 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={submit}
                  className="bg-sage-700 text-white font-semibold text-sm py-2.5 px-6 rounded-xl hover:bg-sage-800 transition-colors"
                >
                  Find my match
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "finding" && (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-sage-100 flex items-center justify-center text-3xl mb-6 animate-pulse">
              🔍
            </div>
            <h1 className="text-xl font-bold text-stone-900 mb-2">Finding your match…</h1>
            <p className="text-stone-500 text-sm">Matching you with the right professional based on your answers.</p>
          </div>
        )}

        {step === "result" && result && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
            {"matched" in result && result.matched && (
              <>
                <h1 className="text-2xl font-bold text-stone-900 mb-2">You&apos;ve been matched!</h1>
                <p className="text-stone-500 text-sm leading-relaxed mb-6">We think you&apos;ll click with:</p>
              </>
            )}

            {"alreadyAssigned" in result && (
              <>
                <h1 className="text-2xl font-bold text-stone-900 mb-2">You&apos;re already connected</h1>
                {result.therapist ? (
                  <p className="text-stone-500 text-sm leading-relaxed mb-6">You&apos;re already working with:</p>
                ) : (
                  <p className="text-stone-500 text-sm leading-relaxed mb-8">You already have a professional assigned to your account.</p>
                )}
              </>
            )}

            {matchedTherapist && (
              <div className="text-left bg-cream border border-stone-100 rounded-2xl p-5 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-sage-700 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                    {matchedTherapist.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-stone-900">{matchedTherapist.name}</p>
                    <p className="text-sm text-stone-500">
                      {matchedTherapist.title}
                      {matchedTherapist.yearsOfExperience != null && ` · ${matchedTherapist.yearsOfExperience} yrs experience`}
                    </p>
                    {sharedSpecializations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {sharedSpecializations.map((s) => (
                          <span key={s} className="text-[10px] font-semibold uppercase tracking-wide bg-sage-100 text-sage-800 px-2 py-1 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-stone-400 mt-4 leading-relaxed">
                  Not the right fit? You can request a different therapist any time from your dashboard — no awkward conversation needed.
                </p>
                {matchFactors.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    {!showWhy ? (
                      <button onClick={() => setShowWhy(true)} className="text-xs font-medium text-sage-700 hover:text-sage-800 transition-colors">
                        Why we matched you →
                      </button>
                    ) : (
                      <>
                        <p className="text-xs font-medium text-stone-500 mb-2">Why we matched you</p>
                        <MatchFactorsList factors={matchFactors} />
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {"matched" in result && !result.matched && !("alreadyAssigned" in result) && (
              <>
                <div className="w-16 h-16 mx-auto rounded-2xl bg-sage-100 flex items-center justify-center text-3xl mb-6">🌱</div>
                <h1 className="text-2xl font-bold text-stone-900 mb-2">No match available right now</h1>
                <p className="text-stone-500 text-sm leading-relaxed mb-8">
                  We couldn&apos;t find an available professional matching your preferences just yet.
                  You can browse our full directory and request someone directly.
                </p>
              </>
            )}

            <button
              type="button"
              onClick={async () => { await update({}); window.location.href = "/dashboard"; }}
              className="w-full bg-sage-700 text-white font-semibold text-sm py-3 rounded-xl hover:bg-sage-800 transition-colors"
            >
              Go to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
