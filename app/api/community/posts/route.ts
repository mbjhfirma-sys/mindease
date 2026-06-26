import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const postSchema = z.object({
  content: z.string().min(1).max(1000),
  groupId: z.string().optional(),
  anonymous: z.boolean().default(false),
});

const likeSchema = z.object({
  postId: z.string(),
  action: z.enum(["like", "unlike"]),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groupId = req.nextUrl.searchParams.get("groupId");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20");

  const posts = await db.communityPost.findMany({
    where: groupId ? { groupId } : {},
    include: {
      user: { select: { name: true, avatar: true } },
      likes: { select: { userId: true } },
      replies: { orderBy: { createdAt: "asc" } },
      group: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const userId = session.user.id;
  const formatted = posts.map((p) => ({
    id: p.id,
    author: p.anonymous ? "Anonymous" : p.user.name,
    avatar: p.anonymous ? "🌿" : (p.user.avatar ?? p.user.name.slice(0, 2).toUpperCase()),
    group: p.group?.name ?? null,
    content: p.content,
    time: new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    likes: p.likes.length,
    replies: p.replies.length,
    liked: p.likes.some((l) => l.userId === userId),
    createdAt: p.createdAt,
  }));

  return NextResponse.json({ posts: formatted });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Handle like/unlike action
  const liked = likeSchema.safeParse(body);
  if (liked.success) {
    const { postId, action } = liked.data;
    if (action === "like") {
      await db.postLike.upsert({
        where: { userId_postId: { userId: session.user.id, postId } },
        update: {},
        create: { userId: session.user.id, postId },
      });
    } else {
      await db.postLike.deleteMany({ where: { userId: session.user.id, postId } });
    }
    return NextResponse.json({ ok: true });
  }

  // Create new post
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const post = await db.communityPost.create({
    data: { userId: session.user.id, ...parsed.data },
  });

  return NextResponse.json({ ok: true, post }, { status: 201 });
}
