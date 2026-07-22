import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { peerMatchingOptIn: true, groupMemberships: { select: { groupId: true } } },
  });
  if (!me?.peerMatchingOptIn) {
    return NextResponse.json({ error: "Opt in to peer matching in Settings to see matches" }, { status: 403 });
  }

  const myGroupIds = me.groupMemberships.map((m) => m.groupId);
  if (myGroupIds.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  const memberships = await db.groupMembership.findMany({
    where: {
      groupId: { in: myGroupIds },
      userId: { not: session.user.id },
      user: { peerMatchingOptIn: true },
    },
    select: {
      userId: true,
      user: { select: { id: true, name: true, avatar: true } },
      group: { select: { id: true, name: true } },
    },
  });

  const byUser = new Map<string, { id: string; name: string; avatar: string | null; sharedGroups: { id: string; name: string }[] }>();
  for (const m of memberships) {
    const existing = byUser.get(m.userId);
    if (existing) {
      existing.sharedGroups.push(m.group);
    } else {
      byUser.set(m.userId, { id: m.user.id, name: m.user.name, avatar: m.user.avatar, sharedGroups: [m.group] });
    }
  }

  const matches = [...byUser.values()].sort((a, b) => b.sharedGroups.length - a.sharedGroups.length);

  return NextResponse.json({ matches });
}
