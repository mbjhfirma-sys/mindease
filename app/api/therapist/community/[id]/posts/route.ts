import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const postSchema = z.object({
  content: z.string().min(1).max(1000),
});

async function assertGroupAccess(groupId: string, userId: string) {
  const group = await db.therapistGroup.findUnique({
    where: { id: groupId },
    include: { therapist: { select: { userId: true } } },
  });
  if (!group) return { group: null, isOwner: false };
  const isOwner = group.therapist.userId === userId;
  if (!isOwner) {
    const member = await db.therapistGroupMembership.findUnique({
      where: { groupId_clientId: { groupId, clientId: userId } },
      select: { id: true },
    });
    if (!member) return { group: null, isOwner: false };
  }
  return { group, isOwner };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { group } = await assertGroupAccess(id, session.user.id);
  if (!group) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  const posts = await db.therapistGroupPost.findMany({
    where: { groupId: id },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      likes: { select: { userId: true } },
      _count: { select: { replies: true } },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: parseInt(req.nextUrl.searchParams.get("limit") ?? "50"),
  });

  const userId = session.user.id;
  const formatted = posts.map((p) => ({
    id: p.id,
    groupId: p.groupId,
    author: p.author.name,
    authorId: p.author.id,
    content: p.content,
    pinned: p.pinned,
    flagged: p.flagged,
    likes: p.likes.length,
    liked: p.likes.some((l) => l.userId === userId),
    replyCount: p._count.replies,
    createdAt: p.createdAt,
  }));

  return NextResponse.json({ posts: formatted });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { group, isOwner } = await assertGroupAccess(id, session.user.id);
  if (!group) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  // Only the therapist who owns the group can post
  if (!isOwner) return NextResponse.json({ error: "Only the therapist can post" }, { status: 403 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const post = await db.therapistGroupPost.create({
    data: { groupId: id, authorId: session.user.id, content: parsed.data.content },
  });

  return NextResponse.json({ ok: true, post }, { status: 201 });
}
