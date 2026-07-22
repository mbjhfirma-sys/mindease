import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.toLowerCase();

  const articles = await db.article.findMany({
    where: {
      published: true,
      ...(category && category !== "All" ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { summary: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
              { tags: { has: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ category: "asc" }, { order: "asc" }],
    select: {
      id: true, slug: true, title: true, category: true, summary: true,
      readTime: true, icon: true, color: true, tags: true,
    },
  });

  let result = articles.map((a) => ({ ...a, completed: false }));

  const session = await auth();
  if (session?.user?.id) {
    try {
      const completedRows = await db.articleProgress.findMany({
        where: { userId: session.user.id, completed: true },
        select: { articleId: true },
      });
      const completedIds = new Set(completedRows.map((r) => r.articleId));
      result = result.map((a) => ({ ...a, completed: completedIds.has(a.id) }));
    } catch {
      // DB error — leave completed at false rather than show incorrect data
    }
  }

  return NextResponse.json({ articles: result, total: result.length });
}
