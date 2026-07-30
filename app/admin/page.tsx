"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminStats, AdminTherapistItem } from "@/lib/types";
import { SeverityBadge } from "@/components/SeverityBadge";

type AdminRiskFlagRow = {
  id: string; userId: string; userName: string; source: string;
  severity: "high" | "moderate"; detail: string; status: string; createdAt: string;
  therapistName: string | null;
  activeStepUpWindow: { windowEnd: string; contactLabel: string; checkInIntervalHrs: number } | null;
};

const EMPTY_STATS: AdminStats = {
  users: { total: 0, clients: 0, therapists: 0, admins: 0, newLast7d: 0 },
  therapists: { total: 0, pending: 0, approved: 0, rejected: 0 },
  community: { openReports: 0, flaggedPosts: 0, totalPosts: 0 },
  safety: { openRiskFlags: 0 },
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [pending, setPending] = useState<AdminTherapistItem[]>([]);
  const [riskFlags, setRiskFlags] = useState<AdminRiskFlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ackBusyId, setAckBusyId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/therapists").then((r) => r.json()),
      fetch("/api/admin/risk-flags").then((r) => r.json()),
    ]).then(([sData, tData, rData]) => {
      if (sData.users) setStats(sData);
      const therapists: AdminTherapistItem[] = tData.therapists ?? [];
      setPending(therapists.filter((t) => t.status === "pending"));
      setRiskFlags(rData.flags ?? []);
    }).finally(() => setLoading(false));
  }, []);

  async function acknowledgeFlag(id: string) {
    setAckBusyId(id);
    const res = await fetch(`/api/risk-flags/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "acknowledged" }),
    });
    setAckBusyId(null);
    if (res.ok) {
      setRiskFlags((prev) => prev.filter((f) => f.id !== id));
      setStats((prev) => ({ ...prev, safety: { openRiskFlags: Math.max(0, prev.safety.openRiskFlags - 1) } }));
    }
  }

  async function updateStatus(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    const res = await fetch(`/api/admin/therapists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    if (res.ok) {
      setPending((prev) => prev.filter((t) => t.id !== id));
      setStats((prev) => ({ ...prev, therapists: { ...prev.therapists, pending: prev.therapists.pending - 1 } }));
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-stone-100 rounded w-1/2" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-stone-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const moderationCount = stats.community.openReports + stats.community.flaggedPosts;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Overview</h1>
        <p className="text-sm text-stone-500 mt-1">Platform health at a glance</p>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total users", value: stats.users.total },
          { label: "New signups (7d)", value: stats.users.newLast7d },
          { label: "Total therapists", value: stats.therapists.total },
          { label: "Pending verifications", value: stats.therapists.pending },
          { label: "Open risk flags", value: stats.safety.openRiskFlags },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-xl p-4">
            <div className="text-2xl font-semibold text-stone-900">{s.value}</div>
            <div className="text-xs text-stone-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Needs attention */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-900">Needs Attention</h2>
            {pending.length > 5 && (
              <Link href="/admin/therapists" className="text-xs text-stone-500 hover:text-stone-900 transition-colors">View all →</Link>
            )}
          </div>
          <div className="space-y-2">
            {pending.slice(0, 5).map((t) => (
              <div key={t.id} className="bg-white border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0">
                  {t.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-800 truncate">{t.name}</div>
                  <div className="text-xs text-stone-400 truncate">{t.title}</div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    disabled={busyId === t.id}
                    onClick={() => updateStatus(t.id, "approved")}
                    className="text-xs bg-stone-900 text-white px-2.5 py-1 rounded-md hover:bg-stone-800 transition-colors font-medium disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    disabled={busyId === t.id}
                    onClick={() => updateStatus(t.id, "rejected")}
                    className="text-xs border border-stone-200 text-stone-500 px-2.5 py-1 rounded-md hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
            {pending.length === 0 && (
              <div className="bg-white border border-stone-100 rounded-xl py-8 text-center text-sm text-stone-400">All caught up</div>
            )}
          </div>
        </div>

        {/* Moderation queue */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-900">Moderation Queue</h2>
            {moderationCount > 0 && (
              <Link href="/admin/community" className="text-xs text-stone-500 hover:text-stone-900 transition-colors">Review →</Link>
            )}
          </div>
          <div className="bg-white border border-stone-100 rounded-xl p-4">
            {moderationCount === 0 ? (
              <div className="py-6 text-center text-sm text-stone-400">Nothing to review</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-2xl font-semibold text-stone-900">{stats.community.openReports}</div>
                  <div className="text-xs text-stone-500 mt-1">Open reports</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-stone-900">{stats.community.flaggedPosts}</div>
                  <div className="text-xs text-stone-500 mt-1">Flagged posts</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Risk flags */}
      <div>
        <h2 className="text-sm font-semibold text-stone-900 mb-3">Risk Flags</h2>
        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          {riskFlags.length === 0 ? (
            <div className="py-10 text-center text-sm text-stone-400">No open risk flags.</div>
          ) : (
            riskFlags.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3 border-t border-stone-50 first:border-t-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-800">
                    <Link href={`/admin/users/${f.userId}`} className="hover:underline">{f.userName}</Link>
                    <SeverityBadge severity={f.severity} className="ml-2" />
                    {f.activeStepUpWindow && (
                      <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border text-red-600 bg-red-50 border-red-200">
                        Elevated monitoring
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    {f.detail} · {f.source} · {new Date(f.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {f.therapistName ? ` · Therapist: ${f.therapistName}` : " · No assigned therapist"}
                  </div>
                </div>
                <button
                  onClick={() => acknowledgeFlag(f.id)}
                  disabled={ackBusyId === f.id}
                  className="text-xs border border-stone-200 bg-white text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  Acknowledge
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Secondary activity row */}
      <div>
        <h2 className="text-sm font-semibold text-stone-900 mb-3">Platform Activity</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Approved therapists", value: stats.therapists.approved },
            { label: "Client users", value: stats.users.clients },
            { label: "Community posts", value: stats.community.totalPosts },
            { label: "Admins", value: stats.users.admins },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-xl p-4">
              <div className="text-2xl font-semibold text-stone-900">{s.value}</div>
              <div className="text-xs text-stone-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
