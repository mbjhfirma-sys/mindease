"use client";

import Link from "next/link";
import { useState } from "react";
import { therapistClients, therapistAppointments, therapistProfile } from "@/lib/mockData";

const RISK_LABEL: Record<string, string> = { low: "Low", medium: "Medium", high: "High" };

const todayAppts = therapistAppointments.filter((a) => a.date === "Today");
const allPendingAppts = therapistAppointments.filter((a) => a.status === "pending");
const highRisk = therapistClients.filter((c) => c.riskLevel === "high");
const allPendingJournals = therapistClients.filter((c) => c.pendingJournalReview);

export default function TherapistOverview() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [declined, setDeclined] = useState<Set<string>>(new Set());
  const [dismissedJournals, setDismissedJournals] = useState<Set<string>>(new Set());

  const pendingAppts = allPendingAppts.filter((a) => !accepted.has(a.id) && !declined.has(a.id));
  const pendingJournals = allPendingJournals.filter((c) => !dismissedJournals.has(c.id));

  function accept(id: string) {
    setAccepted((prev) => new Set(prev).add(id));
  }
  function decline(id: string) {
    setDeclined((prev) => new Set(prev).add(id));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">{greeting}, {therapistProfile.name}</h1>
        <p className="text-sm text-stone-500 mt-1">
          {todayAppts.length} session{todayAppts.length !== 1 ? "s" : ""} today · {pendingAppts.length} pending booking{pendingAppts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* High-risk alert */}
      {highRisk.length > 0 && (
        <div className="bg-white border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <div className="w-1 self-stretch bg-red-400 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-stone-900">High-risk client flag</div>
            <div className="text-xs text-stone-500 mt-0.5">
              {highRisk.map((c) => c.name).join(", ")} — review safety plan and recent notes.
            </div>
          </div>
          <Link href="/therapist/clients" className="text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors flex-shrink-0">View →</Link>
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active clients", value: therapistProfile.activeClients },
          { label: "Sessions today", value: todayAppts.length },
          { label: "Pending bookings", value: pendingAppts.length },
          { label: "Journal reviews", value: pendingJournals.length },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-xl p-4">
            <div className="text-2xl font-semibold text-stone-900">{s.value}</div>
            <div className="text-xs text-stone-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Today's sessions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-900">Today's Sessions</h2>
            <Link href="/therapist/appointments" className="text-xs text-stone-500 hover:text-stone-900 transition-colors">All →</Link>
          </div>
          <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
            {todayAppts.length === 0 ? (
              <div className="py-10 text-center text-sm text-stone-400">No sessions today</div>
            ) : (
              <div className="divide-y divide-stone-50">
                {todayAppts.map((appt) => (
                  <div key={appt.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="text-center min-w-[48px]">
                      <div className="text-xs font-semibold text-stone-800">{appt.time}</div>
                      <div className="text-[10px] text-stone-400">{appt.duration}</div>
                    </div>
                    <div className="w-px h-8 bg-stone-100 flex-shrink-0" />
                    <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0">
                      {appt.clientName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-800 truncate">{appt.clientName}</div>
                      <div className="text-xs text-stone-400 capitalize truncate">{appt.type}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {appt.status === "pending" ? (
                        <span className="text-[10px] border border-stone-200 text-stone-500 px-1.5 py-0.5 rounded">Pending</span>
                      ) : (
                        <span className="text-[10px] border border-stone-200 text-stone-500 px-1.5 py-0.5 rounded">Confirmed</span>
                      )}
                      <button className="bg-stone-900 text-white text-[10px] font-medium px-2 py-1 rounded-md hover:bg-stone-800 transition-colors">
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Needs attention */}
        <div>
          <h2 className="text-sm font-semibold text-stone-900 mb-3">Needs Attention</h2>
          <div className="space-y-2">
            {/* Accepted/declined toasts */}
            {[...accepted].map((id) => {
              const a = allPendingAppts.find((x) => x.id === id)!;
              return (
                <div key={`acc-${id}`} className="bg-sage-50 border border-sage-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-sm">✅</span>
                  <div className="flex-1 text-xs text-sage-700 font-medium">Booking confirmed for {a.clientName} — {a.date} at {a.time}</div>
                </div>
              );
            })}
            {[...declined].map((id) => {
              const a = allPendingAppts.find((x) => x.id === id)!;
              return (
                <div key={`dec-${id}`} className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-sm">✗</span>
                  <div className="flex-1 text-xs text-stone-500">Booking declined for {a.clientName} — {a.date} at {a.time}</div>
                </div>
              );
            })}

            {pendingAppts.map((a) => (
              <div key={a.id} className="bg-white border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0">
                  {a.clientName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-800">{a.clientName}</div>
                  <div className="text-xs text-stone-400">Booking request · {a.date} at {a.time}</div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => accept(a.id)}
                    className="text-xs bg-stone-900 text-white px-2.5 py-1 rounded-md hover:bg-stone-800 transition-colors font-medium"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => decline(a.id)}
                    className="text-xs border border-stone-200 text-stone-500 px-2.5 py-1 rounded-md hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}

            {pendingJournals.map((c) => (
              <div key={c.id} className="bg-white border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-800">{c.name}</div>
                  <div className="text-xs text-stone-400">New journal entry to review</div>
                </div>
                <div className="flex gap-1.5">
                  <Link
                    href={`/therapist/clients/${c.id}?tab=journal`}
                    className="text-xs bg-stone-900 text-white px-2.5 py-1 rounded-md hover:bg-stone-800 transition-colors font-medium"
                  >
                    Read journal
                  </Link>
                  <button
                    onClick={() => setDismissedJournals((prev) => new Set(prev).add(c.id))}
                    className="text-xs border border-stone-200 text-stone-400 px-2.5 py-1 rounded-md hover:bg-stone-50 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}

            {pendingAppts.length === 0 && pendingJournals.length === 0 && accepted.size === 0 && declined.size === 0 && (
              <div className="bg-white border border-stone-100 rounded-xl py-8 text-center text-sm text-stone-400">
                All caught up
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client mood snapshot */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-900">Client Overview</h2>
          <Link href="/therapist/clients" className="text-xs text-stone-500 hover:text-stone-900 transition-colors">All clients →</Link>
        </div>
        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          <div className="divide-y divide-stone-50">
            {therapistClients.map((client) => (
              <Link
                key={client.id}
                href={`/therapist/clients/${client.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-stone-50 transition-colors group"
              >
                <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0">
                  {client.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-stone-800 group-hover:text-stone-900">{client.name}</span>
                    <span className={`text-[10px] border px-1.5 py-0.5 rounded font-medium ${
                      client.riskLevel === "high" ? "border-red-200 text-red-600" :
                      client.riskLevel === "medium" ? "border-amber-200 text-amber-600" :
                      "border-stone-200 text-stone-400"
                    }`}>{RISK_LABEL[client.riskLevel]}</span>
                    {client.unreadMessages > 0 && (
                      <span className="text-[10px] bg-stone-900 text-white w-4 h-4 rounded-full flex items-center justify-center font-semibold">{client.unreadMessages}</span>
                    )}
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5 truncate">{client.condition.join(", ")}</div>
                </div>
                {/* Mini mood bars */}
                <div className="flex items-end gap-0.5 h-7 flex-shrink-0">
                  {client.moodHistory.map((score, j) => (
                    <div
                      key={j}
                      className="w-1.5 bg-stone-900 rounded-t-sm opacity-80"
                      style={{ height: `${(score / 5) * 26}px` }}
                    />
                  ))}
                </div>
                <div className="text-right flex-shrink-0 min-w-[48px]">
                  <div className="text-sm font-semibold text-stone-900">{client.moodAvg.toFixed(1)}</div>
                  <div className="text-[10px] text-stone-400">{client.missionCompletion}%</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
