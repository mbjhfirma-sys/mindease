"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PROFESSION_TYPES } from "@/lib/professionTypes";
import Logo from "@/components/Logo";

type Role = "CLIENT" | "THERAPIST";

const ROLE_OPTIONS: { role: Role; emoji: string; label: string; sub: string }[] = [
  { role: "CLIENT",    emoji: "🌱", label: "I'm here for support",          sub: "Access therapy, courses & tools" },
  { role: "THERAPIST", emoji: "🩺", label: "I'm a mental health professional", sub: "Manage clients & sessions" },
];

const LEFT_PANEL: Record<Role, { emoji: string; heading: string; body: string; bullets: string[] }> = {
  CLIENT: {
    emoji: "🌱",
    heading: "Your mental health journey starts here",
    body: "Join 50,000+ members building healthier habits with expert-led courses and compassionate support.",
    bullets: [
      "Access 3 courses free — no card needed",
      "Evidence-based content from licensed professionals",
      "Cancel or upgrade at any time",
    ],
  },
  THERAPIST: {
    emoji: "🩺",
    heading: "Grow your practice with YouMindo",
    body: "Join hundreds of licensed professionals delivering evidence-based care through our secure platform.",
    bullets: [
      "Manage clients, sessions & progress in one place",
      "Assign personalised daily missions & journaling",
      "HIPAA-aligned, secure & fully encrypted",
    ],
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const [role,      setRole]      = useState<Role>("CLIENT");
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [title,         setTitle]         = useState("");
  const [professionType, setProfessionType] = useState("");
  const [therapistCode, setTherapistCode] = useState("");
  const [agreed,        setAgreed]        = useState(false);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);

  const panel = LEFT_PANEL[role];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) { setError("Please accept the Terms of Service to continue."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (role === "THERAPIST" && !professionType) { setError("Please select your profession."); return; }

    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email,
        password,
        role,
        ...(role === "THERAPIST" && title.trim() ? { title: title.trim() } : {}),
        ...(role === "THERAPIST" ? { therapistCode, professionType } : {}),
      }),
    });

    setLoading(false);
    const data = await res.json();

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Registration failed. Please try again.");
      return;
    }

    router.push(data.pendingReview ? "/login?registered=1&pending=1" : "/login?registered=1");
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sage-700 flex-col justify-between p-12 text-white transition-all duration-300">
        <Link href="/" className="flex items-center">
          <Logo variant="white" height={26} />
        </Link>
        <div>
          <div className="text-5xl mb-6">{panel.emoji}</div>
          <h2 className="text-3xl font-bold mb-4 leading-snug">{panel.heading}</h2>
          <p className="text-sage-200 leading-relaxed mb-8">{panel.body}</p>
          <div className="space-y-3">
            {panel.bullets.map((b) => (
              <div key={b} className="flex items-center gap-3 text-sm text-sage-100">
                <div className="w-5 h-5 bg-sage-500 rounded-full flex items-center justify-center text-xs flex-shrink-0">✓</div>
                {b}
              </div>
            ))}
          </div>
        </div>
        <p className="text-sage-400 text-sm">© 2025 YouMindo</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden flex items-center mb-8">
            <Logo height={24} />
          </Link>

          <h1 className="text-2xl font-bold text-stone-900 mb-1">Create your account</h1>
          <p className="text-stone-500 text-sm mb-6">Free to join — no credit card required</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {ROLE_OPTIONS.map(({ role: r, emoji, label, sub }) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border-2 text-left transition-all ${
                  role === r
                    ? "border-sage-600 bg-sage-50"
                    : "border-stone-200 hover:border-stone-300 bg-white"
                }`}
              >
                <span className="text-xl">{emoji}</span>
                <span className={`text-xs font-semibold leading-tight ${role === r ? "text-sage-800" : "text-stone-700"}`}>
                  {label}
                </span>
                <span className="text-[10px] text-stone-400 leading-tight">{sub}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  required
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500 bg-white"
              />
            </div>

            {/* Therapist-only fields */}
            {role === "THERAPIST" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Profession</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROFESSION_TYPES.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProfessionType(p.id)}
                        className={`flex flex-col items-start gap-0.5 p-2.5 rounded-xl border-2 text-left transition-all ${
                          professionType === p.id
                            ? "border-sage-600 bg-sage-50"
                            : "border-stone-200 hover:border-stone-300 bg-white"
                        }`}
                      >
                        <span className={`text-xs font-semibold leading-tight ${professionType === p.id ? "text-sage-800" : "text-stone-700"}`}>
                          {p.label}
                        </span>
                        <span className="text-[10px] text-stone-400 leading-tight">{p.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Professional title
                    <span className="ml-1 text-stone-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Licensed Clinical Psychologist"
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Registration code
                    <span className="ml-1 text-stone-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="password"
                    value={therapistCode}
                    onChange={(e) => setTherapistCode(e.target.value)}
                    placeholder="Have a code from YouMindo? Enter it here"
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500 bg-white"
                  />
                  <p className="mt-1.5 text-xs text-stone-400 leading-relaxed">
                    A code gives you instant access. No code? You can still sign up —
                    our team will review your profile before you get full access.
                  </p>
                </div>
              </>
            )}

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 accent-sage-700"
              />
              <label htmlFor="terms" className="text-stone-500 text-xs leading-relaxed">
                I agree to the{" "}
                <a href="#" className="text-sage-700 underline">Terms of Service</a>{" "}
                and{" "}
                <a href="#" className="text-sage-700 underline">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sage-700 text-white font-semibold text-sm py-3 rounded-xl hover:bg-sage-800 transition-colors disabled:opacity-50"
            >
              {loading
                ? "Creating account…"
                : role === "THERAPIST"
                ? "Create Professional Account"
                : "Create Free Account"}
            </button>
          </form>

          <p className="text-center text-stone-500 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-sage-700 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
