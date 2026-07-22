import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const questionSchema = z.object({
  question: z.string().min(1).max(1000),
  options: z.array(z.string().min(1).max(300)).min(2).max(6),
  correct: z.number().int().min(0),
  explanation: z.string().max(1000).default(""),
});

const updateSchema = z.object({
  module: z.string().min(1).max(200).optional(),
  title: z.string().min(1).max(200).optional(),
  duration: z.string().max(50).optional(),
  content: z.string().max(5000).nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  audioUrl: z.string().url().nullable().optional(),
  exerciseType: z.enum([
    "breathing", "bodyscan", "gratitude", "grounding",
    "pmr", "boxbreathing", "reframe", "values", "feelingswheel",
    "worryjar", "lovingkindness", "cbttriangle", "urgesurf", "selfcompassion",
  ]).nullable().optional(),
  questions: z.array(questionSchema).optional(),
  reorder: z.enum(["up", "down"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: courseId, lessonId } = await params;
  const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson || lesson.courseId !== courseId) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { questions, reorder, ...fields } = parsed.data;

  if (reorder) {
    const neighbor = reorder === "up"
      ? await db.lesson.findFirst({ where: { courseId, order: { lt: lesson.order } }, orderBy: { order: "desc" } })
      : await db.lesson.findFirst({ where: { courseId, order: { gt: lesson.order } }, orderBy: { order: "asc" } });

    if (neighbor) {
      await db.$transaction([
        db.lesson.update({ where: { id: lesson.id }, data: { order: neighbor.order } }),
        db.lesson.update({ where: { id: neighbor.id }, data: { order: lesson.order } }),
      ]);
    }
  }

  if (Object.keys(fields).length > 0) {
    await db.lesson.update({ where: { id: lessonId }, data: fields });
  }

  if (questions) {
    await db.$transaction([
      db.quizQuestion.deleteMany({ where: { lessonId } }),
      db.quizQuestion.createMany({
        data: questions.map((q, i) => ({ lessonId, order: i, question: q.question, options: q.options, correct: q.correct, explanation: q.explanation })),
      }),
    ]);
  }

  const updated = await db.lesson.findUnique({ where: { id: lessonId }, include: { questions: { orderBy: { order: "asc" } } } });

  return NextResponse.json({ ok: true, lesson: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: courseId, lessonId } = await params;
  const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson || lesson.courseId !== courseId) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  await db.lesson.delete({ where: { id: lessonId } });
  await db.course.update({ where: { id: courseId }, data: { lessonCount: { decrement: 1 } } });

  return NextResponse.json({ ok: true });
}
