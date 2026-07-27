"use client";

import { useState } from "react";
import Link from "next/link";
import { Video, MapPin, Phone, MoreVertical } from "lucide-react";
import { getJoinWindow } from "@/lib/video";

export type Appt = {
  id: string; date: string; duration: number;
  type: "video" | "in_person" | "phone";
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  client: { id: string; name: string };
  notes?: string | null;
};

const TYPE_META = {
  video: { label: "Video", Icon: Video, color: "#60A5FA" },
  in_person: { label: "In person", Icon: MapPin, color: "#52B788" },
  phone: { label: "Phone", Icon: Phone, color: "#C084FC" },
} as const;

const STATUS_META: Record<Appt["status"], { label: string; className: string }> = {
  pending: { label: "Pending", className: "text-amber-700 bg-amber-50 border-amber-200" },
  confirmed: { label: "Confirmed", className: "text-sage-700 bg-sage-50 border-sage-200" },
  completed: { label: "Completed", className: "text-stone-500 bg-stone-50 border-stone-200" },
  cancelled: { label: "Cancelled", className: "text-red-600 bg-red-50 border-red-200" },
  no_show: { label: "No-show", className: "text-red-600 bg-red-50 border-red-200" },
};

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function dateGroupLabel(iso: string): string {
  const target = new Date(iso);
  const today = new Date();
  if (isSameDay(target, today)) return "Today";
  if (isSameDay(target, addDays(today, 1))) return "Tomorrow";
  if (isSameDay(target, addDays(today, -1))) return "Yesterday";
  return target.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function displayTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatCountdown(ms: number): string {
  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
}

export default function AppointmentRow({
  appt, showDate = false, onApprove, onDecline, onJoin, onComplete, onReschedule, onCancel,
}: {
  appt: Appt;
  showDate?: boolean;
  onApprove?: () => void;
  onDecline?: () => void;
  onJoin?: () => void;
  onComplete?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const tm = TYPE_META[appt.type];
  const sm = STATUS_META[appt.status];
  const Icon = tm.Icon;

  const joinWindow = appt.status === "confirmed" ? getJoinWindow(new Date(appt.date), appt.duration) : null;
  const sessionEndsAt = new Date(new Date(appt.date).getTime() + appt.duration * 60_000);
  const sessionHasEnded = new Date() >= sessionEndsAt;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-t border-stone-50 first:border-t-0">
      <div className={`flex-shrink-0 text-xs font-semibold text-stone-600 font-mono whitespace-nowrap ${showDate ? "" : "w-14"}`}>
        {showDate ? `${dateGroupLabel(appt.date)} · ${displayTime(appt.date)}` : displayTime(appt.date)}
      </div>
      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-[11px] font-bold text-stone-600 flex-shrink-0">
        {appt.client.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-stone-900 truncate">{appt.client.name}</div>
        <div className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
          <Icon size={11} style={{ color: tm.color }} />
          {tm.label} · {appt.duration} min
        </div>
      </div>

      {appt.status === "pending" ? (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={onDecline} className="text-xs font-semibold text-stone-500 border border-stone-200 px-2.5 py-1.5 rounded-lg hover:bg-stone-50 transition-colors">Decline</button>
          <button onClick={onApprove} className="text-xs font-semibold text-white bg-sage-600 px-2.5 py-1.5 rounded-lg hover:bg-sage-700 transition-colors">Accept</button>
        </div>
      ) : (
        <>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${sm.className}`}>{sm.label}</span>
          {appt.status === "confirmed" && appt.type === "video" && joinWindow?.isOpen && (
            <button onClick={onJoin} className="text-xs font-semibold text-white bg-stone-900 px-2.5 py-1.5 rounded-lg hover:bg-stone-800 transition-colors flex-shrink-0">Join</button>
          )}
          {appt.status === "confirmed" && appt.type === "video" && joinWindow && !joinWindow.isOpen && new Date() < joinWindow.opensAt && (
            <span className="text-[10px] font-semibold text-amber-600 flex-shrink-0 whitespace-nowrap">In {formatCountdown(joinWindow.opensInMs)}</span>
          )}
          {appt.status === "confirmed" && sessionHasEnded && (
            <button onClick={onComplete} className="text-xs font-semibold text-sage-700 bg-sage-50 border border-sage-200 px-2.5 py-1.5 rounded-lg hover:bg-sage-100 transition-colors flex-shrink-0">Mark done</button>
          )}
          {appt.status === "completed" && (
            <Link href={`/therapist/clients/${appt.client.id}?tab=notes`} className="text-xs font-semibold text-stone-500 border border-stone-200 px-2.5 py-1.5 rounded-lg hover:bg-stone-50 transition-colors flex-shrink-0">
              Notes
            </Link>
          )}
          {appt.status === "confirmed" && (
            <div
              className="relative flex-shrink-0"
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setMenuOpen(false); }}
            >
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition-colors"
                aria-label="More actions"
                aria-expanded={menuOpen}
              >
                <MoreVertical size={15} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-stone-100 rounded-lg shadow-lg py-1 z-10">
                  <button
                    onClick={() => { setMenuOpen(false); onReschedule?.(); }}
                    className="w-full text-left px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onCancel?.(); }}
                    className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Cancel session
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
