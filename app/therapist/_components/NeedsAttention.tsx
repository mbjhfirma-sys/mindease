"use client";

import Link from "next/link";
import { AlertTriangle, Calendar, Moon, Flag } from "lucide-react";
import { SeverityBadge } from "@/components/SeverityBadge";

export type AttentionRiskFlag = {
  id: string; clientId: string; clientName: string; source: string;
  severity: "high" | "moderate"; detail: string; createdAt: string;
};
export type AttentionBooking = {
  id: string; date: string; duration: number; type: string;
  client: { id: string; name: string };
};
export type AttentionInactiveClient = { id: string; name: string; lastSessionLabel: string };
export type AttentionCommunityFlag = {
  id: string; groupId: string; groupName: string; authorName: string; content: string; createdAt: string;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NeedsAttention({
  riskFlags, bookings, inactiveClients, communityFlags,
  onAcknowledgeFlag, ackBusyId, onAcceptBooking, onDeclineBooking,
}: {
  riskFlags: AttentionRiskFlag[];
  bookings: AttentionBooking[];
  inactiveClients: AttentionInactiveClient[];
  communityFlags: AttentionCommunityFlag[];
  onAcknowledgeFlag: (id: string) => void;
  ackBusyId: string | null;
  onAcceptBooking: (id: string) => void;
  onDeclineBooking: (id: string) => void;
}) {
  const empty = riskFlags.length === 0 && bookings.length === 0 && inactiveClients.length === 0 && communityFlags.length === 0;

  if (empty) {
    return <div className="py-10 text-center text-sm text-stone-400">You&rsquo;re all caught up.</div>;
  }

  return (
    <div>
      {riskFlags.map((f) => (
        <div key={f.id} className="flex items-center gap-3 px-4 py-3 border-t border-stone-50 first:border-t-0">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0"><AlertTriangle size={15} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-stone-800">
              <Link href={`/therapist/clients/${f.clientId}`} className="hover:underline">{f.clientName}</Link>
              <SeverityBadge severity={f.severity} className="ml-2" />
            </div>
            <div className="text-xs text-stone-400 mt-0.5">{f.detail} &middot; {fmtDate(f.createdAt)}</div>
          </div>
          <button
            onClick={() => onAcknowledgeFlag(f.id)}
            disabled={ackBusyId === f.id}
            className="text-xs border border-stone-200 bg-white text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            Acknowledge
          </button>
        </div>
      ))}

      {bookings.map((b) => (
        <div key={b.id} className="flex items-center gap-3 px-4 py-3 border-t border-stone-50 first:border-t-0">
          <div className="w-8 h-8 rounded-lg bg-sage-50 text-sage-700 flex items-center justify-center flex-shrink-0"><Calendar size={15} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-stone-800"><span className="font-semibold">{b.client.name}</span> requested {b.type.replace("_", " ")}</div>
            <div className="text-xs text-stone-400 mt-0.5">{fmtDate(b.date)} &middot; {b.duration} min</div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={() => onDeclineBooking(b.id)} className="text-xs border border-stone-200 text-stone-500 px-2.5 py-1.5 rounded-lg hover:bg-stone-50 transition-colors">Decline</button>
            <button onClick={() => onAcceptBooking(b.id)} className="text-xs bg-sage-600 text-white px-2.5 py-1.5 rounded-lg font-medium hover:bg-sage-700 transition-colors">Accept</button>
          </div>
        </div>
      ))}

      {inactiveClients.map((c) => (
        <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-t border-stone-50 first:border-t-0">
          <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-500 flex items-center justify-center flex-shrink-0"><Moon size={15} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-stone-800"><span className="font-semibold">{c.name}</span> has gone quiet</div>
            <div className="text-xs text-stone-400 mt-0.5">Last session {c.lastSessionLabel}</div>
          </div>
          <Link href={`/therapist/messages`} className="text-xs border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors flex-shrink-0">Message</Link>
        </div>
      ))}

      {communityFlags.map((f) => (
        <div key={f.id} className="flex items-center gap-3 px-4 py-3 border-t border-stone-50 first:border-t-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0"><Flag size={15} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-stone-800">Post flagged in <span className="font-semibold">{f.groupName}</span></div>
            <div className="text-xs text-stone-400 mt-0.5 truncate">{f.content}</div>
          </div>
          <Link href="/therapist/community" className="text-xs border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors flex-shrink-0">Review</Link>
        </div>
      ))}
    </div>
  );
}
