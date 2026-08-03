"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";
import { formatCents } from "@/lib/money";
import { THERAPIST_PLANS } from "@/lib/therapistPlans";

type Subscription = { planId: string; stripeSubscriptionId: string | null; status: string } | null;

export default function UpgradeModal({
  onClose,
  title = "Upgrade your plan",
  description,
}: {
  onClose: () => void;
  title?: string;
  description?: string;
}) {
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [loading, setLoading] = useState(true);
  const [planBusy, setPlanBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/therapist/business/subscription")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setSubscription(d.subscription ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  // Mirrors SubscriptionTab.tsx's subscribeTo: Checkout for a first move onto a paid tier,
  // the existing POST/PATCH route for everything else (Starter-local, switching between two
  // already-real paid tiers, scheduling a downgrade back to Starter).
  async function subscribeTo(planId: string) {
    setPlanBusy(planId);
    try {
      if (planId !== "starter" && !subscription?.stripeSubscriptionId) {
        const res = await fetch("/api/therapist/business/subscription/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId }),
        });
        const d = await res.json();
        if (d.url) window.location.href = d.url;
        return;
      }
      const method = subscription ? "PATCH" : "POST";
      const res = await fetch("/api/therapist/business/subscription", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (res.ok) onClose();
    } finally {
      setPlanBusy(null);
    }
  }

  // Portaled to document.body — position:sticky/fixed ancestors (e.g. the sidebar) always
  // establish their own stacking context, which would otherwise trap a nested z-50 element
  // behind later DOM siblings (header, page content) regardless of z-index.
  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={handleBackdrop}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-stone-50 flex items-start justify-between px-6 pt-6 pb-4 rounded-t-3xl z-10">
          <div className="flex-1 pr-4">
            <h2 className="text-lg font-bold text-stone-900 leading-tight">{title}</h2>
            {description && <p className="text-sm text-stone-500 mt-1">{description}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-all flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-8 pt-5">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-56 bg-stone-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {THERAPIST_PLANS.map((plan) => {
                const isCurrent = subscription?.planId === plan.id && subscription.status === "active";
                return (
                  <div key={plan.id} className={`bg-white border rounded-xl p-4 flex flex-col gap-3 ${isCurrent ? "border-stone-900 ring-1 ring-stone-900" : "border-stone-100"}`}>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{plan.name}</p>
                      <p className="text-lg font-semibold text-stone-900 mt-0.5">
                        {formatCents(plan.priceCents)}<span className="text-xs font-normal text-stone-400">/mo</span>
                      </p>
                    </div>
                    <ul className="text-xs text-stone-500 space-y-1 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5"><Check size={12} className="text-sage-600 mt-0.5 flex-shrink-0" />{f}</li>
                      ))}
                    </ul>
                    <button
                      onClick={() => subscribeTo(plan.id)}
                      disabled={isCurrent || planBusy !== null}
                      className={`text-xs font-medium py-2 rounded-lg transition-colors ${
                        isCurrent ? "bg-stone-100 text-stone-400 cursor-default" : "bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50"
                      }`}
                    >
                      {planBusy === plan.id ? "Redirecting…" : isCurrent ? "Current plan" : subscription ? "Switch to this plan" : "Subscribe"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
