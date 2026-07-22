import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  instructor: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  level: z.string().min(1).max(50).default("Beginner"),
  duration: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  thumbnail: z.string().max(10).optional(),
  color: z.string().max(50).optional(),
  tags: z.array(z.string()).default([]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const courses = await db.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { lessons: true } } },
  });

  return NextResponse.json({
    courses: courses.map((c) => ({
      id: c.id, title: c.title, instructor: c.instructor, category: c.category, level: c.level,
      tags: c.tags, enrolled: c.enrolled, description: c.description, duration: c.duration,
      rating: c.rating, thumbnail: c.thumbnail, color: c.color, published: c.published,
      lessonCount: c._count.lessons, createdAt: c.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const course = await db.course.create({
    data: { ...parsed.data, published: false },
  });

  return NextResponse.json({ ok: true, course }, { status: 201 });
}
