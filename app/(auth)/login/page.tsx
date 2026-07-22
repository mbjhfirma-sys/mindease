"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import Logo from "@/components/Logo";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const pendingReview = searchParams.get("pending") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!requires2FA) {
      setLoading(true);
      const precheck = await fetch("/api/auth/requires-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).then((r) => r.json()).catch(() => ({ requires2FA: false }));

      if (precheck.requires2FA) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      totpCode: requires2FA ? totpCode : undefined,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(requires2FA ? "Invalid code. Please try again." : "Invalid email or password.");
      return;
    }

    const session = await getSession();
    const role = (session?.user as { role?: string } | null)?.role;
    const destination = role === "THERAPIST" ? "/therapist" : role === "ADMIN" ? "/admin" : "/dashboard";
    router.push(destination);
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sage-700 flex-col justify-between p-12 text-white">
        <Link href="/" className="flex items-center">
          <Logo variant="white" height={26} />
        </Link>
        <div>
          <div className="text-5xl mb-6">🧠</div>
          <h2 className="text-3xl font-bold mb-4 leading-snug">
            Welcome back to your well-being journey
          </h2>
          <p className="text-sage-200 leading-relaxed">
            Your courses, coaching sessions, and community are all waiting for you.
          </p>
          <div className="mt-8 bg-sage-600/50 rounded-2xl p-5">
            <div className="flex gap-1 mb-2">
              {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}
            </div>
            <p className="text-sage-100 text-sm italic mb-3">
              "YouMindo has genuinely changed how I handle stress. I feel more equipped than ever."
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sage-400 rounded-full flex items-center justify-center">👩</div>
              <div>
                <div className="text-white text-sm font-medium">Emma R.</div>
                <div className="text-sage-300 text-xs">Member since 2024</div>
              </div>
            </div>
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

          <h1 className="text-2xl font-bold text-stone-900 mb-1">Welcome back</h1>
          <p className="text-stone-500 text-sm mb-6">Sign in to your account</p>

          {justRegistered && pendingReview && (
            <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              Account created! Your professional profile is pending review by the
              YouMindo team — you&apos;ll get full access once you&apos;re approved.
            </div>
          )}
          {justRegistered && !pendingReview && (
            <div className="mb-4 px-4 py-3 bg-sage-50 border border-sage-200 rounded-xl text-sm text-sage-800">
              Account created! Sign in to get started.
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={requires2FA}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500 bg-white disabled:bg-stone-50 disabled:text-stone-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-stone-700">Password</label>
                <a href="#" className="text-sage-600 text-xs hover:underline">Forgot password?</a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={requires2FA}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sage-500 bg-white disabled:bg-stone-50 disabled:text-stone-500"
              />
            </div>

            {requires2FA && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-stone-700">
                    {useBackupCode ? "Backup code" : "Authentication code"}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setUseBackupCode((v) => !v); setTotpCode(""); }}
                    className="text-sage-600 text-xs hover:underline"
                  >
                    {useBackupCode ? "Use authenticator code instead" : "Use a backup code instead"}
                  </button>
                </div>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder={useBackupCode ? "XXXX-XXXX" : "123456"}
                  autoFocus
                  required
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm tracking-widest focus:outline-none focus:border-sage-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => { setRequires2FA(false); setTotpCode(""); setError(""); }}
                  className="text-xs text-stone-400 hover:text-stone-700 mt-1.5"
                >
                  ← Back
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sage-700 text-white font-semibold text-sm py-3 rounded-xl hover:bg-sage-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in…" : requires2FA ? "Verify & Sign In" : "Sign In"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <hr className="flex-1 border-stone-200" />
            <span className="text-stone-400 text-xs">or continue with</span>
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
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-sage-700 font-semibold hover:underline">
              Sign up free
            </Link>
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 pt-6 border-t border-dashed border-stone-200">
              <p className="text-center text-[11px] text-stone-400 uppercase tracking-widest font-medium mb-3">
                Dev shortcuts
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-1.5 border border-stone-200 rounded-xl py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  👤 Client dash
                </Link>
                <Link
                  href="/therapist"
                  className="flex items-center justify-center gap-1.5 border border-stone-200 rounded-xl py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  🩺 Clinician dash
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
