"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Lock, ChevronDown } from "lucide-react";
import { formatCents, discountedPriceCents, type CouponRedemption } from "@/lib/money";
import { CLIENT_PLANS, planById, type ClientPlan, type ClientPlanId } from "@/lib/clientPlans";
import PlanComparisonTable from "@/components/dashboard/PlanComparisonTable";

type BillingCycle = "monthly" | "annual";

const FEATURE_LABELS: Record<keyof ClientPlan["features"], string> = {
  mindo: "Mindo AI companion",
  fullCourseLibrary: "Full course library",
  liveGroupSessions: "Live weekly group sessions",
};

export default function UpgradeModal({
  onClose,
  title = "Upgrade your plan",
  description,
}: {
  onClose: () => void;
  title?: string;
  description?: string;
}) {
  const [plan, setPlan] = useState<ClientPlanId>("free");
  const [couponRedemption, setCouponRedemption] = useState<CouponRedemption | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingActionLoading, setBillingActionLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (d.user?.plan) setPlan(d.user.plan);
        if (d.user?.couponRedemption) setCouponRedemption(d.user.couponRedemption);
      })
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

  async function handleUpgrade(planId: string) {
    setBillingActionLoading(planId);
    try {
      const res = await fetch("/api/user/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle }),
      });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
    } finally {
      setBillingActionLoading(null);
    }
  }

  async function handleSwitchPlan(planId: string) {
    setBillingActionLoading(planId);
    try {
      const res = await fetch("/api/user/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (res.ok) { setPlan(planId as ClientPlanId); onClose(); }
    } finally {
      setBillingActionLoading(null);
    }
  }

  async function handleManageBilling() {
    setBillingActionLoading("portal");
    try {
      const res = await fetch("/api/user/subscription/portal", { method: "POST" });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
    } finally {
      setBillingActionLoading(null);
    }
  }

  const currentFeatures = planById(plan).features;
  const missingFeatures = (Object.keys(FEATURE_LABELS) as (keyof ClientPlan["features"])[])
    .filter((key) => !currentFeatures[key])
    .map((key) => FEATURE_LABELS[key]);

  // Only the free→checkout path supports annual billing today — switching between two
  // already-active paid plans still goes through the existing monthly-only route, so the
  // toggle would be misleading (and inert) for anyone not on Free.
  const canChooseAnnual = plan === "free";

  // Portaled to document.body — this modal can be triggered from inside the sticky sidebar,
  // and position:sticky always establishes its own stacking context, which would otherwise
  // trap a nested z-50 element behind whatever the sidebar's later DOM siblings (header, page
  // content) happen to be, regardless of z-index.
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
              {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-stone-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              {couponRedemption && (
                <div className="flex items-center gap-2 bg-sage-50 border border-sage-200 rounded-xl px-4 py-3 mb-4">
                  <span className="text-base">🎉</span>
                  <p className="text-sm text-sage-800">
                    You have{" "}
                    <span className="font-semibold">
                      {couponRedemption.coupon.discountType === "percent"
                        ? `${couponRedemption.discountValueSnapshot}% off`
                        : `${formatCents(couponRedemption.discountValueSnapshot)} off`}
                    </span>{" "}
                    any paid plan — referred by {couponRedemption.coupon.owner.user.name} (code {couponRedemption.coupon.code}).
                  </p>
                </div>
              )}

              {missingFeatures.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                  <span className="text-sm text-amber-800 flex items-center gap-1.5">
                    <Lock size={13} className="flex-shrink-0" />
                    <span className="font-semibold">On {planById(plan).name}, you&apos;re missing:</span>
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {missingFeatures.map((f) => (
                      <span key={f} className="text-xs font-medium bg-white border border-amber-200 text-amber-800 rounded-full px-2.5 py-1">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {canChooseAnnual && (
                <div className="flex justify-center mb-4">
                  <div className="inline-flex bg-stone-100 border border-stone-200 rounded-full p-0.5">
                    <button
                      onClick={() => setBillingCycle("monthly")}
                      className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors ${billingCycle === "monthly" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle("annual")}
                      className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${billingCycle === "annual" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
                    >
                      Annually
                      <span className="text-[10px] font-bold bg-sage-100 text-sage-700 rounded-full px-1.5 py-0.5">Save 17%</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {CLIENT_PLANS.map((p) => {
                  const isCurrent = plan === p.id;
                  const useAnnual = canChooseAnnual && billingCycle === "annual" && p.annualPriceCents != null;
                  const baseCents = useAnnual ? p.annualPriceCents! : p.priceCents;
                  const discountedCents = couponRedemption ? discountedPriceCents(baseCents, couponRedemption) : null;
                  const priceLabel = baseCents === 0 ? "$0/mo" : useAnnual ? `${formatCents(baseCents)}/yr` : `${formatCents(baseCents)}/mo`;
                  const monthlyEquivalent = useAnnual ? formatCents(Math.round(p.annualPriceCents! / 12)) : null;
                  const savedCents = useAnnual ? p.priceCents * 12 - p.annualPriceCents! : 0;
                  const buttonLabel = isCurrent
                    ? "Current plan"
                    : plan === "free"
                    ? `Upgrade — ${priceLabel}`
                    : (p.id === "free" ? "Downgrade" : "Switch plan");
                  const loadingKey = p.id === "free" ? "portal" : p.id;
                  return (
                    <div key={p.id} className={`rounded-xl border p-5 relative ${isCurrent ? "border-stone-900 bg-stone-50" : "border-stone-100 bg-white"}`}>
                      {p.mostPopular && !isCurrent && (
                        <span className="absolute -top-2.5 right-4 text-[10px] bg-sage-600 text-white px-2 py-0.5 rounded-full font-medium">Most Popular</span>
                      )}
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-semibold text-stone-900">{p.name}</h3>
                        {isCurrent && <span className="text-[10px] bg-stone-900 text-white px-1.5 py-0.5 rounded font-medium">Current</span>}
                      </div>
                      <p className="text-xs text-stone-400 mb-3">{p.tagline}</p>
                      {discountedCents !== null && discountedCents !== baseCents ? (
                        <div className="mb-1">
                          <span className="text-xs text-stone-400 line-through mr-2">{priceLabel}</span>
                          <span className="text-2xl font-semibold text-sage-700">{formatCents(discountedCents)}{useAnnual ? "/yr" : "/mo"}</span>
                        </div>
                      ) : (
                        <div className="text-2xl font-semibold text-stone-900 mb-1">{priceLabel}</div>
                      )}
                      <div className="text-xs text-sage-700 font-medium mb-3 h-4">
                        {useAnnual && monthlyEquivalent ? `Just ${monthlyEquivalent}/mo · save ${formatCents(savedCents)}/yr` : " "}
                      </div>
                      <ul className="space-y-1.5 mb-4">
                        {p.highlights.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-xs text-stone-500">
                            <span className="text-stone-400 mt-0.5 flex-shrink-0">✓</span><span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      {isCurrent && missingFeatures.length > 0 && (
                        <div className="mb-4">
                          <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider border-t border-dashed border-stone-200 pt-2.5 mb-1.5">
                            Not included
                          </div>
                          <ul className="space-y-1.5">
                            {missingFeatures.map((f) => (
                              <li key={f} className="flex items-start gap-2 text-xs text-stone-400">
                                <Lock size={11} className="mt-0.5 flex-shrink-0" /><span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <button
                        disabled={isCurrent || billingActionLoading !== null}
                        onClick={() => {
                          if (p.id === "free") return handleManageBilling();
                          if (plan === "free") return handleUpgrade(p.id);
                          return handleSwitchPlan(p.id);
                        }}
                        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${isCurrent ? "bg-stone-200 text-stone-500 cursor-default" : "bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50"}`}
                      >
                        {billingActionLoading === loadingKey ? "Redirecting…" : buttonLabel}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4">
                <button
                  onClick={() => setShowComparison((v) => !v)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors py-2"
                >
                  {showComparison ? "Hide" : "See"} full feature comparison
                  <ChevronDown size={13} className={`transition-transform ${showComparison ? "rotate-180" : ""}`} />
                </button>
                {showComparison && <PlanComparisonTable currentPlan={plan} />}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
