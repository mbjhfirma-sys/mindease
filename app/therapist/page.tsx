"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Calendar, Clock, AlertTriangle, Users, Sparkles } from "lucide-react";
import VideoCallRoom from "@/components/video/VideoCallRoom";
import { getJoinWindow } from "@/lib/video";
import { buildBriefingText } from "@/lib/therapistBriefing";
import NeedsAttention, {
  type AttentionRiskFlag, type AttentionBooking, type AttentionInactiveClient, type AttentionCommunityFlag,
} from "./_components/NeedsAttention";

type Client = {
  id: string; name: string; email: string; plan: string; level: number;
  recentMoods: { score: number; date: string }[];
  lastActivity: "recent" | "inactive";
  riskLevel: "low" | "medium" | "high";
  missionCompletion: number;
};

type Appointment = {
  id: string; date: string; duration: number; type: string; status: string;
  client: { id: string; name: string };
};

type MindoDigest = { id: string; clientId: string; clientName: string; digestText: string; createdAt: string };

const RISK_BADGE: Record<Client["riskLevel"], string> = {
  low: "text-sage-700 bg-sage-50 border-sage-200",
  medium: "text-amber-700 bg-amber-50 border-amber-200",
  high: "text-red-600 bg-red-50 border-red-200",
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatCountdown(ms: number): string {
  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
}

export default function TherapistOverview() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Doctor");
  const [riskFlags, setRiskFlags] = useState<AttentionRiskFlag[]>([]);
  const [ackBusyId, setAckBusyId] = useState<string | null>(null);
  const [mindoDigests, setMindoDigests] = useState<MindoDigest[]>([]);
  const [communityFlags, setCommunityFlags] = useState<AttentionCommunityFlag[]>([]);
  const [activeCall, setActiveCall] = useState<Appointment | null>(null);

  // Keeps join-window countdowns fresh without a network round trip.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 20_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/therapist/clients").then((r) => r.json()),
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/user").then((r) => r.json()),
      fetch("/api/therapist/risk-flags").then((r) => r.json()),
      fetch("/api/mindo/digests/recent").then((r) => r.json()).catch(() => ({})),
      fetch("/api/therapist/community/flagged").then((r) => r.json()).catch(() => ({})),
    ]).then(([cData, aData, uData, rData, mData, fData]) => {
      setClients(cData.clients ?? []);
      setAppointments(aData.appointments ?? []);
      if (uData.user?.name) setUserName(uData.user.name);
      setRiskFlags(rData.flags ?? []);
      setMindoDigests(mData.digests ?? []);
      setCommunityFlags(fData.posts ?? []);
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

  async function accept(id: string) {
    setAppointments((p) => p.map((a) => a.id === id ? { ...a, status: "confirmed" } : a));
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed" }),
    });
  }

  async function decline(id: string) {
    setAppointments((p) => p.map((a) => a.id === id ? { ...a, status: "cancelled" } : a));
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-5">
        <div className="h-32 bg-stone-100 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-stone-100 rounded-xl" />)}
        </div>
        <div className="h-48 bg-stone-100 rounded-xl" />
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments
    .filter((a) => a.date.startsWith(today))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const pendingAppts = appointments.filter((a) => a.status === "pending");
  const inactiveClients = clients.filter((c) => c.lastActivity === "inactive");

  function lastSessionLabel(clientId: string): string {
    const completed = appointments
      .filter((a) => a.client.id === clientId && a.status === "completed")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return completed.length > 0 ? new Date(completed[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "no sessions yet";
  }

  const briefingText = buildBriefingText({
    greeting,
    userName,
    sessions: todayAppts.map((a) => ({ clientName: a.client.name, time: fmtTime(a.date) })),
    riskFlags: riskFlags.map((f) => ({ clientName: f.clientName, severity: f.severity, detail: f.detail })),
    inactiveClientNames: inactiveClients.map((c) => c.name),
    pendingCount: pendingAppts.length,
    communityFlagCount: communityFlags.length,
  });

  const attentionBookings: AttentionBooking[] = pendingAppts.map((a) => ({
    id: a.id, date: a.date, duration: a.duration, type: a.type, client: a.client,
  }));
  const attentionInactive: AttentionInactiveClient[] = inactiveClients.map((c) => ({
    id: c.id, name: c.name, lastSessionLabel: lastSessionLabel(c.id),
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mindo practice briefing */}
      <div className="bg-gradient-to-r from-sage-700 to-emerald-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center flex-shrink-0"><Sparkles size={13} /></div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-sage-200">Mindo &middot; Practice Briefing</span>
        </div>
        <p className="text-sm leading-relaxed max-w-2xl">{briefingText}</p>
        <div className="flex items-center gap-4 mt-3.5">
          <a href="#needs-attention" className="text-xs font-semibold text-sage-100 hover:text-white underline underline-offset-2">Jump to needs attention</a>
          {riskFlags.length > 0 && (
            <Link href={`/therapist/clients/${riskFlags[0].clientId}?tab=insights`} className="text-xs font-semibold text-sage-100 hover:text-white underline underline-offset-2">
              View {riskFlags[0].clientName.split(" ")[0]}&rsquo;s insights
            </Link>
          )}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Sessions today", value: todayAppts.length, sub: todayAppts.length > 0 ? `next at ${fmtTime(todayAppts[0].date)}` : "nothing scheduled", Icon: Calendar, bg: "bg-sage-50", fg: "text-sage-700" },
          { label: "Pending requests", value: pendingAppts.length, sub: "awaiting your response", Icon: Clock, bg: "bg-amber-50", fg: "text-amber-700" },
          { label: "Open risk flags", value: riskFlags.length, sub: "needs acknowledgement", Icon: AlertTriangle, bg: "bg-red-50", fg: "text-red-600" },
          { label: "Active clients", value: clients.length, sub: "on your roster", Icon: Users, bg: "bg-stone-100", fg: "text-stone-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-xl p-4 flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg ${s.bg} ${s.fg} flex items-center justify-center flex-shrink-0`}><s.Icon size={15} /></div>
            <div className="min-w-0">
              <div className="text-xl font-semibold text-stone-900">{s.value}</div>
              <div className="text-xs text-stone-500 mt-0.5">{s.label}</div>
              <div className="text-[10px] text-stone-400 mt-0.5 truncate">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Needs attention */}
      <div id="needs-attention">
        <h2 className="text-sm font-semibold text-stone-900 mb-3">Needs your attention</h2>
        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          <NeedsAttention
            riskFlags={riskFlags}
            bookings={attentionBookings}
            inactiveClients={attentionInactive}
            communityFlags={communityFlags}
            onAcknowledgeFlag={acknowledgeFlag}
            ackBusyId={ackBusyId}
            onAcceptBooking={accept}
            onDeclineBooking={decline}
          />
        </div>
      </div>

      {/* Today's sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-900">Today&apos;s sessions</h2>
          <Link href="/therapist/appointments" className="text-xs text-stone-500 hover:text-stone-900 transition-colors">All &rarr;</Link>
        </div>
        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          {todayAppts.length === 0 ? (
            <div className="py-10 text-center text-sm text-stone-400">No sessions today</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {todayAppts.map((appt) => {
                const joinWindow = appt.status === "confirmed" ? getJoinWindow(new Date(appt.date), appt.duration) : null;
                return (
                  <div key={appt.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="text-center min-w-[48px]">
                      <div className="text-xs font-semibold text-stone-800">{fmtTime(appt.date)}</div>
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
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${appt.status === "confirmed" ? "text-sage-700 bg-sage-50 border-sage-200" : "text-amber-700 bg-amber-50 border-amber-200"}`}>
                        {appt.status}
                      </span>
                      {appt.status === "confirmed" && appt.type === "video" && joinWindow?.isOpen && (
                        <button onClick={() => setActiveCall(appt)} className="bg-stone-900 text-white text-[10px] font-medium px-2 py-1 rounded-md hover:bg-stone-800 transition-colors">Join</button>
                      )}
                      {appt.status === "confirmed" && appt.type === "video" && joinWindow && !joinWindow.isOpen && new Date() < joinWindow.opensAt && (
                        <span className="text-[10px] text-stone-400 font-medium whitespace-nowrap">in {formatCountdown(joinWindow.opensInMs)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mindo digests */}
      {mindoDigests.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-stone-900 mb-3">This week&apos;s client digests</h2>
          <div className="space-y-2">
            {mindoDigests.map((d) => (
              <Link
                key={d.id}
                href={`/therapist/clients/${d.clientId}?tab=insights`}
                className="flex items-center gap-3 bg-white border border-stone-100 rounded-xl px-4 py-3 hover:border-stone-200 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-sage-50 text-sage-700 flex items-center justify-center flex-shrink-0"><Sparkles size={13} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-800">{d.clientName}</div>
                  <div className="text-xs text-stone-500 mt-0.5 truncate">{d.digestText}</div>
                </div>
                <span className="text-xs text-stone-400 flex-shrink-0">
                  {new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Client overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-900">Client overview</h2>
          <Link href="/therapist/clients" className="text-xs text-stone-500 hover:text-stone-900 transition-colors">All clients &rarr;</Link>
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stone-800 group-hover:text-stone-900">{client.name}</span>
                        {client.riskLevel !== "low" && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${RISK_BADGE[client.riskLevel]}`}>
                            {client.riskLevel === "high" ? "High risk" : "Medium risk"}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5 truncate">{client.email} &middot; {client.plan}</div>
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

      {activeCall && (
        <VideoCallRoom
          appointmentId={activeCall.id}
          otherPartyName={activeCall.client.name}
          sessionType={activeCall.type}
          durationLabel={`${activeCall.duration} min`}
          onEnd={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
