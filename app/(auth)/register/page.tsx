"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) { setError("Please accept the Terms of Service to continue."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email,
        password,
        role: "CLIENT",
      }),
    });

    setLoading(false);
    const data = await res.json();

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Registration failed. Please try again.");
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sage-700 flex-col justify-between p-12 text-white">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="w-8 h-8 bg-sage-500 rounded-lg flex items-center justify-center text-sm">🌿</span>
          MindEase
        </Link>
        <div>
          <div className="text-5xl mb-6">🌱</div>
          <h2 className="text-3xl font-bold mb-4 leading-snug">
            Your mental health journey starts here
          </h2>
          <p className="text-sage-200 leading-relaxed mb-8">
            Join 50,000+ members building healthier habits with expert-led courses and compassionate support.
          </p>
          <div className="space-y-3">
            {[
              "Access 3 courses free — no card needed",
              "Evidence-based content from licensed professionals",
              "Cancel or upgrade at any time",
            ].map((b) => (
              <div key={b} className="flex items-center gap-3 text-sm text-sage-100">
                <div className="w-5 h-5 bg-sage-500 rounded-full flex items-center justify-center text-xs flex-shrink-0">✓</div>
                {b}
              </div>
            ))}
          </div>
        </div>
        <p className="text-sage-400 text-sm">© 2025 MindEase</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden flex items-center gap-2 font-semibold text-sage-800 mb-8">
            <span className="w-7 h-7 bg-sage-700 rounded-md flex items-center justify-center text-white text-xs">🌿</span>
            MindEase
          </Link>

          <h1 className="text-2xl font-bold text-stone-900 mb-1">Create your account</h1>
          <p className="text-stone-500 text-sm mb-8">Free forever — no credit card required</p>

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
              {loading ? "Creating account…" : "Create Free Account"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <hr className="flex-1 border-stone-200" />
            <span className="text-stone-400 text-xs">or sign up with</span>
            <hr className="flex-1 border-stone-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {["Google", "Apple"].map((provider) => (
              <button
                key={provider}
                type="button"
                className="flex items-center justify-center gap-2 border border-stone-200 rounded-xl py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
              >
                {provider === "Google" ? "🔵" : "🍎"} {provider}
              </button>
            ))}
          </div>

          <p className="text-center text-stone-500 text-sm mt-8">
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
