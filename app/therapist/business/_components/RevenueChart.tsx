"use client";

import { useId, useState } from "react";
import { formatCents } from "@/lib/money";

type Point = { date: string; cents: number };

const WIDTH = 600;
const HEIGHT = 140;
const TOP_PAD = 18;
const BOTTOM_PAD = 4;

export default function RevenueChart({ data, currency }: { data: Point[]; currency: string }) {
  const gradientId = useId();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const maxCents = Math.max(...data.map((d) => d.cents), 100);
  const usableHeight = HEIGHT - TOP_PAD - BOTTOM_PAD;
  const n = data.length;

  const xAt = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * WIDTH);
  const yAt = (cents: number) => HEIGHT - BOTTOM_PAD - (cents / maxCents) * usableHeight;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(d.cents)}`).join(" ");
  const areaPath = `${linePath} L${xAt(n - 1)},${HEIGHT - BOTTOM_PAD} L${xAt(0)},${HEIGHT - BOTTOM_PAD} Z`;

  const lastIdx = n - 1;
  const activeIdx = hoverIdx ?? lastIdx;
  const active = data[activeIdx];

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHoverIdx(Math.round(frac * (n - 1)));
  }

  const gridLines = [0, 0.5, 1];

  return (
    <div
      className="relative w-full select-none"
      style={{ height: HEIGHT }}
      onMouseMove={handleMove}
      onMouseLeave={() => setHoverIdx(null)}
    >
      <svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-sage-500)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-sage-500)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((f) => (
          <line
            key={f}
            x1={0}
            x2={WIDTH}
            y1={TOP_PAD + f * usableHeight}
            y2={TOP_PAD + f * usableHeight}
            stroke="var(--color-stone-100)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke="var(--color-sage-600)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        {hoverIdx !== null && (
          <line
            x1={xAt(hoverIdx)}
            x2={xAt(hoverIdx)}
            y1={TOP_PAD}
            y2={HEIGHT - BOTTOM_PAD}
            stroke="var(--color-stone-300)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}

        <circle cx={xAt(activeIdx)} cy={yAt(active.cents)} r={4} fill="var(--color-sage-600)" stroke="white" strokeWidth={2} />
      </svg>

      <div className="absolute top-0 left-1 text-[9px] text-stone-400">{formatCents(maxCents, currency)}</div>
      <div className="absolute bottom-1 left-1 text-[9px] text-stone-400">$0</div>

      <div
        className="absolute -translate-x-1/2 bg-stone-900 text-white text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-sm"
        style={{
          left: `${(activeIdx / Math.max(1, n - 1)) * 100}%`,
          top: Math.max(0, yAt(active.cents) - 32),
        }}
      >
        {formatCents(active.cents, currency)}
        <span className="text-stone-400 font-normal ml-1">
          {new Date(active.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
}
