"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
import { formatCents } from "@/lib/money";

type Coupon = {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  active: boolean;
  maxRedemptions: number | null;
  _count: { redemptions: number };
};

type Referral = {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "THERAPIST";
  couponCode: string;
  redeemedAt: string;
  lifetimeCommissionCents: number;
};

type Affiliate = {
  referrals: Referral[];
  monthlyCommissionCents: number;
  lifetimeCommissionCents: number;
  pendingCommissionCents: number;
};

function discountLabel(c: Coupon): string {
  return c.discountType === "percent" ? `${c.discountValue}% off` : formatCents(c.discountValue) + " off";
}

export default function AffiliateTab() {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("20");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [creatingClientCode, setCreatingClientCode] = useState(false);
  const [clientCodeError, setClientCodeError] = useState("");

  function loadAll() {
    Promise.all([
      fetch("/api/therapist/business/coupons").then((r) => r.json()),
      fetch("/api/therapist/business/affiliate").then((r) => r.json()),
    ]).then(([cData, aData]) => {
      if (cData.coupons) setCoupons(cData.coupons);
      if (aData.referrals) setAffiliate(aData);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  async function createCoupon() {
    const value = parseInt(discountValue, 10);
    if (!value || value <= 0) { setCreateError("Enter a discount greater than 0"); return; }
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/therapist/business/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() || undefined, discountType, discountValue: value }),
      });
      const d = await res.json();
      if (!res.ok) { setCreateError(d.error?.fieldErrors?.discountValue?.[0] ?? d.error ?? "Couldn't create code."); return; }
      setCode("");
      setDiscountValue("20");
      setShowForm(false);
      loadAll();
    } finally {
      setCreating(false);
    }
  }

  async function createClientCode() {
    setCreatingClientCode(true);
    setClientCodeError("");
    try {
      const res = await fetch("/api/therapist/business/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discountType: "percent", discountValue: 15 }),
      });
      const d = await res.json();
      if (!res.ok) { setClientCodeError(d.error ?? "Couldn't create your client code."); return; }
      loadAll();
    } finally {
      setCreatingClientCode(false);
    }
  }

  async function toggleActive(coupon: Coupon) {
    setCoupons((prev) => prev.map((c) => c.id === coupon.id ? { ...c, active: !c.active } : c));
    await fetch(`/api/therapist/business/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !coupon.active }),
    });
  }

  async function deleteCoupon(id: string) {
    const res = await fetch(`/api/therapist/business/coupons/${id}`, { method: "DELETE" });
    if (res.ok) loadAll();
  }

  function copyCode(coupon: Coupon) {
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopiedId(coupon.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-stone-100 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "This month", value: formatCents(affiliate?.monthlyCommissionCents ?? 0) },
          { label: "Lifetime commissions", value: formatCents(affiliate?.lifetimeCommissionCents ?? 0) },
          { label: "Pending payout", value: formatCents(affiliate?.pendingCommissionCents ?? 0) },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-xl p-4">
            <div className="text-2xl font-semibold text-stone-900">{s.value}</div>
            <div className="text-xs text-stone-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-stone-100 rounded-xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Share a code with your clients</h3>
            <p className="text-xs text-stone-500">Give clients 15% off their own YouMindo subscription when they sign up with your code.</p>
          </div>
          <button
            onClick={createClientCode}
            disabled={creatingClientCode}
            className="text-xs font-medium bg-stone-900 text-white px-3 py-2 rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            {creatingClientCode ? "Creating…" : "Create client code (15% off)"}
          </button>
        </div>
        {clientCodeError && <p className="text-xs text-red-600 mt-2">{clientCodeError}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-stone-900">Your coupon codes</h3>
          <button onClick={() => setShowForm((v) => !v)} className="text-xs font-medium bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors">
            {showForm ? "Cancel" : "+ Create code"}
          </button>
        </div>
        <p className="text-xs text-stone-400 mb-3">
          Any code here can be shared with a client (for a subscription discount) or another therapist (for a referral commission) — set whatever discount you like.
        </p>

        {showForm && (
          <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 mb-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Code</label>
                <input
                  type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Auto-generated"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Discount type</label>
                <select
                  value={discountType} onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-white"
                >
                  <option value="percent">Percent off</option>
                  <option value="fixed">Fixed amount off (cents)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">
                  {discountType === "percent" ? "Percent" : "Cents"}
                </label>
                <input
                  type="number" min="1" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                />
              </div>
            </div>
            {createError && <p className="text-xs text-red-600">{createError}</p>}
            <button
              onClick={createCoupon}
              disabled={creating}
              className="text-sm font-medium bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating…" : "Create code"}
            </button>
          </div>
        )}

        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          {coupons.length === 0 ? (
            <div className="py-10 text-center text-sm text-stone-400">No codes yet — create one to start referring.</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {coupons.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-stone-900">{c.code}</span>
                      <button onClick={() => copyCode(c)} className="text-stone-400 hover:text-stone-700 transition-colors">
                        {copiedId === c.id ? <Check size={12} className="text-sage-600" /> : <Copy size={12} />}
                      </button>
                      {!c.active && <span className="text-[10px] font-medium text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">Inactive</span>}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">
                      {discountLabel(c)} · {c._count.redemptions} redemption{c._count.redemptions === 1 ? "" : "s"}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(c)}
                    className="text-xs text-stone-500 hover:text-stone-800 border border-stone-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {c.active ? "Deactivate" : "Activate"}
                  </button>
                  {c._count.redemptions === 0 && (
                    <button onClick={() => deleteCoupon(c.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-stone-900 mb-3">Referrals</h3>
        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          {!affiliate || affiliate.referrals.length === 0 ? (
            <div className="py-10 text-center text-sm text-stone-400">No referrals yet.</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {affiliate.referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm text-stone-800">{r.name}</div>
                    <div className="text-xs text-stone-400">
                      {r.role === "THERAPIST" ? "Therapist" : "Client"} · code {r.couponCode} · joined {new Date(r.redeemedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-stone-900">
                    {r.role === "THERAPIST" ? formatCents(r.lifetimeCommissionCents) : <span className="text-xs font-normal text-stone-400">No commission (client)</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-stone-400 mt-2">
          Commission only accrues when a referred therapist pays for their own YouMindo subscription — client referrals earn no commission since YouMindo doesn&apos;t process client payments.
        </p>
      </div>
    </div>
  );
}
