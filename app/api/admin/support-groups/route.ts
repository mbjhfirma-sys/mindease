import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(1).max(500),
  category: z.string().min(1).max(100),
  icon: z.string().min(1).max(10).default("💬"),
  color: z.string().min(1).max(50).default("bg-sage-100"),
  identityTags: z.array(z.string()).default([]),
  ageGroup: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const groups = await db.supportGroup.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { memberships: true } } },
  });

  return NextResponse.json({
    groups: groups.map((g) => ({
      id: g.id, name: g.name, description: g.description, category: g.category,
      icon: g.icon, color: g.color, identityTags: g.identityTags, ageGroup: g.ageGroup,
      memberCount: g._count.memberships, createdAt: g.createdAt,
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

  const group = await db.supportGroup.create({ data: parsed.data });

  await db.adminAuditLog.create({
    data: { adminId: session.user.id, action: "support_group.created", targetType: "SupportGroup", targetId: group.id },
  });

  return NextResponse.json({ ok: true, group }, { status: 201 });
}
