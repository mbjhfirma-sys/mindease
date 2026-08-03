import { db } from "@/lib/db";
import type Stripe from "stripe";
import { CLIENT_PLANS } from "@/lib/clientPlans";
import type { ClientSubscriptionStatus } from "@prisma/client";

function mapStatus(status: Stripe.Subscription.Status): ClientSubscriptionStatus {
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

export async function handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const user = await db.user.findUnique({ where: { stripeCustomerId: customerId } });
  if (!user) return; // A customer this app doesn't recognize (e.g. a future therapist-side subscription).

  if (event.type === "customer.subscription.deleted") {
    await db.$transaction([
      db.clientSubscription.deleteMany({ where: { stripeSubscriptionId: subscription.id } }),
      db.user.update({ where: { id: user.id }, data: { plan: "free" } }),
    ]);
    return;
  }

  const item = subscription.items.data[0];
  const priceId = item?.price.id;
  // Matches either cycle's price ID — a plan's annual price is a real, separate Stripe Price
  // (see lib/clientPlans.ts), not something inferred from interval/amount.
  const plan = CLIENT_PLANS.find((p) => p.stripePriceId === priceId || p.stripePriceIdAnnual === priceId);
  if (!plan || !item) return; // A price this app doesn't recognize as a client plan — ignore.

  const status = mapStatus(subscription.status);
  const priceCents = priceId === plan.stripePriceIdAnnual ? (plan.annualPriceCents ?? plan.priceCents) : plan.priceCents;

  await db.$transaction([
    db.clientSubscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        userId: user.id,
        planId: plan.id,
        priceCents,
        status,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId!,
        currentPeriodStart: new Date(item.current_period_start * 1000),
        currentPeriodEnd: new Date(item.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      },
      update: {
        planId: plan.id,
        priceCents,
        status,
        stripePriceId: priceId!,
        currentPeriodStart: new Date(item.current_period_start * 1000),
        currentPeriodEnd: new Date(item.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      },
    }),
    db.user.update({ where: { id: user.id }, data: { plan: status === "active" ? plan.id : "free" } }),
  ]);
}
