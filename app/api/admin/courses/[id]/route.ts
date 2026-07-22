import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  instructor: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  level: z.string().min(1).max(50).optional(),
  duration: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  thumbnail: z.string().max(10).optional(),
  color: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  enrolled: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  return NextResponse.json({ course });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await db.course.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const course = await db.course.update({ where: { id }, data: parsed.data });

  await db.adminAuditLog.create({
    data: { adminId: session.user.id, action: "course.updated", targetType: "Course", targetId: id },
  });

  return NextResponse.json({ ok: true, course });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await db.course.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  await db.course.delete({ where: { id } });

  await db.adminAuditLog.create({
    data: { adminId: session.user.id, action: "course.deleted", targetType: "Course", targetId: id },
  });

  return NextResponse.json({ ok: true });
}
