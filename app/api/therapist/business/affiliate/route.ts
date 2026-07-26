import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reconcileSubscription } from "@/lib/subscriptionBilling";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const redemptions = await db.couponRedemption.findMany({
    where: { coupon: { ownerTherapistId: therapist.id } },
    include: {
      redeemedBy: { select: { name: true, email: true } },
      coupon: { select: { code: true } },
      commissions: { select: { amountCents: true, currency: true, accruedAt: true } },
    },
    orderBy: { redeemedAt: "desc" },
  });

  // Commissions only accrue during subscription reconciliation, which normally happens when
  // the REFERRED therapist loads their own subscription/invoices page — reconcile each of
  // them here too, so the referrer's dashboard doesn't lag behind real elapsed time.
  const referredTherapistUserIds = redemptions.filter((r) => r.redeemedRole === "THERAPIST").map((r) => r.redeemedByUserId);
  if (referredTherapistUserIds.length > 0) {
    const referredSubscriptions = await db.therapistSubscription.findMany({
      where: { therapist: { userId: { in: referredTherapistUserIds } } },
      select: { id: true },
    });
    await Promise.all(referredSubscriptions.map((s) => reconcileSubscription(s.id)));
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [refreshedRedemptions, monthlyAgg, lifetimeAgg, pendingAgg] = await Promise.all([
    db.couponRedemption.findMany({
      where: { coupon: { ownerTherapistId: therapist.id } },
      include: {
        redeemedBy: { select: { name: true, email: true } },
        coupon: { select: { code: true } },
        commissions: { select: { amountCents: true, currency: true, accruedAt: true } },
      },
      orderBy: { redeemedAt: "desc" },
    }),
    db.affiliateCommission.aggregate({
      where: { ownerTherapistId: therapist.id, accruedAt: { gte: monthStart } },
      _sum: { amountCents: true },
    }),
    db.affiliateCommission.aggregate({
      where: { ownerTherapistId: therapist.id },
      _sum: { amountCents: true },
    }),
    db.affiliateCommission.aggregate({
      where: { ownerTherapistId: therapist.id, payoutId: null },
      _sum: { amountCents: true },
    }),
  ]);

  return NextResponse.json({
    referrals: refreshedRedemptions.map((r) => ({
      id: r.id,
      name: r.redeemedBy.name,
      email: r.redeemedBy.email,
      role: r.redeemedRole,
      couponCode: r.coupon.code,
      redeemedAt: r.redeemedAt,
      lifetimeCommissionCents: r.commissions.reduce((sum, c) => sum + c.amountCents, 0),
    })),
    monthlyCommissionCents: monthlyAgg._sum.amountCents ?? 0,
    lifetimeCommissionCents: lifetimeAgg._sum.amountCents ?? 0,
    pendingCommissionCents: pendingAgg._sum.amountCents ?? 0,
  });
}
