import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const postSchema = z.object({
  lessonId: z.string(),
  courseId: z.string(),
  completed: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courseId = req.nextUrl.searchParams.get("courseId");

  const where = courseId
    ? { userId: session.user.id, courseId }
    : { userId: session.user.id };

  const rows = await db.courseProgress.findMany({ where });
  const completedLessonIds = rows.filter((r) => r.completed).map((r) => r.lessonId);
  const last = rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

  return NextResponse.json({
    courseId,
    completedLessonIds,
    lastLessonId: last?.lessonId ?? null,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { lessonId, courseId, completed } = parsed.data;

  const row = await db.courseProgress.upsert({
    where: { userId_courseId_lessonId: { userId: session.user.id, courseId, lessonId } },
    update: { completed },
    create: { userId: session.user.id, courseId, lessonId, completed },
  });

  return NextResponse.json({ ok: true, ...row });
}
