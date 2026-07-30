import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { planById } from "@/lib/clientPlans";

const patchSchema = z.object({ planId: z.enum(["growth", "premium"]) });

// Switches between two already-active paid plans directly via the Stripe API rather than
// the Billing Portal — Stripe's portal only exposes plan-switching when explicitly
// configured per-product in the Dashboard, an external setup step this avoids entirely.
// Stripe's own customer.subscription.updated webhook (already handled) does the actual
// ClientSubscription/User.plan sync once this update lands.
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const plan = planById(parsed.data.planId);
  if (!plan.stripePriceId) return NextResponse.json({ error: "Plan not configured" }, { status: 500 });

  const existing = await db.clientSubscription.findUnique({ where: { userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "No active subscription to switch — use checkout instead" }, { status: 400 });

  const subscription = await stripe.subscriptions.retrieve(existing.stripeSubscriptionId);
  const currentItem = subscription.items.data[0];

  await stripe.subscriptions.update(existing.stripeSubscriptionId, {
    items: [{ id: currentItem.id, price: plan.stripePriceId }],
    proration_behavior: "create_prorations",
  });

  return NextResponse.json({ ok: true });
}
