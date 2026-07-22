import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  content: z.string().min(1).max(1000),
  groupId: z.string().optional(),
  anonymous: z.boolean().default(false),
  groupSource: z.enum(["support", "therapist"]).default("support"),
});

const likeSchema = z.object({
  postId: z.string(),
  action: z.enum(["like", "unlike"]),
  postSource: z.enum(["support", "therapist"]).default("support"),
});

const replySchema = z.object({
  postId: z.string(),
  content: z.string().min(1).max(500),
  postSource: z.enum(["support", "therapist"]).default("support"),
});

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "1d ago" : `${d}d ago`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groupId = req.nextUrl.searchParams.get("groupId");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "40"), 100);
  const userId = session.user.id;

  // Fetch support group posts
  const supportPosts = await db.communityPost.findMany({
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

  // Find therapist groups the user has joined (to include their posts)
  const joinedTherapistGroups = await db.therapistGroupMembership.findMany({
    where: { clientId: userId },
    select: { groupId: true },
  });
  const therapistGroupIds = joinedTherapistGroups.map((m) => m.groupId);

  // If also querying a specific therapist group
  if (groupId && !therapistGroupIds.includes(groupId)) {
    // Check if user is the therapist owner
    const owned = await db.therapistGroup.findFirst({
      where: { id: groupId, therapist: { userId } },
      select: { id: true },
    });
    if (owned) therapistGroupIds.push(groupId);
  }

  // Fetch therapist group posts
  const therapistPosts = therapistGroupIds.length > 0
    ? await db.therapistGroupPost.findMany({
        where: {
          groupId: groupId
            ? { equals: groupId }
            : { in: therapistGroupIds },
        },
        include: {
          author: { select: { name: true, avatar: true, role: true } },
          likes: { select: { userId: true } },
          replies: {
            include: { author: { select: { name: true, avatar: true, role: true } } },
            orderBy: { createdAt: "asc" },
          },
          group: { select: { name: true } },
        },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: limit,
      })
    : [];

  const formatted = [
    ...supportPosts.map((p) => ({
      id: p.id,
      source: "support" as const,
      author: p.anonymous ? "Anonymous" : p.user.name,
      avatar: p.anonymous ? "🌿" : (p.user.avatar ?? p.user.name.slice(0, 2).toUpperCase()),
      group: p.group?.name ?? null,
      groupId: p.groupId ?? null,
      content: p.content,
      time: timeAgo(p.createdAt),
      likes: p.likes.length,
      replies: p.replies.length,
      liked: p.likes.some((l) => l.userId === userId),
      pinned: false,
      createdAt: p.createdAt,
    })),
    ...therapistPosts.map((p) => ({
      id: p.id,
      source: "therapist" as const,
      author: "Anonymous",
      avatar: "🌿",
      group: p.group?.name ?? null,
      groupId: p.groupId,
      content: p.content,
      time: timeAgo(p.createdAt),
      likes: p.likes.length,
      replies: p.replies.length,
      liked: p.likes.some((l) => l.userId === userId),
      pinned: p.pinned,
      createdAt: p.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
   .slice(0, limit);

  return NextResponse.json({ posts: formatted });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const userId = session.user.id;

  // ── Reply ──────────────────────────────────────────────────────────────────
  const replyParsed = replySchema.safeParse(body);
  if (replyParsed.success && body.type === "reply") {
    const { postId, content, postSource } = replyParsed.data;
    if (postSource === "therapist") {
      const targetPost = await db.therapistGroupPost.findUnique({ where: { id: postId }, select: { groupId: true } });
      if (!targetPost) return NextResponse.json({ error: "Post not found" }, { status: 404 });
      const tGroup = await db.therapistGroup.findUnique({ where: { id: targetPost.groupId }, include: { therapist: { select: { userId: true } } } });
      if (!tGroup) return NextResponse.json({ error: "Group not found" }, { status: 404 });
      if (tGroup.therapist.userId !== userId) {
        const mem = await db.therapistGroupMembership.findUnique({ where: { groupId_clientId: { groupId: targetPost.groupId, clientId: userId } } });
        if (!mem) return NextResponse.json({ error: "Not a member" }, { status: 403 });
      }
      const reply = await db.therapistGroupPostReply.create({
        data: { postId, authorId: userId, content },
      });
      return NextResponse.json({ ok: true, reply }, { status: 201 });
    } else {
      const reply = await db.postReply.create({
        data: { postId, userId, content },
      });
      return NextResponse.json({ ok: true, reply }, { status: 201 });
    }
  }

  // ── Like / Unlike ──────────────────────────────────────────────────────────
  const liked = likeSchema.safeParse(body);
  if (liked.success && (body.action === "like" || body.action === "unlike")) {
    const { postId, action, postSource } = liked.data;
    if (postSource === "therapist") {
      const likePost = await db.therapistGroupPost.findUnique({ where: { id: postId }, select: { groupId: true } });
      if (!likePost) return NextResponse.json({ error: "Post not found" }, { status: 404 });
      const likeGroup = await db.therapistGroup.findUnique({ where: { id: likePost.groupId }, include: { therapist: { select: { userId: true } } } });
      if (likeGroup?.therapist.userId !== userId) {
        const likeMem = await db.therapistGroupMembership.findUnique({ where: { groupId_clientId: { groupId: likePost.groupId, clientId: userId } } });
        if (!likeMem) return NextResponse.json({ error: "Not a member" }, { status: 403 });
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
    } else {
      if (action === "like") {
        await db.postLike.upsert({
          where: { userId_postId: { userId, postId } },
          update: {},
          create: { userId, postId },
        });
      } else {
        await db.postLike.deleteMany({ where: { userId, postId } });
      }
    }
    return NextResponse.json({ ok: true });
  }

  // ── Create post ────────────────────────────────────────────────────────────
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { content, groupId, groupSource } = parsed.data;
  // Respect the user's "always post anonymously" privacy preference
  const userPrefs = await db.user.findUnique({
    where: { id: userId },
    select: { privacyPrefs: true },
  });
  const privacyPrefs = (userPrefs?.privacyPrefs as Record<string, boolean> | null) ?? {};
  const anonymous = privacyPrefs.anonymousCommunity === true ? true : parsed.data.anonymous;

  if (groupSource === "therapist" && groupId) {
    // Verify user is a member or the therapist
    const group = await db.therapistGroup.findUnique({
      where: { id: groupId },
      include: { therapist: { select: { userId: true } } },
    });
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const isOwner = group.therapist.userId === userId;
    if (!isOwner) {
      const member = await db.therapistGroupMembership.findUnique({
        where: { groupId_clientId: { groupId, clientId: userId } },
      });
      if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const post = await db.therapistGroupPost.create({
      data: { groupId, authorId: userId, content },
    });
    return NextResponse.json({ ok: true, post }, { status: 201 });
  }

  const post = await db.communityPost.create({
    data: { userId, content, groupId, anonymous },
    select: { id: true, content: true, groupId: true, anonymous: true, createdAt: true },
  });
  return NextResponse.json({ ok: true, post }, { status: 201 });
}
