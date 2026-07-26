"use client";

import { useEffect, useState } from "react";
import { formatCents } from "@/lib/money";

type Analytics = {
  revenueTrend: { label: string; cents: number }[];
  totalCents: number;
  sessionCount: number;
  activeClientCount: number;
  avgSessionValueCents: number;
};

const RANGES = ["7d", "30d", "90d"] as const;

export default function AnalyticsTab() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("30d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Analytics | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/therapist/business/analytics?range=${range}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [range]);

  const maxCents = data ? Math.max(...data.revenueTrend.map((b) => b.cents), 1) : 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1 w-fit">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
              range === r ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-stone-100 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Revenue", value: formatCents(data.totalCents), sub: `last ${range}` },
              { label: "Sessions", value: String(data.sessionCount), sub: `last ${range}` },
              { label: "Avg session value", value: formatCents(data.avgSessionValueCents), sub: "per session" },
              { label: "Active clients", value: String(data.activeClientCount), sub: "on your roster" },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-stone-100 rounded-xl p-4">
                <div className="text-2xl font-semibold text-stone-900">{s.value}</div>
                <div className="text-xs text-stone-500 mt-0.5">{s.label}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-stone-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-stone-900 mb-4">Revenue trend</h3>
            {data.totalCents === 0 ? (
              <p className="text-sm text-stone-400 py-6 text-center">No revenue in this period yet.</p>
            ) : (
              <div className="flex items-end gap-2 h-32">
                {data.revenueTrend.map((bucket, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="relative w-full flex justify-center">
                      {hoverIdx === i && (
                        <div className="absolute bottom-full mb-1.5 bg-stone-900 text-white text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none">
                          {formatCents(bucket.cents)}
                        </div>
                      )}
                      <div
                        className="w-full max-w-8 rounded-t-sm cursor-pointer transition-colors"
                        style={{
                          height: `${Math.max((bucket.cents / maxCents) * 96, bucket.cents > 0 ? 4 : 1)}px`,
                          backgroundColor: hoverIdx === i ? "#44403c" : "#1c1917",
                          opacity: bucket.cents > 0 ? 0.85 : 0.15,
                        }}
                        onMouseEnter={() => setHoverIdx(i)}
                        onMouseLeave={() => setHoverIdx(null)}
                      />
                    </div>
                    <span className="text-[9px] text-stone-400 truncate w-full text-center">{bucket.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
