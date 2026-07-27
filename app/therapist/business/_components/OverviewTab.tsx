"use client";

import { useEffect, useState } from "react";
import { Pencil, TrendingUp, TrendingDown } from "lucide-react";
import { formatCents } from "@/lib/money";
import RevenueChart from "./RevenueChart";
import RecentTransactions from "./RecentTransactions";
import StatSparkline from "./StatSparkline";
import ClientLeaderboard from "./ClientLeaderboard";

type Range = "7d" | "30d" | "90d";
const RANGES: { key: Range; label: string; sentence: string }[] = [
  { key: "7d", label: "7D", sentence: "last 7 days" },
  { key: "30d", label: "30D", sentence: "last 30 days" },
  { key: "90d", label: "90D", sentence: "last 90 days" },
];

type Transaction = {
  id: string;
  clientName: string;
  sessionDate: string;
  durationMinutes: number;
  ratePerMinuteCents: number;
  netAmountCents: number;
  currency: string;
  status: "available" | "requested" | "paid";
};

type Overview = {
  currency: string;
  ratePerMinuteCents: number | null;
  pendingPayoutCents: number;
  pendingEarningIds: string[];
  pendingCommissionIds: string[];
  totalCents: number;
  changePct: number;
  sessionCount: number;
  avgSessionValueCents: number;
  activeClientCount: number;
  sessionsTrend: number[];
  avgValueTrend: number[];
  revenueTrend: { date: string; cents: number }[];
  leaderboard: { id: string; name: string; cents: number; count: number }[];
  transactions: Transaction[];
};

export default function OverviewTab() {
  const [range, setRange] = useState<Range>("30d");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState("");
  const [rateSaving, setRateSaving] = useState(false);
  const [rateError, setRateError] = useState("");

  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState("");

  function load(r: Range) {
    fetch(`/api/therapist/business/overview?range=${r}`)
      .then((res) => res.json())
      .then((d) => { if (d.transactions) setOverview(d); })
      .finally(() => { setInitialLoading(false); setRefreshing(false); });
  }

  useEffect(() => { load(range); }, [range]);

  function handleRangeChange(r: Range) {
    if (r === range) return;
    setRefreshing(true);
    setRange(r);
  }

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
      load(range);
    } finally {
      setRateSaving(false);
    }
  }

  async function requestPayout() {
    if (!overview) return;
    setRequestingPayout(true);
    setPayoutError("");
    try {
      const res = await fetch("/api/therapist/business/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ earningIds: overview.pendingEarningIds, commissionIds: overview.pendingCommissionIds }),
      });
      if (!res.ok) { setPayoutError("Couldn't request a payout — try again."); return; }
      load(range);
    } finally {
      setRequestingPayout(false);
    }
  }

  if (initialLoading || !overview) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-14 bg-stone-100 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-stone-100 rounded-xl" />)}
        </div>
        <div className="h-56 bg-stone-100 rounded-xl" />
        <div className="h-56 bg-stone-100 rounded-xl" />
      </div>
    );
  }

  const currency = overview.currency;
  const rangeInfo = RANGES.find((r) => r.key === range)!;
  const avgThisPeriod = overview.sessionCount > 0 ? Math.round(overview.totalCents / overview.sessionCount) : 0;

  return (
    <div className={`space-y-5 transition-opacity ${refreshing ? "opacity-60 pointer-events-none" : ""}`}>
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

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Revenue, {rangeInfo.sentence}</div>
          <div className="text-4xl font-bold text-stone-900 tracking-tight mt-1">{formatCents(overview.totalCents, currency)}</div>
        </div>
        <div className="flex gap-1 bg-stone-100 p-1 rounded-lg">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => handleRangeChange(r.key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${
                range === r.key ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-100 rounded-xl p-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="text-2xl font-semibold text-stone-900">{overview.sessionCount}</div>
              <div className="text-xs text-stone-500 mt-0.5">Sessions</div>
              <div className="text-[10px] text-stone-400 mt-0.5">{rangeInfo.sentence}</div>
            </div>
            <StatSparkline values={overview.sessionsTrend} />
          </div>
        </div>
        <div className="bg-white border border-stone-100 rounded-xl p-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="text-2xl font-semibold text-stone-900">{formatCents(avgThisPeriod, currency)}</div>
              <div className="text-xs text-stone-500 mt-0.5">Avg session value</div>
              <div className="text-[10px] text-stone-400 mt-0.5">per session</div>
            </div>
            <StatSparkline values={overview.avgValueTrend} />
          </div>
        </div>
        <div className="bg-white border border-stone-100 rounded-xl p-4">
          <div className="text-2xl font-semibold text-stone-900">{overview.activeClientCount}</div>
          <div className="text-xs text-stone-500 mt-0.5">Active clients</div>
          <div className="text-[10px] text-stone-400 mt-0.5">on your roster</div>
        </div>
        <div className="bg-white border border-stone-100 rounded-xl p-4">
          <div className="text-2xl font-semibold text-stone-900">{formatCents(overview.pendingPayoutCents, currency)}</div>
          <div className="text-xs text-stone-500 mt-0.5">Pending payout</div>
          {overview.pendingPayoutCents > 0 && (
            <button
              onClick={requestPayout}
              disabled={requestingPayout}
              className="text-[11px] font-bold text-sage-700 hover:text-sage-800 mt-1.5 disabled:opacity-50"
            >
              {requestingPayout ? "Requesting…" : "Request payout →"}
            </button>
          )}
          {payoutError && <p className="text-[10px] text-red-600 mt-1">{payoutError}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-3">
        <div className="bg-white border border-stone-100 rounded-xl p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Revenue trend</h3>
              <p className="text-xs text-stone-400">Daily, {rangeInfo.sentence}</p>
            </div>
            {overview.changePct !== 0 && (
              <div
                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${
                  overview.changePct > 0 ? "text-sage-700 bg-sage-50 border-sage-200" : "text-red-700 bg-red-50 border-red-200"
                }`}
              >
                {overview.changePct > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(overview.changePct)}% vs prior {rangeInfo.sentence}
              </div>
            )}
          </div>
          {overview.totalCents === 0 ? (
            <p className="text-sm text-stone-400 py-10 text-center">No revenue in this period yet.</p>
          ) : (
            <div className="mt-4">
              <RevenueChart data={overview.revenueTrend} currency={currency} />
            </div>
          )}
        </div>

        <div className="bg-white border border-stone-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-stone-900">Top clients</h3>
          <p className="text-xs text-stone-400">Share of {rangeInfo.sentence}</p>
          <div className="mt-2">
            <ClientLeaderboard clients={overview.leaderboard} currency={currency} />
          </div>
        </div>
      </div>

      <RecentTransactions transactions={overview.transactions} />
    </div>
  );
}
