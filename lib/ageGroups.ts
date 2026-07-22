// Shared bucket list — a client picks the ONE bracket they fall into (their own
// age), a therapist picks the MANY brackets they serve. Using one canonical list
// on both sides keeps them directly comparable for matching (same pattern as
// lib/specializations.ts), no separate translation table needed.
export const AGE_GROUPS = [
  { id: "children", label: "Child (under 13)" },
  { id: "teen", label: "Teen (13–17)" },
  { id: "adult", label: "Adult (18–64)" },
  { id: "senior", label: "Senior (65+)" },
] as const;

export type AgeGroupId = (typeof AGE_GROUPS)[number]["id"];
