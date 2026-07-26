"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { formatCents } from "@/lib/money";

type Overview = {
  currency: string;
  ratePerMinuteCents: number | null;
  revenue: { monthCents: number; allTimeCents: number; sessionsThisMonth: number; avgSessionValueCents: number };
  pendingPayoutCents: number;
};

export default function OverviewTab() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);

  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState("");
  const [rateSaving, setRateSaving] = useState(false);
  const [rateError, setRateError] = useState("");

  function load() {
    fetch("/api/therapist/business/overview").then((r) => r.json()).then((d) => { if (d.revenue) setOverview(d); }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function saveRate() {
    const dollars = parseFloat(rateInput);
    if (!dollars || dollars <= 0) { setRateError("Enter a rate greater than $0"); return; }
    setRateSaving(true);
    setRateError("");
    try {
      const res = await fetch("/api/therapist/business/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratePerMinuteCents: Math.round(dollars * 100) }),
      });
      if (!res.ok) { setRateError("Couldn't save your rate — try again."); return; }
      setEditingRate(false);
      load();
    } finally {
      setRateSaving(false);
    }
  }

  if (loading || !overview) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-stone-100 rounded-xl" />)}
      </div>
    );
  }

  const currency = overview.currency;

  return (
    <div className="space-y-5">
      {overview.ratePerMinuteCents == null ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
          <p className="text-sm font-medium text-amber-900">Set your per-minute rate to start tracking earnings</p>
          <p className="text-xs text-amber-700">Earnings are calculated automatically from the actual duration of your completed video sessions.</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500">$</span>
            <input
              type="number" min="0" step="0.01" value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              placeholder="5.00"
              className="w-28 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
            />
            <span className="text-sm text-stone-500">/ min</span>
            <button
              onClick={saveRate}
              disabled={rateSaving}
              className="ml-2 bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {rateSaving ? "Saving…" : "Save rate"}
            </button>
          </div>
          {rateError && <p className="text-xs text-red-600">{rateError}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
          {editingRate ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-500">$</span>
              <input
                type="number" min="0" step="0.01" value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                className="w-24 border border-stone-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-stone-400"
                autoFocus
              />
              <span className="text-sm text-stone-500">/ min</span>
              <button onClick={saveRate} disabled={rateSaving} className="text-xs font-medium bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 disabled:opacity-50">
                {rateSaving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditingRate(false)} className="text-xs text-stone-400 hover:text-stone-600">Cancel</button>
              {rateError && <p className="text-xs text-red-600">{rateError}</p>}
            </div>
          ) : (
            <>
              <p className="text-sm text-stone-700">
                Your rate: <span className="font-semibold">{formatCents(overview.ratePerMinuteCents, currency)}/min</span>
              </p>
              <button
                onClick={() => { setRateInput((overview.ratePerMinuteCents! / 100).toFixed(2)); setEditingRate(true); }}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800"
              >
                <Pencil size={12} /> Edit
              </button>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Revenue this month", value: formatCents(overview.revenue.monthCents, currency), sub: `${overview.revenue.sessionsThisMonth} session${overview.revenue.sessionsThisMonth === 1 ? "" : "s"}` },
          { label: "All-time revenue", value: formatCents(overview.revenue.allTimeCents, currency), sub: "since you joined" },
          { label: "Avg session value", value: formatCents(overview.revenue.avgSessionValueCents, currency), sub: "per completed session" },
          { label: "Pending payout balance", value: formatCents(overview.pendingPayoutCents, currency), sub: "not yet withdrawn" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-xl p-4 hover:border-stone-200 transition-colors">
            <div className="text-2xl font-semibold text-stone-900">{s.value}</div>
            <div className="text-xs text-stone-500 mt-0.5">{s.label}</div>
            <div className="text-[10px] text-stone-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
