import { db } from "@/lib/db";
import { createInvoiceForPeriod } from "@/lib/subscriptionBilling";
import type Stripe from "stripe";

// invoice.subscription doesn't exist on this Stripe API version — the link moved to
// invoice.parent.subscription_details.subscription. Stripe's own Invoice.status has no
// "failed" value (draft|open|paid|uncollectible|void); this app's Invoice.status="failed"
// is derived from the event *type* (invoice.payment_failed), never read off Stripe's status.
export async function handleTherapistInvoiceEvent(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;
  const stripeSubscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
  if (!stripeSubscriptionId) return; // Not tied to a subscription — not our concern.

  let subscription = await db.therapistSubscription.findUnique({ where: { stripeSubscriptionId } });

  if (!subscription) {
    // Stripe doesn't guarantee delivery order between invoice.paid and
    // customer.subscription.created for the same checkout — fall back to a customer-scoped
    // lookup. TherapistBilling.stripeCustomerId is populated synchronously by the checkout
    // route itself, so it's always already there even when the subscription webhook isn't yet.
    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
    const billing = customerId ? await db.therapistBilling.findUnique({ where: { stripeCustomerId: customerId } }) : null;
    if (!billing) return; // Not a therapist customer (e.g. a client's own invoice) — ignore.

    subscription = await db.therapistSubscription.findUnique({ where: { therapistId: billing.therapistId } });
    if (!subscription) {
      // Genuinely not ready yet at the DB level (e.g. a brand-new therapist's very first
      // paid subscription, no prior Starter row to upgrade in place). Throw so the
      // dispatcher's existing fail-and-retry path hands this back to Stripe's own webhook
      // retry schedule, instead of silently dropping a real invoice.
      throw new Error(`No TherapistSubscription found yet for therapist ${billing.therapistId}`);
    }
  }

  // The invoice's own period_start/period_end mark when the invoice was generated, not the
  // service period it covers — for a brand-new subscription's first invoice they're identical
  // (a zero-length instant). Stripe's own docs say to use the line item's period instead.
  const linePeriod = invoice.lines.data[0]?.period;
  const periodStart = new Date((linePeriod?.start ?? invoice.period_start) * 1000);
  const periodEnd = new Date((linePeriod?.end ?? invoice.period_end) * 1000);

  if (event.type === "invoice.paid") {
    await createInvoiceForPeriod(subscription, periodStart, periodEnd, {
      amountCents: invoice.amount_paid,
      status: "paid",
      stripeInvoiceId: invoice.id,
    });
  } else if (event.type === "invoice.payment_failed") {
    await createInvoiceForPeriod(subscription, periodStart, periodEnd, {
      amountCents: invoice.amount_due,
      status: "failed",
      stripeInvoiceId: invoice.id,
    });
  }
}
