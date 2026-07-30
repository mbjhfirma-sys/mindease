import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { planById } from "@/lib/clientPlans";

const rsvpSchema = z.object({
  groupSessionId: z.string(),
  action: z.enum(["rsvp", "cancel_rsvp"]),
});

async function canView(groupId: string, userId: string) {
  const group = await db.therapistGroup.findUnique({ where: { id: groupId }, select: { therapist: { select: { userId: true } } } });
  if (!group) return false;
  if (group.therapist.userId === userId) return true;
  const membership = await db.therapistGroupMembership.findUnique({
    where: { groupId_clientId: { groupId, clientId: userId } },
  });
  return !!membership;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await canView(id, session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sessions = await db.groupSession.findMany({
    where: { therapistGroupId: id, status: "scheduled" },
    orderBy: { scheduledStart: "asc" },
    include: {
      _count: { select: { rsvps: true } },
      rsvps: { where: { userId: session.user.id }, select: { id: true } },
    },
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id, scheduledStart: s.scheduledStart, durationMin: s.durationMin,
      maxParticipants: s.maxParticipants, rsvpCount: s._count.rsvps,
      hasRsvped: s.rsvps.length > 0,
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await canView(id, session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { groupSessionId, action } = parsed.data;
  const groupSession = await db.groupSession.findUnique({ where: { id: groupSessionId } });
  if (!groupSession || groupSession.therapistGroupId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "rsvp" && session.user.role === "CLIENT") {
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
    if (!planById(user?.plan).features.liveGroupSessions) {
      return NextResponse.json({ error: "plan_required" }, { status: 403 });
    }
  }

  if (action === "rsvp") {
    await db.groupSessionRsvp.upsert({
      where: { groupSessionId_userId: { groupSessionId, userId: session.user.id } },
      update: {},
      create: { groupSessionId, userId: session.user.id },
    });
  } else {
    await db.groupSessionRsvp.deleteMany({ where: { groupSessionId, userId: session.user.id } });
  }

  return NextResponse.json({ ok: true });
}
