import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const logSchema = z.object({
  responseData: z.record(z.string(), z.any()).optional(),
});

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: challengeId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = logSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const challenge = await db.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

  const participant = await db.challengeParticipant.findUnique({
    where: { challengeId_userId: { challengeId, userId: session.user.id } },
  });
  if (!participant) return NextResponse.json({ error: "Join the challenge first" }, { status: 403 });

  if (participant.completedAt) {
    return NextResponse.json({ ok: true, alreadyLogged: true, progress: participant.progress, completed: true });
  }

  const start = todayStart();
  if (participant.lastLoggedAt && participant.lastLoggedAt >= start) {
    return NextResponse.json({ ok: true, alreadyLogged: true, progress: participant.progress, completed: false });
  }

  const nextProgress = Math.min(participant.progress + 1, challenge.totalDays);
  const justCompleted = nextProgress >= challenge.totalDays;

  await db.challengeParticipant.update({
    where: { id: participant.id },
    data: {
      progress: nextProgress,
      lastLoggedAt: new Date(),
      completedAt: justCompleted ? new Date() : undefined,
    },
  });

  if (justCompleted) {
    await db.user.update({ where: { id: session.user.id }, data: { xp: { increment: challenge.xpReward } } });
  }

  return NextResponse.json({ ok: true, progress: nextProgress, completed: justCompleted, xpEarned: justCompleted ? challenge.xpReward : 0 });
}
