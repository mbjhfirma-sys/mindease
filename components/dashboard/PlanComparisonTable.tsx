"use client";

import type { ClientPlanId } from "@/lib/clientPlans";

type CellValue = boolean | string;
type Row = { label: string; free: CellValue; growth: CellValue; premium: CellValue };

// Kept in sync by hand with lib/clientPlans.ts's highlights — there's no single structured
// feature-matrix source to derive this from (highlights are freeform per-plan copy).
const ROWS: Row[] = [
  { label: "Course library", free: "Intro courses only", growth: "Full library", premium: "Full library" },
  { label: "Mindo AI companion", free: false, growth: true, premium: true },
  { label: "Live weekly group sessions", free: false, growth: true, premium: true },
  { label: "Journaling & mood tracking", free: true, growth: true, premium: true },
  { label: "Community & peer support groups", free: true, growth: true, premium: true },
  { label: "1-on-1 therapist sessions", free: "Pay per session", growth: "Pay per session", premium: "1 free/mo + pay per session" },
  { label: "Dedicated wellness coach", free: false, growth: false, premium: true },
  { label: "Priority support", free: false, growth: false, premium: true },
  { label: "Family & couples add-on", free: false, growth: false, premium: "Available" },
  { label: "Safety plan & crisis resources", free: "Always free", growth: "Always free", premium: "Always free" },
];

function Cell({ value, tinted }: { value: CellValue; tinted?: boolean }) {
  if (value === true) return <span className="text-sage-600 font-semibold">✓</span>;
  if (value === false) return <span className="text-stone-300">—</span>;
  return <span className={tinted ? "text-sage-800 font-medium" : "text-stone-500"}>{value}</span>;
}

export default function PlanComparisonTable({ currentPlan }: { currentPlan: ClientPlanId }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-100">
      <table className="w-full text-xs border-collapse min-w-[480px]">
        <thead>
          <tr className="bg-stone-50">
            <th className="text-left font-semibold text-stone-500 px-3 py-2.5 w-[36%]">Feature</th>
            <th className={`px-3 py-2.5 font-semibold ${currentPlan === "free" ? "text-stone-900" : "text-stone-500"}`}>Free</th>
            <th className="px-3 py-2.5 font-semibold text-sage-800 bg-sage-50">Growth</th>
            <th className={`px-3 py-2.5 font-semibold ${currentPlan === "premium" ? "text-stone-900" : "text-stone-500"}`}>Premium</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-t border-stone-100">
              <td className="px-3 py-2.5 text-stone-600">{row.label}</td>
              <td className="px-3 py-2.5 text-center"><Cell value={row.free} /></td>
              <td className="px-3 py-2.5 text-center bg-sage-50/60"><Cell value={row.growth} tinted /></td>
              <td className="px-3 py-2.5 text-center"><Cell value={row.premium} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
