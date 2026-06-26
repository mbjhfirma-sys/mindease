import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const createSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().min(5).max(500),
  category: z.string().min(1),
  duration: z.number().int().min(1).max(180),
  xp: z.number().int().min(5).max(100).default(10),
  recurring: z.boolean().default(true),
});

const deleteSchema = z.object({
  missionId: z.string(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const missions = await db.mission.findMany({
    where: { therapistId: therapist.id },
    include: {
      _count: { select: { completions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = missions.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    category: m.category,
    duration: m.duration,
    xp: m.xp,
    recurring: m.recurring,
    completionCount: m._count.completions,
    createdAt: m.createdAt,
  }));

  return NextResponse.json({ missions: formatted });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const mission = await db.mission.create({
    data: { ...parsed.data, therapistId: therapist.id },
  });

  return NextResponse.json({ ok: true, mission }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const body = await req.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const mission = await db.mission.findUnique({ where: { id: parsed.data.missionId } });
  if (!mission || mission.therapistId !== therapist.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.mission.delete({ where: { id: parsed.data.missionId } });
  return NextResponse.json({ ok: true });
}
