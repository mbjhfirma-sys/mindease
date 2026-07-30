import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { dispatchStripeEvent } from "@/lib/stripeWebhooks/dispatch";

// Not behind proxy.ts's PROTECTED map (only /dashboard, /therapist, /admin, /api/admin
// are gated) — same shape as the cron routes passing through unauthenticated and
// checking their own secret, except this checks a cryptographic signature instead of
// a bearer token.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  // Signature verification needs the raw, unparsed body — never req.json() here.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[/api/webhooks/stripe] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await dispatchStripeEvent(event);

  return NextResponse.json({ received: true });
}
