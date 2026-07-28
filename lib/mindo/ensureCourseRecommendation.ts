import { db } from "@/lib/db";
import { pickOnboardingRecommendedCourse } from "@/lib/courseRecommendations";
import { generateCourseRecommendationReason } from "@/lib/mindo/generateCourseRecommendation";

export type CourseRecommendationView = {
  concern: string;
  reason: string;
  course: {
    id: string; title: string; instructor: string; category: string; level: string;
    duration: string; lessons: number; rating: number; thumbnail: string; color: string; description: string;
  };
};

export type EnsureCourseRecommendationResult =
  | { enabled: false }
  | { enabled: true; recommendation: CourseRecommendationView | null };

async function courseCompletion(userId: string, courseIds: string[]): Promise<Map<string, number>> {
  if (courseIds.length === 0) return new Map();
  const records = await db.courseProgress.groupBy({
    by: ["courseId"],
    where: { userId, courseId: { in: courseIds }, completed: true },
    _count: { lessonId: true },
  });
  return new Map(records.map((r) => [r.courseId, r._count.lessonId]));
}

function toView(concern: string, reason: string, course: {
  id: string; title: string; instructor: string; category: string; level: string;
  duration: string | null; lessonCount: number; rating: number; thumbnail: string | null; color: string | null; description: string | null;
}): CourseRecommendationView {
  return {
    concern,
    reason,
    course: {
      id: course.id, title: course.title, instructor: course.instructor, category: course.category, level: course.level,
      duration: course.duration ?? "", lessons: course.lessonCount, rating: course.rating,
      thumbnail: course.thumbnail ?? "📘", color: course.color ?? "bg-stone-100", description: course.description ?? "",
    },
  };
}

export async function ensureCourseRecommendation(userId: string): Promise<EnsureCourseRecommendationResult> {
  const intake = await db.clientIntake.findUnique({ where: { userId }, select: { concerns: true, goals: true } });
  if (!intake || intake.concerns.length === 0) return { enabled: false };

  const cached = await db.courseRecommendation.findUnique({ where: { userId }, include: { course: true } });
  if (cached) {
    const completion = await courseCompletion(userId, [cached.courseId]);
    const isComplete = cached.course.lessonCount > 0 && (completion.get(cached.courseId) ?? 0) >= cached.course.lessonCount;
    if (!isComplete) {
      return { enabled: true, recommendation: toView(cached.concern, cached.reason, cached.course) };
    }
    // The recommended course was finished since it was cached — clear it so a
    // fresh concern/course pair can be picked below instead of recommending
    // something already done.
    await db.courseRecommendation.delete({ where: { userId } }).catch(() => {});
  }

  const courses = await db.course.findMany({ where: { published: true } });
  const completion = await courseCompletion(userId, courses.map((c) => c.id));
  const eligible = courses.filter((c) => !(c.lessonCount > 0 && (completion.get(c.id) ?? 0) >= c.lessonCount));

  const pick = pickOnboardingRecommendedCourse(intake.concerns, eligible);
  if (!pick) return { enabled: true, recommendation: null };

  const result = await generateCourseRecommendationReason(pick.concern, intake.goals, pick.course);
  const data = { userId, courseId: pick.course.id, concern: pick.concern, reason: result.text, model: result.model };
  await db.courseRecommendation.upsert({
    where: { userId },
    create: data,
    update: data,
  });

  return { enabled: true, recommendation: toView(pick.concern, result.text, pick.course) };
}
