"use client";

import Link from "next/link";
import { useState } from "react";
import { therapistClients } from "@/lib/mockData";

type SortKey = "name" | "moodAvg" | "missionCompletion" | "riskLevel";
type ModalTab = "add" | "invite";

const MOCK_REGISTERED_USERS = [
  { id: "u101", name: "Sophie Turner", email: "sophie@example.com", joinedDate: "Jan 2025" },
  { id: "u102", name: "Liam Patel",    email: "liam.patel@example.com", joinedDate: "Mar 2025" },
  { id: "u103", name: "Aisha Okafor",  email: "aisha.o@example.com", joinedDate: "Apr 2025" },
  { id: "u104", name: "Noah Brooks",   email: "nbrooks@example.com", joinedDate: "May 2025" },
];

function AddClientModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<ModalTab>("add");

  // "Add existing" state
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  // "Invite" state
  const [inviteFirst, setInviteFirst] = useState("");
  const [inviteLast, setInviteLast] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  const existingIds = new Set(therapistClients.map((c) => c.id));
  const filteredUsers = MOCK_REGISTERED_USERS.filter(
    (u) =>
      !existingIds.has(u.id) &&
      (u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  function handleAdd() {
    if (!selectedUserId) return;
    setAddSuccess(true);
  }

  function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!inviteFirst || !inviteEmail) return;
    setInviteSent(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-stone-900">Add client</h2>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors text-xl leading-none">×</button>
          </div>
          <div className="flex gap-1 bg-stone-100 p-1 rounded-lg">
            <button
              onClick={() => setTab("add")}
              className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${tab === "add" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
            >
              Existing user
            </button>
            <button
              onClick={() => setTab("invite")}
              className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${tab === "invite" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
            >
              Invite new client
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {tab === "add" ? (
            addSuccess ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-sm font-medium text-stone-900">Client added successfully</p>
                <p className="text-xs text-stone-500 mt-1">They can now see you as their therapist.</p>
                <button onClick={onClose} className="mt-5 w-full bg-stone-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-stone-800 transition-colors">Done</button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-stone-500">Search for a user who already has a MindEase account.</p>
                <input
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setSelectedUserId(null); }}
                  placeholder="Search by name or email…"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-stone-400 transition-colors"
                  autoFocus
                />
                {userSearch && (
                  <div className="border border-stone-100 rounded-xl overflow-hidden divide-y divide-stone-50">
                    {filteredUsers.length === 0 ? (
                      <p className="text-sm text-stone-400 text-center py-6">No users found</p>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => setSelectedUserId(u.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${selectedUserId === u.id ? "bg-stone-900 text-white" : "hover:bg-stone-50"}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${selectedUserId === u.id ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"}`}>
                            {u.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className={`text-sm font-medium truncate ${selectedUserId === u.id ? "text-white" : "text-stone-900"}`}>{u.name}</div>
                            <div className={`text-xs truncate ${selectedUserId === u.id ? "text-white/70" : "text-stone-400"}`}>{u.email} · Member since {u.joinedDate}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
                <button
                  onClick={handleAdd}
                  disabled={!selectedUserId}
                  className="w-full bg-stone-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add to my clients
                </button>
              </div>
            )
          ) : (
            inviteSent ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">📨</div>
                <p className="text-sm font-medium text-stone-900">Invitation sent to {inviteEmail}</p>
                <p className="text-xs text-stone-500 mt-1">They'll receive a link to create their account and be connected to you automatically.</p>
                <button onClick={onClose} className="mt-5 w-full bg-stone-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-stone-800 transition-colors">Done</button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                <p className="text-sm text-stone-500">Send your client an email invitation to create their MindEase account. They'll be linked to you automatically when they sign up.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1.5">First name <span className="text-red-400">*</span></label>
                    <input
                      value={inviteFirst}
                      onChange={(e) => setInviteFirst(e.target.value)}
                      placeholder="Jane"
                      required
                      className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1.5">Last name</label>
                    <input
                      value={inviteLast}
                      onChange={(e) => setInviteLast(e.target.value)}
                      placeholder="Doe"
                      className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">Email address <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="client@example.com"
                    required
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">Personal note <span className="text-stone-400 font-normal">(optional)</span></label>
                  <textarea
                    value={inviteNote}
                    onChange={(e) => setInviteNote(e.target.value)}
                    placeholder="Add a short message to include in the invitation email…"
                    rows={3}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400 transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-stone-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-stone-800 transition-colors"
                >
                  Send invitation
                </button>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [showModal, setShowModal] = useState(false);

  const filtered = therapistClients
    .filter((c) => {
      if (riskFilter !== "all" && c.riskLevel !== riskFilter) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.condition.join(" ").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "moodAvg") return b.moodAvg - a.moodAvg;
      if (sort === "missionCompletion") return b.missionCompletion - a.missionCompletion;
      if (sort === "riskLevel") {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.riskLevel] - order[b.riskLevel];
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Clients</h1>
          <p className="text-sm text-stone-500 mt-1">{therapistClients.length} active</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors"
        >
          Add client
        </button>
      </div>

      {showModal && <AddClientModal onClose={() => setShowModal(false)} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or condition…"
          className="flex-1 min-w-48 bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
        />
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-600 focus:outline-none focus:border-stone-400 transition-colors"
        >
          <option value="all">All risk levels</option>
          <option value="high">High risk</option>
          <option value="medium">Medium risk</option>
          <option value="low">Low risk</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-600 focus:outline-none focus:border-stone-400 transition-colors"
        >
          <option value="name">Sort: Name</option>
          <option value="moodAvg">Sort: Mood</option>
          <option value="missionCompletion">Sort: Missions</option>
          <option value="riskLevel">Sort: Risk</option>
        </select>
      </div>

      {/* Client list */}
      <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-400">No clients match your search</div>
        ) : (
          <div className="divide-y divide-stone-50">
            {filtered.map((client) => (
              <Link
                key={client.id}
                href={`/therapist/clients/${client.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors group"
              >
                <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center text-sm font-semibold text-stone-600 flex-shrink-0">
                  {client.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-medium text-stone-900 group-hover:text-stone-700">{client.name}</span>
                    <span className={`text-[10px] border px-1.5 py-0.5 rounded font-medium ${
                      client.riskLevel === "high" ? "border-red-200 text-red-600" :
                      client.riskLevel === "medium" ? "border-amber-200 text-amber-600" :
                      "border-stone-200 text-stone-400"
                    }`}>{client.riskLevel}</span>
                    {client.unreadMessages > 0 && (
                      <span className="text-[10px] bg-stone-900 text-white w-4 h-4 rounded-full flex items-center justify-center font-semibold">{client.unreadMessages}</span>
                    )}
                    {client.pendingJournalReview && (
                      <span className="text-[10px] text-stone-500 border border-stone-200 px-1.5 py-0.5 rounded">Journal pending</span>
                    )}
                  </div>
                  <div className="text-xs text-stone-400 truncate">{client.age} · {client.condition.join(", ")} · {client.plan}</div>
                </div>

                {/* Mini mood chart */}
                <div className="flex items-end gap-0.5 h-7 flex-shrink-0 hidden sm:flex">
                  {client.moodHistory.map((score, j) => (
                    <div key={j} className="w-1.5 bg-stone-900 rounded-t-sm opacity-70" style={{ height: `${(score / 5) * 26}px` }} />
                  ))}
                </div>

                <div className="text-right flex-shrink-0 min-w-[80px]">
                  <div className="text-sm font-semibold text-stone-900">{client.moodAvg.toFixed(1)} avg</div>
                  <div className="text-xs text-stone-400">{client.missionCompletion}% missions</div>
                </div>

                <div className="text-right flex-shrink-0 hidden md:block min-w-[72px]">
                  <div className="text-xs text-stone-500">Next</div>
                  <div className="text-xs font-medium text-stone-700">{client.nextSession ?? "—"}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
