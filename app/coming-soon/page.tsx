import { Suspense } from "react";
import type { Metadata } from "next";
import AccessGate from "./AccessGate";

export const metadata: Metadata = {
  title: "YouMindo — Launching soon",
  description: "We're putting the finishing touches on YouMindo. Check back soon.",
  robots: { index: false, follow: false },
};

const COMING = [
  { icon: "🧘", label: "Mindfulness & meditation" },
  { icon: "💬", label: "One-on-one therapy" },
  { icon: "🌱", label: "Wellness coaching" },
];

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center">
        <span className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 text-sm font-medium px-3 py-1.5 rounded-full mb-7">
          🚧 Getting ready for launch
        </span>

        <div className="text-5xl mb-5">🧠</div>

        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 leading-tight mb-4">
          We&apos;re putting the finishing touches on{" "}
          <span className="text-sage-700">YouMindo</span>
        </h1>

        <p className="text-stone-500 text-base leading-relaxed mb-9 max-w-md mx-auto">
          Evidence-based courses, guided meditations, and licensed therapists — all in one
          calm, welcoming space. We&apos;ll be ready soon.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {COMING.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 bg-white border border-stone-200 text-stone-500 text-xs font-medium px-3 py-1.5 rounded-full"
            >
              <span>{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 pt-8 border-t border-stone-200/70">
          <Suspense fallback={null}>
            <AccessGate />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
