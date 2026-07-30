import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { authorizeGroupSessionParticipant } from "@/lib/groupSessionAuth";
import { getActiveParticipants } from "@/lib/groupSession";
import { getJoinWindow } from "@/lib/video";
import { planById } from "@/lib/clientPlans";

const STUN_ICE_SERVERS = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const auth_ = await auth();
  if (!auth_?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = auth_.user.id;

  const { sessionId } = await params;
  const authz = await authorizeGroupSessionParticipant(sessionId, userId);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.status === 404 ? "Not found" : "Forbidden" }, { status: authz.status });
  }
  const { session: groupSession, isHost } = authz;

  if (!isHost && auth_.user.role === "CLIENT") {
    const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true } });
    if (!planById(user?.plan).features.liveGroupSessions) {
      return NextResponse.json({ error: "plan_required" }, { status: 403 });
    }
  }

  if (groupSession.status !== "scheduled") {
    return NextResponse.json({ error: "session_not_active" }, { status: 403 });
  }

  const window = getJoinWindow(groupSession.scheduledStart, groupSession.durationMin);
  const now = new Date();
  if (now < window.opensAt) {
    return NextResponse.json({ error: "join_window_not_open", opensAt: window.opensAt, closesAt: window.closesAt }, { status: 403 });
  }
  if (now > window.closesAt) {
    return NextResponse.json({ error: "join_window_closed", opensAt: window.opensAt, closesAt: window.closesAt }, { status: 403 });
  }

  const active = await getActiveParticipants(sessionId);
  const alreadyIn = active.some((p) => p.userId === userId);
  if (!alreadyIn && !isHost && active.length >= groupSession.maxParticipants) {
    return NextResponse.json({ error: "session_full" }, { status: 403 });
  }

  // A redundant join call from someone already active (e.g. React Strict Mode's
  // double-invoked mount effect calling this route twice) must not reset joinedAt —
  // doing so would shift their effective join-order and could flip the deterministic
  // "who offers to whom" decision other participants compute against them. Only a
  // genuine (re)join — brand new, or coming back after having left — updates it.
  const self = alreadyIn
    ? await db.groupSessionParticipant.findUniqueOrThrow({
        where: { groupSessionId_userId: { groupSessionId: sessionId, userId } },
      })
    : await db.groupSessionParticipant.upsert({
        where: { groupSessionId_userId: { groupSessionId: sessionId, userId } },
        update: { leftAt: null, joinedAt: now },
        create: { groupSessionId: sessionId, userId, joinedAt: now },
      });

  const participants = (await getActiveParticipants(sessionId)).filter((p) => p.userId !== userId);

  return NextResponse.json({
    selfUserId: userId,
    selfJoinedAt: self.joinedAt,
    isHost,
    iceServers: STUN_ICE_SERVERS,
    participants: participants.map((p) => ({ userId: p.userId, name: p.name, joinedAt: p.joinedAt })),
  });
}
