"use client";

import { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { AdminUserDetail } from "@/lib/types";

type Tab = "overview" | "journal" | "clinical" | "activity" | "community" | "appointments" | "messages";
const TABS: Tab[] = ["overview", "journal", "clinical", "activity", "community", "appointments", "messages"];
const TAB_LABEL: Record<Tab, string> = {
  overview: "Overview", journal: "Journal", clinical: "Clinical", activity: "Activity",
  community: "Community", appointments: "Appointments", messages: "Messages",
};

function RESPONSE_PREVIEW(data: Record<string, unknown>) {
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (entries.length === 0) return null;
  return (
    <div className="mt-2 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2.5 space-y-1.5">
      {entries.map(([key, value]) => (
        <div key={key} className="text-xs">
          <span className="text-stone-400 font-medium">{key}: </span>
          <span className="text-stone-700 whitespace-pre-wrap">
            {Array.isArray(value) ? value.join(", ") : typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <AdminUserDetailInner id={id} />
    </Suspense>
  );
}

function AdminUserDetailInner({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab | null) ?? "overview");
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedJournalId, setExpandedJournalId] = useState<string | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user); })
      .finally(() => setLoading(false));
  }, [id]);

  function selectTab(t: Tab) {
    setTab(t);
    router.replace(`/admin/users/${id}?tab=${t}`, { scroll: false });
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <Link href="/admin/users" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">← Users</Link>
        <div className="bg-white border border-stone-100 rounded-xl p-5 animate-pulse">
          <div className="h-12 bg-stone-100 rounded-lg w-1/2 mb-4" />
          <div className="h-4 bg-stone-100 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <Link href="/admin/users" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">← Users</Link>
        <div className="bg-white border border-stone-100 rounded-xl p-8 text-center text-stone-400 text-sm">User not found.</div>
      </div>
    );
  }

  const moodScores = user.moodEntries.map((m) => m.score);
  const moodAvg = moodScores.length ? parseFloat((moodScores.reduce((s, v) => s + v, 0) / moodScores.length).toFixed(1)) : 0;
  const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
  const recentMoods = [...user.moodEntries].reverse().slice(-14);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link href="/admin/users" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">← Users</Link>

      {/* Header */}
      <div className="bg-white border border-stone-100 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-lg font-semibold text-stone-600">
              {user.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-stone-900">{user.name}</h1>
                <span className="text-[10px] border border-stone-200 text-stone-400 px-1.5 py-0.5 rounded font-medium">Level {user.level}</span>
              </div>
              <div className="text-xs text-stone-500 mt-0.5">{user.plan} · {user.email}</div>
              <div className="text-xs text-stone-400 mt-0.5">
                Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-stone-100">
          {[
            { label: "Avg mood", value: moodAvg > 0 ? moodAvg.toFixed(1) : "—" },
            { label: "XP earned", value: `${user.xp} xp` },
            { label: "2FA", value: user.twoFactorEnabled ? "On" : "Off" },
            { label: "Onboarded", value: user.hasOnboarded ? "Yes" : "No" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-sm font-semibold text-stone-900 truncate">{s.value}</div>
              <div className="text-[10px] text-stone-400 mt-0.5">{s.label}</div>
            </div>
          ))}
          {user.assignedTherapist ? (
            <Link href={`/admin/therapists/${user.assignedTherapist.id}`} className="text-center hover:opacity-70 transition-opacity">
              <div className="text-sm font-semibold text-stone-900 truncate underline decoration-stone-300">{user.assignedTherapist.name}</div>
              <div className="text-[10px] text-stone-400 mt-0.5">Therapist</div>
            </Link>
          ) : (
            <div className="text-center">
              <div className="text-sm font-semibold text-stone-900 truncate">Unassigned</div>
              <div className="text-[10px] text-stone-400 mt-0.5">Therapist</div>
            </div>
          )}
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
          {user.assignedTherapist && (
            <Link href={`/admin/therapists/${user.assignedTherapist.id}`} className="block bg-white border border-stone-100 rounded-xl p-4 hover:border-stone-300 transition-colors">
              <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1">Assigned therapist</div>
              <div className="text-sm font-medium text-stone-900">{user.assignedTherapist.name}</div>
              <div className="text-xs text-stone-400">{user.assignedTherapist.title} · Rating {user.assignedTherapist.rating.toFixed(1)}</div>
            </Link>
          )}

          {user.riskFlags.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-100">
                <h3 className="text-sm font-semibold text-stone-900">Risk flags</h3>
              </div>
              <div className="divide-y divide-stone-50">
                {user.riskFlags.map((f) => (
                  <div key={f.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div>
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded mr-2 ${f.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{f.severity}</span>
                      <span className="text-sm text-stone-700">{f.detail}</span>
                      <div className="text-xs text-stone-400 mt-0.5">{f.source} · {new Date(f.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${f.status === "open" ? "border-amber-200 text-amber-700" : "border-stone-200 text-stone-400"}`}>{f.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-stone-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-stone-900 mb-4">Mood trend (last {recentMoods.length} entries)</h3>
            {recentMoods.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400">No mood data recorded yet.</div>
            ) : (
              <>
                <div className="flex items-end gap-1.5 h-20">
                  {recentMoods.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full rounded-t-sm bg-stone-900" style={{ height: `${(m.score / 5) * 60}px`, minHeight: "4px" }} />
                      <span className="text-[9px] text-stone-400">{DAYS[i % 7]}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-stone-400 mt-3 pt-3 border-t border-stone-50">
                  <span>Min: {Math.min(...moodScores)} / 5</span>
                  <span>Avg: {moodAvg} / 5</span>
                  <span>Max: {Math.max(...moodScores)} / 5</span>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-stone-100 rounded-xl p-4">
              <div className="text-2xl font-semibold text-stone-900">{user.journalEntries.length}</div>
              <div className="text-xs text-stone-500 mt-1">Journal entries</div>
            </div>
            <div className="bg-white border border-stone-100 rounded-xl p-4">
              <div className="text-2xl font-semibold text-stone-900">{user.missionCompletions.length}</div>
              <div className="text-xs text-stone-500 mt-1">Tasks completed</div>
            </div>
            <div className="bg-white border border-stone-100 rounded-xl p-4">
              <div className="text-2xl font-semibold text-stone-900">{user.appointments.length}</div>
              <div className="text-xs text-stone-500 mt-1">Appointments</div>
            </div>
            <div className="bg-white border border-stone-100 rounded-xl p-4">
              <div className="text-2xl font-semibold text-stone-900">{user.clinicalNotes.length}</div>
              <div className="text-xs text-stone-500 mt-1">Clinical notes</div>
            </div>
          </div>
        </div>
      )}

      {/* Journal */}
      {tab === "journal" && (
        <div className="space-y-3">
          {user.journalEntries.length === 0 && (
            <div className="bg-white border border-stone-100 rounded-xl py-16 text-center text-sm text-stone-400">No journal entries.</div>
          )}
          {user.journalEntries.map((entry) => {
            const expanded = expandedJournalId === entry.id;
            return (
              <div key={entry.id} className="bg-white border border-stone-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-stone-800">{entry.title}</span>
                    <div className="text-xs text-stone-400 mt-0.5">
                      {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}{new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <div key={v} className={`w-2 h-2 rounded-full ${v <= entry.mood ? "bg-stone-700" : "bg-stone-100"}`} />
                    ))}
                    <span className="text-[10px] text-stone-400 ml-1">{entry.mood}/5</span>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {entry.emotions.map((e) => <span key={e} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-md">{e}</span>)}
                </div>
                <p className={`text-sm text-stone-700 leading-relaxed whitespace-pre-wrap ${expanded ? "" : "line-clamp-2"}`}>{entry.content}</p>
                {entry.content.length > 140 && (
                  <button onClick={() => setExpandedJournalId(expanded ? null : entry.id)} className="text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors mt-2">
                    {expanded ? "Show less" : "Read full entry →"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Clinical */}
      {tab === "clinical" && (
        <div className="space-y-4">
          {user.treatmentPlans.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-stone-900 mb-3">Treatment plan{user.treatmentPlans.length > 1 ? "s" : ""}</h2>
              <div className="space-y-3">
                {user.treatmentPlans.map((p) => (
                  <div key={p.id} className={`bg-white border rounded-xl overflow-hidden ${p.riskLevel === "high" ? "border-red-200" : "border-stone-100"}`}>
                    <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 bg-stone-50">
                      <span className="text-xs font-medium text-stone-600">By {p.therapistName}</span>
                      <span className={`text-[10px] border px-1.5 py-0.5 rounded font-medium capitalize ${
                        p.riskLevel === "high" ? "border-red-200 text-red-600" : p.riskLevel === "medium" ? "border-amber-200 text-amber-600" : "border-stone-200 text-stone-400"
                      }`}>{p.riskLevel} risk</span>
                    </div>
                    <div className="divide-y divide-stone-50">
                      {[
                        ["Diagnosis", p.diagnosis], ["Approach", p.approach], ["Frequency", p.frequency],
                        ["Short-term goals", p.shortTermGoals], ["Long-term goals", p.longTermGoals], ["Phase", p.phase],
                      ].map(([label, value]) => value && (
                        <div key={label} className="px-5 py-3">
                          <div className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1">{label}</div>
                          <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 py-3 bg-stone-50 flex gap-4 text-xs text-stone-500">
                      <span>Safety plan: {p.safetyPlan ? "Yes" : "No"}</span>
                      <span>Emergency contacts: {p.emergencyContacts ? "Yes" : "No"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-stone-900 mb-3">Clinical notes ({user.clinicalNotes.length})</h2>
            {user.clinicalNotes.length === 0 ? (
              <div className="bg-white border border-stone-100 rounded-xl py-12 text-center text-sm text-stone-400">No clinical notes.</div>
            ) : (
              <div className="space-y-3">
                {user.clinicalNotes.map((note) => {
                  const isExpanded = expandedNoteId === note.id;
                  return (
                    <div key={note.id} className="bg-white border border-stone-100 rounded-xl overflow-hidden">
                      <button onClick={() => setExpandedNoteId(isExpanded ? null : note.id)} className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-stone-50 transition-colors">
                        <div className="flex-shrink-0 text-center bg-stone-50 rounded-lg px-3 py-2 min-w-[60px]">
                          <div className="text-[10px] text-stone-400 uppercase font-medium">{new Date(note.date).toLocaleDateString("en-US", { month: "short" })}</div>
                          <div className="text-sm font-semibold text-stone-900">{new Date(note.date).getDate()}</div>
                          <div className="text-[10px] text-stone-400">{new Date(note.date).getFullYear()}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-medium text-stone-600 capitalize border border-stone-200 px-1.5 py-0.5 rounded">{note.sessionType}</span>
                            <span className={`text-[10px] border px-1.5 py-0.5 rounded font-medium capitalize ${
                              note.riskLevel === "high" ? "border-red-200 text-red-600" : note.riskLevel === "medium" ? "border-amber-200 text-amber-600" : "border-stone-200 text-stone-400"
                            }`}>{note.riskLevel} risk</span>
                            <span className="text-[10px] text-stone-400">by {note.therapistName}</span>
                          </div>
                          <p className={`text-xs text-stone-600 leading-relaxed ${isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"}`}>{note.content}</p>
                        </div>
                        <div className="flex-shrink-0 text-stone-400 mt-1">{isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</div>
                      </button>
                      {isExpanded && (note.affect || note.nextSteps || note.tags.length > 0) && (
                        <div className="px-5 pb-5 space-y-3 border-t border-stone-50 pt-4">
                          {note.affect && (
                            <div>
                              <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Affect</div>
                              <p className="text-sm text-stone-700">{note.affect}</p>
                            </div>
                          )}
                          {note.nextSteps && (
                            <div>
                              <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Next steps</div>
                              <p className="text-sm text-stone-700 leading-relaxed">{note.nextSteps}</p>
                            </div>
                          )}
                          {note.tags.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                              {note.tags.map((t) => <span key={t} className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">{t}</span>)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity */}
      {tab === "activity" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-stone-900 mb-3">Completed tasks ({user.missionCompletions.length})</h2>
            <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
              {user.missionCompletions.length === 0 ? (
                <div className="py-10 text-center text-sm text-stone-400">No tasks completed yet.</div>
              ) : (
                <div className="divide-y divide-stone-50">
                  {user.missionCompletions.map((m) => {
                    const hasResponse = !!m.responseData && Object.values(m.responseData).some((v) => v !== null && v !== undefined && v !== "");
                    const isExpanded = expandedMissionId === m.id;
                    return (
                      <div key={m.id} className="px-5 py-4">
                        <button onClick={() => hasResponse && setExpandedMissionId(isExpanded ? null : m.id)} className={`w-full flex items-start gap-3 text-left ${hasResponse ? "cursor-pointer" : "cursor-default"}`}>
                          <div className="mt-0.5 w-4 h-4 rounded-full border-2 bg-stone-900 border-stone-900 flex items-center justify-center flex-shrink-0">
                            <span className="text-[8px] text-white font-bold">✓</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-stone-800">{m.mission.title}</div>
                            <div className="flex gap-3 mt-1 text-xs text-stone-400">
                              <span className="capitalize">{m.mission.category}</span>
                              <span>+{m.mission.xp} xp</span>
                              <span>{new Date(m.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            </div>
                          </div>
                          {hasResponse && (isExpanded ? <ChevronUp size={14} className="text-stone-400 mt-0.5" /> : <ChevronDown size={14} className="text-stone-400 mt-0.5" />)}
                        </button>
                        {isExpanded && m.responseData && RESPONSE_PREVIEW(m.responseData)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-stone-100 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-stone-900 mb-3">Achievements ({user.achievements.length})</h3>
              {user.achievements.length === 0 ? <p className="text-xs text-stone-400">No achievements yet.</p> : (
                <div className="flex flex-wrap gap-2">
                  {user.achievements.map((a) => (
                    <span key={a.id} className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-lg">{a.badgeId}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-stone-100 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-stone-900 mb-3">Courses</h3>
              {user.courseEnrollments.length === 0 && user.courseProgress.length === 0 ? (
                <p className="text-xs text-stone-400">No course activity.</p>
              ) : (
                <div className="space-y-2">
                  {user.courseEnrollments.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-xs">
                      <span className="text-stone-700 truncate">{c.courseName}</span>
                      <span className="text-stone-400 capitalize">{c.status.replace("_", " ")}</span>
                    </div>
                  ))}
                  {user.courseProgress.map((c) => (
                    <div key={c.courseId} className="flex items-center justify-between text-xs">
                      <span className="text-stone-700 truncate">{c.courseTitle}</span>
                      <span className="text-stone-400">{c.completedLessons}/{c.totalLessons} lessons</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-stone-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-stone-900 mb-3">Assessment results ({user.assessmentResults.length})</h3>
            {user.assessmentResults.length === 0 ? <p className="text-xs text-stone-400">No assessments taken.</p> : (
              <div className="divide-y divide-stone-50">
                {user.assessmentResults.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 text-xs">
                    <span className="text-stone-700">{a.assessmentId}</span>
                    <span className="text-stone-500">{a.label} · {a.score}</span>
                    <span className="text-stone-400">{new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Community */}
      {tab === "community" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-stone-900 mb-3">Posts ({user.communityPosts.length})</h2>
            <div className="space-y-2">
              {user.communityPosts.map((p) => (
                <div key={p.id} className="bg-white border border-stone-100 rounded-xl p-4">
                  <p className="text-sm text-stone-700 whitespace-pre-wrap">{p.content}</p>
                  <div className="text-xs text-stone-400 mt-2">
                    {p.group ?? "General"} · {p.likes} likes · {p.replies} replies · {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
              ))}
              {user.communityPosts.length === 0 && <div className="bg-white border border-stone-100 rounded-xl py-8 text-center text-sm text-stone-400">No posts.</div>}
            </div>
          </div>

          {user.postReplies.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-stone-900 mb-3">Replies ({user.postReplies.length})</h2>
              <div className="bg-white border border-stone-100 rounded-xl overflow-hidden divide-y divide-stone-50">
                {user.postReplies.map((r) => (
                  <div key={r.id} className="px-4 py-3 text-sm text-stone-700">{r.content}</div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-stone-100 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-stone-900 mb-2">Support groups joined</h3>
              {user.groupMemberships.length === 0 ? <p className="text-xs text-stone-400">None.</p> : (
                <div className="space-y-1">
                  {user.groupMemberships.map((m) => <div key={m.id} className="text-xs text-stone-600">{m.groupName}</div>)}
                </div>
              )}
            </div>
            <div className="bg-white border border-stone-100 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-stone-900 mb-2">Therapist groups joined</h3>
              {user.therapistGroupMemberships.length === 0 ? <p className="text-xs text-stone-400">None.</p> : (
                <div className="space-y-1">
                  {user.therapistGroupMemberships.map((m) => <div key={m.id} className="text-xs text-stone-600">{m.groupName}</div>)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Appointments */}
      {tab === "appointments" && (
        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          {user.appointments.length === 0 ? (
            <div className="py-16 text-center text-sm text-stone-400">No appointments.</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {user.appointments.map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="text-center min-w-[64px]">
                    <div className="text-xs font-semibold text-stone-800">{new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    <div className="text-[10px] text-stone-400">{new Date(a.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-800">{a.therapistName}</div>
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

      {/* Messages */}
      {tab === "messages" && (
        <div className="space-y-4">
          {user.conversations.length === 0 ? (
            <div className="bg-white border border-stone-100 rounded-xl py-16 text-center text-sm text-stone-400">No conversations.</div>
          ) : (
            user.conversations.map((c) => (
              <div key={c.id} className="bg-white border border-stone-100 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-stone-100 bg-stone-50">
                  <span className="text-sm font-medium text-stone-800">Conversation with {c.therapistName}</span>
                </div>
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {c.messages.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-4">No messages yet.</p>
                  ) : (
                    c.messages.map((m) => (
                      <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          m.from === "user" ? "bg-stone-900 text-white rounded-br-sm" : "bg-stone-100 text-stone-700 rounded-bl-sm"
                        }`}>
                          <span className="whitespace-pre-line">{m.text}</span>
                          <div className={`text-[10px] mt-1 opacity-60 ${m.from === "user" ? "text-right" : ""}`}>
                            {new Date(m.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
