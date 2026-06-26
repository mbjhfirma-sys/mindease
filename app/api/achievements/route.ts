import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const awardSchema = z.object({
  badgeId: z.string(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [achievements, moodCount, journalCount, missionCompletions, courseProgress] = await Promise.all([
    db.achievement.findMany({ where: { userId: session.user.id } }),
    db.moodEntry.count({ where: { userId: session.user.id } }),
    db.journalEntry.count({ where: { userId: session.user.id } }),
    db.missionCompletion.count({ where: { userId: session.user.id } }),
    db.courseProgress.count({ where: { userId: session.user.id, completed: true } }),
  ]);

  // Calculate streak from mood entries
  const recentMoods = await db.moodEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { createdAt: true },
  });

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const hasEntry = recentMoods.some((m) => m.createdAt >= day && m.createdAt < nextDay);
    if (!hasEntry && i > 0) break;
    if (hasEntry) streak++;
  }

  return NextResponse.json({
    achievements,
    stats: {
      streak,
      moodEntries: moodCount,
      journalEntries: journalCount,
      missionsCompleted: missionCompletions,
      lessonsCompleted: courseProgress,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = awardSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const achievement = await db.achievement.upsert({
    where: { userId_badgeId: { userId: session.user.id, badgeId: parsed.data.badgeId } },
    update: {},
    create: { userId: session.user.id, badgeId: parsed.data.badgeId },
  });

  return NextResponse.json({ ok: true, achievement });
}
