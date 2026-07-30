import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { planById } from "@/lib/clientPlans";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.toLowerCase();

  const courses = await db.course.findMany({
    where: {
      published: true,
      ...(category && category !== "All" ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { instructor: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { lessons: true } } },
  });

  let result = courses.map((c) => ({
    id: c.id, title: c.title, instructor: c.instructor, category: c.category, level: c.level,
    duration: c.duration ?? "", lessons: c._count.lessons, enrolled: c.enrolled, rating: c.rating,
    progress: 0, thumbnail: c.thumbnail ?? "📘", color: c.color ?? "bg-stone-100",
    description: c.description ?? "", tags: c.tags, locked: !c.isFreeTier,
  }));

  // Replace the zeroed-out progress with real per-user progress from the DB, and
  // resolve locking against the caller's actual plan + any therapist-assigned enrollments
  // (a therapist assigning a course is a clinical decision that bypasses the plan gate).
  const session = await auth();
  if (session?.user?.id) {
    try {
      const [progressRecords, user, enrollments] = await Promise.all([
        db.courseProgress.groupBy({
          by: ["courseId"],
          where: { userId: session.user.id, completed: true },
          _count: { lessonId: true },
        }),
        db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
        db.courseEnrollment.findMany({ where: { clientId: session.user.id, courseId: { not: null } }, select: { courseId: true } }),
      ]);
      const progressMap = new Map(progressRecords.map((p) => [p.courseId, p._count.lessonId]));
      const assignedCourseIds = new Set(enrollments.map((e) => e.courseId));
      const hasFullLibrary = planById(user?.plan).features.fullCourseLibrary;
      result = result.map((c) => {
        const completedLessons = progressMap.get(c.id) ?? 0;
        const progress = c.lessons > 0 ? Math.round((completedLessons / c.lessons) * 100) : 0;
        const locked = c.locked && !hasFullLibrary && !assignedCourseIds.has(c.id);
        return { ...c, progress, locked };
      });
    } catch {
      // DB error — leave progress/locked at their defaults rather than show incorrect data
    }
  }

  return NextResponse.json({ courses: result, total: result.length });
}
