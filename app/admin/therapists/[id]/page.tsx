"use client";

import { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import type { AdminTherapistDetail } from "@/lib/types";

type Tab = "overview" | "clients" | "appointments" | "community" | "missions";
const TABS: Tab[] = ["overview", "clients", "appointments", "community", "missions"];
const TAB_LABEL: Record<Tab, string> = {
  overview: "Overview", clients: "Clients", appointments: "Appointments", community: "Community", missions: "Missions & Courses",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-sage-50 text-sage-700 border-sage-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminTherapistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <AdminTherapistDetailInner id={id} />
    </Suspense>
  );
}

function AdminTherapistDetailInner({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab | null) ?? "overview");
  const [therapist, setTherapist] = useState<AdminTherapistDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/therapists/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.therapist) setTherapist(d.therapist); })
      .finally(() => setLoading(false));
  }, [id]);

  function selectTab(t: Tab) {
    setTab(t);
    router.replace(`/admin/therapists/${id}?tab=${t}`, { scroll: false });
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <Link href="/admin/therapists" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">← Therapists</Link>
        <div className="bg-white border border-stone-100 rounded-xl p-5 animate-pulse">
          <div className="h-12 bg-stone-100 rounded-lg w-1/2 mb-4" />
          <div className="h-4 bg-stone-100 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <Link href="/admin/therapists" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">← Therapists</Link>
        <div className="bg-white border border-stone-100 rounded-xl p-8 text-center text-stone-400 text-sm">Therapist not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link href="/admin/therapists" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">← Therapists</Link>

      {/* Header */}
      <div className="bg-white border border-stone-100 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-lg font-semibold text-stone-600">
              {therapist.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-stone-900">{therapist.name}</h1>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${STATUS_STYLE[therapist.verificationStatus]}`}>
                  {therapist.verificationStatus}
                </span>
              </div>
              <div className="text-xs text-stone-500 mt-0.5">{therapist.title} · {therapist.email}</div>
              <div className="text-xs text-stone-400 mt-0.5">Rating {therapist.rating.toFixed(1)}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-stone-100">
          {[
            { label: "Clients", value: String(therapist.clients.length) },
            { label: "Appointments", value: String(therapist.appointments.length) },
            { label: "Clinical notes", value: String(therapist.clinicalNoteCount) },
            { label: "Treatment plans", value: String(therapist.treatmentPlanCount) },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-sm font-semibold text-stone-900">{s.value}</div>
              <div className="text-[10px] text-stone-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-100 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => selectTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-100 rounded-xl overflow-hidden divide-y divide-stone-50">
            {therapist.bio && (
              <div className="px-5 py-4">
                <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1">Bio</div>
                <p className="text-sm text-stone-700 leading-relaxed">{therapist.bio}</p>
              </div>
            )}
            {therapist.approach && (
              <div className="px-5 py-4">
                <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1">Approach</div>
                <p className="text-sm text-stone-700 leading-relaxed">{therapist.approach}</p>
              </div>
            )}
            {therapist.specializations.length > 0 && (
              <div className="px-5 py-4">
                <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1.5">Specializations</div>
                <div className="flex flex-wrap gap-1.5">
                  {therapist.specializations.map((s) => <span key={s} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md">{s}</span>)}
                </div>
              </div>
            )}
            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1">License</div>
                <p className="text-sm text-stone-700">{therapist.licenseNumber ?? "—"}</p>
              </div>
              <div>
                <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1">Years of experience</div>
                <p className="text-sm text-stone-700">{therapist.yearsOfExperience ?? "—"}</p>
              </div>
            </div>
            {therapist.education.length > 0 && (
              <div className="px-5 py-4">
                <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1">Education</div>
                <p className="text-sm text-stone-700">{therapist.education.join(", ")}</p>
              </div>
            )}
            {therapist.languages.length > 0 && (
              <div className="px-5 py-4">
                <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1">Languages</div>
                <p className="text-sm text-stone-700">{therapist.languages.join(", ")}</p>
              </div>
            )}
            <div className="px-5 py-4">
              <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1">Verified</div>
              <p className="text-sm text-stone-700">
                {therapist.verifiedAt ? new Date(therapist.verifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not yet verified"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Clients */}
      {tab === "clients" && (
        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          {therapist.clients.length === 0 ? (
            <div className="py-16 text-center text-sm text-stone-400">No clients assigned.</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {therapist.clients.map((c) => (
                <Link key={c.id} href={`/admin/users/${c.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-stone-50 transition-colors group">
                  <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-stone-800 group-hover:text-stone-900">{c.name}</span>
                    <div className="text-xs text-stone-400 mt-0.5 truncate">{c.email} · {c.plan} · Level {c.level}</div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <div className="text-xs text-stone-500">Joined</div>
                    <div className="text-xs font-medium text-stone-700">{new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Appointments */}
      {tab === "appointments" && (
        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          {therapist.appointments.length === 0 ? (
            <div className="py-16 text-center text-sm text-stone-400">No appointments.</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {therapist.appointments.map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="text-center min-w-[64px]">
                    <div className="text-xs font-semibold text-stone-800">{new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    <div className="text-[10px] text-stone-400">{new Date(a.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-800">{a.clientName}</div>
                    <div className="text-xs text-stone-400 capitalize">{a.type.replace("_", " ")} · {a.duration}min</div>
                  </div>
                  <span className={`text-[10px] border px-1.5 py-0.5 rounded font-medium capitalize ${a.status === "confirmed" || a.status === "completed" ? "border-sage-200 text-sage-600" : "border-stone-200 text-stone-500"}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Community */}
      {tab === "community" && (
        <div className="space-y-2">
          {therapist.groups.length === 0 ? (
            <div className="bg-white border border-stone-100 rounded-xl py-16 text-center text-sm text-stone-400">No community groups run by this therapist.</div>
          ) : (
            therapist.groups.map((g) => (
              <div key={g.id} className="bg-white border border-stone-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-stone-800">{g.name}</div>
                  <div className="text-xs text-stone-400 capitalize">{g.category} · {g.status}</div>
                </div>
                <div className="text-right text-xs text-stone-500">
                  <div>{g.memberCount} members</div>
                  <div>{g.postCount} posts</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Missions & Courses */}
      {tab === "missions" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-stone-900 mb-3">Tasks authored ({therapist.missions.length})</h2>
            <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
              {therapist.missions.length === 0 ? (
                <div className="py-10 text-center text-sm text-stone-400">No custom tasks authored.</div>
              ) : (
                <div className="divide-y divide-stone-50">
                  {therapist.missions.map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="text-sm font-medium text-stone-800">{m.title}</div>
                        <div className="text-xs text-stone-400 capitalize">{m.category}</div>
                      </div>
                      <span className="text-xs text-stone-500">{m.completions} completions</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="bg-white border border-stone-100 rounded-xl p-4">
            <div className="text-2xl font-semibold text-stone-900">{therapist.courseEnrollmentCount}</div>
            <div className="text-xs text-stone-500 mt-1">Course enrollments assigned across all clients</div>
          </div>
        </div>
      )}
    </div>
  );
}
