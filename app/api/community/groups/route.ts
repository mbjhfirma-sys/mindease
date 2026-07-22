import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const joinSchema = z.object({
  groupId: z.string(),
  action: z.enum(["join", "leave"]),
  source: z.enum(["support", "therapist"]).default("support"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const [supportGroups, therapistGroups] = await Promise.all([
    db.supportGroup.findMany({
      include: {
        memberships: { select: { userId: true } },
        _count: { select: { memberships: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.therapistGroup.findMany({
      where: { privacy: "open", status: "active" },
      include: {
        memberships: { select: { clientId: true } },
        _count: { select: { memberships: true } },
        therapist: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const formatted = [
    ...supportGroups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      category: g.category,
      icon: g.icon,
      color: g.color ?? "",
      nextSession: g.nextSession ?? null,
      members: g._count.memberships,
      joined: g.memberships.some((m) => m.userId === userId),
      source: "support" as const,
      createdByName: null,
    })),
    ...therapistGroups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description ?? "",
      category: g.category,
      icon: g.icon,
      color: "",
      nextSession: null,
      members: g._count.memberships,
      joined: g.memberships.some((m) => m.clientId === userId),
      source: "therapist" as const,
      createdByName: g.therapist.user.name,
    })),
  ];

  return NextResponse.json({ groups: formatted });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { groupId, action, source } = parsed.data;
  const userId = session.user.id;

  if (source === "therapist") {
    // Verify the group is open
    const group = await db.therapistGroup.findUnique({
      where: { id: groupId },
      select: { privacy: true, status: true },
    });
    if (!group || group.privacy !== "open" || group.status !== "active") {
      return NextResponse.json({ error: "Group not available" }, { status: 403 });
    }

    if (action === "join") {
      await db.therapistGroupMembership.upsert({
        where: { groupId_clientId: { groupId, clientId: userId } },
        update: {},
        create: { groupId, clientId: userId },
      });
    } else {
      await db.therapistGroupMembership.deleteMany({
        where: { groupId, clientId: userId },
      });
    }
  } else {
    if (action === "join") {
      await db.groupMembership.upsert({
        where: { userId_groupId: { userId, groupId } },
        update: {},
        create: { userId, groupId },
      });
    } else {
      await db.groupMembership.deleteMany({ where: { userId, groupId } });
    }
  }

  return NextResponse.json({ ok: true });
}
