import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
  category: z.string().optional(),
  icon: z.string().optional(),
  privacy: z.enum(["open", "invite"]).optional(),
  status: z.enum(["active", "archived"]).optional(),
});

async function getTherapistId(userId: string) {
  const t = await db.therapist.findUnique({ where: { userId }, select: { id: true } });
  return t?.id ?? null;
}

async function ownsGroup(therapistId: string, groupId: string) {
  const g = await db.therapistGroup.findUnique({ where: { id: groupId }, select: { therapistId: true } });
  return g?.therapistId === therapistId;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const group = await db.therapistGroup.findUnique({
    where: { id },
    include: {
      therapist: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { memberships: true, posts: true } },
    },
  });

  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Members can view — therapist who owns it or their clients
  const isOwner = group.therapist.userId === session.user.id;
  const isMember = !isOwner && await db.therapistGroupMembership.findUnique({
    where: { groupId_clientId: { groupId: id, clientId: session.user.id } },
    select: { id: true },
  });

  if (!isOwner && !isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      category: group.category,
      icon: group.icon,
      privacy: group.privacy,
      status: group.status,
      memberCount: group._count.memberships,
      postCount: group._count.posts,
      createdAt: group.createdAt,
      isOwner,
      createdByName: group.therapist.user.name,
    },
  });
}

export async function PATCH(
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const group = await db.therapistGroup.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ok: true, group });
}

export async function DELETE(
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

  await db.therapistGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
