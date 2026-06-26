import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const joinSchema = z.object({
  groupId: z.string(),
  action: z.enum(["join", "leave"]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const groups = await db.supportGroup.findMany({
    include: {
      memberships: { select: { userId: true } },
      _count: { select: { memberships: true, posts: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const formatted = groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    category: g.category,
    icon: g.icon,
    color: g.color,
    nextSession: g.nextSession,
    members: g._count.memberships,
    joined: g.memberships.some((m) => m.userId === userId),
  }));

  return NextResponse.json({ groups: formatted });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { groupId, action } = parsed.data;
  const userId = session.user.id;

  if (action === "join") {
    await db.groupMembership.upsert({
      where: { userId_groupId: { userId, groupId } },
      update: {},
      create: { userId, groupId },
    });
  } else {
    await db.groupMembership.deleteMany({ where: { userId, groupId } });
  }

  return NextResponse.json({ ok: true });
}
