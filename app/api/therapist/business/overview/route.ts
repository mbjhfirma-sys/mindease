import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
const SPARK_BUCKETS = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({
    where: { userId: session.user.id },
    include: { clients: { select: { id: true } } },
  });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const rangeParam = req.nextUrl.searchParams.get("range") ?? "30d";
  const days = RANGE_DAYS[rangeParam] ?? 30;
  const now = new Date();
  const since = new Date(now.getTime() - days * DAY_MS);
  const prevSince = new Date(now.getTime() - days * 2 * DAY_MS);

  const [billing, periodEarnings, prevPeriodAgg, pendingEarnings, pendingCommissions] = await Promise.all([
    db.therapistBilling.findUnique({ where: { therapistId: therapist.id } }),
    db.sessionEarning.findMany({
      where: { therapistId: therapist.id, sessionDate: { gte: since, lte: now } },
      orderBy: { sessionDate: "desc" },
      select: {
        id: true,
        sessionDate: true,
        durationMinutes: true,
        ratePerMinuteCents: true,
        netAmountCents: true,
        currency: true,
        clientId: true,
        payoutId: true,
        client: { select: { name: true } },
        payout: { select: { status: true } },
      },
    }),
    db.sessionEarning.aggregate({
      where: { therapistId: therapist.id, sessionDate: { gte: prevSince, lt: since } },
      _sum: { netAmountCents: true },
    }),
    db.sessionEarning.findMany({ where: { therapistId: therapist.id, payoutId: null }, select: { id: true, netAmountCents: true } }),
    db.affiliateCommission.findMany({ where: { ownerTherapistId: therapist.id, payoutId: null }, select: { id: true, amountCents: true } }),
  ]);

  // Daily buckets drive the main chart at whatever granularity the range implies (7, 30, or 90 points).
  const revenueTrend = Array.from({ length: days }, (_, i) => ({
    date: new Date(since.getTime() + i * DAY_MS).toISOString().slice(0, 10),
    cents: 0,
  }));
  // A fixed 6-bucket rollup (floating-point width, not calendar-aligned) feeds the stat-tile sparklines
  // at any range — calendar buckets would leave a partial trailing bucket that always reads as a cliff-drop.
  const bucketMs = (days * DAY_MS) / SPARK_BUCKETS;
  const sessionsTrend = new Array(SPARK_BUCKETS).fill(0);
  const avgValueSum = new Array(SPARK_BUCKETS).fill(0);
  const avgValueCount = new Array(SPARK_BUCKETS).fill(0);
  const clientTotals = new Map<string, { id: string; name: string; cents: number; count: number }>();

  for (const e of periodEarnings) {
    const offset = e.sessionDate.getTime() - since.getTime();
    const dayIdx = Math.min(days - 1, Math.max(0, Math.floor(offset / DAY_MS)));
    revenueTrend[dayIdx].cents += e.netAmountCents;

    const bucketIdx = Math.min(SPARK_BUCKETS - 1, Math.max(0, Math.floor(offset / bucketMs)));
    sessionsTrend[bucketIdx] += 1;
    avgValueSum[bucketIdx] += e.netAmountCents;
    avgValueCount[bucketIdx] += 1;

    const existing = clientTotals.get(e.clientId);
    if (existing) { existing.cents += e.netAmountCents; existing.count += 1; }
    else clientTotals.set(e.clientId, { id: e.clientId, name: e.client.name, cents: e.netAmountCents, count: 1 });
  }
  const avgValueTrend = avgValueSum.map((sum, i) => (avgValueCount[i] > 0 ? Math.round(sum / avgValueCount[i]) : 0));

  const totalCents = periodEarnings.reduce((sum, e) => sum + e.netAmountCents, 0);
  const prevTotalCents = prevPeriodAgg._sum.netAmountCents ?? 0;
  const changePct = prevTotalCents > 0 ? Math.round(((totalCents - prevTotalCents) / prevTotalCents) * 100) : totalCents > 0 ? 100 : 0;
  const sessionCount = periodEarnings.length;
  const avgSessionValueCents = sessionCount > 0 ? Math.round(totalCents / sessionCount) : 0;

  const leaderboard = [...clientTotals.values()].sort((a, b) => b.cents - a.cents);

  return NextResponse.json({
    currency: billing?.currency ?? "USD",
    ratePerMinuteCents: billing?.ratePerMinuteCents ?? null,
    range: rangeParam,
    pendingPayoutCents:
      pendingEarnings.reduce((sum, e) => sum + e.netAmountCents, 0) + pendingCommissions.reduce((sum, c) => sum + c.amountCents, 0),
    pendingEarningIds: pendingEarnings.map((e) => e.id),
    pendingCommissionIds: pendingCommissions.map((c) => c.id),
    totalCents,
    changePct,
    sessionCount,
    avgSessionValueCents,
    activeClientCount: therapist.clients.length,
    sessionsTrend,
    avgValueTrend,
    revenueTrend,
    leaderboard,
    transactions: periodEarnings.map((e) => ({
      id: e.id,
      clientName: e.client.name,
      sessionDate: e.sessionDate,
      durationMinutes: e.durationMinutes,
      ratePerMinuteCents: e.ratePerMinuteCents,
      netAmountCents: e.netAmountCents,
      currency: e.currency,
      status: e.payoutId == null ? "available" : e.payout?.status === "paid" ? "paid" : "requested",
    })),
  });
}
