import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { MAX_GROUP_PARTICIPANTS_HARD_CAP } from "@/lib/groupSession";

const createSchema = z.object({
  scheduledStart: z.string().refine((v) => !isNaN(new Date(v).getTime()), { message: "Invalid date" }),
  durationMin: z.number().int().min(15).max(180).default(50),
  // No upper bound here on purpose — the route clamps to the hard cap below rather
  // than rejecting an over-ambitious request outright.
  maxParticipants: z.number().int().min(2).default(6),
});

async function getTherapistId(userId: string) {
  const t = await db.therapist.findUnique({ where: { userId }, select: { id: true } });
  return t?.id ?? null;
}

async function ownsGroup(therapistId: string, groupId: string) {
  const g = await db.therapistGroup.findUnique({ where: { id: groupId }, select: { therapistId: true } });
  return g?.therapistId === therapistId;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapistId = await getTherapistId(session.user.id);
  if (!therapistId) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const { id } = await params;
  if (!(await ownsGroup(therapistId, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sessions = await db.groupSession.findMany({
    where: { therapistGroupId: id },
    orderBy: { scheduledStart: "desc" },
    include: { _count: { select: { rsvps: true, participants: true } } },
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id, scheduledStart: s.scheduledStart, durationMin: s.durationMin,
      maxParticipants: s.maxParticipants, status: s.status, endedAt: s.endedAt,
      rsvpCount: s._count.rsvps, createdAt: s.createdAt,
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapistId = await getTherapistId(session.user.id);
  if (!therapistId) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const { id } = await params;
  if (!(await ownsGroup(therapistId, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const groupSession = await db.groupSession.create({
    data: {
      therapistGroupId: id,
      hostUserId: session.user.id,
      scheduledStart: new Date(parsed.data.scheduledStart),
      durationMin: parsed.data.durationMin,
      maxParticipants: Math.min(parsed.data.maxParticipants, MAX_GROUP_PARTICIPANTS_HARD_CAP),
    },
  });

  return NextResponse.json({ ok: true, session: groupSession }, { status: 201 });
}
