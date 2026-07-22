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
