import { db } from "@/lib/db";
import type Stripe from "stripe";

// Subscription-mode Checkout Sessions are handled entirely via customer.subscription.*
// events (which carry everything needed) — this only concerns payment-mode sessions,
// i.e. real per-session charges. Confirming the SessionCharge is paid does not itself
// confirm the appointment — it only lifts the payment gate blocking the therapist from
// being able to confirm it through their existing workflow.
export async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode !== "payment") return;

  const sessionChargeId = session.metadata?.sessionChargeId;
  if (!sessionChargeId) return;

  const charge = await db.sessionCharge.findUnique({ where: { id: sessionChargeId } });
  if (!charge || charge.status !== "requires_payment") return;

  await db.sessionCharge.update({
    where: { id: sessionChargeId },
    data: {
      status: "paid",
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
    },
  });
}
