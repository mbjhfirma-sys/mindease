import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Not a therapist" }, { status: 403 });

  const client = await db.user.findFirst({
    where: { id: clientId, therapistId: therapist.id },
    select: {
      id: true, name: true, email: true, avatar: true, plan: true, level: true, xp: true, createdAt: true,
      privacyPrefs: true,
      moodEntries: { select: { score: true, note: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 14 },
      journalEntries: { select: { id: true, title: true, content: true, mood: true, emotions: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 20 },
      missionCompletions: {
        select: { id: true, completedAt: true, responseData: true, mission: { select: { id: true, title: true, category: true, xp: true, activityType: true } } },
        orderBy: { completedAt: "desc" },
        take: 30,
      },
      clientAppointments: {
        where: { therapistId: therapist.id },
        select: { id: true, date: true, duration: true, type: true, status: true, notes: true },
        orderBy: { date: "desc" },
        take: 20,
      },
      assessmentResults: {
        select: { id: true, assessmentId: true, score: true, label: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      clientIntake: {
        select: {
          concerns: true, languagePreference: true, genderPreference: true,
          ageRange: true, priorTherapyExperience: true, goals: true, modalityPreference: true,
        },
      },
    },
  });

  if (!client) return NextResponse.json({ error: "Client not found or not assigned" }, { status: 404 });

  const privacyPrefs = (client.privacyPrefs as Record<string, boolean> | null) ?? {};
  const shareJournal = privacyPrefs.shareJournalWithTherapist === true;

  const moodScores = client.moodEntries.map((m) => m.score);
  const moodAvg = moodScores.length
    ? parseFloat((moodScores.reduce((s, v) => s + v, 0) / moodScores.length).toFixed(1))
    : 0;

  return NextResponse.json({
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      avatar: client.avatar,
      plan: client.plan,
      level: client.level,
      xp: client.xp,
      memberSince: client.createdAt,
      moodHistory: client.moodEntries.map((m) => ({ score: m.score, note: m.note, date: m.createdAt })),
      moodAvg,
      journalEntries: shareJournal ? client.journalEntries : [],
      journalShared: shareJournal,
      missionCompletions: client.missionCompletions,
      appointments: client.clientAppointments,
      assessmentResults: client.assessmentResults,
      intake: client.clientIntake,
    },
  });
}
