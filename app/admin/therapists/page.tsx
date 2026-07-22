"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminTherapistItem } from "@/lib/types";

const STATUS_STYLE: Record<AdminTherapistItem["status"], string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-sage-50 text-sage-700 border-sage-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminTherapistsPage() {
  const [therapists, setTherapists] = useState<AdminTherapistItem[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/therapists")
      .then((res) => res.json())
      .then((data) => setTherapists(data.therapists ?? []))
      .catch(() => setError("Failed to load therapists."));
  }, []);

  async function updateStatus(id: string, status: "approved" | "rejected" | "pending") {
    setBusyId(id);
    const res = await fetch(`/api/admin/therapists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);

    if (!res.ok) {
      setError("Failed to update status.");
      return;
    }

    setTherapists((prev) =>
      prev?.map((t) => (t.id === id ? { ...t, status, verifiedAt: status === "approved" ? new Date().toISOString() : null } : t)) ?? null
    );
  }

  const pending = therapists?.filter((t) => t.status === "pending") ?? [];
  const reviewed = therapists?.filter((t) => t.status !== "pending") ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Therapist verifications</h1>
        <p className="text-sm text-stone-500 mt-1">
          Review professionals who signed up without a registration code before they get full access to the therapist portal.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {!therapists && <p className="text-stone-400 text-sm">Loading…</p>}

      {therapists && (
        <div>
          <h2 className="text-sm font-semibold text-stone-900 mb-3">Needs Attention</h2>
          <div className="space-y-2">
            {pending.map((t) => (
              <div key={t.id} className="bg-white border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0">
                  {t.name[0]}
                </div>
                <Link href={`/admin/therapists/${t.id}`} className="flex-1 min-w-0 hover:opacity-70 transition-opacity">
                  <div className="text-sm font-medium text-stone-800 truncate">{t.name}</div>
                  <div className="text-xs text-stone-400 truncate">
                    {t.email} · {t.title}
                    {t.licenseNumber ? ` · License ${t.licenseNumber}` : ""}
                  </div>
                </Link>
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
              <div className="bg-white border border-stone-100 rounded-xl py-8 text-center text-sm text-stone-400">No profiles waiting for review</div>
            )}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-stone-900 mb-3">Previously reviewed</h2>
          <div className="bg-white border border-stone-100 rounded-xl overflow-hidden divide-y divide-stone-50">
            {reviewed.map((t) => (
              <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <Link href={`/admin/therapists/${t.id}`} className="min-w-0 hover:opacity-70 transition-opacity">
                  <span className="text-sm font-medium text-stone-800 truncate">{t.name}</span>
                  <span className="text-stone-400 text-xs ml-2 truncate">{t.email}</span>
                </Link>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[t.status]}`}>
                    {t.status}
                  </span>
                  {t.status === "rejected" && (
                    <button
                      disabled={busyId === t.id}
                      onClick={() => updateStatus(t.id, "approved")}
                      className="text-xs font-semibold text-sage-700 hover:underline disabled:opacity-50"
                    >
                      Approve instead
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
