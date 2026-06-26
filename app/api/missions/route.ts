import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const completeSchema = z.object({
  missionId: z.string(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const missions = await db.mission.findMany({
    where: {
      OR: [
        { therapistId: null },
        { therapist: { clients: { some: { id: userId } } } },
      ],
    },
    include: {
      completions: {
        where: { userId, completedAt: { gte: todayStart } },
        take: 1,
      },
    },
  });

  const todayCompletions = await db.missionCompletion.count({
    where: { userId, completedAt: { gte: todayStart } },
  });

  const formatted = missions.map((m) => ({
    ...m,
    completed: m.completions.length > 0,
    completions: undefined,
  }));

  return NextResponse.json({ missions: formatted, completedToday: todayCompletions });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { missionId } = parsed.data;
  const mission = await db.mission.findUnique({ where: { id: missionId } });
  if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const existing = await db.missionCompletion.findFirst({
    where: { userId: session.user.id, missionId, completedAt: { gte: todayStart } },
  });
  if (existing) return NextResponse.json({ ok: true, alreadyCompleted: true });

  await db.missionCompletion.create({
    data: { userId: session.user.id, missionId },
  });

  return NextResponse.json({ ok: true, xpEarned: mission.xp });
}
