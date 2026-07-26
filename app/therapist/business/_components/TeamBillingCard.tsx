"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatCents } from "@/lib/money";

type Member = {
  id: string;
  name: string;
  email: string;
  status: "invited" | "active" | "removed";
  invitedAt: string;
  joinedAt: string | null;
};

type OwnerClinic = {
  id: string;
  name: string;
  includedSeats: number;
  extraSeatPriceCents: number;
  currency: string;
  seatCount: number;
  extraSeats: number;
  extraSeatCostCents: number;
  members: Member[];
};

type Membership = { id: string; clinicName: string; ownerName: string; invitedAt: string };

type State =
  | { role: "none" }
  | { role: "invited"; membership: Membership }
  | { role: "active"; membership: Membership }
  | { role: "owner"; clinic: OwnerClinic };

const STATUS_STYLE: Record<string, string> = {
  active: "text-sage-700 bg-sage-50 border-sage-200",
  invited: "text-amber-700 bg-amber-50 border-amber-200",
};

export default function TeamBillingCard() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<State>({ role: "none" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  function load() {
    fetch("/api/therapist/clinic").then((r) => r.json()).then((d) => setState(d)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createClinic() {
    if (!clinicName.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/therapist/clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clinicName.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Couldn't create clinic."); return; }
      setShowCreate(false);
      setClinicName("");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function respondInvite(membershipId: string, accept: boolean) {
    setBusy(true);
    try {
      await fetch(`/api/therapist/clinic/invite/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/therapist/clinic/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Couldn't send invite."); return; }
      setInviteEmail("");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(membershipId: string) {
    setBusy(true);
    try {
      await fetch(`/api/therapist/clinic/members/${membershipId}`, { method: "DELETE" });
      load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="h-24 bg-stone-100 rounded-xl animate-pulse" />;
  }

  if (state.role === "none") {
    return (
      <div className="bg-white border border-stone-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-stone-900 mb-1">Team billing</h3>
        <p className="text-xs text-stone-400 mb-3">Running a clinic? Group multiple therapists under one billing account.</p>
        {showCreate ? (
          <div className="flex items-center gap-2">
            <input
              type="text" value={clinicName} onChange={(e) => setClinicName(e.target.value)}
              placeholder="Clinic name"
              className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
            />
            <button onClick={createClinic} disabled={busy} className="text-xs font-medium bg-stone-900 text-white px-3 py-2 rounded-lg hover:bg-stone-800 disabled:opacity-50">
              {busy ? "Creating…" : "Create"}
            </button>
            <button onClick={() => setShowCreate(false)} className="text-xs text-stone-400 hover:text-stone-600">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setShowCreate(true)} className="text-xs font-medium bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors">
            Set up team billing
          </button>
        )}
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  if (state.role === "invited") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-stone-900 mb-1">Clinic invite</h3>
        <p className="text-sm text-stone-700 mb-3">
          <span className="font-medium">{state.membership.ownerName}</span> invited you to join <span className="font-medium">{state.membership.clinicName}</span>.
        </p>
        <div className="flex gap-2">
          <button onClick={() => respondInvite(state.membership.id, true)} disabled={busy} className="text-xs font-medium bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 disabled:opacity-50">
            Accept
          </button>
          <button onClick={() => respondInvite(state.membership.id, false)} disabled={busy} className="text-xs font-medium border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-white">
            Decline
          </button>
        </div>
      </div>
    );
  }

  if (state.role === "active") {
    return (
      <div className="bg-white border border-stone-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-stone-900 mb-1">Team billing</h3>
        <p className="text-sm text-stone-600">
          You&apos;re a member of <span className="font-medium text-stone-900">{state.membership.clinicName}</span>, owned by {state.membership.ownerName}.
        </p>
      </div>
    );
  }

  // role === "owner"
  const c = state.clinic;
  const activeMembers = c.members.filter((m) => m.status !== "removed");
  return (
    <div className="bg-white border border-stone-100 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-900">{c.name}</h3>
        <span className="text-xs text-stone-400">{c.seatCount} seat{c.seatCount === 1 ? "" : "s"} · {c.includedSeats} included</span>
      </div>

      {c.extraSeats > 0 && (
        <div className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 text-xs text-stone-600">
          {c.extraSeats} extra seat{c.extraSeats === 1 ? "" : "s"} × {formatCents(c.extraSeatPriceCents, c.currency)} = <span className="font-semibold">{formatCents(c.extraSeatCostCents, c.currency)}</span>/mo
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-stone-500 px-1">
          <span className="flex-1">Owner (you)</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border text-stone-500 bg-stone-50 border-stone-200">Owner</span>
        </div>
        {activeMembers.map((m) => (
          <div key={m.id} className="flex items-center gap-2 px-1">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-800 truncate">{m.name}</p>
              <p className="text-xs text-stone-400 truncate">{m.email}</p>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[m.status]}`}>{m.status}</span>
            <button onClick={() => removeMember(m.id)} disabled={busy} className="text-stone-300 hover:text-red-500 transition-colors">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
        <input
          type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="Invite a therapist by email"
          className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
        />
        <button onClick={sendInvite} disabled={busy} className="text-xs font-medium bg-stone-900 text-white px-3 py-2 rounded-lg hover:bg-stone-800 disabled:opacity-50">
          Invite
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
