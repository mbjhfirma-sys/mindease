import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const postSchema = z.object({
  articleId: z.string(),
  completed: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const articleId = req.nextUrl.searchParams.get("articleId");

  const rows = await db.articleProgress.findMany({
    where: articleId
      ? { userId: session.user.id, articleId }
      : { userId: session.user.id },
  });

  return NextResponse.json({
    completedArticleIds: rows.filter((r) => r.completed).map((r) => r.articleId),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { articleId, completed } = parsed.data;

  const row = await db.articleProgress.upsert({
    where: { userId_articleId: { userId: session.user.id, articleId } },
    update: { completed },
    create: { userId: session.user.id, articleId, completed },
  });

  return NextResponse.json({ ok: true, ...row });
}
