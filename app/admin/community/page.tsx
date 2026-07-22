"use client";

import { useEffect, useState } from "react";
import type { AdminReportItem, AdminFlaggedPostItem } from "@/lib/types";

export default function AdminCommunityPage() {
  const [reports, setReports] = useState<AdminReportItem[] | null>(null);
  const [flaggedPosts, setFlaggedPosts] = useState<AdminFlaggedPostItem[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/community/reports").then((r) => r.json()),
      fetch("/api/admin/community/flagged-posts").then((r) => r.json()),
    ]).then(([rData, fData]) => {
      setReports(rData.reports ?? []);
      setFlaggedPosts(fData.posts ?? []);
    }).catch(() => setError("Failed to load moderation queue."));
  }, []);

  async function actOnReport(id: string, action: "dismiss" | "remove") {
    if (action === "remove" && !window.confirm("Permanently delete the reported content? This can't be undone.")) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/community/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    if (res.ok) setReports((prev) => prev?.filter((r) => r.id !== id) ?? null);
    else setError("Failed to update report.");
  }

  async function actOnFlaggedPost(id: string, action: "unflag" | "remove") {
    if (action === "remove" && !window.confirm("Permanently delete this post? This can't be undone.")) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/community/flagged-posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    if (res.ok) setFlaggedPosts((prev) => prev?.filter((p) => p.id !== id) ?? null);
    else setError("Failed to update post.");
  }

  const loading = reports === null || flaggedPosts === null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Community moderation</h1>
        <p className="text-sm text-stone-500 mt-1">Open reports and flagged posts waiting for review.</p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {loading && <p className="text-stone-400 text-sm">Loading…</p>}

      {!loading && (
        <>
          <div>
            <h2 className="text-sm font-semibold text-stone-900 mb-3">Open reports</h2>
            <div className="space-y-2">
              {reports!.map((r) => (
                <div key={r.id} className="bg-white border border-amber-100 rounded-xl px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0 mt-0.5">
                      {r.reporter[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-stone-800">
                        <span className="font-medium">{r.reporter}</span> reported a {r.targetType} by{" "}
                        <span className="font-medium">{r.author ?? "unknown user"}</span>
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">Reason: {r.reason}</div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        disabled={busyId === r.id}
                        onClick={() => actOnReport(r.id, "dismiss")}
                        className="text-xs bg-stone-900 text-white px-2.5 py-1 rounded-md hover:bg-stone-800 transition-colors font-medium disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                      <button
                        disabled={busyId === r.id}
                        onClick={() => actOnReport(r.id, "remove")}
                        className="text-xs border border-red-200 text-red-600 px-2.5 py-1 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Remove content
                      </button>
                    </div>
                  </div>
                  <div className="mt-2.5 ml-10 px-3 py-2 bg-stone-50 border border-stone-100 rounded-lg text-sm text-stone-700 whitespace-pre-wrap break-words">
                    {r.preview ?? <span className="text-stone-400 italic">Content no longer available</span>}
                  </div>
                </div>
              ))}
              {reports!.length === 0 && (
                <div className="bg-white border border-stone-100 rounded-xl py-8 text-center text-sm text-stone-400">No open reports</div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-stone-900 mb-3">Flagged posts</h2>
            <div className="space-y-2">
              {flaggedPosts!.map((p) => (
                <div key={p.id} className="bg-white border border-amber-100 rounded-xl px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0 mt-0.5">
                      {p.author[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-stone-800">
                        <span className="font-medium">{p.author}</span> · {p.group}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        disabled={busyId === p.id}
                        onClick={() => actOnFlaggedPost(p.id, "unflag")}
                        className="text-xs bg-stone-900 text-white px-2.5 py-1 rounded-md hover:bg-stone-800 transition-colors font-medium disabled:opacity-50"
                      >
                        Unflag
                      </button>
                      <button
                        disabled={busyId === p.id}
                        onClick={() => actOnFlaggedPost(p.id, "remove")}
                        className="text-xs border border-red-200 text-red-600 px-2.5 py-1 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="mt-2.5 ml-10 px-3 py-2 bg-stone-50 border border-stone-100 rounded-lg text-sm text-stone-700 whitespace-pre-wrap break-words">
                    {p.content}
                  </div>
                </div>
              ))}
              {flaggedPosts!.length === 0 && (
                <div className="bg-white border border-stone-100 rounded-xl py-8 text-center text-sm text-stone-400">No flagged posts</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
