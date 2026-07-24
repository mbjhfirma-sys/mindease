// Shared tag list, same pattern as lib/specializations.ts — a client picks the
// traits they want in a therapist, a therapist picks the traits they offer.
// Framed as a provider capability the client is requesting ("I want a therapist
// who offers X"), not a client identity field — nobody is asked to categorize
// themselves to use this.
export const AFFIRMING_CARE_TAGS = [
  { id: "lgbtq_affirming", label: "LGBTQ+ affirming", description: "Experienced and comfortable working with LGBTQ+ clients" },
  { id: "culturally_responsive", label: "Culturally responsive care", description: "Attentive to race, ethnicity, and cultural background" },
  { id: "faith_sensitive", label: "Faith-sensitive care", description: "Comfortable incorporating or respecting religious/spiritual beliefs" },
  { id: "neurodivergent_affirming", label: "Neurodivergent-affirming", description: "Experienced with ADHD, autism, and other neurodivergence" },
  { id: "body_positive", label: "Body-positive care", description: "Weight-inclusive, non-diet approach" },
  { id: "disability_affirming", label: "Disability-affirming care", description: "Experienced working with clients with disabilities" },
] as const;

export type AffirmingCareTagId = (typeof AFFIRMING_CARE_TAGS)[number]["id"];
