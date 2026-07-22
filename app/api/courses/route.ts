import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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
    description: c.description ?? "", tags: c.tags,
  }));

  // Replace the zeroed-out progress with real per-user progress from the DB
  const session = await auth();
  if (session?.user?.id) {
    try {
      const progressRecords = await db.courseProgress.groupBy({
        by: ["courseId"],
        where: { userId: session.user.id, completed: true },
        _count: { lessonId: true },
      });
      const progressMap = new Map(progressRecords.map((p) => [p.courseId, p._count.lessonId]));
      result = result.map((c) => {
        const completedLessons = progressMap.get(c.id) ?? 0;
        const progress = c.lessons > 0 ? Math.round((completedLessons / c.lessons) * 100) : 0;
        return { ...c, progress };
      });
    } catch {
      // DB error — leave progress at 0 rather than show incorrect data
    }
  }

  return NextResponse.json({ courses: result, total: result.length });
}
