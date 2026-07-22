import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BUILTIN_CHALLENGES } from "@/lib/defaultChallenges";

const joinSchema = z.object({
  challengeId: z.string(),
});

async function ensureDefaultChallengesExist() {
  await Promise.all(
    BUILTIN_CHALLENGES.map((c) => {
      const data = {
        title: c.title,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty,
        totalDays: c.totalDays,
        xpReward: c.xpReward,
        activityType: c.activityType,
      };
      return db.challenge.upsert({ where: { id: c.id }, update: data, create: { id: c.id, ...data } });
    })
  );
}

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureDefaultChallengesExist();

  const challenges = await db.challenge.findMany({
    include: {
      _count: { select: { participants: true } },
      participants: { where: { userId: session.user.id } },
    },
    orderBy: { createdAt: "asc" },
  });

  const start = todayStart();
  const formatted = challenges.map((c) => {
    const me = c.participants[0] ?? null;
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      difficulty: c.difficulty,
      totalDays: c.totalDays,
      xpReward: c.xpReward,
      activityType: c.activityType,
      participantCount: c._count.participants,
      joined: !!me,
      progress: me?.progress ?? 0,
      completed: !!me?.completedAt,
      canLogToday: !!me && !me.completedAt && (!me.lastLoggedAt || me.lastLoggedAt < start),
    };
  });

  return NextResponse.json({ challenges: formatted });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await ensureDefaultChallengesExist();

  const challenge = await db.challenge.findUnique({ where: { id: parsed.data.challengeId } });
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

  await db.challengeParticipant.upsert({
    where: { challengeId_userId: { challengeId: challenge.id, userId: session.user.id } },
    update: {},
    create: { challengeId: challenge.id, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
