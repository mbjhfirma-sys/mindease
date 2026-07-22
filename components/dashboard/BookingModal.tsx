"use client";

import { useState, useEffect } from "react";
import { timeSlotToDate } from "@/lib/scheduling";

type TherapistInfo = { name: string; avatar: string; title: string; specializations: string[]; rating: number };
type SessionType = "video" | "phone" | "in-person";
type Duration = 15 | 30 | 45 | 60;

interface BookingModalProps {
  onClose: () => void;
  therapistId?: string;
  therapistName?: string;
  therapistTitle?: string;
}

const sessionTypeIcons: Record<SessionType, string> = {
  video: "📹",
  phone: "📞",
  "in-person": "🏥",
};

const sessionTypeLabels: Record<SessionType, string> = {
  video: "Video",
  phone: "Phone",
  "in-person": "In-Person",
};

const DEFAULT_THERAPIST: TherapistInfo = { name: "Your Therapist", avatar: "👩‍⚕️", title: "Licensed Therapist", specializations: [], rating: 0 };

export default function BookingModal({ onClose, therapistId: therapistIdProp, therapistName, therapistTitle }: BookingModalProps) {
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  const [therapist, setTherapist] = useState<TherapistInfo>(() => ({
    ...DEFAULT_THERAPIST,
    name: therapistName ?? DEFAULT_THERAPIST.name,
    title: therapistTitle ?? DEFAULT_THERAPIST.title,
  }));
  const [realTherapistId, setRealTherapistId] = useState<string | null>(therapistIdProp ?? null);
  const [sessionType, setSessionType] = useState<SessionType>("video");
  const [duration, setDuration] = useState<Duration>(60);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (therapistIdProp) return;
    fetch("/api/user").then((r) => r.json()).then((d) => {
      const t = d.user?.assignedTherapist;
      if (t) {
        setRealTherapistId(t.id);
        setTherapist({
          name: t.user?.name ?? "Your Therapist",
          avatar: t.user?.avatar ?? "👩‍⚕️",
          title: t.title ?? "Licensed Therapist",
          specializations: t.specializations ?? [],
          rating: t.rating ?? 0,
        });
      }
    });
  }, [therapistIdProp]);

  useEffect(() => {
    if (!realTherapistId || !date) {
      setAvailableSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    fetch(`/api/therapists/${realTherapistId}/availability?date=${date}&duration=${duration}`)
      .then((r) => (r.ok ? r.json() : { slots: [] }))
      .then((d) => {
        if (cancelled) return;
        const slots: string[] = d.slots ?? [];
        setAvailableSlots(slots);
        setTime((prev) => (prev && !slots.includes(prev) ? "" : prev));
      })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [realTherapistId, date, duration]);

  const canSubmit = date && time && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    if (!realTherapistId) {
      setError("No therapist selected. Please assign a therapist first.");
      setLoading(false);
      return;
    }
    try {
      const isoDate = timeSlotToDate(date, time).toISOString();
      const apiType = sessionType === "in-person" ? "in_person" : sessionType;
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          therapistId: realTherapistId,
          date: isoDate,
          type: apiType,
          duration,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Could not book session");
      }
      setConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send request");
    } finally {
      setLoading(false);
    }
  }

  const formattedDate = date
    ? new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 pt-6 pb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              {confirmed ? "Session Requested!" : "Book a Session"}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          {/* Therapist card */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
              {therapist.avatar}
            </div>
            <div>
              <div className="font-semibold">{therapist.name}</div>
              <div className="text-blue-200 text-xs">{therapist.title}</div>
              <div className="flex gap-1 mt-1 flex-wrap">
                {therapist.specializations.map((s) => (
                  <span key={s} className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            {therapist.rating > 0 && (
              <div className="ml-auto text-right flex-shrink-0">
                <div className="text-base font-bold">★ {therapist.rating.toFixed(1)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Confirmed state */}
        {confirmed ? (
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-4">
              ✓
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1">Request Sent</h3>
            <p className="text-stone-500 text-sm mb-6">
              {therapist.name} will confirm your session shortly.
            </p>
            <div className="bg-stone-50 rounded-2xl p-4 text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Date</span>
                <span className="font-medium text-stone-800">{formattedDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Time</span>
                <span className="font-medium text-stone-800">{time}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Type</span>
                <span className="font-medium text-stone-800">
                  {sessionTypeIcons[sessionType]} {sessionTypeLabels[sessionType]}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Duration</span>
                <span className="font-medium text-stone-800">{duration} min</span>
              </div>
              {notes && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Notes</span>
                  <span className="font-medium text-stone-800 text-right max-w-[60%]">{notes}</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* Booking form */
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

            {/* Session type */}
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2 block">
                Session Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["video", "phone", "in-person"] as SessionType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSessionType(t)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-medium transition-all ${
                      sessionType === t
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-stone-200 text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    <span className="text-lg">{sessionTypeIcons[t]}</span>
                    {sessionTypeLabels[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2 block">
                Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([15, 30, 45, 60] as Duration[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      duration === d
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-stone-200 text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2 block">
                Date
              </label>
              <input
                type="date"
                min={minDateStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Time */}
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2 block">
                Time
              </label>
              {!date ? (
                <p className="text-xs text-stone-400 py-2">Pick a date to see available times.</p>
              ) : slotsLoading ? (
                <p className="text-xs text-stone-400 py-2">Loading available times…</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-xs text-stone-400 py-2">No available times for this date — try another day.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setTime(slot)}
                      className={`py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                        time === slot
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-stone-200 text-stone-600 hover:border-stone-300"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2 block">
                Notes <span className="font-normal normal-case">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Anything you'd like your therapist to know before the session…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pb-1">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border-2 border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                  canSubmit
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-stone-100 text-stone-400 cursor-not-allowed"
                }`}
              >
                {loading ? "Sending…" : "Request Session →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
