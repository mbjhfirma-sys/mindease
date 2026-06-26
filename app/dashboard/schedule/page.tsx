"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { scheduleItems, clientAppointments, userProfile, therapistProfile, messages, type ClientAppointment } from "@/lib/mockData";
import VideoCallModal from "@/components/therapist/VideoCallModal";
import BookingModal from "@/components/dashboard/BookingModal";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const today = new Date();
const todayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][today.getDay()];

const typeColors: Record<string, string> = {
  session: "bg-amber-100 border-amber-300 text-amber-800",
  therapy: "bg-blue-100 border-blue-300 text-blue-800",
  course: "bg-sage-100 border-sage-300 text-sage-800",
  group: "bg-purple-100 border-purple-300 text-purple-800",
};

const typeLabels: Record<string, string> = {
  session: "Meditation",
  therapy: "Therapy",
  course: "Course",
  group: "Group",
};

const typeIcons: Record<string, string> = {
  session: "🧘",
  therapy: "🧠",
  course: "📚",
  group: "🤝",
};

type ScheduleItem = (typeof scheduleItems)[number];

function SessionDetailModal({
  session,
  onClose,
  onCancel,
}: {
  session: ScheduleItem;
  onClose: () => void;
  onCancel: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  function handleCancel() {
    onCancel(session.id);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        {/* Icon + header */}
        <div className="px-6 pt-4 pb-5">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
              session.type === "session" ? "bg-amber-100" :
              session.type === "therapy" ? "bg-blue-100" :
              session.type === "course" ? "bg-sage-100" :
              "bg-purple-100"
            }`}>
              {typeIcons[session.type]}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColors[session.type]}`}>
                  {typeLabels[session.type]}
                </span>
              </div>
              <h2 className="text-base font-bold text-stone-900 leading-snug">{session.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 transition-colors p-1 flex-shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 3.5V6.5L8.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {session.time}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1.5" y="2.5" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4.5 1v3M8.5 1v3M1.5 6h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {session.day}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5h9M6.5 2v9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {session.duration}
            </div>
          </div>

          {/* Description */}
          <p className="mt-4 text-sm text-stone-600 leading-relaxed">{session.description}</p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-2 flex flex-col gap-2">
          {confirming ? (
            <>
              <p className="text-xs text-stone-500 text-center mb-1">
                Are you sure you want to cancel <span className="font-semibold text-stone-700">{session.title}</span>?
              </p>
              <button
                onClick={handleCancel}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                Yes, Cancel Session
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold transition-colors"
              >
                Keep It
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setConfirming(true)}
                className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold border border-red-100 transition-colors"
              >
                Cancel Session
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const router = useRouter();
  const [activeDay, setActiveDay] = useState(todayName);
  const [activeCall, setActiveCall] = useState<ClientAppointment | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ScheduleItem | null>(null);
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());

  const therapistConvoId = messages.find(
    (m) => m.sender === userProfile.therapist
  )?.id ?? null;

  const activeScheduleItems = scheduleItems.filter((s) => !cancelledIds.has(s.id));
  const dayItems = activeScheduleItems.filter((s) => s.day === activeDay);

  function getAppointment(day: string, time: string) {
    return clientAppointments.find((a) => a.day === day && a.time === time && a.status === "confirmed");
  }

  const daysWithActivity = new Set([
    ...activeScheduleItems.map((s) => s.day),
    ...clientAppointments.map((a) => a.day),
  ]);

  function handleCancel(id: string) {
    setCancelledIds((prev) => new Set([...prev, id]));
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">My Schedule</h1>
            <p className="text-stone-500 mt-1 text-sm">
              {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => setShowBooking(true)}
            className="bg-sage-700 text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-sage-800 transition-colors"
          >
            + Book Session
          </button>
        </div>

        {/* Therapist assignment card */}
        {userProfile.therapist ? (
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
                {therapistProfile.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-stone-900 text-sm">{therapistProfile.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">Your Therapist</span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">{therapistProfile.title}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {therapistProfile.specialisations.map((s) => (
                    <span key={s} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                {(() => {
                  const next = clientAppointments.find((a) => a.status === "confirmed");
                  return next ? (
                    <div>
                      <div className="text-xs text-stone-400 mb-0.5">Next session</div>
                      <div className="text-xs font-semibold text-stone-800">{next.date}</div>
                      <div className="text-xs text-stone-500">{next.time} · {next.duration}</div>
                    </div>
                  ) : (
                    <div className="text-xs text-stone-400">No upcoming sessions</div>
                  );
                })()}
              </div>
            </div>
            {(() => {
              const next = clientAppointments.find((a) => a.status === "confirmed");
              return next ? (
                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between sm:hidden">
                  <div>
                    <div className="text-xs text-stone-400">Next session</div>
                    <div className="text-xs font-semibold text-stone-800">{next.date} · {next.time}</div>
                  </div>
                </div>
              ) : null;
            })()}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() =>
                  router.push(
                    therapistConvoId
                      ? `/dashboard/messages?open=${therapistConvoId}`
                      : "/dashboard/messages"
                  )
                }
                className="text-xs font-semibold bg-sage-700 hover:bg-sage-800 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Message
              </button>
              <button
                onClick={() => setShowBooking(true)}
                className="text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-xl transition-colors"
              >
                Book Session
              </button>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span className="text-xs text-stone-500">Available today</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-6 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="font-semibold text-stone-700 text-sm mb-1">No therapist assigned yet</h3>
            <p className="text-stone-400 text-xs mb-4">Connect with a licensed therapist to get personalised support.</p>
            <button className="text-xs font-semibold bg-sage-700 hover:bg-sage-800 text-white px-5 py-2 rounded-xl transition-colors">
              Find a Therapist
            </button>
          </div>
        )}

        {/* Week strip */}
        <div className="bg-white rounded-2xl p-4 border border-stone-100">
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, i) => {
              const isToday = day === todayName;
              const isActive = day === activeDay;
              const hasItems = daysWithActivity.has(day);
              const date = new Date(today);
              date.setDate(today.getDate() - today.getDay() + i + 1);
              const hasCall = clientAppointments.some((a) => a.day === day && a.status === "confirmed");

              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-colors ${
                    isActive
                      ? "bg-sage-700 text-white"
                      : isToday
                      ? "bg-sage-50 text-sage-700"
                      : "hover:bg-stone-50 text-stone-600"
                  }`}
                >
                  <span className="text-xs font-medium">{day}</span>
                  <span className={`text-base font-bold ${isActive ? "text-white" : ""}`}>
                    {date.getDate()}
                  </span>
                  {(hasItems || hasCall) && (
                    <div className="flex gap-0.5">
                      {hasItems && <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : "bg-sage-400"}`} />}
                      {hasCall && <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white/70" : "bg-blue-400"}`} />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day sessions */}
        <div>
          <h2 className="text-base font-bold text-stone-700 mb-4">
            {activeDay === todayName ? "Today" : activeDay} — {dayItems.length} session{dayItems.length !== 1 ? "s" : ""}
            {clientAppointments.some((a) => a.day === activeDay) ? ` + therapy call` : ""}
          </h2>

          {/* Confirmed therapy call card for this day */}
          {(() => {
            const appts = clientAppointments.filter((a) => a.day === activeDay);
            if (appts.length === 0) return null;
            return appts.map((appt) => (
              <div
                key={appt.id}
                className="mb-3 border-2 border-blue-200 bg-blue-50 rounded-2xl p-5 flex items-center gap-5"
              >
                <div className="text-center min-w-[52px]">
                  <div className="text-sm font-bold text-blue-800">{appt.time.split(" ")[0]}</div>
                  <div className="text-xs text-blue-600">{appt.time.split(" ")[1]}</div>
                </div>
                <div className="w-px h-10 bg-blue-200" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-blue-900">Therapy Session</div>
                  <div className="text-xs text-blue-600 mt-0.5">{appt.therapistName} · {appt.duration}</div>
                  {appt.notes && <div className="text-xs text-blue-500 mt-0.5 italic">{appt.notes}</div>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    appt.status === "confirmed"
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "bg-stone-100 text-stone-500 border border-stone-200"
                  }`}>
                    {appt.status === "confirmed" ? "Confirmed" : "Pending"}
                  </span>
                  {appt.status === "confirmed" && (
                    <button
                      onClick={() => setActiveCall(appt)}
                      className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg transition-colors"
                    >
                      Join →
                    </button>
                  )}
                </div>
              </div>
            ));
          })()}

          {dayItems.length === 0 && !clientAppointments.some((a) => a.day === activeDay) ? (
            <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center">
              <div className="text-5xl mb-4">☀️</div>
              <h3 className="font-semibold text-stone-700 mb-1">Free day!</h3>
              <p className="text-stone-400 text-sm">No sessions scheduled. Use this time to rest or explore a new course.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayItems.map((session) => {
                const appt = getAppointment(session.day, session.time);
                return (
                  <div
                    key={session.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedSession(session)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedSession(session)}
                    className={`cursor-pointer border rounded-2xl p-5 flex items-center gap-5 transition-all hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] ${typeColors[session.type]}`}
                  >
                    <div className="text-center min-w-[52px]">
                      <div className="text-sm font-bold">{session.time.split(" ")[0]}</div>
                      <div className="text-xs opacity-70">{session.time.split(" ")[1]}</div>
                    </div>
                    <div className="w-px h-10 bg-current opacity-20" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{session.title}</div>
                      <div className="text-xs opacity-70 mt-0.5">{session.duration}</div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                        {typeLabels[session.type]}
                      </span>
                      {appt ? (
                        <button
                          onClick={() => setActiveCall(appt)}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                        >
                          Join →
                        </button>
                      ) : (
                        <span className="text-lg">{typeIcons[session.type]}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* All This Week */}
        <div>
          <h2 className="text-base font-bold text-stone-700 mb-4">All This Week</h2>
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            {activeScheduleItems.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSelectedSession(s)}
                className={`w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors ${
                  i < activeScheduleItems.length - 1 ? "border-b border-stone-100" : ""
                }`}
              >
                <div className="w-10 text-center">
                  <div className="text-xs text-stone-400">{s.day}</div>
                </div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  s.type === "therapy" ? "bg-blue-400" :
                  s.type === "group" ? "bg-purple-400" :
                  s.type === "course" ? "bg-sage-400" :
                  "bg-amber-400"
                }`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-stone-800">{s.title}</div>
                  <div className="text-xs text-stone-400">{s.time} · {s.duration}</div>
                </div>
                {getAppointment(s.day, s.time) ? (
                  <span
                    onClick={(e) => { e.stopPropagation(); setActiveCall(getAppointment(s.day, s.time)!); }}
                    className="text-xs bg-stone-900 hover:bg-stone-800 text-white px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Join
                  </span>
                ) : (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeColors[s.type]}`}>
                    {typeLabels[s.type]}
                  </span>
                )}
              </button>
            ))}

            {/* Upcoming confirmed calls not in scheduleItems */}
            {clientAppointments.filter((a) =>
              a.status === "confirmed" &&
              !activeScheduleItems.some((s) => s.day === a.day && s.time === a.time)
            ).map((appt) => (
              <div
                key={appt.id}
                className="flex items-center gap-4 px-5 py-4 border-t border-stone-100 bg-blue-50/40"
              >
                <div className="w-10 text-center">
                  <div className="text-xs text-stone-400">{appt.day}</div>
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0 bg-blue-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-stone-800">Therapy Session — {appt.therapistName}</div>
                  <div className="text-xs text-stone-400">{appt.time} · {appt.duration}{appt.notes ? ` · ${appt.notes}` : ""}</div>
                </div>
                <button
                  onClick={() => setActiveCall(appt)}
                  className="text-xs bg-stone-900 hover:bg-stone-800 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onCancel={handleCancel}
        />
      )}

      {activeCall && (
        <VideoCallModal
          clientName={activeCall.therapistName}
          sessionType={activeCall.type}
          duration={activeCall.duration}
          onEnd={() => setActiveCall(null)}
        />
      )}

      {showBooking && <BookingModal onClose={() => setShowBooking(false)} />}
    </>
  );
}
