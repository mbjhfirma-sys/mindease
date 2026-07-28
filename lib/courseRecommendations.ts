// Maps each assessment tool to candidate course tags/category keywords used to
// surface a "Recommended for you" strip after a client completes that assessment.
// Matching is a simple case-insensitive overlap against Course.tags/Course.category —
// if no course happens to carry a matching tag yet, the section just doesn't render.
export const ASSESSMENT_COURSE_KEYWORDS: Record<string, string[]> = {
  a1: ["anxiety", "stress", "relaxation", "mindfulness"], // GAD-7
  a2: ["depression", "mood", "behavioral activation"], // PHQ-9
  a3: ["burnout", "stress", "work-life"], // CBI
  a4: ["stress", "mindfulness", "relaxation"], // PSS-10
  a5: ["sleep", "insomnia"], // ISI
  a6: ["wellbeing", "self-care", "mindfulness"], // WEMWBS
};

export function matchesAssessmentKeywords(
  assessmentId: string,
  course: { category: string; tags: string[] }
): boolean {
  const keywords = ASSESSMENT_COURSE_KEYWORDS[assessmentId];
  if (!keywords) return false;
  const haystack = [course.category, ...course.tags].map((s) => s.toLowerCase());
  return keywords.some((kw) => haystack.some((h) => h.includes(kw.toLowerCase())));
}

// Maps each onboarding "what brings you here" concern (lib/specializations.ts's
// SPECIALIZATION ids — the client intake quiz and this list share the same strings)
// to candidate course tags/category keywords, used to pick the single course Mindo
// surfaces as "Recommended by Mindo" on the courses page. Same convention as
// ASSESSMENT_COURSE_KEYWORDS above: if no course carries a matching tag yet for a
// given concern, that concern just never produces a recommendation.
export const CONCERN_COURSE_KEYWORDS: Record<string, string[]> = {
  "Anxiety": ["anxiety"],
  "Depression": ["depression", "mood"],
  "Stress & Burnout": ["stress", "burnout"],
  "Sleep Issues": ["sleep"],
  "Self-Esteem": ["self-love", "self-esteem", "compassion", "confidence"],
  "Trauma & PTSD": ["trauma"],
  "Grief & Loss": ["grief", "loss"],
  "Relationships": ["relationship"],
};

export function matchesConcernKeywords(
  concern: string,
  course: { category: string; tags: string[] }
): boolean {
  const keywords = CONCERN_COURSE_KEYWORDS[concern];
  if (!keywords) return false;
  const haystack = [course.category, ...course.tags].map((s) => s.toLowerCase());
  return keywords.some((kw) => haystack.some((h) => h.includes(kw.toLowerCase())));
}

// Picks the course Mindo should recommend for a client, deterministically — the
// client's onboarding concerns are walked in the order they picked them, and the
// first one with a matching, not-yet-completed course wins. Keeping course
// selection deterministic (rather than letting the AI choose) means Mindo can
// never recommend a course that doesn't exist; only the "why" text is generated.
export function pickOnboardingRecommendedCourse<T extends { category: string; tags: string[] }>(
  concerns: string[],
  eligibleCourses: T[]
): { course: T; concern: string } | null {
  for (const concern of concerns) {
    const match = eligibleCourses.find((c) => matchesConcernKeywords(concern, c));
    if (match) return { course: match, concern };
  }
  return null;
}
