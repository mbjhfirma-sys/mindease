import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { computeConsecutiveDayStreak, resolveTimeZone, STREAK_LOOKBACK } from "@/lib/dateKey";

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
      id: true, name: true, email: true, avatar: true, plan: true, createdAt: true,
      timezone: true,
      privacyPrefs: true,
      moodEntries: { select: { score: true, note: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 14 },
      journalEntries: { select: { id: true, title: true, content: true, mood: true, emotions: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 20 },
      missionCompletions: {
        select: { id: true, completedAt: true, responseData: true, mission: { select: { id: true, title: true, category: true, activityType: true } } },
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
          affirmingCarePreferences: true, genderIdentity: true, preferredCommunication: true,
          takingMedication: true, relationshipStatus: true,
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

  const streakLookbackStart = new Date(Date.now() - STREAK_LOOKBACK * 24 * 60 * 60 * 1000);
  const [openRiskFlags, streakMoods, activeStepUpWindow, matchReasoning, pendingFeedback] = await Promise.all([
    db.riskFlag.findMany({
      where: { userId: clientId, status: "open" },
      select: { id: true, source: true, severity: true, detail: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    db.moodEntry.findMany({
      where: { userId: clientId, createdAt: { gte: streakLookbackStart } },
      select: { createdAt: true },
    }),
    db.riskStepUpWindow.findFirst({
      where: { userId: clientId, status: "active" },
      select: { id: true, windowEnd: true, contactLabel: true, checkInIntervalHrs: true },
    }),
    db.matchReasoning.findUnique({
      where: { clientId },
      select: { method: true, totalScore: true, factors: true, createdAt: true, therapistId: true },
    }),
    db.matchFeedback.findUnique({
      where: { clientId_therapistId_respondentId: { clientId, therapistId: therapist.id, respondentId: session.user.id } },
      select: { id: true, status: true },
    }),
  ]);

  const riskLevel = openRiskFlags.some((f) => f.severity === "high")
    ? "high"
    : openRiskFlags.some((f) => f.severity === "moderate")
    ? "medium"
    : "low";
  const timeZone = resolveTimeZone(client.timezone);
  const streak = computeConsecutiveDayStreak(streakMoods.map((m) => m.createdAt), timeZone);

  // A reasoning snapshot from a PREVIOUS therapist relationship (before a since-happened
  // switch) shouldn't be shown as if it explains the current match — this route only
  // ever returns a client already confirmed assigned to this calling therapist.
  const currentMatchReasoning = matchReasoning && matchReasoning.therapistId === therapist.id
    ? { method: matchReasoning.method, totalScore: matchReasoning.totalScore, factors: matchReasoning.factors, createdAt: matchReasoning.createdAt }
    : null;

  return NextResponse.json({
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      avatar: client.avatar,
      plan: client.plan,
      memberSince: client.createdAt,
      moodHistory: client.moodEntries.map((m) => ({ score: m.score, note: m.note, date: m.createdAt })),
      moodAvg,
      streak,
      riskLevel,
      riskFlags: openRiskFlags,
      activeStepUpWindow,
      matchReasoning: currentMatchReasoning,
      pendingMatchFeedbackId: pendingFeedback?.status === "pending" ? pendingFeedback.id : null,
      journalEntries: shareJournal ? client.journalEntries : [],
      journalShared: shareJournal,
      missionCompletions: client.missionCompletions,
      appointments: client.clientAppointments,
      assessmentResults: client.assessmentResults,
      intake: client.clientIntake,
    },
  });
}
