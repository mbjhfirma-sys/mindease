import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { authorizeVideoParticipant } from "@/lib/videoAuth";

const MAX_SIGNALS_PER_APPOINTMENT = 200;
const MAX_SDP_PAYLOAD_CHARS = 20_000;
const MAX_CANDIDATE_PAYLOAD_CHARS = 2_000;

const signalSchema = z.object({
  type: z.enum(["offer", "answer", "ice_candidate"]),
  payload: z.unknown(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { appointmentId } = await params;
  const authz = await authorizeVideoParticipant(appointmentId, session.user.id);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.status === 404 ? "Not found" : "Forbidden" }, { status: authz.status });
  }
  const { role } = authz;
  const userId = session.user.id;

  const videoSession = await db.videoSession.findUnique({ where: { appointmentId } });
  if (!videoSession) {
    return NextResponse.json({ signals: [], sessionStatus: "open", endedReason: null, otherJoined: false });
  }

  const otherJoined =
    role === "offerer"
      ? !!videoSession.clientJoinedAt && !videoSession.clientLeftAt
      : !!videoSession.therapistJoinedAt && !videoSession.therapistLeftAt;

  const pending = await db.videoSignal.findMany({
    where: { appointmentId, senderId: { not: userId }, deliveredAt: null },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  if (pending.length > 0) {
    await db.videoSignal.updateMany({
      where: { id: { in: pending.map((s) => s.id) } },
      data: { deliveredAt: new Date() },
    });
  }

  return NextResponse.json({
    signals: pending.map((s) => ({ id: s.id, type: s.type, payload: s.payload, createdAt: s.createdAt })),
    sessionStatus: videoSession.status,
    endedReason: videoSession.endedReason,
    otherJoined,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { appointmentId } = await params;
  const authz = await authorizeVideoParticipant(appointmentId, session.user.id);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.status === 404 ? "Not found" : "Forbidden" }, { status: authz.status });
  }
  const { role } = authz;
  const userId = session.user.id;

  const videoSession = await db.videoSession.findUnique({ where: { appointmentId } });
  if (!videoSession) return NextResponse.json({ error: "not_joined" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = signalSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_signal" }, { status: 400 });
  const { type, payload } = parsed.data;

  if (type === "offer" && role !== "offerer") return NextResponse.json({ error: "not_offerer" }, { status: 403 });
  if (type === "answer" && role !== "answerer") return NextResponse.json({ error: "not_answerer" }, { status: 403 });

  const payloadSize = JSON.stringify(payload ?? null).length;
  const maxSize = type === "ice_candidate" ? MAX_CANDIDATE_PAYLOAD_CHARS : MAX_SDP_PAYLOAD_CHARS;
  if (payloadSize > maxSize) return NextResponse.json({ error: "payload_too_large" }, { status: 400 });

  const count = await db.videoSignal.count({ where: { appointmentId } });
  if (count >= MAX_SIGNALS_PER_APPOINTMENT) {
    return NextResponse.json({ error: "too_many_signals" }, { status: 429 });
  }

  const row = await db.videoSignal.create({
    data: { appointmentId, senderId: userId, type, payload: (payload ?? null) as Prisma.InputJsonValue },
  });

  return NextResponse.json({ ok: true, id: row.id });
}
