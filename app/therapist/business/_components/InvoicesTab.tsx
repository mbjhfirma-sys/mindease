"use client";

import { useEffect, useState } from "react";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCents } from "@/lib/money";

type Invoice = {
  id: string;
  periodStart: string;
  periodEnd: string;
  amountCents: number;
  currency: string;
  status: "paid" | "pending" | "failed";
  issuedAt: string;
};

const STATUS_STYLE: Record<Invoice["status"], string> = {
  paid: "text-sage-700 bg-sage-50 border-sage-200",
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  failed: "text-red-600 bg-red-50 border-red-200",
};

export default function InvoicesTab() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/therapist/business/invoices?year=${year}`)
      .then((r) => r.json())
      .then((d) => setInvoices(d.invoices ?? []))
      .finally(() => setLoading(false));
  }, [year]);

  async function downloadCsv() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/therapist/business/invoices/export?year=${year}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `youmindo-invoices-${year}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setYear((y) => y - 1)} className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold text-stone-900 w-12 text-center">{year}</span>
          <button onClick={() => setYear((y) => y + 1)} disabled={year >= new Date().getFullYear()} className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-50 hover:text-stone-700 disabled:opacity-30 transition-colors"><ChevronRight size={16} /></button>
        </div>
        <button
          onClick={downloadCsv}
          disabled={downloading || invoices.length === 0}
          className="flex items-center gap-1.5 text-xs font-medium border border-stone-200 text-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-50 disabled:opacity-40 transition-colors"
        >
          <Download size={12} /> {downloading ? "Preparing…" : "Download CSV"}
        </button>
      </div>

      <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-2 animate-pulse">
            {[1, 2].map((i) => <div key={i} className="h-12 bg-stone-100 rounded-lg" />)}
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-10 text-center text-sm text-stone-400">No invoices for {year}.</div>
        ) : (
          <div className="divide-y divide-stone-50">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm text-stone-800">
                    {new Date(inv.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(inv.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  <p className="text-xs text-stone-400">Issued {new Date(inv.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-stone-900">{formatCents(inv.amountCents, inv.currency)}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[inv.status]}`}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
