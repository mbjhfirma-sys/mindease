import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const posts = await db.therapistGroupPost.findMany({
    where: { flagged: true, group: { therapistId: therapist.id } },
    orderBy: { createdAt: "desc" },
    include: {
      group: { select: { id: true, name: true } },
      author: { select: { id: true, name: true } },
    },
  });

  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.author.id))];

  const [escalations, allOpenFlags] = await Promise.all([
    db.riskFlag.findMany({
      where: { source: "community", sourceId: { in: postIds }, status: "open" },
      select: { sourceId: true, severity: true, detail: true },
    }),
    db.riskFlag.findMany({
      where: { userId: { in: authorIds }, status: "open" },
      select: { userId: true },
    }),
  ]);

  const escalationByPost = new Map(escalations.map((e) => [e.sourceId, e]));
  const openFlagCountByAuthor = new Map<string, number>();
  for (const f of allOpenFlags) {
    openFlagCountByAuthor.set(f.userId, (openFlagCountByAuthor.get(f.userId) ?? 0) + 1);
  }

  return NextResponse.json({
    posts: posts.map((p) => {
      const escalation = escalationByPost.get(p.id);
      // "Other" open flags for this author, not counting the escalation tied to this exact post.
      const totalOpenForAuthor = openFlagCountByAuthor.get(p.author.id) ?? 0;
      const otherOpenRiskFlagCount = Math.max(0, totalOpenForAuthor - (escalation ? 1 : 0));
      return {
        id: p.id,
        groupId: p.group.id,
        groupName: p.group.name,
        authorId: p.author.id,
        authorName: p.author.name,
        content: p.content,
        createdAt: p.createdAt,
        severity: escalation?.severity ?? "moderate",
        detail: escalation?.detail ?? null,
        otherOpenRiskFlagCount,
      };
    }),
  });
}
