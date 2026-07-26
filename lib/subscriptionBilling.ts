import { db } from "@/lib/db";
import type { TherapistSubscription } from "@prisma/client";

const MAX_RECONCILE_ITERATIONS = 36; // safety guard against runaway catch-up loops

function addCycle(date: Date, cycle: "monthly" | "annual"): Date {
  const next = new Date(date);
  if (cycle === "annual") next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

// Creates (idempotently) the Invoice for one billing period and, if this therapist was
// referred by another therapist's coupon, accrues that referrer's affiliate commission on
// it — the one real, persisted trigger for affiliate earnings. Used both by the initial
// subscribe (which seeds the first period's invoice immediately) and by reconciliation
// (which creates each subsequent period's invoice once it has actually elapsed), so the
// commission logic never gets bypassed by either path.
export async function createInvoiceForPeriod(subscription: TherapistSubscription, periodStart: Date, periodEnd: Date) {
  const invoice = await db.invoice.upsert({
    where: { subscriptionId_periodStart: { subscriptionId: subscription.id, periodStart } },
    create: {
      subscriptionId: subscription.id,
      therapistId: subscription.therapistId,
      periodStart,
      periodEnd,
      amountCents: subscription.priceCents,
      currency: subscription.currency,
      status: "paid",
    },
    update: {},
  });

  const therapist = await db.therapist.findUnique({ where: { id: subscription.therapistId }, select: { userId: true } });
  const redemption = therapist
    ? await db.couponRedemption.findUnique({
        where: { redeemedByUserId: therapist.userId },
        include: { coupon: true },
      })
    : null;

  if (redemption && redemption.redeemedRole === "THERAPIST") {
    await db.affiliateCommission.upsert({
      where: { invoiceId: invoice.id },
      create: {
        redemptionId: redemption.id,
        invoiceId: invoice.id,
        ownerTherapistId: redemption.coupon.ownerTherapistId,
        amountCents: Math.round((invoice.amountCents * redemption.coupon.commissionBps) / 10000),
        currency: invoice.currency,
      },
      update: {},
    });
  }

  return invoice;
}

// Creates one Invoice per fully-elapsed billing period since the subscription was last
// reconciled, so numbers always reflect real elapsed time rather than being pre-generated.
// Idempotent via Invoice's @@unique([subscriptionId, periodStart]) — safe to call on every read.
export async function reconcileSubscription(subscriptionId: string): Promise<TherapistSubscription | null> {
  let subscription: TherapistSubscription | null = await db.therapistSubscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription || subscription.status !== "active") return subscription;

  let iterations = 0;
  const now = new Date();

  while (subscription.currentPeriodEnd <= now && iterations < MAX_RECONCILE_ITERATIONS) {
    iterations++;
    const periodStart: Date = subscription.currentPeriodStart;
    const periodEnd: Date = subscription.currentPeriodEnd;

    await createInvoiceForPeriod(subscription, periodStart, periodEnd);

    if (!subscription.autoRenew) {
      subscription = await db.therapistSubscription.update({
        where: { id: subscriptionId },
        data: { status: "canceled", canceledAt: periodEnd },
      });
      break;
    }

    const nextStart: Date = periodEnd;
    const nextEnd = addCycle(nextStart, subscription.billingCycle);
    subscription = await db.therapistSubscription.update({
      where: { id: subscriptionId },
      data: { currentPeriodStart: nextStart, currentPeriodEnd: nextEnd },
    });
  }

  return subscription;
}
