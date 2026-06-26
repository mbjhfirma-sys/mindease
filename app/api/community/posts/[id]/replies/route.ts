import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const postSchema = z.object({
  content: z.string().min(1).max(500),
  anonymous: z.boolean().default(false),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId } = await params;

  const post = await db.communityPost.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const replies = await db.postReply.findMany({
    where: { postId },
    include: { user: { select: { name: true, avatar: true } } },
    orderBy: { createdAt: "asc" },
  });

  const formatted = replies.map((r) => ({
    id: r.id,
    author: r.anonymous ? "Anonymous" : (r.user?.name ?? "Unknown"),
    avatar: r.anonymous ? "🌿" : (r.user?.avatar ?? (r.user?.name?.slice(0, 2).toUpperCase() ?? "?")),
    content: r.content,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ replies: formatted });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId } = await params;

  const post = await db.communityPost.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const reply = await db.postReply.create({
    data: {
      postId,
      userId: session.user.id,
      content: parsed.data.content,
      anonymous: parsed.data.anonymous,
    },
    include: { user: { select: { name: true, avatar: true } } },
  });

  return NextResponse.json({
    ok: true,
    reply: {
      id: reply.id,
      author: reply.anonymous ? "Anonymous" : (reply.user?.name ?? "Unknown"),
      avatar: reply.anonymous ? "🌿" : (reply.user?.avatar ?? reply.user?.name?.slice(0, 2).toUpperCase() ?? "?"),
      content: reply.content,
      createdAt: reply.createdAt,
    },
  }, { status: 201 });
}
