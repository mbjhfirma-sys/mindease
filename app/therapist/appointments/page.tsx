"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import VideoCallModal from "@/components/therapist/VideoCallModal";
import { therapistAppointments, therapistClients, type TherapistAppointment } from "@/lib/mockData";

type TabView = "upcoming" | "pending" | "history" | "calendar" | "availability";
type ActiveCall = { clientName: string; sessionType: string; duration: string };

const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

function isoToDisplayDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const wd = d.toLocaleDateString("en-US", { weekday: "short" });
  const mo = d.toLocaleDateString("en-US", { month: "short" });
  return `${wd} ${mo} ${d.getDate()}`;
}

function todayIso(): string {
  const d = new Date(2026, 5, 24);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseApptDate(str: string): Date {
  if (str === "Today") return new Date(2026, 5, 24);
  const m = str.match(/([A-Z][a-z]{2})\s+(\d{1,2})/);
  if (m && m[1] in MONTH_MAP) return new Date(2026, MONTH_MAP[m[1]], parseInt(m[2]));
  return new Date(2026, 5, 1);
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusLabel: Record<TherapistAppointment["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No-show",
};

export default function AppointmentsPage() {
  const [appts, setAppts] = useState(therapistAppointments);
  const [view, setView] = useState<TabView>("upcoming");
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [rescheduleAppt, setRescheduleAppt] = useState<TherapistAppointment | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);

  // Calendar state — start on June 2026 (today's month)
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(5);
  const [selectedDay, setSelectedDay] = useState<number | null>(24);

  function approve(id: string) {
    setAppts((p) => p.map((a) => (a.id === id ? { ...a, status: "confirmed" as const } : a)));
  }
  function decline(id: string) {
    setAppts((p) => p.map((a) => (a.id === id ? { ...a, status: "cancelled" as const } : a)));
  }
  function bookAppointment(
    clientId: string, clientName: string,
    date: string, time: string,
    type: TherapistAppointment["type"], duration: string, notes: string
  ) {
    const newAppt: TherapistAppointment = {
      id: `ta${Date.now()}`,
      clientId,
      clientName,
      clientAvatar: clientName[0],
      date: isoToDisplayDate(date),
      time,
      duration,
      type,
      status: "pending",
      initiatedBy: "therapist",
      notes: notes || undefined,
    };
    setAppts((p) => [newAppt, ...p]);
  }

  function reschedule(id: string, newDate: string, newTime: string) {
    setAppts((p) =>
      p.map((a) => (a.id === id ? { ...a, date: isoToDisplayDate(newDate), time: newTime } : a))
    );
    setRescheduleAppt(null);
  }

  const upcoming = appts
    .filter((a) => a.status === "confirmed" || a.status === "pending")
    .sort((a, b) => a.date.localeCompare(b.date));
  const pending = appts.filter((a) => a.status === "pending");
  const clientPending = pending.filter((a) => a.initiatedBy === "client");
  const therapistPending = pending.filter((a) => a.initiatedBy === "therapist");
  const history = appts.filter(
    (a) => a.status === "completed" || a.status === "cancelled" || a.status === "no-show"
  );

  const displayList =
    view === "pending" ? pending : view === "history" ? history : upcoming;

  // Calendar helpers
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthName = new Date(calYear, calMonth, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // Group appointments by day for the visible month
  const apptsByDay: Record<number, TherapistAppointment[]> = {};
  for (const a of appts) {
    const d = parseApptDate(a.date);
    if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
      const day = d.getDate();
      if (!apptsByDay[day]) apptsByDay[day] = [];
      apptsByDay[day].push(a);
    }
  }

  const selectedAppts = selectedDay ? (apptsByDay[selectedDay] ?? []) : [];

  function prevMonth() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
    setSelectedDay(null);
  }

  const todayKey = `2026-5-24`; // June 24, 2026
  const isToday = (day: number) => `${calYear}-${calMonth}-${day}` === todayKey;

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">Appointments</h1>
            <p className="text-sm text-stone-500 mt-1">
              {pending.length} pending · {upcoming.length - pending.length} confirmed
            </p>
          </div>
          <button
            onClick={() => setShowBookModal(true)}
            className="bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors"
          >
            Book slot
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100 overflow-x-auto">
          {(
            [
              { id: "upcoming", label: `Upcoming (${upcoming.length})` },
              { id: "pending", label: `Pending${pending.length > 0 ? ` (${pending.length})` : ""}` },
              { id: "history", label: "History" },
              { id: "calendar", label: "Calendar" },
              { id: "availability", label: "Availability" },
            ] as { id: TabView; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                view === t.id
                  ? "border-stone-900 text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Appointment list */}
        {view !== "availability" && view !== "calendar" && (
          <div className="space-y-3">
            {view === "pending" ? (
              <>
                {pending.length === 0 && (
                  <div className="bg-white border border-stone-100 rounded-xl py-14 text-center text-sm text-stone-400">
                    No pending appointments
                  </div>
                )}
                {clientPending.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-1">
                      Client requests
                    </p>
                    {clientPending.map((appt) => (
                      <AppointmentCard
                        key={appt.id}
                        appt={appt}
                        onApprove={() => approve(appt.id)}
                        onDecline={() => decline(appt.id)}
                        onJoin={() => setActiveCall({ clientName: appt.clientName, sessionType: appt.type, duration: appt.duration })}
                        onReschedule={() => setRescheduleAppt(appt)}
                      />
                    ))}
                  </div>
                )}
                {therapistPending.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-1">
                      Your bookings awaiting confirmation
                    </p>
                    {therapistPending.map((appt) => (
                      <AppointmentCard
                        key={appt.id}
                        appt={appt}
                        onApprove={() => approve(appt.id)}
                        onDecline={() => decline(appt.id)}
                        onJoin={() => setActiveCall({ clientName: appt.clientName, sessionType: appt.type, duration: appt.duration })}
                        onReschedule={() => setRescheduleAppt(appt)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {displayList.length === 0 && (
                  <div className="bg-white border border-stone-100 rounded-xl py-14 text-center text-sm text-stone-400">
                    No appointments in this category
                  </div>
                )}
                {displayList.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appt={appt}
                    onApprove={() => approve(appt.id)}
                    onDecline={() => decline(appt.id)}
                    onJoin={() =>
                      setActiveCall({
                        clientName: appt.clientName,
                        sessionType: appt.type,
                        duration: appt.duration,
                      })
                    }
                    onReschedule={() => setRescheduleAppt(appt)}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* Calendar view */}
        {view === "calendar" && (
          <div className="space-y-4">
            <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
              {/* Month navigation */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold text-stone-900">{monthName}</span>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day-of-week header */}
              <div className="grid grid-cols-7 border-b border-stone-100">
                {DAY_LABELS.map((d) => (
                  <div
                    key={d}
                    className="py-2 text-center text-[10px] font-semibold text-stone-400 uppercase tracking-wider"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {/* Empty cells before month starts */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-16 border-b border-r border-stone-50 last:border-r-0" />
                ))}

                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dayAppts = apptsByDay[day] ?? [];
                  const confirmed = dayAppts.filter((a) => a.status === "confirmed").length;
                  const pendingCount = dayAppts.filter((a) => a.status === "pending").length;
                  const isSelected = selectedDay === day;
                  const today = isToday(day);

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                      className={`h-16 border-b border-r border-stone-50 last:border-r-0 flex flex-col items-start px-2 pt-1.5 pb-1 transition-colors text-left ${
                        isSelected
                          ? "bg-stone-900"
                          : "hover:bg-stone-50"
                      }`}
                    >
                      <span
                        className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full mb-1 ${
                          isSelected
                            ? "text-white"
                            : today
                            ? "bg-stone-900 text-white"
                            : "text-stone-700"
                        }`}
                      >
                        {day}
                      </span>

                      {/* Appointment dots */}
                      <div className="flex flex-col gap-0.5 w-full">
                        {confirmed > 0 && (
                          <span
                            className={`text-[9px] leading-tight px-1.5 py-0.5 rounded font-medium truncate w-full ${
                              isSelected
                                ? "bg-stone-700 text-stone-200"
                                : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {confirmed} confirmed
                          </span>
                        )}
                        {pendingCount > 0 && (
                          <span
                            className={`text-[9px] leading-tight px-1.5 py-0.5 rounded font-medium truncate w-full ${
                              isSelected
                                ? "bg-amber-700 text-amber-100"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {pendingCount} pending
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-stone-500">
                <span className="w-2.5 h-2.5 bg-stone-100 rounded-sm" />
                Confirmed
              </span>
              <span className="flex items-center gap-1.5 text-xs text-stone-500">
                <span className="w-2.5 h-2.5 bg-amber-50 rounded-sm border border-amber-200" />
                Pending
              </span>
              <span className="flex items-center gap-1.5 text-xs text-stone-500">
                <span className="w-2.5 h-2.5 bg-stone-900 rounded-full" />
                Today
              </span>
            </div>

            {/* Selected-day detail panel */}
            {selectedDay !== null && (
              <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-stone-900">
                    {new Date(calYear, calMonth, selectedDay).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <span className="text-xs text-stone-400">
                    {selectedAppts.length === 0
                      ? "No sessions"
                      : `${selectedAppts.length} session${selectedAppts.length > 1 ? "s" : ""}`}
                  </span>
                </div>

                {selectedAppts.length === 0 ? (
                  <div className="py-10 text-center text-sm text-stone-400">
                    No appointments scheduled
                  </div>
                ) : (
                  <div className="divide-y divide-stone-50">
                    {selectedAppts
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((appt) => (
                        <AppointmentCard
                          key={appt.id}
                          appt={appt}
                          flat
                          onApprove={() => approve(appt.id)}
                          onDecline={() => decline(appt.id)}
                          onJoin={() =>
                            setActiveCall({
                              clientName: appt.clientName,
                              sessionType: appt.type,
                              duration: appt.duration,
                            })
                          }
                          onReschedule={() => setRescheduleAppt(appt)}
                        />
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Availability */}
        {view === "availability" && (
          <div className="bg-white border border-stone-100 rounded-xl p-5 space-y-5">
            <h3 className="text-sm font-semibold text-stone-900">Weekly Availability</h3>
            <div className="space-y-3">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-stone-700 flex-shrink-0">{day}</div>
                  <div className="flex gap-2 flex-wrap">
                    {["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"].map((slot) => {
                      const isBooked = therapistAppointments.some(
                        (a) =>
                          a.date !== "Jun 14" &&
                          a.date !== "Jun 16" &&
                          a.time === slot &&
                          (a.status === "confirmed" || a.status === "pending")
                      );
                      return (
                        <button
                          key={slot}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                            isBooked
                              ? "bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed"
                              : "border-stone-200 text-stone-600 hover:border-stone-900 hover:text-stone-900"
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
            <div className="pt-4 border-t border-stone-100 flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-stone-400">
                <span className="w-2.5 h-2.5 bg-stone-200 rounded-sm" />
                Available
              </span>
              <span className="flex items-center gap-1.5 text-xs text-stone-300">
                <span className="w-2.5 h-2.5 bg-stone-100 rounded-sm border border-stone-100" />
                Booked
              </span>
            </div>
            <button className="bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors">
              Save availability
            </button>
          </div>
        )}
      </div>

      {activeCall && (
        <VideoCallModal
          clientName={activeCall.clientName}
          sessionType={activeCall.sessionType}
          duration={activeCall.duration}
          onEnd={() => setActiveCall(null)}
        />
      )}

      {showBookModal && (
        <BookSlotModal
          takenSlots={appts
            .filter((a) => a.status === "confirmed" || a.status === "pending")
            .map((a) => ({ date: a.date, time: a.time }))}
          onConfirm={bookAppointment}
          onClose={() => setShowBookModal(false)}
        />
      )}

      {rescheduleAppt && (
        <RescheduleModal
          appt={rescheduleAppt}
          takenSlots={appts
            .filter(
              (a) =>
                a.id !== rescheduleAppt.id &&
                (a.status === "confirmed" || a.status === "pending")
            )
            .map((a) => ({ date: a.date, time: a.time }))}
          onConfirm={(newDate, newTime) => reschedule(rescheduleAppt.id, newDate, newTime)}
          onClose={() => setRescheduleAppt(null)}
        />
      )}
    </>
  );
}

function RescheduleModal({
  appt,
  takenSlots,
  onConfirm,
  onClose,
}: {
  appt: TherapistAppointment;
  takenSlots: { date: string; time: string }[];
  onConfirm: (newDate: string, newTime: string) => void;
  onClose: () => void;
}) {
  const [newDate, setNewDate] = useState(todayIso());
  const [newTime, setNewTime] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const displayNewDate = isoToDisplayDate(newDate);
  const takenTimesOnDate = takenSlots
    .filter((s) => s.date === displayNewDate)
    .map((s) => s.time);

  function handleConfirm() {
    if (!newTime) return;
    onConfirm(newDate, newTime);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Reschedule session</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {appt.clientName} · currently {appt.date} at {appt.time}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Date picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700">New date</label>
            <input
              type="date"
              value={newDate}
              min={todayIso()}
              onChange={(e) => { setNewDate(e.target.value); setNewTime(null); }}
              className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-colors"
            />
          </div>

          {/* Time slots */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-stone-700">New time</label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map((slot) => {
                const taken = takenTimesOnDate.includes(slot);
                const selected = newTime === slot;
                return (
                  <button
                    key={slot}
                    disabled={taken}
                    onClick={() => setNewTime(slot)}
                    className={`text-xs px-2 py-2 rounded-lg border font-medium transition-all ${
                      taken
                        ? "bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed"
                        : selected
                        ? "bg-stone-900 text-white border-stone-900"
                        : "border-stone-200 text-stone-600 hover:border-stone-900 hover:text-stone-900"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            {takenTimesOnDate.length > 0 && (
              <p className="text-[11px] text-stone-400">
                Grey slots are already booked on this date.
              </p>
            )}
          </div>

          {/* Optional note */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700">
              Message to client <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Moving our session due to a scheduling conflict…"
              className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-stone-100 bg-stone-50">
          <button
            onClick={onClose}
            className="text-sm border border-stone-200 text-stone-600 px-4 py-2 rounded-lg hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!newTime}
            className="text-sm bg-stone-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm reschedule
          </button>
        </div>
      </div>
    </div>
  );
}

function BookSlotModal({
  takenSlots,
  onConfirm,
  onClose,
}: {
  takenSlots: { date: string; time: string }[];
  onConfirm: (
    clientId: string, clientName: string,
    date: string, time: string,
    type: TherapistAppointment["type"], duration: string, notes: string
  ) => void;
  onClose: () => void;
}) {
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(null);
  const [sessionType, setSessionType] = useState<TherapistAppointment["type"]>("individual");
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState<string | null>(null);
  const [duration, setDuration] = useState("50 min");
  const [notes, setNotes] = useState("");
  const [booked, setBooked] = useState(false);

  const displayDate = isoToDisplayDate(date);
  const takenTimesOnDate = takenSlots.filter((s) => s.date === displayDate).map((s) => s.time);

  const filteredClients = therapistClients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const SESSION_TYPES: { value: TherapistAppointment["type"]; label: string }[] = [
    { value: "individual", label: "Individual" },
    { value: "group",      label: "Group"      },
    { value: "assessment", label: "Assessment" },
    { value: "crisis",     label: "Crisis"     },
  ];

  const canConfirm = selectedClient && time;

  function handleBook() {
    if (!canConfirm) return;
    onConfirm(selectedClient.id, selectedClient.name, date, time, sessionType, duration, notes);
    setBooked(true);
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (booked && selectedClient && time) {
    const displayD = isoToDisplayDate(date);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
          <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
            {/* Status ring */}
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4 9l3.5 3.5L14 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold text-stone-900">Session booked</h2>
              <p className="text-xs text-stone-400 mt-0.5">A confirmation request has been sent to the client.</p>
            </div>

            {/* Booking summary */}
            <div className="w-full bg-stone-50 rounded-xl px-4 py-3 space-y-2 text-left">
              {[
                { label: "Client",   value: selectedClient.name },
                { label: "Date",     value: displayD },
                { label: "Time",     value: time },
                { label: "Duration", value: duration },
                { label: "Type",     value: sessionType.charAt(0).toUpperCase() + sessionType.slice(1) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">{label}</span>
                  <span className="text-xs font-medium text-stone-800">{value}</span>
                </div>
              ))}
            </div>

            {/* Awaiting badge */}
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-medium text-amber-700">
                Awaiting {selectedClient.name.split(" ")[0]}&apos;s confirmation
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-stone-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-stone-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Book a slot</h2>
            <p className="text-xs text-stone-400 mt-0.5">Schedule a new session with a client</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Client picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700">
              Client <span className="text-red-400">*</span>
            </label>
            {selectedClient ? (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                <div className="w-7 h-7 bg-stone-200 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0">
                  {selectedClient.name[0]}
                </div>
                <span className="text-sm text-stone-900 flex-1">{selectedClient.name}</span>
                <button
                  onClick={() => { setSelectedClient(null); setClientSearch(""); }}
                  className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Search client name…"
                  autoFocus
                  className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-colors"
                />
                {clientSearch && (
                  <div className="border border-stone-100 rounded-lg overflow-hidden divide-y divide-stone-50 max-h-36 overflow-y-auto">
                    {filteredClients.length === 0 ? (
                      <p className="text-sm text-stone-400 text-center py-4">No clients found</p>
                    ) : (
                      filteredClients.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedClient({ id: c.id, name: c.name }); setClientSearch(""); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-stone-50 transition-colors"
                        >
                          <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0">
                            {c.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-stone-900 truncate">{c.name}</div>
                            <div className="text-xs text-stone-400 truncate">{c.condition.join(", ")}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Session type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700">Session type</label>
            <div className="flex flex-wrap gap-1.5">
              {SESSION_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSessionType(value)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                    sessionType === value
                      ? "bg-stone-900 text-white border-stone-900"
                      : "border-stone-200 text-stone-600 hover:border-stone-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">Date <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={date}
                min={todayIso()}
                onChange={(e) => { setDate(e.target.value); setTime(null); }}
                className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">Duration</label>
              <div className="flex gap-1.5">
                {["25 min", "50 min", "80 min"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 text-xs py-2 rounded-lg border font-medium transition-all ${
                      duration === d
                        ? "bg-stone-900 text-white border-stone-900"
                        : "border-stone-200 text-stone-600 hover:border-stone-400"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time slots */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-stone-700">
              Time <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map((slot) => {
                const taken = takenTimesOnDate.includes(slot);
                const selected = time === slot;
                return (
                  <button
                    key={slot}
                    disabled={taken}
                    onClick={() => setTime(slot)}
                    className={`text-xs px-2 py-2 rounded-lg border font-medium transition-all ${
                      taken
                        ? "bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed"
                        : selected
                        ? "bg-stone-900 text-white border-stone-900"
                        : "border-stone-200 text-stone-600 hover:border-stone-900 hover:text-stone-900"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            {takenTimesOnDate.length > 0 && (
              <p className="text-[11px] text-stone-400">Grey slots are already booked on this date.</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700">
              Notes <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Initial intake session. Focus on anxiety assessment."
              className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-stone-100 bg-stone-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="text-sm border border-stone-200 text-stone-600 px-4 py-2 rounded-lg hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!canConfirm}
            onClick={handleBook}
            className="text-sm bg-stone-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Book session
          </button>
        </div>
      </div>
    </div>
  );
}

// Extracted card so it works in both list and calendar detail panel
function AppointmentCard({
  appt,
  flat = false,
  onApprove,
  onDecline,
  onJoin,
  onReschedule,
}: {
  appt: TherapistAppointment;
  flat?: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onJoin: () => void;
  onReschedule: () => void;
}) {
  return (
    <div
      className={`${
        flat ? "px-4 py-4" : `bg-white border rounded-xl p-4 ${appt.isNew ? "border-stone-300" : "border-stone-100"}`
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="text-center min-w-[56px] flex-shrink-0 bg-stone-50 rounded-lg px-2 py-2.5">
          <div className="text-[10px] text-stone-400 uppercase font-medium">{appt.date}</div>
          <div className="text-sm font-semibold text-stone-900 mt-0.5">{appt.time}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">{appt.duration}</div>
        </div>

        <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0 self-center">
          {appt.clientName[0]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="text-sm font-medium text-stone-900">{appt.clientName}</h3>
            {appt.isNew && (
              <span className="text-[10px] bg-stone-900 text-white px-1.5 py-0.5 rounded font-medium">
                New
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-stone-400 capitalize">{appt.type}</span>
            <span className="text-stone-200">·</span>
            <span
              className={`text-[10px] border px-1.5 py-0.5 rounded ${
                appt.status === "pending"
                  ? "border-amber-200 text-amber-600"
                  : appt.status === "confirmed"
                  ? "border-stone-200 text-stone-600"
                  : appt.status === "completed"
                  ? "border-stone-200 text-stone-400"
                  : "border-red-200 text-red-500"
              }`}
            >
              {statusLabel[appt.status]}
            </span>
            {appt.status === "pending" && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  appt.initiatedBy === "client"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-stone-100 text-stone-500"
                }`}
              >
                {appt.initiatedBy === "client" ? "Client requested" : "You booked"}
              </span>
            )}
          </div>
          {appt.notes && (
            <p className="text-xs text-stone-400 mt-1 truncate">{appt.notes}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {appt.status === "pending" && (
            <>
              <button
                onClick={onApprove}
                className="text-xs bg-stone-900 text-white px-2.5 py-1 rounded-md font-medium hover:bg-stone-800 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={onDecline}
                className="text-xs border border-stone-200 text-stone-500 px-2.5 py-1 rounded-md hover:bg-stone-50 transition-colors"
              >
                Decline
              </button>
            </>
          )}
          {appt.status === "confirmed" && (
            <>
              <button
                onClick={onJoin}
                className="text-xs bg-stone-900 text-white px-2.5 py-1 rounded-md font-medium hover:bg-stone-800 transition-colors"
              >
                Join
              </button>
              <button
                onClick={onReschedule}
                className="text-xs border border-stone-200 text-stone-500 px-2.5 py-1 rounded-md hover:bg-stone-50 transition-colors"
              >
                Reschedule
              </button>
            </>
          )}
          {appt.status === "completed" && (
            <button className="text-xs border border-stone-200 text-stone-500 px-2.5 py-1 rounded-md hover:bg-stone-50 transition-colors">
              Notes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
