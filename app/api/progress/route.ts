import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { computeLockedLessonIds } from "@/lib/courseProgression";
import { canAccessCourse } from "@/lib/courseAccess";

const postSchema = z.object({
  lessonId: z.string(),
  courseId: z.string(),
  completed: z.boolean().default(true),
  score: z.number().int().min(0).max(100).optional(),
  passed: z.boolean().optional(),
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

  const { lessonId, courseId, completed, score, passed } = parsed.data;

  if (completed) {
    const [lessons, existing, course, user] = await Promise.all([
      db.lesson.findMany({ where: { courseId }, orderBy: { order: "asc" }, select: { id: true } }),
      db.courseProgress.findMany({ where: { userId: session.user.id, courseId, completed: true }, select: { lessonId: true } }),
      db.course.findUnique({ where: { id: courseId }, select: { id: true, isFreeTier: true } }),
      db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
    ]);
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    const allowed = await canAccessCourse(session.user.id, user?.plan ?? "free", course);
    if (!allowed) return NextResponse.json({ error: "plan_required" }, { status: 403 });

    const completedLessonIds = new Set(existing.map((r) => r.lessonId));
    const locked = computeLockedLessonIds(lessons, completedLessonIds);
    if (locked.has(lessonId)) {
      return NextResponse.json({ error: "lesson_locked" }, { status: 403 });
    }
  }

  const row = await db.courseProgress.upsert({
    where: { userId_courseId_lessonId: { userId: session.user.id, courseId, lessonId } },
    update: { completed, ...(score !== undefined ? { score } : {}), ...(passed !== undefined ? { passed } : {}) },
    create: { userId: session.user.id, courseId, lessonId, completed, score, passed },
  });

  return NextResponse.json({ ok: true, ...row });
}
