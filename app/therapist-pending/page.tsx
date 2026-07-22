"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import Logo from "@/components/Logo";

export default function TherapistPendingPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex items-center mb-10">
          <Logo height={24} />
        </Link>

        <div className="w-16 h-16 mx-auto rounded-2xl bg-sage-100 flex items-center justify-center text-3xl mb-6">
          🕒
        </div>

        <h1 className="text-2xl font-bold text-stone-900 mb-2">Your profile is under review</h1>
        <p className="text-stone-500 text-sm leading-relaxed mb-8">
          Thanks for signing up as a mental health professional. The YouMindo team
          reviews every clinician profile before granting full access to the
          therapist portal — we&apos;ll email you as soon as you&apos;re approved.
        </p>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full bg-sage-700 text-white font-semibold text-sm py-3 rounded-xl hover:bg-sage-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
