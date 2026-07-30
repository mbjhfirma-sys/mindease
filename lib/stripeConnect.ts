import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

// Separate-charges-and-transfers model: the platform's own Stripe account charges the
// client, then a Transfer moves the therapist's net cut to their connected account — so
// the connected account only ever needs the transfers capability, never card_payments.
export async function createConnectAccountIfNeeded(therapistId: string): Promise<string> {
  const billing = await db.therapistBilling.findUnique({ where: { therapistId } });
  if (billing?.stripeConnectAccountId) return billing.stripeConnectAccountId;

  const therapist = await db.therapist.findUniqueOrThrow({
    where: { id: therapistId },
    include: { user: { select: { email: true } } },
  });

  const account = await stripe.accounts.create({
    type: "express",
    email: therapist.user.email,
    capabilities: { transfers: { requested: true } },
  });

  await db.therapistBilling.upsert({
    where: { therapistId },
    create: { therapistId, stripeConnectAccountId: account.id },
    update: { stripeConnectAccountId: account.id },
  });

  return account.id;
}

export async function createConnectOnboardingLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    return_url: returnUrl,
    refresh_url: refreshUrl,
  });
  return link.url;
}
