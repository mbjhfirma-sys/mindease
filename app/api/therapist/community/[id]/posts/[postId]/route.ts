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

  const authorIds = [...new Set(replies.map((r) => r.author.id))];
  const [riskFlags, escalations] = await Promise.all([
    db.riskFlag.findMany({ where: { userId: { in: authorIds }, status: "open" }, select: { userId: true, severity: true } }),
    db.riskFlag.findMany({ where: { source: "community", sourceId: { in: replies.map((r) => r.id) }, status: "open" }, select: { sourceId: true, severity: true, detail: true } }),
  ]);
  const riskByAuthor = new Map<string, "high" | "medium">();
  for (const f of riskFlags) {
    if (f.severity === "high") riskByAuthor.set(f.userId, "high");
    else if (f.severity === "moderate" && riskByAuthor.get(f.userId) !== "high") riskByAuthor.set(f.userId, "medium");
  }
  const escalationByReply = new Map(escalations.map((e) => [e.sourceId, e]));

  return NextResponse.json({
    replies: replies.map((r) => {
      const escalation = escalationByReply.get(r.id);
      return {
        id: r.id,
        author: r.author.name,
        authorId: r.author.id,
        authorRiskLevel: riskByAuthor.get(r.author.id) ?? "low",
        content: r.content,
        createdAt: r.createdAt,
        likes: r.likes.length,
        liked: r.likes.some((l) => l.userId === userId),
        escalated: !!escalation,
        escalationSeverity: escalation?.severity ?? null,
        escalationDetail: escalation?.detail ?? null,
      };
    }),
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

  // Dismissing a flagged post also acknowledges its linked risk flag (if any),
  // so it stops showing as open on the client's individual risk profile too.
  if (parsed.data.flagged === false) {
    await db.riskFlag.updateMany({
      where: { source: "community", sourceId: postId, status: "open" },
      data: { status: "acknowledged", acknowledgedAt: new Date(), acknowledgedById: session.user.id },
    });
  }

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
