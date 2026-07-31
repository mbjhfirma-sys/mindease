"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { formatCents } from "@/lib/money";
import { THERAPIST_PLANS } from "@/lib/therapistPlans";
import TeamBillingCard from "./TeamBillingCard";

type Subscription = {
  id: string;
  planId: string;
  priceCents: number;
  currency: string;
  billingCycle: "monthly" | "annual";
  autoRenew: boolean;
  status: "active" | "past_due" | "canceled" | "incomplete";
  currentPeriodEnd: string;
  stripeSubscriptionId: string | null;
} | null;

type Billing = {
  currency: string;
  billingEmail: string | null;
  invoiceCompanyName: string | null;
  vatNumber: string | null;
  paymentNotificationsEnabled: boolean;
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-stone-900" : "bg-stone-200"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function SubscriptionTab() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [billing, setBilling] = useState<Billing>({
    currency: "USD", billingEmail: null, invoiceCompanyName: null, vatNumber: null, paymentNotificationsEnabled: true,
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [planBusy, setPlanBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

  const [billingSaving, setBillingSaving] = useState(false);
  const [billingSaved, setBillingSaved] = useState(false);

  function loadAll() {
    Promise.all([
      fetch("/api/therapist/business/subscription").then((r) => r.json()),
      fetch("/api/therapist/business/billing").then((r) => r.json()),
      fetch("/api/user").then((r) => r.json()),
    ]).then(([subData, billData, uData]) => {
      setSubscription(subData.subscription ?? null);
      if (billData.billing) setBilling(billData.billing);
      if (uData.user) setTwoFactorEnabled(!!uData.user.twoFactorEnabled);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  async function subscribeTo(planId: string) {
    setPlanBusy(true);
    try {
      // Not yet a real Stripe subscription and moving to a paid tier — needs Checkout to
      // create one. Every other case (Starter-local, switching between two already-real
      // paid tiers, scheduling a downgrade back to Starter) goes through the existing
      // POST/PATCH route, which now handles each of those directly.
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
      if (res.ok) loadAll();
    } finally {
      setPlanBusy(false);
    }
  }

  async function openPortal() {
    setPortalBusy(true);
    try {
      const res = await fetch("/api/therapist/business/subscription/portal", { method: "POST" });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
    } finally {
      setPortalBusy(false);
    }
  }

  async function toggleAutoRenew(v: boolean) {
    setSubscription((s) => s && { ...s, autoRenew: v });
    await fetch("/api/therapist/business/subscription", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoRenew: v }),
    });
  }

  async function cancelSubscription() {
    setPlanBusy(true);
    try {
      const res = await fetch("/api/therapist/business/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancel: true }),
      });
      if (res.ok) loadAll();
    } finally {
      setPlanBusy(false);
    }
  }

  async function saveBilling() {
    setBillingSaving(true);
    try {
      const res = await fetch("/api/therapist/business/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: billing.currency,
          billingEmail: billing.billingEmail || null,
          invoiceCompanyName: billing.invoiceCompanyName || null,
          vatNumber: billing.vatNumber || null,
          paymentNotificationsEnabled: billing.paymentNotificationsEnabled,
        }),
      });
      if (res.ok) {
        setBillingSaved(true);
        setTimeout(() => setBillingSaved(false), 2500);
      }
    } finally {
      setBillingSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-stone-100 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-stone-900 mb-3">Your plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {THERAPIST_PLANS.map((plan) => {
            const isCurrent = subscription?.planId === plan.id && subscription.status === "active";
            return (
              <div key={plan.id} className={`bg-white border rounded-xl p-4 flex flex-col gap-3 ${isCurrent ? "border-stone-900 ring-1 ring-stone-900" : "border-stone-100"}`}>
                <div>
                  <p className="text-sm font-semibold text-stone-900">{plan.name}</p>
                  <p className="text-lg font-semibold text-stone-900 mt-0.5">{formatCents(plan.priceCents)}<span className="text-xs font-normal text-stone-400">/mo</span></p>
                </div>
                <ul className="text-xs text-stone-500 space-y-1 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5"><Check size={12} className="text-sage-600 mt-0.5 flex-shrink-0" />{f}</li>
                  ))}
                </ul>
                <button
                  onClick={() => subscribeTo(plan.id)}
                  disabled={isCurrent || planBusy}
                  className={`text-xs font-medium py-2 rounded-lg transition-colors ${
                    isCurrent ? "bg-stone-100 text-stone-400 cursor-default" : "bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50"
                  }`}
                >
                  {isCurrent ? "Current plan" : subscription ? "Switch to this plan" : "Subscribe"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {subscription && (
        <div className="bg-white border border-stone-100 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-700">
                {subscription.status === "canceled"
                  ? "Subscription canceled"
                  : subscription.status === "active" && !subscription.autoRenew
                  ? "Downgrading to Starter"
                  : subscription.status === "past_due"
                  ? "Payment past due"
                  : "Next renewal"}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                {subscription.status === "canceled"
                  ? "Access continues until the end of the current period."
                  : subscription.status === "active" && !subscription.autoRenew
                  ? `Your plan reverts to Starter on ${new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
                  : new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            {subscription.status === "active" && subscription.stripeSubscriptionId && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500">Auto-renew</span>
                <Toggle checked={subscription.autoRenew} onChange={toggleAutoRenew} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {subscription.status === "active" && subscription.autoRenew && (
              <button onClick={cancelSubscription} disabled={planBusy} className="text-xs text-red-500 hover:text-red-700 transition-colors">
                Cancel subscription
              </button>
            )}
            {subscription.stripeSubscriptionId && (
              <button onClick={openPortal} disabled={portalBusy} className="text-xs text-stone-500 hover:text-stone-800 transition-colors">
                {portalBusy ? "Redirecting…" : "Manage billing, payment method & invoices →"}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-stone-100 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-stone-900">Billing settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Billing email</label>
            <input
              type="email" value={billing.billingEmail ?? ""}
              onChange={(e) => setBilling((b) => ({ ...b, billingEmail: e.target.value }))}
              placeholder="you@example.com"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Currency</label>
            <select
              value={billing.currency}
              onChange={(e) => setBilling((b) => ({ ...b, currency: e.target.value }))}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-white"
            >
              {["USD", "EUR", "GBP", "CAD", "AUD"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Invoice company name</label>
            <input
              type="text" value={billing.invoiceCompanyName ?? ""}
              onChange={(e) => setBilling((b) => ({ ...b, invoiceCompanyName: e.target.value }))}
              placeholder="Optional"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">VAT number</label>
            <input
              type="text" value={billing.vatNumber ?? ""}
              onChange={(e) => setBilling((b) => ({ ...b, vatNumber: e.target.value }))}
              placeholder="Optional"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-stone-700">Payment notifications</span>
          <Toggle checked={billing.paymentNotificationsEnabled} onChange={(v) => setBilling((b) => ({ ...b, paymentNotificationsEnabled: v }))} />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          {billingSaved ? <p className="text-xs text-stone-500 flex items-center gap-1"><Check size={12} className="text-green-600" /> Saved</p> : <span />}
          <button
            onClick={saveBilling}
            disabled={billingSaving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            {billingSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <Lock size={14} className="text-stone-400" />
          <span className="text-sm text-stone-700">Two-factor authentication</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${twoFactorEnabled ? "text-sage-700 bg-sage-50 border-sage-200" : "text-stone-500 bg-white border-stone-200"}`}>
            {twoFactorEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>
        <Link href="/therapist/settings" className="text-xs text-stone-500 hover:text-stone-800 transition-colors">Manage in Settings →</Link>
      </div>

      <TeamBillingCard />
    </div>
  );
}
