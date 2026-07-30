import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { authorizeGroupSessionParticipant } from "@/lib/groupSessionAuth";
import { getActiveParticipants } from "@/lib/groupSession";

// Scaled up from the 1:1 route's 200 — up to 15 pairwise links at the default 6-person
// cap (28 at the 8-person hard cap) generate proportionally more offer/answer/candidate
// traffic than a single pair ever would.
const MAX_SIGNALS_PER_SESSION = 2000;
const MAX_SDP_PAYLOAD_CHARS = 20_000;
const MAX_CANDIDATE_PAYLOAD_CHARS = 2_000;

const signalSchema = z.object({
  recipientId: z.string(),
  type: z.enum(["offer", "answer", "ice_candidate"]),
  payload: z.unknown(),
});

export async function GET(
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

  const pending = await db.groupSessionSignal.findMany({
    where: { groupSessionId: sessionId, recipientId: userId, deliveredAt: null },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  if (pending.length > 0) {
    await db.groupSessionSignal.updateMany({
      where: { id: { in: pending.map((s) => s.id) } },
      data: { deliveredAt: new Date() },
    });
  }

  // Exclude the caller — same contract as the join route's `participants` field.
  // The client's roster diff compares "myself" against each entry by joinedAt/userId
  // to decide who should offer to whom, and that comparison is only meaningful for
  // genuinely other participants.
  const participants = (await getActiveParticipants(sessionId)).filter((p) => p.userId !== userId);

  return NextResponse.json({
    signals: pending.map((s) => ({ id: s.id, senderId: s.senderId, type: s.type, payload: s.payload, createdAt: s.createdAt })),
    sessionStatus: authz.session.status,
    participants: participants.map((p) => ({ userId: p.userId, name: p.name, joinedAt: p.joinedAt })),
  });
}

export async function POST(
  req: NextRequest,
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

  const body = await req.json().catch(() => null);
  const parsed = signalSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_signal" }, { status: 400 });
  const { recipientId, type, payload } = parsed.data;

  const participants = await getActiveParticipants(sessionId);
  if (!participants.some((p) => p.userId === recipientId)) {
    return NextResponse.json({ error: "recipient_not_active" }, { status: 400 });
  }

  const payloadSize = JSON.stringify(payload ?? null).length;
  const maxSize = type === "ice_candidate" ? MAX_CANDIDATE_PAYLOAD_CHARS : MAX_SDP_PAYLOAD_CHARS;
  if (payloadSize > maxSize) return NextResponse.json({ error: "payload_too_large" }, { status: 400 });

  const count = await db.groupSessionSignal.count({ where: { groupSessionId: sessionId } });
  if (count >= MAX_SIGNALS_PER_SESSION) {
    return NextResponse.json({ error: "too_many_signals" }, { status: 429 });
  }

  const row = await db.groupSessionSignal.create({
    data: {
      groupSessionId: sessionId, senderId: userId, recipientId, type,
      payload: (payload ?? null) as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ ok: true, id: row.id });
}
