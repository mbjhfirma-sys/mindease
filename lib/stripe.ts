import Stripe from "stripe";

const globalForStripe = globalThis as unknown as { stripe: Stripe };

function createStripeClient(): Stripe {
  if (globalForStripe.stripe) return globalForStripe.stripe;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "Stripe is not configured (STRIPE_SECRET_KEY is missing) — billing features are unavailable."
    );
  }
  const client = new Stripe(process.env.STRIPE_SECRET_KEY);
  if (process.env.NODE_ENV !== "production") globalForStripe.stripe = client;
  return client;
}

// A Proxy defers actually constructing the Stripe client (and validating
// STRIPE_SECRET_KEY) until the first real call a request makes, rather than at
// module evaluation. Next.js evaluates every route's module graph at build time
// ("collecting page data") even for routes nobody has hit yet — eagerly
// constructing here meant a missing key failed the *entire* production build,
// not just the routes that actually touch Stripe.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = createStripeClient();
    return Reflect.get(client, prop, client);
  },
});
