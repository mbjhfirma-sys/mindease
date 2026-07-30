"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { formatCents } from "@/lib/money";

type PendingEarning = {
  id: string;
  sessionDate: string;
  durationMinutes: number;
  netAmountCents: number;
  currency: string;
  client: { name: string };
};

type PendingCommission = {
  id: string;
  amountCents: number;
  currency: string;
  accruedAt: string;
};

type Payout = {
  id: string;
  status: "pending" | "paid";
  totalAmountCents: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  earnings: { id: string }[];
  commissions: { id: string }[];
};

export default function PayoutsTab() {
  const [loading, setLoading] = useState(true);
  const [pendingEarnings, setPendingEarnings] = useState<PendingEarning[]>([]);
  const [pendingCommissions, setPendingCommissions] = useState<PendingCommission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedCommissions, setSelectedCommissions] = useState<Set<string>>(new Set());
  const [requesting, setRequesting] = useState(false);
  const [payoutsReady, setPayoutsReady] = useState(false);

  function load() {
    fetch("/api/therapist/business/payouts").then((r) => r.json()).then((d) => {
      if (d.pendingEarnings) setPendingEarnings(d.pendingEarnings);
      if (d.pendingCommissions) setPendingCommissions(d.pendingCommissions);
      if (d.payouts) setPayouts(d.payouts);
      setPayoutsReady(Boolean(d.stripeConnectChargesEnabled && d.stripeConnectPayoutsEnabled));
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectCommission(id: string) {
    setSelectedCommissions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function requestPayout() {
    if (selected.size === 0 && selectedCommissions.size === 0) return;
    setRequesting(true);
    try {
      const res = await fetch("/api/therapist/business/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ earningIds: [...selected], commissionIds: [...selectedCommissions] }),
      });
      if (res.ok) {
        setSelected(new Set());
        setSelectedCommissions(new Set());
        load();
      }
    } finally {
      setRequesting(false);
    }
  }

  async function markPaid(payoutId: string) {
    const res = await fetch(`/api/therapist/business/payouts/${payoutId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    if (res.ok) load();
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2].map((i) => <div key={i} className="h-24 bg-stone-100 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-stone-900">Ready to withdraw ({pendingEarnings.length + pendingCommissions.length})</h3>
          {(selected.size > 0 || selectedCommissions.size > 0) && (
            <button
              onClick={requestPayout}
              disabled={requesting || !payoutsReady}
              title={payoutsReady ? undefined : "Connect your Stripe payout account on the Overview tab first"}
              className="bg-stone-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {requesting ? "Requesting…" : `Request payout (${selected.size + selectedCommissions.size})`}
            </button>
          )}
        </div>
        {!payoutsReady && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            Connect your Stripe payout account on the Overview tab before requesting a payout.
          </p>
        )}
        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          {pendingEarnings.length === 0 && pendingCommissions.length === 0 ? (
            <div className="py-10 text-center text-sm text-stone-400">No pending earnings yet.</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {pendingEarnings.map((e) => (
                <button
                  key={e.id}
                  onClick={() => toggleSelect(e.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-stone-50 transition-colors"
                >
                  <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${selected.has(e.id) ? "bg-stone-900 border-stone-900" : "border-stone-300"}`}>
                    {selected.has(e.id) && <Check size={10} strokeWidth={3} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-stone-800">{e.client.name}</div>
                    <div className="text-xs text-stone-400">
                      {new Date(e.sessionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {Math.round(e.durationMinutes)} min
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-stone-900">{formatCents(e.netAmountCents, e.currency)}</div>
                </button>
              ))}
              {pendingCommissions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleSelectCommission(c.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-stone-50 transition-colors"
                >
                  <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${selectedCommissions.has(c.id) ? "bg-stone-900 border-stone-900" : "border-stone-300"}`}>
                    {selectedCommissions.has(c.id) && <Check size={10} strokeWidth={3} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-stone-800">Referral commission</div>
                    <div className="text-xs text-stone-400">
                      {new Date(c.accruedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-stone-900">{formatCents(c.amountCents, c.currency)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-stone-900 mb-3">Payout history</h3>
        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          {payouts.length === 0 ? (
            <div className="py-10 text-center text-sm text-stone-400">No payouts requested yet.</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm text-stone-800">{formatCents(p.totalAmountCents, p.currency)}</div>
                    <div className="text-xs text-stone-400">
                      {p.earnings.length > 0 && `${p.earnings.length} session${p.earnings.length === 1 ? "" : "s"}`}
                      {p.earnings.length > 0 && p.commissions.length > 0 && " · "}
                      {p.commissions.length > 0 && `${p.commissions.length} commission${p.commissions.length === 1 ? "" : "s"}`}
                      {" · requested "}{new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  {p.status === "paid" ? (
                    <span className="text-xs font-medium text-sage-700 bg-sage-50 border border-sage-200 px-2.5 py-1 rounded-full">Paid</span>
                  ) : (
                    <button
                      onClick={() => markPaid(p.id)}
                      className="text-xs font-medium text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      Mark as paid
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-stone-400 mt-2">
          Sessions paid for through YouMindo are transferred to your connected Stripe account the moment you mark the payout paid. Older bookkeeping-only entries (from before Stripe payments were connected) still need manual reconciliation.
        </p>
      </div>
    </div>
  );
}
