import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  category: z.string().min(1),
  icon: z.string().default("💬"),
  privacy: z.enum(["open", "invite"]).default("open"),
});

async function getTherapistId(userId: string) {
  const t = await db.therapist.findUnique({ where: { userId }, select: { id: true } });
  return t?.id ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapistId = await getTherapistId(session.user.id);
  if (!therapistId) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const groups = await db.therapistGroup.findMany({
    where: { therapistId },
    include: {
      _count: { select: { memberships: true, posts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    category: g.category,
    icon: g.icon,
    privacy: g.privacy,
    status: g.status,
    memberCount: g._count.memberships,
    postCount: g._count.posts,
    createdAt: g.createdAt,
    isOwner: true,
  }));

  return NextResponse.json({ groups: formatted });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapistId = await getTherapistId(session.user.id);
  if (!therapistId) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const group = await db.therapistGroup.create({
    data: { therapistId, ...parsed.data },
  });

  return NextResponse.json({ ok: true, group }, { status: 201 });
}
