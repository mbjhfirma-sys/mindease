export type ClientPlanId = "free" | "growth" | "premium";

export type ClientPlan = {
  id: ClientPlanId;
  name: string;
  tagline: string;
  priceCents: number;
  /** Billed once a year in place of 12 monthly charges — 2 months free vs. paying monthly. */
  annualPriceCents?: number;
  mostPopular?: boolean;
  highlights: string[];
  stripePriceId?: string;
  stripePriceIdAnnual?: string;
  features: {
    mindo: boolean;
    fullCourseLibrary: boolean;
    liveGroupSessions: boolean;
  };
};

export const CLIENT_PLANS: ClientPlan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "A calm starting point for your mental health journey.",
    priceCents: 0,
    highlights: [
      "Access to a curated set of intro courses",
      "Community forum & peer support groups",
      "Journaling & mood tracking",
      "Book 1-on-1 sessions with your therapist any time (pay per session)",
      "Safety plan & crisis resources — always free",
    ],
    features: { mindo: false, fullCourseLibrary: false, liveGroupSessions: false },
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Everything you need to build lasting mental health habits.",
    priceCents: 1900,
    annualPriceCents: 19000,
    mostPopular: true,
    stripePriceId: process.env.STRIPE_PRICE_GROWTH,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_GROWTH_ANNUAL,
    highlights: [
      "Full course library",
      "Live weekly group sessions",
      "Mindo, your AI companion — chat, daily briefings, personalized course picks",
      "Progress tracking & journaling",
      "Community + peer support groups",
      "Book 1-on-1 sessions with your therapist any time (pay per session)",
    ],
    features: { mindo: true, fullCourseLibrary: true, liveGroupSessions: true },
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Deep, personalized support from certified professionals.",
    priceCents: 4900,
    annualPriceCents: 49000,
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
    highlights: [
      "Everything in Growth",
      "1 free 15-minute session every month",
      "Book additional 1-on-1 sessions any time (pay per session)",
      "Dedicated wellness coach relationship",
      "Priority support",
      "Family & couples add-on available",
    ],
    features: { mindo: true, fullCourseLibrary: true, liveGroupSessions: true },
  },
];

export function planById(id: string | null | undefined): ClientPlan {
  return CLIENT_PLANS.find((p) => p.id === id) ?? CLIENT_PLANS[0];
}
