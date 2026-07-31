import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type Stripe from "stripe";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { planById } from "@/lib/therapistPlans";

const postSchema = z.object({ planId: z.enum(["professional", "practice"]) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const plan = planById(parsed.data.planId);
  if (!plan?.stripePriceId) return NextResponse.json({ error: "Plan not configured" }, { status: 500 });

  const therapist = await db.therapist.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { email: true, name: true } },
      subscription: { select: { stripeSubscriptionId: true } },
      billing: { select: { stripeCustomerId: true } },
    },
  });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });
  if (therapist.subscription?.stripeSubscriptionId) {
    return NextResponse.json({ error: "You already have an active subscription — use the switch action instead" }, { status: 400 });
  }

  // TherapistBilling may not exist yet (a therapist who's never touched Billing/Connect
  // settings) — unlike User, it isn't guaranteed to already have a row.
  let customerId = therapist.billing?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: therapist.user.email, name: therapist.user.name });
    customerId = customer.id;
    await db.therapistBilling.upsert({
      where: { therapistId: therapist.id },
      create: { therapistId: therapist.id, stripeCustomerId: customerId },
      update: { stripeCustomerId: customerId },
    });
  }

  const redemption = await db.couponRedemption.findUnique({
    where: { redeemedByUserId: session.user.id },
    include: { coupon: true },
  });
  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (redemption) {
    const stripeCoupon = await stripe.coupons.create(
      redemption.coupon.discountType === "percent"
        ? { percent_off: redemption.discountValueSnapshot, duration: "forever" }
        : { amount_off: redemption.discountValueSnapshot, currency: "usd", duration: "forever" }
    );
    discounts = [{ coupon: stripeCoupon.id }];
  }

  const origin = req.nextUrl.origin;
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    discounts,
    success_url: `${origin}/therapist/business/subscription?checkout=success`,
    cancel_url: `${origin}/therapist/business/subscription?checkout=canceled`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
