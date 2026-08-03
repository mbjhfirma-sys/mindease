// A therapist's own self-set maxClients can only ever set a *lower* personal preference
// than their plan allows, never exceed it — Starter's real ceiling of 5 always wins over a
// higher (or unset/unlimited) self-set value.
//
// A therapist only gets a real TherapistSubscription row once they've explicitly touched
// Settings -> Subscription (POST /api/therapist/business/subscription, or a paid Stripe
// checkout) — Starter itself is deliberately represented as the *absence* of a row (see
// lib/therapistPlans.ts), not a row with planId "starter". Treating a missing subscription
// as "uncapped" would silently exempt every therapist who's never visited that tab, which is
// most of them — so null/undefined is folded into the "starter" branch here too.
export function getEffectiveMaxClients(
  maxClients: number | null,
  subscriptionPlanId: string | null | undefined
): number | null {
  if (subscriptionPlanId == null || subscriptionPlanId === "starter") return Math.min(maxClients ?? 5, 5);
  return maxClients;
}
