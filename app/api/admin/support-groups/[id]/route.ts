import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().min(1).max(500).optional(),
  category: z.string().min(1).max(100).optional(),
  icon: z.string().min(1).max(10).optional(),
  color: z.string().min(1).max(50).optional(),
  identityTags: z.array(z.string()).optional(),
  ageGroup: z.string().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const group = await db.supportGroup.findUnique({
    where: { id },
    include: { _count: { select: { memberships: true } } },
  });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    group: {
      id: group.id, name: group.name, description: group.description, category: group.category,
      icon: group.icon, color: group.color, identityTags: group.identityTags, ageGroup: group.ageGroup,
      memberCount: group._count.memberships, createdAt: group.createdAt,
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await db.supportGroup.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const group = await db.supportGroup.update({ where: { id }, data: parsed.data });

  await db.adminAuditLog.create({
    data: { adminId: session.user.id, action: "support_group.updated", targetType: "SupportGroup", targetId: id },
  });

  return NextResponse.json({ ok: true, group });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await db.supportGroup.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.supportGroup.delete({ where: { id } });

  await db.adminAuditLog.create({
    data: { adminId: session.user.id, action: "support_group.deleted", targetType: "SupportGroup", targetId: id },
  });

  return NextResponse.json({ ok: true });
}
