import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [billing, allTimeAgg, monthAgg, monthCount, pendingEarningsAgg, pendingCommissionsAgg] = await Promise.all([
    db.therapistBilling.findUnique({ where: { therapistId: therapist.id } }),
    db.sessionEarning.aggregate({ where: { therapistId: therapist.id }, _sum: { netAmountCents: true } }),
    db.sessionEarning.aggregate({
      where: { therapistId: therapist.id, sessionDate: { gte: monthStart } },
      _sum: { netAmountCents: true },
    }),
    db.sessionEarning.count({ where: { therapistId: therapist.id, sessionDate: { gte: monthStart } } }),
    db.sessionEarning.aggregate({
      where: { therapistId: therapist.id, payoutId: null },
      _sum: { netAmountCents: true },
    }),
    db.affiliateCommission.aggregate({
      where: { ownerTherapistId: therapist.id, payoutId: null },
      _sum: { amountCents: true },
    }),
  ]);

  const allTimeCents = allTimeAgg._sum.netAmountCents ?? 0;
  const monthCents = monthAgg._sum.netAmountCents ?? 0;
  const allTimeCount = await db.sessionEarning.count({ where: { therapistId: therapist.id } });

  return NextResponse.json({
    currency: billing?.currency ?? "USD",
    ratePerMinuteCents: billing?.ratePerMinuteCents ?? null,
    revenue: {
      monthCents,
      allTimeCents,
      sessionsThisMonth: monthCount,
      avgSessionValueCents: allTimeCount > 0 ? Math.round(allTimeCents / allTimeCount) : 0,
    },
    pendingPayoutCents: (pendingEarningsAgg._sum.netAmountCents ?? 0) + (pendingCommissionsAgg._sum.amountCents ?? 0),
  });
}
