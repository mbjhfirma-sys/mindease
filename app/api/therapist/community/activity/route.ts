import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const LIMIT = 20;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const groups = await db.therapistGroup.findMany({ where: { therapistId: therapist.id }, select: { id: true, name: true } });
  const groupIds = groups.map((g) => g.id);
  const groupNameById = new Map(groups.map((g) => [g.id, g.name]));

  if (groupIds.length === 0) return NextResponse.json({ activity: [] });

  const [posts, replies, memberships] = await Promise.all([
    db.therapistGroupPost.findMany({
      where: { groupId: { in: groupIds }, authorId: { not: session.user.id } },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      select: { id: true, groupId: true, content: true, createdAt: true, author: { select: { name: true } } },
    }),
    db.therapistGroupPostReply.findMany({
      where: { post: { groupId: { in: groupIds } }, authorId: { not: session.user.id } },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      select: {
        id: true, content: true, createdAt: true,
        author: { select: { name: true } },
        post: { select: { groupId: true } },
      },
    }),
    db.therapistGroupMembership.findMany({
      where: { groupId: { in: groupIds } },
      orderBy: { joinedAt: "desc" },
      take: LIMIT,
      select: { id: true, groupId: true, joinedAt: true, client: { select: { name: true } } },
    }),
  ]);

  const activity = [
    ...posts.map((p) => ({
      id: `post-${p.id}`,
      type: "post" as const,
      groupId: p.groupId,
      groupName: groupNameById.get(p.groupId) ?? "",
      authorName: p.author.name,
      content: p.content,
      createdAt: p.createdAt,
    })),
    ...replies.map((r) => ({
      id: `reply-${r.id}`,
      type: "reply" as const,
      groupId: r.post.groupId,
      groupName: groupNameById.get(r.post.groupId) ?? "",
      authorName: r.author.name,
      content: r.content,
      createdAt: r.createdAt,
    })),
    ...memberships.map((m) => ({
      id: `join-${m.id}`,
      type: "join" as const,
      groupId: m.groupId,
      groupName: groupNameById.get(m.groupId) ?? "",
      authorName: m.client.name,
      content: null,
      createdAt: m.joinedAt,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, LIMIT);

  return NextResponse.json({ activity });
}
