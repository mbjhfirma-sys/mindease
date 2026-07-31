// Plan catalog for a therapist's own YouMindo platform subscription — separate from, and
// unrelated to, per-session client billing (tracked via TherapistBilling/SessionEarning).
// Starter has no stripePriceId (a real, persisted, Stripe-less state, same "no Stripe object
// for the free tier" instinct as lib/clientPlans.ts's "free" entry) — Professional/Practice
// read their Price IDs from env, created once per environment in the Stripe Dashboard.
export type TherapistPlan = {
  id: "starter" | "professional" | "practice";
  name: string;
  priceCents: number;
  features: string[];
  stripePriceId?: string;
};

export const THERAPIST_PLANS: TherapistPlan[] = [
  {
    id: "starter",
    name: "Starter",
    priceCents: 0,
    features: ["Up to 5 active clients", "Core scheduling & messaging", "Standard support"],
  },
  {
    id: "professional",
    name: "Professional",
    priceCents: 2900,
    features: ["Unlimited active clients", "Business analytics & tax exports", "Priority support"],
    stripePriceId: process.env.STRIPE_PRICE_THERAPIST_PROFESSIONAL,
  },
  {
    id: "practice",
    name: "Practice",
    priceCents: 7900,
    features: ["Everything in Professional", "Team billing for clinics", "Dedicated onboarding"],
    stripePriceId: process.env.STRIPE_PRICE_THERAPIST_PRACTICE,
  },
];

export type TherapistPlanId = TherapistPlan["id"];

export function planById(id: string): TherapistPlan | null {
  return THERAPIST_PLANS.find((p) => p.id === id) ?? null;
}
