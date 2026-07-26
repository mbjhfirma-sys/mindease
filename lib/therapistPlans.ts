// Static plan catalog for a therapist's own YouMindo platform subscription — separate from,
// and unrelated to, per-session client billing (tracked via TherapistBilling/SessionEarning).
// Pricing here is a placeholder business decision (documented, trivially adjustable) — no
// payment processor is wired up yet, so subscribing/renewing is bookkeeping only.
export const THERAPIST_PLANS = [
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
  },
  {
    id: "practice",
    name: "Practice",
    priceCents: 7900,
    features: ["Everything in Professional", "Team billing for clinics", "Dedicated onboarding"],
  },
] as const;

export type TherapistPlanId = (typeof THERAPIST_PLANS)[number]["id"];

export function planById(id: string) {
  return THERAPIST_PLANS.find((p) => p.id === id) ?? null;
}
