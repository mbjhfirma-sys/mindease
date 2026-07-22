import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const createSchema = z.object({
  module: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  type: z.enum(["video", "quiz", "reflection", "exercise", "audio"]),
  duration: z.string().max(50).default("5 min"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: courseId } = await params;
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const last = await db.lesson.findFirst({ where: { courseId }, orderBy: { order: "desc" } });
  const order = (last?.order ?? -1) + 1;

  const lesson = await db.lesson.create({
    data: { courseId, order, ...parsed.data },
    include: { questions: true },
  });

  await db.course.update({ where: { id: courseId }, data: { lessonCount: { increment: 1 } } });

  return NextResponse.json({ ok: true, lesson }, { status: 201 });
}
