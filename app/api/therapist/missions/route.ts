import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const activityTypeEnum = z.enum([
  "gratitude", "reflection", "checkin", "worry", "self_compassion", "strength",
  "values", "breathing", "timer", "walk", "bodyscan", "social", "stretch", "generic",
]);

const createSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().min(5).max(500),
  category: z.string().min(1),
  duration: z.number().int().min(1).max(180),
  xp: z.number().int().min(5).max(100).default(10),
  recurring: z.boolean().default(true),
  activityType: activityTypeEnum.default("generic"),
});

const deleteSchema = z.object({
  missionId: z.string(),
});

const updateSchema = z.object({
  missionId: z.string(),
  title: z.string().min(2).max(100),
  description: z.string().min(5).max(500),
  category: z.string().min(1),
  duration: z.number().int().min(1).max(180),
  xp: z.number().int().min(5).max(100),
  recurring: z.boolean(),
  activityType: activityTypeEnum.default("generic"),
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
      attachments: { orderBy: { createdAt: "asc" } },
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
    activityType: m.activityType,
    completionCount: m._count.completions,
    createdAt: m.createdAt,
    attachments: m.attachments,
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

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await db.mission.findUnique({ where: { id: parsed.data.missionId } });
  if (!existing || existing.therapistId !== therapist.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { missionId, ...data } = parsed.data;
  const mission = await db.mission.update({
    where: { id: missionId },
    data,
    include: { _count: { select: { completions: true } }, attachments: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({
    ok: true,
    mission: {
      id: mission.id,
      title: mission.title,
      description: mission.description,
      category: mission.category,
      duration: mission.duration,
      xp: mission.xp,
      recurring: mission.recurring,
      activityType: mission.activityType,
      completionCount: mission._count.completions,
      createdAt: mission.createdAt,
      attachments: mission.attachments,
    },
  });
}
