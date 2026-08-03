import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type Stripe from "stripe";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { planById } from "@/lib/clientPlans";

const postSchema = z.object({
  planId: z.enum(["growth", "premium"]),
  billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const plan = planById(parsed.data.planId);
  const priceId = parsed.data.billingCycle === "annual" ? plan.stripePriceIdAnnual : plan.stripePriceId;
  if (!priceId) return NextResponse.json({ error: "Plan not configured" }, { status: 500 });

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    include: { couponRedemption: { include: { coupon: true } } },
  });

  // Created lazily on first Checkout/Portal touch — never fabricated for a user who's
  // never interacted with billing.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name });
    customerId = customer.id;
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (user.couponRedemption) {
    const { coupon: redeemedCoupon, discountValueSnapshot } = user.couponRedemption;
    const stripeCoupon = await stripe.coupons.create(
      redeemedCoupon.discountType === "percent"
        ? { percent_off: discountValueSnapshot, duration: "forever" }
        : { amount_off: discountValueSnapshot, currency: "usd", duration: "forever" }
    );
    discounts = [{ coupon: stripeCoupon.id }];
  }

  const origin = req.nextUrl.origin;
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    discounts,
    success_url: `${origin}/dashboard/settings?tab=subscription&checkout=success`,
    cancel_url: `${origin}/dashboard/settings?tab=subscription&checkout=canceled`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
