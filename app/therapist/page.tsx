"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type Client = {
  id: string; name: string; email: string; plan: string; level: number;
  recentMoods: { score: number; date: string }[];
  lastActivity: string;
};

type Appointment = {
  id: string; date: string; duration: number; type: string; status: string;
  client: { id: string; name: string };
  therapist: { user: { name: string } };
};

type RiskFlag = {
  id: string; clientId: string; clientName: string; source: string;
  severity: "high" | "moderate"; detail: string; createdAt: string;
};

export default function TherapistOverview() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [clients,      setClients]      = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [accepted,     setAccepted]     = useState<Set<string>>(new Set());
  const [declined,     setDeclined]     = useState<Set<string>>(new Set());
  const [userName,     setUserName]     = useState("Doctor");
  const [riskFlags,    setRiskFlags]    = useState<RiskFlag[]>([]);
  const [ackBusyId,    setAckBusyId]    = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/therapist/clients").then((r) => r.json()),
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/user").then((r) => r.json()),
      fetch("/api/therapist/risk-flags").then((r) => r.json()),
    ]).then(([cData, aData, uData, rData]) => {
      setClients(cData.clients ?? []);
      setAppointments(aData.appointments ?? []);
      if (uData.user?.name) setUserName(uData.user.name);
      setRiskFlags(rData.flags ?? []);
    }).finally(() => setLoading(false));
  }, []);

  async function acknowledgeFlag(id: string) {
    setAckBusyId(id);
    const res = await fetch(`/api/risk-flags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "acknowledged" }),
    });
    setAckBusyId(null);
    if (res.ok) setRiskFlags((prev) => prev.filter((f) => f.id !== id));
  }

  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter((a) => a.date.startsWith(today));
  const pendingAppts = appointments.filter((a) => a.status === "pending" && !accepted.has(a.id) && !declined.has(a.id));

  async function accept(id: string) {
    setAccepted((p) => new Set(p).add(id));
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed" }),
    });
  }

  async function decline(id: string) {
    setDeclined((p) => new Set(p).add(id));
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-stone-100 rounded w-1/2" />
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map((i) => <div key={i} className="h-20 bg-stone-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">{greeting}, {userName}</h1>
        <p className="text-sm text-stone-500 mt-1">
          {todayAppts.length} session{todayAppts.length !== 1 ? "s" : ""} today · {pendingAppts.length} pending booking{pendingAppts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active clients",   value: clients.length },
          { label: "Sessions today",   value: todayAppts.length },
          { label: "Pending bookings", value: pendingAppts.length },
          { label: "Total sessions",   value: appointments.filter((a) => a.status === "completed").length },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-xl p-4">
            <div className="text-2xl font-semibold text-stone-900">{s.value}</div>
            <div className="text-xs text-stone-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Risk alerts */}
      <div>
        <h2 className="text-sm font-semibold text-stone-900 mb-3">Risk Alerts</h2>
        {riskFlags.length === 0 ? (
          <div className="bg-white border border-stone-100 rounded-xl py-6 text-center text-sm text-stone-400">No risk flags — all clear.</div>
        ) : (
          <div className="space-y-2">
            {riskFlags.map((f) => (
              <div key={f.id} className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${f.severity === "high" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                <span className="text-lg flex-shrink-0">⚠️</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-800">
                    <Link href={`/therapist/clients/${f.clientId}`} className="hover:underline">{f.clientName}</Link>
                    <span className={`ml-2 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${f.severity === "high" ? "bg-red-200 text-red-700" : "bg-amber-200 text-amber-700"}`}>{f.severity}</span>
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">{f.detail} · {f.source} · {new Date(f.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                </div>
                <button
                  onClick={() => acknowledgeFlag(f.id)}
                  disabled={ackBusyId === f.id}
                  className="text-xs border border-stone-200 bg-white text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  Acknowledge
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Today's sessions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-900">Today&apos;s Sessions</h2>
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
                      <div className="text-xs font-semibold text-stone-800">
                        {new Date(appt.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </div>
                      <div className="text-[10px] text-stone-400">{appt.duration}m</div>
                    </div>
                    <div className="w-px h-8 bg-stone-100 flex-shrink-0" />
                    <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0">
                      {appt.client.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-800 truncate">{appt.client.name}</div>
                      <div className="text-xs text-stone-400 capitalize truncate">{appt.type.replace("_", " ")}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] border px-1.5 py-0.5 rounded ${appt.status === "confirmed" ? "border-sage-200 text-sage-600" : "border-stone-200 text-stone-500"}`}>
                        {appt.status}
                      </span>
                      {appt.status === "confirmed" && (
                        <button className="bg-stone-900 text-white text-[10px] font-medium px-2 py-1 rounded-md hover:bg-stone-800 transition-colors">Join</button>
                      )}
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
            {[...accepted].map((id) => {
              const a = appointments.find((x) => x.id === id);
              if (!a) return null;
              return (
                <div key={`acc-${id}`} className="bg-sage-50 border border-sage-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-sm">✅</span>
                  <div className="flex-1 text-xs text-sage-700 font-medium">Booking confirmed for {a.client.name}</div>
                </div>
              );
            })}

            {pendingAppts.map((a) => (
              <div key={a.id} className="bg-white border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0">
                  {a.client.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-800">{a.client.name}</div>
                  <div className="text-xs text-stone-400">
                    Booking request · {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {a.duration}min
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => accept(a.id)} className="text-xs bg-stone-900 text-white px-2.5 py-1 rounded-md hover:bg-stone-800 transition-colors font-medium">Accept</button>
                  <button onClick={() => decline(a.id)} className="text-xs border border-stone-200 text-stone-500 px-2.5 py-1 rounded-md hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors">Decline</button>
                </div>
              </div>
            ))}

            {pendingAppts.length === 0 && accepted.size === 0 && (
              <div className="bg-white border border-stone-100 rounded-xl py-8 text-center text-sm text-stone-400">All caught up</div>
            )}
          </div>
        </div>
      </div>

      {/* Client overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-900">Client Overview</h2>
          <Link href="/therapist/clients" className="text-xs text-stone-500 hover:text-stone-900 transition-colors">All clients →</Link>
        </div>
        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          {clients.length === 0 ? (
            <div className="py-10 text-center text-sm text-stone-400">No clients yet</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {clients.map((client) => {
                const moodAvg = client.recentMoods.length
                  ? (client.recentMoods.reduce((s, m) => s + m.score, 0) / client.recentMoods.length).toFixed(1)
                  : null;
                return (
                  <Link key={client.id} href={`/therapist/clients/${client.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-stone-50 transition-colors group">
                    <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0">
                      {client.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-stone-800 group-hover:text-stone-900">{client.name}</span>
                      <div className="text-xs text-stone-400 mt-0.5 truncate">{client.email} · {client.plan}</div>
                    </div>
                    {client.recentMoods.length > 0 && (
                      <div className="hidden sm:flex items-end gap-0.5 h-7 flex-shrink-0">
                        {client.recentMoods.slice(0, 7).map((m, j) => (
                          <div key={j} className="w-1.5 bg-stone-900 rounded-t-sm opacity-80" style={{ height: `${(m.score / 5) * 26}px` }} />
                        ))}
                      </div>
                    )}
                    <div className="text-right flex-shrink-0 min-w-[48px]">
                      <div className="text-sm font-semibold text-stone-900">{moodAvg ?? "—"}</div>
                      <div className="text-[10px] text-stone-400">mood avg</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
