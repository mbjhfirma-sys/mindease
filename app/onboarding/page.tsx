"use client";

import Link from "next/link";
import { useState } from "react";
import { SPECIALIZATIONS, MODALITY_SUGGESTIONS } from "@/lib/specializations";
import { LANGUAGE_SUGGESTIONS } from "@/lib/languages";
import { AGE_GROUPS } from "@/lib/ageGroups";
import Logo from "@/components/Logo";

type Step = "concerns" | "about" | "preferences" | "finding" | "result";

type Result =
  | { matched: true; therapist: { name: string; title: string } }
  | { matched: false }
  | { alreadyAssigned: true; therapist: { name: string; title: string } | null };

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

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("concerns");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState("");
  const [priorTherapyExperience, setPriorTherapyExperience] = useState("");
  const [goals, setGoals] = useState("");
  const [language, setLanguage] = useState("");
  const [gender, setGender] = useState("no_preference");
  const [modalityPreference, setModalityPreference] = useState("no_preference");
  const [result, setResult] = useState<Result | null>(null);
  const [skipping, setSkipping] = useState(false);

  function toggleConcern(id: string) {
    setConcerns((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function skip() {
    setSkipping(true);
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hasOnboarded: true }),
    });
    // Hard navigation — see the comment in therapist-onboarding/page.tsx: hasOnboarded
    // just flipped server-side and the proxy gates /dashboard on it, so a router.push
    // here could reuse a redirect cached from before this mutation.
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
        languagePreference: language || undefined,
        genderPreference: gender,
        modalityPreference,
      }),
    });
    const data = await res.json();
    setResult(res.ok ? data : { matched: false });
    setStep("result");
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <Link href="/" className="inline-flex items-center mb-8">
          <Logo height={24} />
        </Link>

        {step === "concerns" && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8">
            <h1 className="text-2xl font-bold text-stone-900 mb-2">What brings you here?</h1>
            <p className="text-stone-500 text-sm mb-6">
              Select what applies — we&apos;ll use this to match you with the right professional.
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
                  onClick={() => setStep("about")}
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
                <div className="w-16 h-16 mx-auto rounded-2xl bg-sage-100 flex items-center justify-center text-3xl mb-6">🤝</div>
                <h1 className="text-2xl font-bold text-stone-900 mb-2">You&apos;ve been matched!</h1>
                <p className="text-stone-500 text-sm leading-relaxed mb-8">
                  We&apos;ve connected you with <strong className="text-stone-700">{result.therapist.name}</strong>
                  {result.therapist.title ? `, ${result.therapist.title}` : ""}. They&apos;ll be reaching out soon.
                </p>
              </>
            )}

            {"alreadyAssigned" in result && (
              <>
                <div className="w-16 h-16 mx-auto rounded-2xl bg-sage-100 flex items-center justify-center text-3xl mb-6">✅</div>
                <h1 className="text-2xl font-bold text-stone-900 mb-2">You&apos;re already connected</h1>
                <p className="text-stone-500 text-sm leading-relaxed mb-8">
                  {result.therapist
                    ? <>You&apos;re already working with <strong className="text-stone-700">{result.therapist.name}</strong>.</>
                    : "You already have a professional assigned to your account."}
                </p>
              </>
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
              onClick={() => { window.location.href = "/dashboard"; }}
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
