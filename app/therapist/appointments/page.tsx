"use client";

import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import VideoCallRoom from "@/components/video/VideoCallRoom";
import { notifyBadgesChanged } from "@/lib/badgeEvents";
import { TIME_SLOTS, weekdayOf } from "@/lib/scheduling";
import AppointmentRow, { type Appt, isSameDay } from "./_components/AppointmentRow";
import MiniCalendar from "./_components/MiniCalendar";

type ClientStub = { id: string; name: string };
type TabView = "today" | "history" | "availability";

const SESSION_TYPES = [
  { value: "video", label: "Video" },
  { value: "in_person", label: "In person" },
  { value: "phone", label: "Phone" },
] as const;

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDur(min: number) {
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ""}`;
}

function displayDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function displayTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const r = addDays(d, diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

function relTime(target: Date, now: Date): string {
  const diffMin = Math.round((target.getTime() - now.getTime()) / 60_000);
  if (diffMin <= 0) return "now";
  if (diffMin < 60) return `in ${diffMin}m`;
  const h = Math.floor(diffMin / 60), m = diffMin % 60;
  return `in ${h}h${m ? ` ${m}m` : ""}`;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AppointmentsPage() {
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientStub[]>([]);
  const [view, setView] = useState<TabView>("today");
  const [activeCall, setActiveCall] = useState<Appt | null>(null);
  const [rescheduleAppt, setRescheduleAppt] = useState<Appt | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);

  // Availability state
  const [availableSlots, setAvailableSlots] = useState<Set<string>>(new Set());
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilitySaved, setAvailabilitySaved] = useState(false);

  // Today / mini-calendar state
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // Keeps join-window countdowns fresh without a network round trip.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 20_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/therapist/clients").then((r) => r.json()),
      fetch("/api/therapist/availability").then((r) => r.json()),
    ]).then(([aData, cData, avData]) => {
      setAppts(aData.appointments ?? []);
      setClients((cData.clients ?? []).map((c: ClientStub) => ({ id: c.id, name: c.name })));
      setAvailableSlots(new Set((avData.slots ?? []).map((s: { day: string; time: string }) => `${s.day}|${s.time}`)));
    }).finally(() => setLoading(false));
  }, []);

  function toggleAvailability(day: string, time: string) {
    const key = `${day}|${time}`;
    setAvailableSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  async function saveAvailability() {
    setSavingAvailability(true);
    try {
      const slots = [...availableSlots].map((key) => {
        const [day, time] = key.split("|");
        return { day, time };
      });
      await fetch("/api/therapist/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      setAvailabilitySaved(true);
      setTimeout(() => setAvailabilitySaved(false), 2000);
    } finally {
      setSavingAvailability(false);
    }
  }

  async function approve(id: string) {
    setAppts((p) => p.map((a) => a.id === id ? { ...a, status: "confirmed" as const } : a));
    await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "confirmed" }) });
    notifyBadgesChanged();
  }

  async function decline(id: string) {
    setAppts((p) => p.map((a) => a.id === id ? { ...a, status: "cancelled" as const } : a));
    await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "cancelled" }) });
    notifyBadgesChanged();
  }

  async function complete(id: string) {
    setAppts((p) => p.map((a) => a.id === id ? { ...a, status: "completed" as const } : a));
    await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed" }) });
  }

  async function cancelAppt(id: string) {
    if (!window.confirm("Cancel this session? Your client will be notified.")) return;
    setAppts((p) => p.map((a) => a.id === id ? { ...a, status: "cancelled" as const } : a));
    await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "cancelled" }) });
  }

  async function bookAppointment(clientId: string, clientName: string, date: string, time: string, type: Appt["type"], duration: number, notes: string) {
    const [h, mStr] = time.split(":");
    const isPm = time.includes("PM") && !time.startsWith("12");
    const hour = (isPm ? parseInt(h) + 12 : parseInt(h));
    const isoDate = `${date}T${String(hour).padStart(2, "0")}:${(mStr ?? "00").replace(/[APM]/g, "").trim().padStart(2, "0")}:00.000Z`;

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, date: isoDate, type, duration, notes: notes || undefined }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false as const, error: data.error ?? "Failed to book session" };

    setAppts((p) => [data.appointment as Appt, ...p]);
    return { ok: true as const };
  }

  async function reschedule(id: string, newDateIso: string, newTime: string) {
    const [rawH] = newTime.split(":");
    const isPm = newTime.includes("PM") && !newTime.startsWith("12");
    const hour = isPm ? parseInt(rawH) + 12 : parseInt(rawH);
    const isoDate = `${newDateIso}T${String(hour).padStart(2, "0")}:00:00.000Z`;
    setAppts((p) => p.map((a) => a.id === id ? { ...a, date: isoDate } : a));
    setRescheduleAppt(null);
    await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: isoDate }) });
  }

  const now = new Date();
  const pending = appts.filter((a) => a.status === "pending");
  const activeAppts = appts.filter((a) => a.status !== "cancelled" && a.status !== "no_show");
  const history = appts
    .filter((a) => a.status === "completed" || a.status === "cancelled" || a.status === "no_show")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const todayCount = activeAppts.filter((a) => isSameDay(new Date(a.date), today)).length;
  const weekStart = startOfWeek(today);
  const weekAppts = activeAppts.filter((a) => { const d = new Date(a.date); return d >= weekStart && d < addDays(weekStart, 7); });
  const nextAppt = appts
    .filter((a) => (a.status === "confirmed" || a.status === "pending") && new Date(a.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null;

  const selectedDayAppts = appts
    .filter((a) => isSameDay(new Date(a.date), selectedDate))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const selectedDayLabel = isSameDay(selectedDate, today)
    ? "Today"
    : selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const monthDensity = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of appts) {
      if (a.status === "cancelled" || a.status === "no_show") continue;
      const d = new Date(a.date);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const k = dayKey(d);
        map[k] = (map[k] ?? 0) + 1;
      }
    }
    return map;
  }, [appts, calYear, calMonth]);

  function prevMonth() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); } else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); } else setCalMonth((m) => m + 1);
  }

  const takenSlots = appts.filter((a) => a.status === "confirmed" || a.status === "pending").map((a) => ({
    dateStr: a.date.split("T")[0],
    time: displayTime(a.date),
  }));

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">Appointments</h1>
            <p className="text-sm text-stone-500 mt-1">Your practice, at a glance.</p>
          </div>
          <button onClick={() => setShowBookModal(true)} className="bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors">
            Book slot
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100">
          {([
            { id: "today", label: "Today" },
            { id: "history", label: "History" },
            { id: "availability", label: "Availability" },
          ] as { id: TabView; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                view === t.id ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-white border border-stone-100 rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3">
              <div className="h-64 bg-white border border-stone-100 rounded-xl" />
              <div className="h-64 bg-white border border-stone-100 rounded-xl" />
            </div>
          </div>
        ) : view === "today" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile value={String(todayCount)} label="Today's sessions" sub={today.toLocaleDateString("en-US", { weekday: "long" })} />
              <StatTile value={String(pending.length)} label="Pending requests" sub="awaiting your response" />
              <StatTile value={String(weekAppts.length)} label="This week" sub={`${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${addDays(weekStart, 6).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`} />
              <StatTile value={nextAppt ? relTime(new Date(nextAppt.date), now) : "—"} label="Next session" sub={nextAppt ? nextAppt.client.name : "Nothing scheduled"} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3">
              <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
                <div className="px-4 py-3.5 border-b border-stone-50">
                  <h3 className="text-sm font-semibold text-stone-900">{selectedDayLabel}</h3>
                </div>
                {selectedDayAppts.length === 0 ? (
                  <div className="py-12 text-center text-sm text-stone-400">Nothing on the books.</div>
                ) : (
                  <div>
                    {selectedDayAppts.map((appt) => (
                      <AppointmentRow
                        key={appt.id}
                        appt={appt}
                        onApprove={() => approve(appt.id)}
                        onDecline={() => decline(appt.id)}
                        onJoin={() => setActiveCall(appt)}
                        onComplete={() => complete(appt.id)}
                        onReschedule={() => setRescheduleAppt(appt)}
                        onCancel={() => cancelAppt(appt.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white border border-stone-100 rounded-xl p-4">
                <MiniCalendar
                  year={calYear} month={calMonth} selectedDate={selectedDate}
                  density={monthDensity} onSelectDate={setSelectedDate}
                  onPrevMonth={prevMonth} onNextMonth={nextMonth}
                />
              </div>
            </div>

            <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3.5 border-b border-stone-50">
                <h3 className="text-sm font-semibold text-stone-900">Needs your response</h3>
              </div>
              {pending.length === 0 ? (
                <div className="py-10 text-center text-sm text-stone-400">You&rsquo;re all caught up.</div>
              ) : (
                <div>
                  {pending.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((appt) => (
                    <AppointmentRow key={appt.id} appt={appt} showDate onApprove={() => approve(appt.id)} onDecline={() => decline(appt.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : view === "history" ? (
          <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
            {history.length === 0 ? (
              <div className="py-14 text-center text-sm text-stone-400">No past sessions yet.</div>
            ) : (
              <div>
                {history.map((appt) => (
                  <AppointmentRow key={appt.id} appt={appt} showDate />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-stone-100 rounded-xl p-5 space-y-5">
            <h3 className="text-sm font-semibold text-stone-900">Weekly Availability</h3>
            <div className="space-y-3">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-stone-700 flex-shrink-0">{day}</div>
                  <div className="flex gap-2 flex-wrap">
                    {TIME_SLOTS.map((slot) => {
                      const on = availableSlots.has(`${day}|${slot}`);
                      return (
                        <button
                          key={slot}
                          onClick={() => toggleAvailability(day, slot)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                            on ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-600 hover:border-stone-900 hover:text-stone-900"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={saveAvailability} disabled={savingAvailability} className="bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-40">
                {savingAvailability ? "Saving…" : "Save availability"}
              </button>
              {availabilitySaved && <span className="text-xs text-stone-500">Saved</span>}
            </div>
          </div>
        )}
      </div>

      {activeCall && (
        <VideoCallRoom
          appointmentId={activeCall.id}
          otherPartyName={activeCall.client.name}
          sessionType={activeCall.type}
          durationLabel={fmtDur(activeCall.duration)}
          onEnd={() => setActiveCall(null)}
        />
      )}

      {showBookModal && (
        <BookSlotModal
          clients={clients}
          takenSlots={takenSlots}
          weeklyAvailability={availableSlots}
          onConfirm={bookAppointment}
          onClose={() => setShowBookModal(false)}
        />
      )}

      {rescheduleAppt && (
        <RescheduleModal
          appt={rescheduleAppt}
          takenSlots={appts.filter((a) => a.id !== rescheduleAppt.id && (a.status === "confirmed" || a.status === "pending")).map((a) => ({
            dateStr: a.date.split("T")[0],
            time: displayTime(a.date),
          }))}
          weeklyAvailability={availableSlots}
          onConfirm={(newDate, newTime) => reschedule(rescheduleAppt.id, newDate, newTime)}
          onClose={() => setRescheduleAppt(null)}
        />
      )}
    </>
  );
}

function StatTile({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="bg-white border border-stone-100 rounded-xl p-4">
      <div className="text-2xl font-semibold text-stone-900">{value}</div>
      <div className="text-xs text-stone-500 mt-0.5">{label}</div>
      <div className="text-[10px] text-stone-400 mt-0.5">{sub}</div>
    </div>
  );
}

function RescheduleModal({
  appt, takenSlots, weeklyAvailability, onConfirm, onClose,
}: {
  appt: Appt; takenSlots: { dateStr: string; time: string }[]; weeklyAvailability: Set<string>;
  onConfirm: (newDate: string, newTime: string) => void; onClose: () => void;
}) {
  const [newDate, setNewDate] = useState(todayIso());
  const [newTime, setNewTime] = useState<string | null>(null);

  const takenTimesOnDate = takenSlots.filter((s) => s.dateStr === newDate).map((s) => s.time);
  const enforceAvailability = weeklyAvailability.size > 0;
  const availableTimesOnDate = new Set(
    TIME_SLOTS.filter((slot) => weeklyAvailability.has(`${weekdayOf(newDate)}|${slot}`))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Reschedule session</h2>
            <p className="text-xs text-stone-400 mt-0.5">{appt.client.name} · currently {displayDate(appt.date)} at {displayTime(appt.date)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700">New date</label>
            <input type="date" value={newDate} min={todayIso()} onChange={(e) => { setNewDate(e.target.value); setNewTime(null); }} className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-stone-700">New time</label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map((slot) => {
                const taken = takenTimesOnDate.includes(slot) || (enforceAvailability && !availableTimesOnDate.has(slot));
                return (
                  <button key={slot} disabled={taken} onClick={() => setNewTime(slot)} className={`text-xs px-2 py-2 rounded-lg border font-medium transition-all ${taken ? "bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed" : newTime === slot ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-600 hover:border-stone-900"}`}>
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-stone-100 bg-stone-50">
          <button onClick={onClose} className="text-sm border border-stone-200 text-stone-600 px-4 py-2 rounded-lg hover:bg-white transition-colors">Cancel</button>
          <button onClick={() => newTime && onConfirm(newDate, newTime)} disabled={!newTime} className="text-sm bg-stone-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Confirm reschedule
          </button>
        </div>
      </div>
    </div>
  );
}

function BookSlotModal({
  clients, takenSlots, weeklyAvailability, onConfirm, onClose,
}: {
  clients: ClientStub[]; takenSlots: { dateStr: string; time: string }[]; weeklyAvailability: Set<string>;
  onConfirm: (clientId: string, clientName: string, date: string, time: string, type: Appt["type"], duration: number, notes: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onClose: () => void;
}) {
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientStub | null>(null);
  const [sessionType, setSessionType] = useState<Appt["type"]>("video");
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(50);
  const [notes, setNotes] = useState("");
  const [booked, setBooked] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takenTimesOnDate = takenSlots.filter((s) => s.dateStr === date).map((s) => s.time);
  const enforceAvailability = weeklyAvailability.size > 0;
  const availableTimesOnDate = new Set(
    TIME_SLOTS.filter((slot) => weeklyAvailability.has(`${weekdayOf(date)}|${slot}`))
  );
  const filteredClients = clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()));

  async function handleBook() {
    if (!selectedClient || !time || booking) return;
    setBooking(true);
    setError(null);
    const result = await onConfirm(selectedClient.id, selectedClient.name, date, time, sessionType, duration, notes);
    setBooking(false);
    if (!result.ok) { setError(result.error); return; }
    setBooked(true);
  }

  if (booked && selectedClient && time) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
          <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9l3.5 3.5L14 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900">Session booked</h2>
              <p className="text-xs text-stone-400 mt-0.5">Pending confirmation from {selectedClient.name}.</p>
            </div>
            <button onClick={onClose} className="w-full bg-stone-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-stone-800 transition-colors">Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Book a slot</h2>
            <p className="text-xs text-stone-400 mt-0.5">Schedule a new session with a client</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition-colors"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700">Client <span className="text-red-400">*</span></label>
            {selectedClient ? (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                <div className="w-7 h-7 bg-stone-200 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600">{selectedClient.name[0]}</div>
                <span className="text-sm text-stone-900 flex-1">{selectedClient.name}</span>
                <button onClick={() => { setSelectedClient(null); setClientSearch(""); }} className="text-xs text-stone-400 hover:text-stone-700">Change</button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <input type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Search client name…" autoFocus className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors" />
                {clientSearch && (
                  <div className="border border-stone-100 rounded-lg overflow-hidden max-h-36 overflow-y-auto">
                    {filteredClients.length === 0 ? (
                      <p className="text-sm text-stone-400 text-center py-4">No clients found</p>
                    ) : filteredClients.map((c) => (
                      <button key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(""); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-stone-50 transition-colors">
                        <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600">{c.name[0]}</div>
                        <span className="text-sm font-medium text-stone-900">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700">Session type</label>
            <div className="flex flex-wrap gap-1.5">
              {SESSION_TYPES.map(({ value, label }) => (
                <button key={value} onClick={() => setSessionType(value)} className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${sessionType === value ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-600 hover:border-stone-400"}`}>{label}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">Date <span className="text-red-400">*</span></label>
              <input type="date" value={date} min={todayIso()} onChange={(e) => { setDate(e.target.value); setTime(null); }} className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">Duration</label>
              <div className="flex gap-1.5">
                {[25, 50, 80].map((d) => (
                  <button key={d} onClick={() => setDuration(d)} className={`flex-1 text-xs py-2 rounded-lg border font-medium transition-all ${duration === d ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-600 hover:border-stone-400"}`}>{d}m</button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-stone-700">Time <span className="text-red-400">*</span></label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map((slot) => {
                const taken = takenTimesOnDate.includes(slot) || (enforceAvailability && !availableTimesOnDate.has(slot));
                return (
                  <button key={slot} disabled={taken} onClick={() => setTime(slot)} className={`text-xs px-2 py-2 rounded-lg border font-medium transition-all ${taken ? "bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed" : time === slot ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-600 hover:border-stone-900"}`}>{slot}</button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700">Notes <span className="text-stone-400 font-normal">(optional)</span></label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Initial intake session." className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors resize-none" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-stone-100 bg-stone-50 flex-shrink-0">
          <button onClick={onClose} className="text-sm border border-stone-200 text-stone-600 px-4 py-2 rounded-lg hover:bg-white transition-colors">Cancel</button>
          <button disabled={!selectedClient || !time || booking} onClick={handleBook} className="text-sm bg-stone-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">{booking ? "Booking…" : "Book session"}</button>
        </div>
      </div>
    </div>
  );
}
