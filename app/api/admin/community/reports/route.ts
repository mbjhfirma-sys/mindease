import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const STATUSES = ["open", "resolved", "dismissed"] as const;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const statusParam = req.nextUrl.searchParams.get("status");
  const status = STATUSES.includes(statusParam as (typeof STATUSES)[number])
    ? (statusParam as (typeof STATUSES)[number])
    : "open";

  const reports = await db.communityReport.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    include: { reporter: { select: { name: true } } },
  });

  // The community feed merges plain support-group posts (CommunityPost) with
  // therapist-group posts (TherapistGroupPost) into one list, and the Report
  // button doesn't tag which source a post came from — so a report's
  // targetId can legitimately point at either table. Try the plain community
  // tables first, then fall back to the therapist-group tables.
  const withPreview = await Promise.all(
    reports.map(async (r) => {
      let preview: string | null = null;
      let author: string | null = null;
      if (r.targetType === "post") {
        const post = await db.communityPost.findUnique({
          where: { id: r.targetId },
          select: { content: true, user: { select: { name: true } } },
        });
        if (post) {
          preview = post.content;
          author = post.user.name;
        } else {
          const groupPost = await db.therapistGroupPost.findUnique({
            where: { id: r.targetId },
            select: { content: true, author: { select: { name: true } } },
          });
          preview = groupPost?.content ?? null;
          author = groupPost?.author.name ?? null;
        }
      } else if (r.targetType === "reply") {
        const reply = await db.postReply.findUnique({
          where: { id: r.targetId },
          select: { content: true, user: { select: { name: true } } },
        });
        if (reply) {
          preview = reply.content;
          author = reply.user?.name ?? null;
        } else {
          const groupReply = await db.therapistGroupPostReply.findUnique({
            where: { id: r.targetId },
            select: { content: true, author: { select: { name: true } } },
          });
          preview = groupReply?.content ?? null;
          author = groupReply?.author.name ?? null;
        }
      }
      return {
        id: r.id,
        reporter: r.reporter.name,
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        status: r.status,
        preview,
        author,
        createdAt: r.createdAt,
      };
    })
  );

  return NextResponse.json({ reports: withPreview });
}
