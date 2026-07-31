import { db } from "@/lib/db";
import type Stripe from "stripe";
import { handleAccountUpdated } from "./connectEvents";
import { handleSubscriptionEvent } from "./subscriptionEvents";
import { handleTherapistSubscriptionEvent } from "./therapistSubscriptionEvents";
import { handleTherapistInvoiceEvent } from "./therapistInvoiceEvents";
import { handleCheckoutSessionCompleted } from "./paymentEvents";

const SUBSCRIPTION_EVENT_TYPES = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

const THERAPIST_INVOICE_EVENT_TYPES = new Set(["invoice.paid", "invoice.payment_failed"]);

export async function dispatchStripeEvent(event: Stripe.Event): Promise<void> {
  try {
    await db.stripeWebhookEvent.create({ data: { stripeEventId: event.id, type: event.type } });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") return; // already processed successfully
    throw err;
  }

  try {
    // Per-event-type handlers are added here as each capability ships (Connect
    // onboarding, client subscriptions, per-session payments) — an event type with
    // no handler yet is correctly a no-op, not an error.
    if (event.type === "account.updated") await handleAccountUpdated(event);
    else if (SUBSCRIPTION_EVENT_TYPES.has(event.type)) {
      // Both handlers run for every subscription event — each is a safe no-op for events
      // belonging to the other role, since its own customer-ID lookup simply finds nothing.
      await handleSubscriptionEvent(event);
      await handleTherapistSubscriptionEvent(event);
    }
    else if (THERAPIST_INVOICE_EVENT_TYPES.has(event.type)) await handleTherapistInvoiceEvent(event);
    else if (event.type === "checkout.session.completed") await handleCheckoutSessionCompleted(event);
  } catch (err) {
    // A failed handler must not leave a phantom "processed" row behind, or Stripe's
    // automatic retry would be silently swallowed by the dedup check above next time.
    await db.stripeWebhookEvent.delete({ where: { stripeEventId: event.id } }).catch(() => {});
    throw err;
  }
}
