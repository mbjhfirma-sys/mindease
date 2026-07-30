import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { notifyAdmins } from "@/lib/notify";
import type { SessionChargeOutcomeReason } from "@prisma/client";

// Resolves a SessionCharge to its terminal state for a given appointment outcome. A failed
// Stripe call must not be silently swallowed the way a notification failure is — on error,
// SessionCharge.status stays at its prior non-terminal value ("paid") so a stuck settlement
// is visible, not lost, and an admin is paged for manual review.
export async function settleSessionCharge(
  appointmentId: string,
  outcomeReason: SessionChargeOutcomeReason
): Promise<void> {
  const charge = await db.sessionCharge.findUnique({ where: { appointmentId } });
  if (!charge || charge.status !== "paid") return; // No real charge, or already resolved.

  try {
    if (charge.fundingSource === "premium_credit") {
      // No money ever moves for a credit-funded session either way — an early cancellation
      // just releases the month's credit for a rebooking; a late one/no-show/completion
      // simply records why, since the therapist was never paid separately for it.
      if (outcomeReason === "early_cancellation") {
        await db.clientSessionCredit.deleteMany({ where: { appointmentId } });
      }
      await db.sessionCharge.update({ where: { id: charge.id }, data: { outcomeReason } });
      return;
    }

    if (outcomeReason === "early_cancellation") {
      const refund = await stripe.refunds.create({ payment_intent: charge.stripePaymentIntentId! });
      await db.sessionCharge.update({
        where: { id: charge.id },
        data: { status: "refunded", outcomeReason, stripeRefundId: refund.id },
      });
      return;
    }

    if (outcomeReason === "late_cancellation" || outcomeReason === "no_show") {
      // Forfeiture: an immediate, standalone Transfer — independent of the normal batched
      // payout flow a completed session's SessionEarning goes through later.
      const billing = await db.therapistBilling.findUnique({ where: { therapistId: charge.therapistId } });
      if (!billing?.stripeConnectAccountId) throw new Error("Therapist has no connected payout account");

      const transfer = await stripe.transfers.create({
        amount: charge.therapistAmountCents,
        currency: charge.currency,
        destination: billing.stripeConnectAccountId,
      });
      await db.sessionCharge.update({
        where: { id: charge.id },
        data: { status: "transferred", outcomeReason, stripeTransferId: transfer.id },
      });
      return;
    }

    // "completed" — money stays put. The existing SessionEarning/Payout batch flow
    // (untouched) is what eventually moves it, at which point the payout route flips
    // this same SessionCharge to "transferred" too.
    await db.sessionCharge.update({ where: { id: charge.id }, data: { outcomeReason } });
  } catch (err) {
    console.error("[settleSessionCharge] failed", appointmentId, outcomeReason, err);
    await notifyAdmins({
      title: "Session settlement failed",
      body: `Couldn't settle a session charge (${outcomeReason}) for appointment ${appointmentId}. Needs manual review.`,
      icon: "⚠️",
      href: "/admin",
    }).catch(() => {});
  }
}
