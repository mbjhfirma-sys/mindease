import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canAccessCourse } from "@/lib/courseAccess";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const course = await db.course.findUnique({
    where: { id },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: { questions: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
  const allowed = await canAccessCourse(session.user.id, user?.plan ?? "free", course);
  if (!allowed) return NextResponse.json({ error: "plan_required" }, { status: 403 });

  const { lessons, ...courseFields } = course;

  return NextResponse.json({
    course: {
      ...courseFields,
      lessons: lessons.length,
    },
    lessons: lessons.map((l) => ({
      id: l.id,
      module: l.module,
      title: l.title,
      duration: l.duration,
      type: l.type,
      content: l.content,
      videoUrl: l.videoUrl,
      audioUrl: l.audioUrl,
      exerciseType: l.exerciseType,
      questions: l.questions.length > 0
        ? l.questions.map((q) => ({ q: q.question, options: q.options, correct: q.correct, explanation: q.explanation }))
        : undefined,
      prompt: l.content ?? undefined,
    })),
    lessonCount: lessons.length,
  });
}
