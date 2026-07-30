import { db } from "@/lib/db";
import type Stripe from "stripe";

export async function handleAccountUpdated(event: Stripe.Event): Promise<void> {
  const account = event.data.object as Stripe.Account;

  const billing = await db.therapistBilling.findUnique({ where: { stripeConnectAccountId: account.id } });
  if (!billing) return; // Event for an account this app doesn't (or no longer) recognize.

  await db.therapistBilling.update({
    where: { id: billing.id },
    data: {
      stripeConnectChargesEnabled: account.charges_enabled,
      stripeConnectPayoutsEnabled: account.payouts_enabled,
      stripeConnectDetailsSubmitted: account.details_submitted,
    },
  });
}
