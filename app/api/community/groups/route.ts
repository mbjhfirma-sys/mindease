import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const joinSchema = z.object({
  groupId: z.string(),
  action: z.enum(["join", "leave", "decline"]),
  source: z.enum(["support", "therapist"]).default("support"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const [supportGroups, therapistGroups, pendingInvites] = await Promise.all([
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
    db.therapistGroupInvite.findMany({
      where: { clientId: userId, accepted: false },
      include: {
        group: {
          include: {
            memberships: { select: { clientId: true } },
            _count: { select: { memberships: true } },
            therapist: { include: { user: { select: { name: true } } } },
          },
        },
      },
    }),
  ]);

  const invitedGroupIds = new Set(pendingInvites.map((i) => i.groupId));
  // Invite-only groups aren't in `therapistGroups` (that query is open-groups-only),
  // so surface them separately — but only ones still active and not yet joined.
  const inviteOnlyGroups = pendingInvites
    .map((i) => i.group)
    .filter((g) => g.status === "active" && g.privacy !== "open" && !g.memberships.some((m) => m.clientId === userId));

  const formatted = [
    ...supportGroups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      category: g.category,
      icon: g.icon,
      color: g.color ?? "",
      nextSession: g.nextSession ?? null,
      identityTags: g.identityTags,
      ageGroup: g.ageGroup,
      members: g._count.memberships,
      joined: g.memberships.some((m) => m.userId === userId),
      source: "support" as const,
      createdByName: null,
      privacy: "open" as const,
      invited: false,
    })),
    ...therapistGroups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description ?? "",
      category: g.category,
      icon: g.icon,
      color: "",
      nextSession: null,
      identityTags: g.identityTags,
      ageGroup: g.ageGroup,
      members: g._count.memberships,
      joined: g.memberships.some((m) => m.clientId === userId),
      source: "therapist" as const,
      createdByName: g.therapist.user.name,
      privacy: g.privacy,
      invited: invitedGroupIds.has(g.id),
    })),
    ...inviteOnlyGroups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description ?? "",
      category: g.category,
      icon: g.icon,
      color: "",
      nextSession: null,
      identityTags: g.identityTags,
      ageGroup: g.ageGroup,
      members: g._count.memberships,
      joined: false,
      source: "therapist" as const,
      createdByName: g.therapist.user.name,
      privacy: g.privacy,
      invited: true,
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
    const group = await db.therapistGroup.findUnique({
      where: { id: groupId },
      select: { privacy: true, status: true },
    });
    if (!group || group.status !== "active") {
      return NextResponse.json({ error: "Group not available" }, { status: 403 });
    }

    if (action === "decline") {
      await db.therapistGroupInvite.deleteMany({ where: { groupId, clientId: userId } });
      return NextResponse.json({ ok: true });
    }

    if (action === "join") {
      if (group.privacy !== "open") {
        const invite = await db.therapistGroupInvite.findUnique({
          where: { groupId_clientId: { groupId, clientId: userId } },
        });
        if (!invite) {
          return NextResponse.json({ error: "You need an invite to join this group" }, { status: 403 });
        }
        await db.therapistGroupInvite.update({ where: { id: invite.id }, data: { accepted: true } });
      }
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
