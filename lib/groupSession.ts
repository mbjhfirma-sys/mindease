import { db } from "@/lib/db";

// A "small support circle" size — keeps mesh WebRTC bandwidth (up to N-1 upstream +
// N-1 downstream streams per client) and connection-failure surface manageable. The
// server always clamps to the hard cap regardless of what a host requests at creation.
export const MAX_GROUP_PARTICIPANTS_DEFAULT = 6;
export const MAX_GROUP_PARTICIPANTS_HARD_CAP = 8;

export type ActiveParticipant = { userId: string; name: string; joinedAt: Date };

// The roster query shared by join/leave/signal routes — the single source of truth
// for "who's actually here," rather than trusting a client-reported or broadcast
// presence signal.
export async function getActiveParticipants(groupSessionId: string): Promise<ActiveParticipant[]> {
  const rows = await db.groupSessionParticipant.findMany({
    where: { groupSessionId, leftAt: null },
    select: { userId: true, joinedAt: true, user: { select: { name: true } } },
    orderBy: { joinedAt: "asc" },
  });
  return rows.map((r) => ({ userId: r.userId, name: r.user.name, joinedAt: r.joinedAt }));
}
