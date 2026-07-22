import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const inviteSchema = z.object({
  clientIds: z.array(z.string()).min(1),
});

const removeSchema = z.object({
  clientId: z.string(),
});

async function getTherapistId(userId: string) {
  const t = await db.therapist.findUnique({ where: { userId }, select: { id: true } });
  return t?.id ?? null;
}

async function ownsGroup(therapistId: string, groupId: string) {
  const g = await db.therapistGroup.findUnique({ where: { id: groupId }, select: { therapistId: true } });
  return g?.therapistId === therapistId;
}

// GET /api/therapist/community/[id]/members — list members and pending invites
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapistId = await getTherapistId(session.user.id);
  if (!therapistId) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const { id } = await params;
  if (!(await ownsGroup(therapistId, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [memberships, invites] = await Promise.all([
    db.therapistGroupMembership.findMany({
      where: { groupId: id },
      include: { client: { select: { id: true, name: true, avatar: true, email: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    db.therapistGroupInvite.findMany({
      where: { groupId: id },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { sentAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    members: memberships.map((m) => ({ ...m.client, joinedAt: m.joinedAt })),
    invites: invites.map((i) => ({
      clientId: i.clientId,
      clientName: i.client.name,
      sentAt: i.sentAt,
      accepted: i.accepted,
    })),
  });
}

// POST /api/therapist/community/[id]/members — send invites to clients
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapistId = await getTherapistId(session.user.id);
  if (!therapistId) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const { id } = await params;
  if (!(await ownsGroup(therapistId, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const ownedClients = await db.user.findMany({
    where: { id: { in: parsed.data.clientIds }, therapistId: therapistId },
    select: { id: true },
  });
  const ownedClientIds = new Set(ownedClients.map((c) => c.id));
  const invalidIds = parsed.data.clientIds.filter((cid) => !ownedClientIds.has(cid));
  if (invalidIds.length > 0) {
    return NextResponse.json({ error: "Some users are not your clients" }, { status: 403 });
  }

  await db.$transaction(
    parsed.data.clientIds.map((clientId) =>
      db.therapistGroupInvite.upsert({
        where: { groupId_clientId: { groupId: id, clientId } },
        update: { sentAt: new Date() },
        create: { groupId: id, clientId },
      })
    )
  );

  return NextResponse.json({ ok: true, invited: parsed.data.clientIds.length });
}

// DELETE /api/therapist/community/[id]/members — remove a member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapistId = await getTherapistId(session.user.id);
  if (!therapistId) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const { id } = await params;
  if (!(await ownsGroup(therapistId, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = removeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await db.therapistGroupMembership.deleteMany({
    where: { groupId: id, clientId: parsed.data.clientId },
  });

  return NextResponse.json({ ok: true });
}
