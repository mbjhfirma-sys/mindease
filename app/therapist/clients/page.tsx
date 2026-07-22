"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type Client = {
  id: string; name: string; email: string; avatar: string | null;
  plan: string; xp: number; level: number; joinedAt: string;
  recentMoods: { score: number; date: string }[];
  lastActivity: string;
};

type WaitlistEntry = {
  id: string; userId: string; name: string; avatar: string | null; email: string; createdAt: string;
};

function AddClientModal({ onClose, onAdded }: { onClose: () => void; onAdded: (name: string) => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addedName, setAddedName] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/therapist/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientCode: code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      setAddedName(data.clientName);
      onAdded(data.clientName);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Add client by code</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5">
          {addedName ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-sm font-medium text-stone-900">{addedName} has been added as your client</p>
              <p className="text-xs text-stone-500 mt-1">They can now see you on their schedule and receive your missions.</p>
              <button onClick={onClose} className="mt-5 w-full bg-stone-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-stone-800 transition-colors">Done</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-stone-500">Ask your client to share their <strong>Client Code</strong> from their Settings → Profile page.</p>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Client Code <span className="text-red-400">*</span></label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="MC-XXXXXX"
                  required
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:border-stone-400 transition-colors uppercase"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading || !code} className="w-full bg-stone-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors">
                {loading ? "Adding…" : "Add client"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [view,       setView]       = useState<"clients" | "waitlist">("clients");
  const [clients,    setClients]    = useState<Client[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [showModal,  setShowModal]  = useState(false);
  const [waitlist,   setWaitlist]   = useState<WaitlistEntry[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  function loadClients() {
    fetch("/api/therapist/clients")
      .then((r) => r.json())
      .then((d) => setClients(d.clients ?? []))
      .finally(() => setLoading(false));
  }

  function loadWaitlist() {
    fetch("/api/therapist/waitlist")
      .then((r) => r.json())
      .then((d) => setWaitlist(d.entries ?? []))
      .finally(() => setWaitlistLoading(false));
  }

  useEffect(() => { loadClients(); loadWaitlist(); }, []);

  async function resolveWaitlistEntry(id: string, action: "accept" | "decline") {
    setResolvingId(id);
    try {
      const res = await fetch(`/api/therapist/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setWaitlist((prev) => prev.filter((w) => w.id !== id));
        if (action === "accept") { setLoading(true); loadClients(); }
      }
    } finally {
      setResolvingId(null);
    }
  }

  const filtered = clients.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Clients</h1>
          <p className="text-sm text-stone-500 mt-1">{clients.length} active</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors">
          Add client
        </button>
      </div>

      {showModal && (
        <AddClientModal
          onClose={() => setShowModal(false)}
          onAdded={() => { setShowModal(false); setLoading(true); loadClients(); }}
        />
      )}

      <div className="flex border-b border-stone-100">
        {([
          { id: "clients" as const, label: "Clients" },
          { id: "waitlist" as const, label: `Waitlist${waitlist.length > 0 ? ` (${waitlist.length})` : ""}` },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              view === t.id ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === "waitlist" ? (
        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          {waitlistLoading ? (
            <div className="divide-y divide-stone-50 animate-pulse">
              {[1, 2].map((i) => <div key={i} className="h-16 px-5 py-4" />)}
            </div>
          ) : waitlist.length === 0 ? (
            <div className="py-16 text-center text-sm text-stone-400">No one is waiting right now.</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {waitlist.map((w) => (
                <div key={w.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center text-sm font-semibold text-stone-600 flex-shrink-0">
                    {w.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-900">{w.name}</div>
                    <div className="text-xs text-stone-400 truncate">{w.email} · waiting since {new Date(w.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      disabled={resolvingId === w.id}
                      onClick={() => resolveWaitlistEntry(w.id, "accept")}
                      className="text-xs bg-stone-900 text-white px-2.5 py-1.5 rounded-md hover:bg-stone-800 transition-colors font-medium disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      disabled={resolvingId === w.id}
                      onClick={() => resolveWaitlistEntry(w.id, "decline")}
                      className="text-xs border border-stone-200 text-stone-500 px-2.5 py-1.5 rounded-md hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
        />
      </div>

      <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-stone-50 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 px-5 py-4" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-400">
            {clients.length === 0 ? "No clients yet. Invite your first client above." : "No clients match your search."}
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {filtered.map((client) => {
              const moodAvg = client.recentMoods.length
                ? (client.recentMoods.reduce((s, m) => s + m.score, 0) / client.recentMoods.length).toFixed(1)
                : "—";
              const isActive = client.lastActivity === "recent";

              return (
                <Link key={client.id} href={`/therapist/clients/${client.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors group">
                  <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center text-sm font-semibold text-stone-600 flex-shrink-0">
                    {client.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-medium text-stone-900 group-hover:text-stone-700">{client.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${isActive ? "border-sage-200 text-sage-600" : "border-stone-200 text-stone-400"}`}>
                        {isActive ? "active" : "inactive"}
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 truncate">{client.email} · {client.plan} · Level {client.level}</div>
                  </div>

                  {/* Mini mood chart */}
                  {client.recentMoods.length > 0 && (
                    <div className="hidden sm:flex items-end gap-0.5 h-7 flex-shrink-0">
                      {client.recentMoods.slice(0, 7).map((m, j) => (
                        <div key={j} className="w-1.5 bg-stone-900 rounded-t-sm opacity-70" style={{ height: `${(m.score / 5) * 26}px` }} />
                      ))}
                    </div>
                  )}

                  <div className="text-right flex-shrink-0 min-w-[80px]">
                    <div className="text-sm font-semibold text-stone-900">{moodAvg !== "—" ? `${moodAvg} avg` : "No data"}</div>
                    <div className="text-xs text-stone-400">Mood (7d)</div>
                  </div>

                  <div className="text-right flex-shrink-0 hidden md:block min-w-[72px]">
                    <div className="text-xs text-stone-500">Joined</div>
                    <div className="text-xs font-medium text-stone-700">
                      {new Date(client.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
