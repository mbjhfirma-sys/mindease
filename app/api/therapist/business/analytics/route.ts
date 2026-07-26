import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
const BUCKET_COUNT = 7; // fixed chart width regardless of range, avoids a 90-bar chart

function fmtLabel(d: Date, days: number): string {
  return days <= 7
    ? d.toLocaleDateString("en-US", { weekday: "short" })
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, include: { clients: { select: { id: true } } } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const rangeParam = req.nextUrl.searchParams.get("range") ?? "30d";
  const days = RANGE_DAYS[rangeParam] ?? 30;
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const bucketMs = (days * 24 * 60 * 60 * 1000) / BUCKET_COUNT;

  const earnings = await db.sessionEarning.findMany({
    where: { therapistId: therapist.id, sessionDate: { gte: since, lte: now } },
    select: { sessionDate: true, netAmountCents: true },
  });

  const buckets = Array.from({ length: BUCKET_COUNT }, (_, i) => {
    const bucketStart = new Date(since.getTime() + i * bucketMs);
    return { label: fmtLabel(bucketStart, days), cents: 0 };
  });
  for (const e of earnings) {
    const offset = e.sessionDate.getTime() - since.getTime();
    const idx = Math.min(BUCKET_COUNT - 1, Math.max(0, Math.floor(offset / bucketMs)));
    buckets[idx].cents += e.netAmountCents;
  }

  const totalCents = earnings.reduce((sum, e) => sum + e.netAmountCents, 0);
  const activeClientCount = therapist.clients.length;
  const sessionCount = earnings.length;

  return NextResponse.json({
    range: rangeParam,
    revenueTrend: buckets,
    totalCents,
    sessionCount,
    activeClientCount,
    avgSessionValueCents: sessionCount > 0 ? Math.round(totalCents / sessionCount) : 0,
  });
}
