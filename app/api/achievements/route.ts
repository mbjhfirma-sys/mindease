import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BADGE_DEFINITIONS, BADGE_ELIGIBILITY, type UserStats } from "@/lib/achievements";
import { createNotification } from "@/lib/notify";

async function computeStats(userId: string): Promise<UserStats> {
  const [moodCount, journalCount, missionCompletions, courseProgress, communityGroups, recentMoods] = await Promise.all([
    db.moodEntry.count({ where: { userId } }),
    db.journalEntry.count({ where: { userId } }),
    db.missionCompletion.count({ where: { userId } }),
    db.courseProgress.count({ where: { userId, completed: true } }),
    db.groupMembership.count({ where: { userId } }),
    db.moodEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30, select: { createdAt: true } }),
  ]);

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

  return {
    streak,
    moodEntries: moodCount,
    journalEntries: journalCount,
    missionsCompleted: missionCompletions,
    lessonsCompleted: courseProgress,
    communityGroups,
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const [stats, existing] = await Promise.all([
    computeStats(userId),
    db.achievement.findMany({ where: { userId } }),
  ]);

  const earnedIds = new Set(existing.map((a) => a.badgeId));
  const newlyEligible = BADGE_DEFINITIONS.filter(
    (b) => !earnedIds.has(b.badgeId) && (BADGE_ELIGIBILITY[b.badgeId]?.(stats) ?? false)
  );

  let achievements = existing;
  if (newlyEligible.length > 0) {
    const created = await db.$transaction(
      newlyEligible.map((b) => db.achievement.create({ data: { userId, badgeId: b.badgeId } }))
    );
    achievements = [...existing, ...created];

    await Promise.all(
      newlyEligible.map((b) =>
        createNotification(userId, {
          title: "New milestone unlocked! 🏆",
          body: `${b.label} — ${b.desc}`,
          icon: "🏆",
          href: "/dashboard/achievements",
        }).catch(() => {})
      )
    );
  }

  return NextResponse.json({ achievements, newlyEarned: newlyEligible, stats });
}
