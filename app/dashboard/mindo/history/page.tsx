"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Sparkles, ArrowLeft } from "lucide-react";
import { DailyFactsGrid } from "@/components/dashboard/DailyFactsGrid";
import type { DailyFacts } from "@/lib/mindo/factsTypes";

type Briefing = { id: string; date: string; briefingText: string; softened: boolean; facts?: DailyFacts };

// `date` is a plain "YYYY-MM-DD" calendar-day label, not an instant — parsing
// it as an ISO string (`new Date(str)`) treats it as UTC midnight, which can
// render as the wrong day once formatted in the browser's own local timezone.
// Construct via the local-time constructor instead so display always matches
// the label, with no timezone conversion involved at all.
function formatDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function MindoHistoryPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    fetch("/api/mindo/briefing/history")
      .then((r) => r.json())
      .then((d: { briefings?: Briefing[] }) => setBriefings(d.briefings ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors mb-3">
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-stone-900">Mindo history</h1>
        <p className="text-sm text-stone-500 mt-1">Your past morning briefings, most recent first.</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-stone-100 rounded-xl" />)}
        </div>
      ) : briefings.length === 0 ? (
        <div className="bg-white border border-stone-100 rounded-xl px-5 py-12 text-center text-sm text-stone-400">
          No briefings yet — check back after your first morning with Mindo.
        </div>
      ) : (
        <div className="space-y-3">
          {briefings.map((b) => (
            <div key={b.id} className="bg-white border border-stone-100 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sage-50 text-sage-600 flex items-center justify-center flex-shrink-0">
                <Sparkles size={15} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-1">
                  {formatDateKey(b.date)}
                </div>
                <p className="text-sm text-stone-700 leading-relaxed">{b.briefingText}</p>
                {b.facts && (
                  <>
                    <button
                      onClick={() => toggleExpanded(b.id)}
                      className="text-[11px] font-medium text-stone-400 hover:text-stone-700 transition-colors mt-1.5"
                    >
                      {expandedIds.has(b.id) ? "Hide the numbers" : "What's this based on? →"}
                    </button>
                    {expandedIds.has(b.id) && <div className="mt-2"><DailyFactsGrid facts={b.facts} /></div>}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
