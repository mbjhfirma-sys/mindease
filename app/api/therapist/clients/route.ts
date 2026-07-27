import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { computeConsecutiveDayStreak, resolveTimeZone, STREAK_LOOKBACK } from "@/lib/dateKey";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({
    where: { userId: session.user.id },
    include: {
      clients: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          plan: true,
          xp: true,
          level: true,
          createdAt: true,
          timezone: true,
          missionCompletions: {
            select: { id: true },
            orderBy: { completedAt: "desc" },
            take: 1,
          },
          moodEntries: {
            select: { score: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 7,
          },
        },
      },
    },
  });

  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const clientIds = therapist.clients.map((c) => c.id);
  const now = Date.now();
  const since30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const streakLookbackStart = new Date(now - STREAK_LOOKBACK * 24 * 60 * 60 * 1000);

  const [openFlags, recentCompletions, streakMoods, appointments] = await Promise.all([
    db.riskFlag.findMany({
      where: { userId: { in: clientIds }, status: "open" },
      select: { userId: true, severity: true },
    }),
    db.missionCompletion.findMany({
      where: { userId: { in: clientIds }, completedAt: { gte: since30 } },
      select: { userId: true, completedAt: true },
    }),
    db.moodEntry.findMany({
      where: { userId: { in: clientIds }, createdAt: { gte: streakLookbackStart } },
      select: { userId: true, createdAt: true },
    }),
    db.appointment.findMany({
      where: { clientId: { in: clientIds }, therapistId: therapist.id },
      select: { clientId: true, date: true, status: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const riskByUser = new Map<string, "medium" | "high">();
  for (const f of openFlags) {
    if (f.severity === "high") {
      riskByUser.set(f.userId, "high");
    } else if (f.severity === "moderate" && riskByUser.get(f.userId) !== "high") {
      riskByUser.set(f.userId, "medium");
    }
  }

  const activeDaysByUser = new Map<string, Set<string>>();
  for (const c of recentCompletions) {
    const dayKey = c.completedAt.toISOString().split("T")[0];
    if (!activeDaysByUser.has(c.userId)) activeDaysByUser.set(c.userId, new Set());
    activeDaysByUser.get(c.userId)!.add(dayKey);
  }

  const moodDatesByUser = new Map<string, Date[]>();
  for (const m of streakMoods) {
    if (!moodDatesByUser.has(m.userId)) moodDatesByUser.set(m.userId, []);
    moodDatesByUser.get(m.userId)!.push(m.createdAt);
  }

  const nowDate = new Date(now);
  const lastSessionByUser = new Map<string, Date>();
  const nextSessionByUser = new Map<string, Date>();
  for (const a of appointments) {
    if (a.status === "completed" && !lastSessionByUser.has(a.clientId)) {
      // appointments is ordered date desc, so the first "completed" hit per client is the most recent
      lastSessionByUser.set(a.clientId, a.date);
    }
    if (a.status === "confirmed" && a.date > nowDate) {
      const current = nextSessionByUser.get(a.clientId);
      if (!current || a.date < current) nextSessionByUser.set(a.clientId, a.date);
    }
  }

  const clients = therapist.clients.map((c) => {
    const daysSinceJoin = Math.max(1, Math.ceil((now - c.createdAt.getTime()) / (24 * 60 * 60 * 1000)));
    const windowDays = Math.min(30, daysSinceJoin);
    const activeDays = activeDaysByUser.get(c.id)?.size ?? 0;
    const missionCompletion = Math.round(Math.min(100, (activeDays / windowDays) * 100));
    const timeZone = resolveTimeZone(c.timezone);
    const streak = computeConsecutiveDayStreak(moodDatesByUser.get(c.id) ?? [], timeZone, nowDate);

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      avatar: c.avatar,
      plan: c.plan,
      xp: c.xp,
      level: c.level,
      joinedAt: c.createdAt,
      recentMoods: c.moodEntries.map((m) => ({ score: m.score, date: m.createdAt })),
      lastActivity: c.missionCompletions[0]?.id ? "recent" : "inactive",
      riskLevel: riskByUser.get(c.id) ?? "low",
      missionCompletion,
      streak,
      lastSession: lastSessionByUser.get(c.id) ?? null,
      nextSession: nextSessionByUser.get(c.id) ?? null,
    };
  });

  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const body = await req.json();
  const clientCode = typeof body.clientCode === "string" ? body.clientCode.trim().toUpperCase() : "";
  if (!clientCode) return NextResponse.json({ error: "Client code is required" }, { status: 400 });

  const client = await db.user.findUnique({ where: { clientCode }, select: { id: true, name: true, therapistId: true } });
  if (!client) return NextResponse.json({ error: "No user found with that client code" }, { status: 404 });
  if (client.therapistId === therapist.id) return NextResponse.json({ error: "This client is already linked to you" }, { status: 409 });
  if (client.therapistId) return NextResponse.json({ error: "This client is already linked to another therapist" }, { status: 409 });

  await db.user.update({ where: { id: client.id }, data: { therapistId: therapist.id } });

  return NextResponse.json({ ok: true, clientName: client.name });
}
