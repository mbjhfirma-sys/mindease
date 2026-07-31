import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { reconcileSubscription, createInvoiceForPeriod } from "@/lib/subscriptionBilling";
import { THERAPIST_PLANS, planById } from "@/lib/therapistPlans";

async function getTherapist(userId: string) {
  return db.therapist.findUnique({ where: { userId } });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await getTherapist(session.user.id);
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const existing = await db.therapistSubscription.findUnique({ where: { therapistId: therapist.id } });
  const subscription = existing ? await reconcileSubscription(existing.id) : null;

  return NextResponse.json({ subscription, plans: THERAPIST_PLANS });
}

// Starter only — paid tiers now go through /checkout, which creates a real Stripe
// subscription. Leaving this accepting all 3 tiers (as it did before real billing existed)
// would let a raw POST {planId:"practice"} hand out a paid tier for free.
const postSchema = z.object({ planId: z.enum(["starter"]) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await getTherapist(session.user.id);
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const existing = await db.therapistSubscription.findUnique({ where: { therapistId: therapist.id } });
  if (existing) return NextResponse.json({ error: "Subscription already exists — use PATCH to change plan" }, { status: 400 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const plan = planById(parsed.data.planId);
  if (!plan) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const subscription = await db.therapistSubscription.create({
    data: {
      therapistId: therapist.id,
      planId: plan.id,
      priceCents: plan.priceCents,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  // Seed the first period's invoice immediately (and accrue any referral commission on it)
  // rather than waiting for reconciliation to catch up a full cycle later.
  await createInvoiceForPeriod(subscription, now, periodEnd);

  return NextResponse.json({ subscription });
}

const patchSchema = z.object({
  planId: z.enum(["starter", "professional", "practice"]).optional(),
  autoRenew: z.boolean().optional(),
  cancel: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await getTherapist(session.user.id);
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const existing = await db.therapistSubscription.findUnique({ where: { therapistId: therapist.id } });
  if (!existing) return NextResponse.json({ error: "No subscription yet" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (!existing.stripeSubscriptionId) {
    // Starter-local path — unchanged behavior from before real billing existed.
    if (parsed.data.planId && parsed.data.planId !== "starter") {
      return NextResponse.json({ error: "Use /checkout to subscribe to a paid plan" }, { status: 400 });
    }
    const data: { autoRenew?: boolean; status?: "active" | "canceled"; canceledAt?: Date } = {};
    if (parsed.data.autoRenew !== undefined) data.autoRenew = parsed.data.autoRenew;
    if (parsed.data.cancel) {
      data.status = "canceled";
      data.canceledAt = new Date();
    }
    const subscription = await db.therapistSubscription.update({ where: { id: existing.id }, data });
    return NextResponse.json({ subscription });
  }

  // Real, Stripe-backed subscription — every change below is a direct Stripe API call; the
  // webhook (not this route) is what ever writes the resulting state back to the DB.
  if (parsed.data.planId === "professional" || parsed.data.planId === "practice") {
    const plan = planById(parsed.data.planId);
    if (!plan?.stripePriceId) return NextResponse.json({ error: "Plan not configured" }, { status: 500 });
    const stripeSub = await stripe.subscriptions.retrieve(existing.stripeSubscriptionId);
    const currentItem = stripeSub.items.data[0];
    await stripe.subscriptions.update(existing.stripeSubscriptionId, {
      items: [{ id: currentItem.id, price: plan.stripePriceId }],
      proration_behavior: "create_prorations",
    });
    return NextResponse.json({ ok: true, pending: true });
  }

  if (parsed.data.planId === "starter" || parsed.data.cancel || parsed.data.autoRenew !== undefined) {
    // "Downgrade to Starter," the explicit Cancel action, and the autoRenew toggle all
    // collapse into the same real operation on a Stripe-backed row — Stripe's own default
    // Portal cancel button schedules at period end too, it doesn't cancel immediately.
    const cancelAtPeriodEnd = parsed.data.planId === "starter" || parsed.data.cancel === true
      ? true
      : parsed.data.autoRenew === false;
    await stripe.subscriptions.update(existing.stripeSubscriptionId, { cancel_at_period_end: cancelAtPeriodEnd });
    return NextResponse.json({ ok: true, pending: true });
  }

  return NextResponse.json({ error: "No changes requested" }, { status: 400 });
}
