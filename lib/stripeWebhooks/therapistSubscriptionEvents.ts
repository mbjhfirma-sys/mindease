import { db } from "@/lib/db";
import type Stripe from "stripe";
import { THERAPIST_PLANS } from "@/lib/therapistPlans";
import type { SubscriptionStatus } from "@prisma/client";

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
    case "paused":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "incomplete":
    default:
      return "incomplete";
  }
}

// Looked up via TherapistBilling.stripeCustomerId — a deliberately separate field and
// handler from the client-subscription path, so an event belonging to the other role is a
// safe no-op by construction (the lookup simply finds nothing) rather than by convention.
export async function handleTherapistSubscriptionEvent(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const billing = await db.therapistBilling.findUnique({ where: { stripeCustomerId: customerId } });
  if (!billing) return; // A customer this app doesn't recognize (e.g. a client's own subscription).

  if (event.type === "customer.subscription.deleted") {
    // Downgrade in place to exactly the steady state a fresh Starter signup already
    // produces (real, ongoing, Stripe-less), so reconcileSubscription's existing local
    // loop transparently takes back over with zero special-casing. Fresh period bounds
    // from now, not the old Stripe-driven ones — those are already stale by the time a
    // subscription is actually deleted (its final period has already ended). updateMany
    // (not update) so a replayed/out-of-order event with no matching row is a safe no-op.
    const now = new Date();
    const nextPeriodEnd = new Date(now);
    nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
    await db.therapistSubscription.updateMany({
      where: { therapistId: billing.therapistId, stripeSubscriptionId: subscription.id },
      data: {
        planId: "starter",
        priceCents: 0,
        status: "active",
        autoRenew: true,
        canceledAt: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
        currentPeriodStart: now,
        currentPeriodEnd: nextPeriodEnd,
      },
    });
    return;
  }

  const item = subscription.items.data[0];
  const priceId = item?.price.id;
  const plan = THERAPIST_PLANS.find((p) => p.stripePriceId === priceId);
  if (!plan || !item) return; // A price this app doesn't recognize as a therapist plan — ignore.

  const status = mapStatus(subscription.status);

  // Keyed on therapistId (not stripeSubscriptionId, unlike the client-side equivalent) —
  // every therapist already has exactly one TherapistSubscription row (therapistId
  // @unique) before this ever fires, since even Starter is a real, persisted row.
  await db.therapistSubscription.upsert({
    where: { therapistId: billing.therapistId },
    create: {
      therapistId: billing.therapistId,
      planId: plan.id,
      priceCents: plan.priceCents,
      status,
      autoRenew: !subscription.cancel_at_period_end,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId!,
      currentPeriodStart: new Date(item.current_period_start * 1000),
      currentPeriodEnd: new Date(item.current_period_end * 1000),
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
    update: {
      planId: plan.id,
      priceCents: plan.priceCents,
      status,
      autoRenew: !subscription.cancel_at_period_end,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId!,
      currentPeriodStart: new Date(item.current_period_start * 1000),
      currentPeriodEnd: new Date(item.current_period_end * 1000),
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
  });
}
