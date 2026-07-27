"use client";

import Link from "next/link";
import { formatCents } from "@/lib/money";

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

const STATUS_STYLE: Record<Transaction["status"], { label: string; className: string }> = {
  available: { label: "Available", className: "text-stone-500 bg-stone-50 border-stone-200" },
  requested: { label: "Requested", className: "text-amber-700 bg-amber-50 border-amber-200" },
  paid: { label: "Paid out", className: "text-sage-700 bg-sage-50 border-sage-200" },
};

export default function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-50">
        <h3 className="text-sm font-semibold text-stone-900">All transactions</h3>
        <Link href="/therapist/business/payouts" className="text-xs text-stone-500 hover:text-stone-800">
          View payouts
        </Link>
      </div>
      {transactions.length === 0 ? (
        <div className="py-10 text-center text-sm text-stone-400">No client payments in this period.</div>
      ) : (
        <div className="divide-y divide-stone-50">
          {transactions.map((t) => {
            const status = STATUS_STYLE[t.status];
            return (
              <div key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-stone-800 truncate">{t.clientName}</div>
                  <div className="text-xs text-stone-400">
                    {new Date(t.sessionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {Math.round(t.durationMinutes)} min session
                  </div>
                </div>
                <div className="text-xs text-stone-400 font-mono tabular-nums w-16 text-right hidden sm:block">
                  {formatCents(t.ratePerMinuteCents, t.currency)}/min
                </div>
                <span className={`text-[10px] font-medium px-2 py-1 rounded-full border whitespace-nowrap ${status.className}`}>
                  {status.label}
                </span>
                <div className="text-sm font-semibold text-stone-900 w-20 text-right tabular-nums">
                  {formatCents(t.netAmountCents, t.currency)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
