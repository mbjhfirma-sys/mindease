import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7; // JS getDay(): 0=Sun..6=Sat -> 0=Mon..6=Sun
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({
    where: { userId: session.user.id },
    include: { clients: { select: { id: true } } },
  });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const rangeParam = req.nextUrl.searchParams.get("range") ?? "7d";
  const days = RANGE_DAYS[rangeParam] ?? 7;
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const clientIds = therapist.clients.map((c) => c.id);

  const [appointments, missionCompletions] = await Promise.all([
    db.appointment.findMany({
      where: { therapistId: therapist.id, date: { gte: since, lte: now } },
      select: { date: true, status: true },
    }),
    clientIds.length > 0
      ? db.missionCompletion.findMany({
          where: { userId: { in: clientIds }, completedAt: { gte: since, lte: now } },
          select: { completedAt: true },
        })
      : Promise.resolve([]),
  ]);

  const engagement = WEEKDAY_LABELS.map((day) => ({ day, sessions: 0, missions: 0 }));
  let attended = 0, cancelled = 0, noShow = 0;

  for (const a of appointments) {
    if (a.status === "completed") {
      engagement[weekdayIndex(a.date)].sessions += 1;
      attended += 1;
    } else if (a.status === "cancelled") {
      cancelled += 1;
    } else if (a.status === "no_show") {
      noShow += 1;
    }
  }

  for (const m of missionCompletions) {
    engagement[weekdayIndex(m.completedAt)].missions += 1;
  }

  const total = attended + cancelled + noShow;

  return NextResponse.json({
    engagement,
    attendance: { total, attended, cancelled, noShow },
  });
}
