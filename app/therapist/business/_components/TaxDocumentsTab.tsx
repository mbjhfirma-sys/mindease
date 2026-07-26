"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";

const DOCUMENTS = [
  { id: "annual-earnings", label: "Annual earnings report", description: "Every session payment recorded this year, by client and date." },
  { id: "vat-report", label: "VAT report", description: "Session earnings alongside your registered company name and VAT number." },
  { id: "full-report", label: "Tax report", description: "Combined income (session earnings) and expenses (platform subscription) for the year." },
] as const;

const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear - 1, currentYear - 2];

export default function TaxDocumentsTab() {
  const [year, setYear] = useState(currentYear);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function download(id: (typeof DOCUMENTS)[number]["id"]) {
    setDownloadingId(id);
    try {
      const res = await fetch(`/api/therapist/business/tax/${id}?year=${year}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `youmindo-${id}-${year}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-stone-400 uppercase tracking-widest">Year</span>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value, 10))}
          className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-stone-400 bg-white"
        >
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="bg-white border border-stone-100 rounded-xl divide-y divide-stone-50">
        {DOCUMENTS.map((doc) => (
          <div key={doc.id} className="flex items-center gap-4 px-5 py-4">
            <div className="w-9 h-9 rounded-lg bg-stone-50 flex items-center justify-center flex-shrink-0">
              <FileText size={16} className="text-stone-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800">{doc.label}</p>
              <p className="text-xs text-stone-400 mt-0.5">{doc.description}</p>
            </div>
            <button
              onClick={() => download(doc.id)}
              disabled={downloadingId === doc.id}
              className="flex items-center gap-1.5 text-xs font-medium border border-stone-200 text-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-50 disabled:opacity-50 transition-colors flex-shrink-0"
            >
              <Download size={12} /> {downloadingId === doc.id ? "Preparing…" : "Download CSV"}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-stone-400">
        These are data exports of your recorded activity with YouMindo for your own accountant — not certified tax or VAT forms.
      </p>
    </div>
  );
}
