"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, Video, Phone, MapPin } from "lucide-react";
import VideoCallRoom from "@/components/video/VideoCallRoom";
import BookingModal from "@/components/dashboard/BookingModal";
import { getJoinWindow } from "@/lib/video";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type AssignedTherapist = {
  id: string;
  userId: string;
  title: string | null;
  specializations: string[];
  rating: number;
  user: { name: string; avatar: string | null };
};

type Appt = {
  id: string;
  date: Date;
  day: string;
  time: string;
  therapistName: string;
  therapistId: string;
  duration: string;
  durationMin: number;
  notes?: string | null;
  status: string;
  type: string;
};

function parseAppt(raw: {
  id: string; date: string; duration: number; type: string; status: string;
  therapist: { id: string; user: { name: string } }; notes?: string | null;
}): Appt {
  const d = new Date(raw.date);
  return {
    id: raw.id,
    date: d,
    day: DAY_NAMES[d.getDay()],
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    therapistName: raw.therapist.user.name,
    therapistId: raw.therapist.id,
    durationMin: raw.duration,
    duration: raw.duration < 60
      ? `${raw.duration} min`
      : `${Math.floor(raw.duration / 60)}h${raw.duration % 60 ? ` ${raw.duration % 60}m` : ""}`,
    notes: raw.notes,
    status: raw.status,
    type: raw.type,
  };
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  video:     <Video size={12} />,
  in_person: <MapPin size={12} />,
  phone:     <Phone size={12} />,
};
const TYPE_LABEL: Record<string, string> = {
  video: "Video", in_person: "In person", phone: "Phone",
};

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:   "bg-amber-50  text-amber-700  border-amber-200",
  completed: "bg-stone-50  text-stone-500  border-stone-200",
  cancelled: "bg-red-50    text-red-500    border-red-200",
  no_show:   "bg-red-50    text-red-500    border-red-200",
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed", pending: "Awaiting confirmation",
  completed: "Completed", cancelled: "Cancelled", no_show: "No-show",
};

function getWeekStart(offsetWeeks: number): Date {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return { name: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i], date: d };
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateFull(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatDateShort(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatCountdown(ms: number): string {
  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
}

export default function SchedulePage() {
  const router = useRouter();
  const [allAppts,        setAllAppts]        = useState<Appt[]>([]);
  const [therapist,       setTherapist]       = useState<AssignedTherapist | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [weekOffset,      setWeekOffset]      = useState(0);
  const [selectedDate,    setSelectedDate]    = useState<Date>(new Date());
  const [activeCall,      setActiveCall]      = useState<Appt | null>(null);
  const [showBooking,     setShowBooking]     = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekStart = getWeekStart(weekOffset);
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999);
  const weekDays  = getWeekDays(weekStart);

  const weekLabel = (() => {
    const s = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const e = weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${s} – ${e}`;
  })();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, userRes] = await Promise.all([
        fetch("/api/appointments", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/user",         { cache: "no-store" }).then((r) => r.json()),
      ]);

      const rawAppts = apptRes.appointments ?? [];
      setAllAppts(rawAppts.map(parseAppt));

      if (userRes.user?.assignedTherapist) {
        setTherapist(userRes.user.assignedTherapist);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Keeps "Available in Xm" join-window countdowns fresh without a network round trip.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 20_000);
    return () => clearInterval(id);
  }, []);

  async function messageTherapist() {
    if (!therapist || startingConversation) return;
    setStartingConversation(true);
    try {
      const r = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ therapistId: therapist.id }),
      });
      const d = await r.json();
      router.push(r.ok && d.conversationId ? `/dashboard/messages?open=${d.conversationId}` : "/dashboard/messages");
    } finally {
      setStartingConversation(false);
    }
  }

  // Appointments helpers
  const now = new Date();
  const upcoming = allAppts
    .filter((a) => a.date > now && a.status !== "cancelled")
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const weekAppts = allAppts.filter(
    (a) => a.date >= weekStart && a.date <= weekEnd && a.status !== "cancelled"
  );

  const dayAppts = allAppts
    .filter((a) => isSameDay(a.date, selectedDate) && a.status !== "cancelled")
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const daysWithAppt = new Set(
    weekAppts.map((a) => a.date.toDateString())
  );

  const nextSession = upcoming[0] ?? null;

  const pendingCount = allAppts.filter((a) => a.status === "pending").length;

  function initials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-5 pb-10">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">My Schedule</h1>
            <p className="text-sm text-stone-500 mt-0.5">
              {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => setShowBooking(true)}
            className="bg-sage-700 hover:bg-sage-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + Book Session
          </button>
        </div>

        {/* ── Therapist card ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="h-28 bg-white rounded-2xl border border-stone-100 animate-pulse" />
        ) : therapist ? (
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-sage-100 text-sage-800 flex items-center justify-center text-lg font-bold flex-shrink-0">
                {initials(therapist.user.name)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 className="font-bold text-stone-900 text-sm">{therapist.user.name}</h3>
                  <span className="text-[10px] font-semibold bg-sage-100 text-sage-800 px-2 py-0.5 rounded-full">Your Therapist</span>
                </div>
                <p className="text-xs text-stone-500">{therapist.title ?? "Licensed Mental Health Professional"}</p>
                {therapist.specializations.length > 0 && (
                  <p className="text-[11px] text-stone-400 mt-0.5 truncate">
                    {therapist.specializations.slice(0, 3).join(" · ")}
                  </p>
                )}
              </div>

              {/* Next session pill */}
              <div className="flex-shrink-0 hidden sm:block text-right">
                {nextSession ? (
                  <div>
                    <div className="text-[10px] text-stone-400 mb-0.5 uppercase tracking-wide font-medium">Next session</div>
                    <div className="text-xs font-semibold text-stone-800">
                      {formatDateShort(nextSession.date)}
                    </div>
                    <div className="text-[11px] text-stone-500">{nextSession.time} · {nextSession.duration}</div>
                    <span className={`inline-block text-[10px] font-semibold border px-2 py-0.5 rounded-full mt-1 ${STATUS_STYLE[nextSession.status] ?? ""}`}>
                      {STATUS_LABEL[nextSession.status] ?? nextSession.status}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-stone-400">No upcoming sessions</span>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={messageTherapist}
                disabled={startingConversation}
                className="text-xs font-semibold bg-sage-700 hover:bg-sage-800 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {startingConversation ? "Opening…" : "Message"}
              </button>
              <button
                onClick={() => setShowBooking(true)}
                className="text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-xl transition-colors"
              >
                Book Session
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-6 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="font-semibold text-stone-700 text-sm mb-1">No therapist connected yet</h3>
            <p className="text-stone-400 text-xs mb-4">Connect with a YouMindo-verified therapist to get personalised support.</p>
            <button
              onClick={() => router.push("/dashboard/find")}
              className="text-xs font-semibold bg-sage-700 hover:bg-sage-800 text-white px-5 py-2 rounded-xl transition-colors"
            >
              Find a Therapist
            </button>
          </div>
        )}

        {/* ── Pending alert ──────────────────────────────────────────────────── */}
        {!loading && pendingCount > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <Clock size={15} className="text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800 font-medium">
              {pendingCount} session{pendingCount > 1 ? "s" : ""} awaiting your therapist's confirmation.
            </p>
          </div>
        )}

        {/* ── Week navigator + strip ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          {/* Week nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-50">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <CalendarDays size={13} className="text-stone-400" />
              <span className="text-xs font-semibold text-stone-700">{weekLabel}</span>
              {weekOffset !== 0 && (
                <button
                  onClick={() => { setWeekOffset(0); setSelectedDate(new Date()); }}
                  className="text-[10px] font-semibold text-sage-700 bg-sage-50 px-2 py-0.5 rounded-full hover:bg-sage-100 transition-colors"
                >
                  Today
                </button>
              )}
            </div>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day pills */}
          <div className="grid grid-cols-7 gap-1.5 p-3">
            {weekDays.map(({ name, date }) => {
              const isToday   = isSameDay(date, new Date());
              const isSelected = isSameDay(date, selectedDate);
              const hasAppt   = daysWithAppt.has(date.toDateString());
              return (
                <button
                  key={name}
                  onClick={() => setSelectedDate(new Date(date))}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-colors ${
                    isSelected ? "bg-sage-700 text-white" :
                    isToday    ? "bg-sage-50 text-sage-800 ring-1 ring-sage-200" :
                    "hover:bg-stone-50 text-stone-600"
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase">{name}</span>
                  <span className="text-sm font-bold">{date.getDate()}</span>
                  {hasAppt && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-sage-500"}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Selected day sessions ──────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
            {isSameDay(selectedDate, new Date()) ? "Today" : formatDateFull(selectedDate)}
            <span className="text-xs font-normal text-stone-400">· {dayAppts.length} session{dayAppts.length !== 1 ? "s" : ""}</span>
          </h2>

          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2].map((i) => <div key={i} className="h-20 bg-white border border-stone-100 rounded-2xl" />)}
            </div>
          ) : dayAppts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-100 px-6 py-10 text-center">
              <p className="text-stone-400 text-sm">No sessions on this day.</p>
              <button
                onClick={() => setShowBooking(true)}
                className="mt-3 text-xs font-semibold text-sage-700 hover:text-sage-900 transition-colors"
              >
                + Book a session
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dayAppts.map((appt) => (
                <SessionCard
                  key={appt.id}
                  appt={appt}
                  onJoin={() => setActiveCall(appt)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── All upcoming sessions ──────────────────────────────────────────── */}
        {!loading && upcoming.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-stone-700 mb-3">All Upcoming Sessions</h2>
            <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50 overflow-hidden">
              {upcoming.map((appt) => {
                const joinWindow = getJoinWindow(appt.date, appt.durationMin);
                return (
                <div key={appt.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Date block */}
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className="text-[10px] font-bold text-stone-400 uppercase">
                      {appt.date.toLocaleDateString("en-US", { month: "short" })}
                    </div>
                    <div className="text-xl font-bold text-stone-900 leading-none">
                      {appt.date.getDate()}
                    </div>
                  </div>

                  <div className="w-px h-10 bg-stone-100 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold text-stone-800">
                        {appt.therapistName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-stone-400 flex-wrap">
                      <span>{appt.time}</span>
                      <span>·</span>
                      <span>{appt.duration}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        {TYPE_ICON[appt.type]}
                        {TYPE_LABEL[appt.type] ?? appt.type}
                      </span>
                    </div>
                    {appt.notes && (
                      <p className="text-[11px] text-stone-400 italic mt-0.5 truncate">{appt.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-semibold border px-2 py-1 rounded-full whitespace-nowrap ${STATUS_STYLE[appt.status] ?? ""}`}>
                      {STATUS_LABEL[appt.status] ?? appt.status}
                    </span>
                    {appt.status === "confirmed" && appt.type === "video" && joinWindow.isOpen && (
                      <button
                        onClick={() => setActiveCall(appt)}
                        className="text-xs bg-stone-900 hover:bg-stone-800 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
                      >
                        Join
                      </button>
                    )}
                    {appt.status === "confirmed" && appt.type === "video" && !joinWindow.isOpen && new Date() < joinWindow.opensAt && (
                      <span className="text-[10px] text-stone-400 font-medium whitespace-nowrap">
                        Available in {formatCountdown(joinWindow.opensInMs)}
                      </span>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Empty state: has therapist but no sessions booked ─────────────── */}
        {!loading && therapist && allAppts.filter((a) => a.status !== "cancelled").length === 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center">
            <div className="text-4xl mb-3">📅</div>
            <h3 className="font-semibold text-stone-800 mb-1">No sessions booked yet</h3>
            <p className="text-stone-400 text-sm mb-5">
              Book your first session with {therapist.user.name} to get started.
            </p>
            <button
              onClick={() => setShowBooking(true)}
              className="bg-sage-700 hover:bg-sage-800 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              Book First Session
            </button>
          </div>
        )}

        {/* ── No therapist + no sessions ────────────────────────────────────── */}
        {!loading && !therapist && allAppts.length === 0 && (
          <div className="bg-stone-50 rounded-2xl border border-stone-100 p-10 text-center">
            <div className="text-4xl mb-3">🌿</div>
            <h3 className="font-semibold text-stone-800 mb-1">Your schedule is clear</h3>
            <p className="text-stone-400 text-sm mb-5">
              Connect with a therapist and book your first session to see it here.
            </p>
            <button
              onClick={() => router.push("/dashboard/find")}
              className="bg-sage-700 hover:bg-sage-800 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              Find a Therapist
            </button>
          </div>
        )}
      </div>

      {activeCall && (
        <VideoCallRoom
          appointmentId={activeCall.id}
          otherPartyName={activeCall.therapistName}
          sessionType={activeCall.type}
          durationLabel={activeCall.duration}
          onEnd={() => setActiveCall(null)}
        />
      )}

      {showBooking && (
        <BookingModal
          therapistId={therapist?.id}
          therapistName={therapist?.user.name}
          therapistTitle={therapist?.title ?? undefined}
          onClose={() => setShowBooking(false)}
        />
      )}
    </>
  );
}

// ── Session card ──────────────────────────────────────────────────────────────

function SessionCard({ appt, onJoin }: { appt: Appt; onJoin: () => void }) {
  const joinWindow = getJoinWindow(appt.date, appt.durationMin);
  const borderColor = {
    video:     "border-l-blue-400",
    in_person: "border-l-sage-500",
    phone:     "border-l-purple-400",
  }[appt.type] ?? "border-l-stone-300";

  return (
    <div className={`bg-white rounded-2xl border border-stone-100 border-l-4 ${borderColor} px-5 py-4 flex items-center gap-4`}>
      <div className="text-center min-w-[52px] flex-shrink-0">
        <div className="text-base font-bold text-stone-800">{appt.time.split(" ")[0]}</div>
        <div className="text-xs text-stone-400">{appt.time.split(" ")[1]}</div>
      </div>
      <div className="w-px h-10 bg-stone-100 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-800 leading-snug">
          Session with {appt.therapistName}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1">
            {TYPE_ICON[appt.type]}
            {TYPE_LABEL[appt.type] ?? appt.type}
          </span>
          <span>·</span>
          <span>{appt.duration}</span>
        </div>
        {appt.notes && <p className="text-xs text-stone-400 italic mt-0.5 truncate">{appt.notes}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-[10px] font-semibold border px-2 py-1 rounded-full ${STATUS_STYLE[appt.status] ?? ""}`}>
          {STATUS_LABEL[appt.status] ?? appt.status}
        </span>
        {appt.status === "confirmed" && appt.type === "video" && joinWindow.isOpen && (
          <button
            onClick={onJoin}
            className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg transition-colors"
          >
            Join →
          </button>
        )}
        {appt.status === "confirmed" && appt.type === "video" && !joinWindow.isOpen && new Date() < joinWindow.opensAt && (
          <span className="text-[10px] text-stone-400 font-medium whitespace-nowrap">
            Available in {formatCountdown(joinWindow.opensInMs)}
          </span>
        )}
      </div>
    </div>
  );
}
