"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const LEVEL_BG = ["bg-stone-100", "bg-sage-100", "bg-sage-200", "bg-sage-500", "bg-sage-700"];
const LEVEL_TEXT = ["text-stone-400", "text-sage-800", "text-sage-800", "text-white font-semibold", "text-white font-semibold"];
const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function levelFor(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function MiniCalendar({
  year, month, selectedDate, density, onSelectDate, onPrevMonth, onNextMonth,
}: {
  year: number;
  month: number;
  selectedDate: Date;
  density: Record<string, number>;
  onSelectDate: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-stone-900">{monthLabel}</h3>
        <div className="flex gap-0.5">
          <button onClick={onPrevMonth} aria-label="Previous month" className="p-1 rounded-md text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <button onClick={onNextMonth} aria-label="Next month" className="p-1 rounded-md text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-[9px] font-semibold text-stone-300">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstWeekday }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const d = new Date(year, month, day);
          const count = density[dayKey(d)] ?? 0;
          const level = levelFor(count);
          const isToday = d.toDateString() === today.toDateString();
          const isSelected = d.toDateString() === selectedDate.toDateString();
          return (
            <button
              key={day}
              onClick={() => onSelectDate(d)}
              title={`${count} session${count === 1 ? "" : "s"}`}
              className={`aspect-square rounded-md text-[10px] flex items-center justify-center transition-all ${LEVEL_BG[level]} ${LEVEL_TEXT[level]} ${isSelected ? "ring-2 ring-stone-900" : isToday ? "ring-1 ring-sage-400" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
