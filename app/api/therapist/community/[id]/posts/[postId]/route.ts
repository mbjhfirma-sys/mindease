import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const patchSchema = z.object({
  pinned: z.boolean().optional(),
  flagged: z.boolean().optional(),
  content: z.string().min(1).max(1000).optional(),
});

const likeSchema = z.object({
  action: z.enum(["like", "unlike"]),
});

const replySchema = z.object({
  content: z.string().min(1).max(500),
});

async function getTherapistUserId(groupId: string) {
  const g = await db.therapistGroup.findUnique({
    where: { id: groupId },
    include: { therapist: { select: { userId: true } } },
  });
  return g?.therapist.userId ?? null;
}

// GET — list replies to a post (any member or the owning therapist)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId, postId } = await params;
  const post = await db.therapistGroupPost.findUnique({ where: { id: postId } });
  if (!post || post.groupId !== groupId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = session.user.id;
  const therapistUserId = await getTherapistUserId(groupId);
  if (userId !== therapistUserId) {
    const member = await db.therapistGroupMembership.findUnique({
      where: { groupId_clientId: { groupId, clientId: userId } },
    });
    if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const replies = await db.therapistGroupPostReply.findMany({
    where: { postId },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      likes: { select: { userId: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    replies: replies.map((r) => ({
      id: r.id,
      author: r.author.name,
      authorId: r.author.id,
      content: r.content,
      createdAt: r.createdAt,
      likes: r.likes.length,
      liked: r.likes.some((l) => l.userId === userId),
    })),
  });
}

// PATCH — pin/flag/edit a post (therapist only), or like/unlike (any member)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId, postId } = await params;
  const post = await db.therapistGroupPost.findUnique({ where: { id: postId } });
  if (!post || post.groupId !== groupId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Like/unlike action — members and therapist only
  const likeResult = likeSchema.safeParse(body);
  if (likeResult.success) {
    const { action } = likeResult.data;
    const userId = session.user.id;
    const likeTherapistId = await getTherapistUserId(groupId);
    if (userId !== likeTherapistId) {
      const likeMember = await db.therapistGroupMembership.findUnique({
        where: { groupId_clientId: { groupId, clientId: userId } },
      });
      if (!likeMember) return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }
    if (action === "like") {
      await db.therapistGroupPostLike.upsert({
        where: { postId_userId: { postId, userId } },
        update: {},
        create: { postId, userId },
      });
    } else {
      await db.therapistGroupPostLike.deleteMany({ where: { postId, userId } });
    }
    return NextResponse.json({ ok: true });
  }

  // Pin/flag/edit — therapist only
  const therapistUserId = await getTherapistUserId(groupId);
  if (session.user.id !== therapistUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await db.therapistGroupPost.update({ where: { id: postId }, data: parsed.data });
  return NextResponse.json({ ok: true, post: updated });
}

// POST — add a reply (any member or therapist)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId, postId } = await params;
  const post = await db.therapistGroupPost.findUnique({ where: { id: postId } });
  if (!post || post.groupId !== groupId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const replyAuthorId = session.user.id;
  const replyGroupTherapistId = await getTherapistUserId(groupId);
  if (replyAuthorId !== replyGroupTherapistId) {
    const replyMember = await db.therapistGroupMembership.findUnique({
      where: { groupId_clientId: { groupId, clientId: replyAuthorId } },
    });
    if (!replyMember) return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const reply = await db.therapistGroupPostReply.create({
    data: { postId, authorId: replyAuthorId, content: parsed.data.content },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });

  return NextResponse.json({
    ok: true,
    reply: {
      id: reply.id,
      author: reply.author.name,
      authorId: reply.author.id,
      content: reply.content,
      createdAt: reply.createdAt,
    },
  }, { status: 201 });
}

// DELETE — delete a post (therapist only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId, postId } = await params;
  const therapistUserId = await getTherapistUserId(groupId);
  if (session.user.id !== therapistUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const post = await db.therapistGroupPost.findUnique({ where: { id: postId } });
  if (!post || post.groupId !== groupId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.therapistGroupPost.delete({ where: { id: postId } });
  return NextResponse.json({ ok: true });
}
