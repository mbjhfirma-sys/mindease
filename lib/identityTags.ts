// A distinct taxonomy from lib/affirmingCare.ts, which is deliberately framed as a
// provider-capability request ("I want a therapist who offers X"), not a client
// self-identity field. This list is the opposite: a client opting in to say "this is
// part of who I am, help me find others who share it" for community-matching
// purposes only. Some underlying themes overlap (LGBTQ+, neurodivergence, etc.), but
// the two lists are kept separate on purpose — this one must never feed therapist
// matching (lib/matching.ts), and the affirming-care list must never be read as
// self-identity.
export const IDENTITY_TAGS = [
  { id: "lgbtq", label: "LGBTQ+", description: "Community for LGBTQ+ members and allies" },
  { id: "neurodivergent", label: "Neurodivergent", description: "ADHD, autism, and other neurodivergent experiences" },
  { id: "bipoc", label: "BIPOC", description: "Black, Indigenous, and people of color" },
  { id: "faith_based", label: "Faith-based", description: "Grounded in a shared religious or spiritual practice" },
  { id: "disability_community", label: "Disability community", description: "Living with a disability or chronic illness" },
  { id: "parents_caregivers", label: "Parents & caregivers", description: "Raising kids or caring for a family member" },
  { id: "veterans", label: "Veterans & military family", description: "Current service members, veterans, and their families" },
] as const;

export type IdentityTagId = (typeof IDENTITY_TAGS)[number]["id"];
