import { db } from "@/lib/db";

export type IntakeAnswers = {
  concerns: string[];
  languagePreference?: string | null;
  genderPreference?: string | null; // "male" | "female" | "no_preference"
  ageRange?: string | null; // one of lib/ageGroups.ts AGE_GROUPS ids
  modalityPreference?: string | null; // one of lib/specializations.ts MODALITY_SUGGESTIONS, or "no_preference"
  affirmingCarePreferences?: string[]; // ids from lib/affirmingCare.ts AFFIRMING_CARE_TAGS
};

export type MatchedTherapist = {
  id: string;
  userId: string;
  name: string;
  title: string;
  specializations: string[];
  yearsOfExperience: number | null;
  score: number;
  factors: MatchReasonFactor[];
};

export type MatchFactorKey = "concerns" | "language" | "gender" | "ageGroup" | "modality" | "affirmingCare" | "fitFeedback";

export type MatchReasonFactor = {
  key: MatchFactorKey;
  label: string;
  weight: number;
  direction: "positive" | "negative" | "neutral";
  matchedValues?: string[];
};

export type TherapistScoringInput = {
  specializations: string[];
  languages: string[];
  gender: string | null;
  ageGroupsServed: string[];
  modalities: string[];
  affirmingCareTags: string[];
  // Precomputed from submitted MatchFeedback (see feedbackModifiersFor below).
  // Undefined/0 when there's not yet enough feedback to have a real signal.
  feedbackModifier?: number;
};

const FEEDBACK_MIN_SAMPLE = 3;
const FEEDBACK_MAX_MODIFIER = 5;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// Pure scoring function — reproduces the original inline scoring math byte-identically
// (same branches, same weights) while additionally emitting a MatchReasonFactor per
// applicable branch, including zero/negative-weight ones, for full match-reasoning
// transparency rather than only surfacing cherry-picked positives.
export function scoreTherapistMatch(intake: IntakeAnswers, t: TherapistScoringInput): { score: number; factors: MatchReasonFactor[] } {
  let score = 0;
  const factors: MatchReasonFactor[] = [];

  const concerns = intake.concerns.map((c) => c.toLowerCase());
  const therapistTags = t.specializations.map((s) => s.toLowerCase());
  const sharedConcerns = intake.concerns.filter((c) => therapistTags.includes(c.toLowerCase()));
  if (concerns.length > 0) {
    const weight = sharedConcerns.length * 100;
    score += weight;
    factors.push({
      key: "concerns",
      label: sharedConcerns.length > 0 ? `Shared concerns: ${sharedConcerns.join(", ")}` : "No shared concerns with what you're looking for help with",
      weight,
      direction: sharedConcerns.length > 0 ? "positive" : "neutral",
      matchedValues: sharedConcerns.length > 0 ? sharedConcerns : undefined,
    });
  }

  if (intake.languagePreference) {
    const matched = t.languages.includes(intake.languagePreference);
    const weight = matched ? 5 : 0;
    score += weight;
    factors.push({
      key: "language",
      label: matched ? `Speaks your preferred language (${intake.languagePreference})` : `Doesn't list ${intake.languagePreference} as a language`,
      weight,
      direction: matched ? "positive" : "neutral",
      matchedValues: matched ? [intake.languagePreference] : undefined,
    });
  }

  if (intake.genderPreference && intake.genderPreference !== "no_preference") {
    let weight: number;
    let label: string;
    let direction: MatchReasonFactor["direction"];
    if (!t.gender) {
      weight = -1; label = "Hasn't specified a gender"; direction = "negative";
    } else if (t.gender === intake.genderPreference) {
      weight = 3; label = `Matches your gender preference (${intake.genderPreference})`; direction = "positive";
    } else {
      weight = -5; label = "Doesn't match your gender preference"; direction = "negative";
    }
    score += weight;
    factors.push({ key: "gender", label, weight, direction });
  }

  // Age-group fit is a real constraint (like gender) — a therapist who doesn't
  // list a client's bracket may genuinely not be equipped for it.
  if (intake.ageRange) {
    let weight: number;
    let label: string;
    let direction: MatchReasonFactor["direction"];
    if (t.ageGroupsServed.length === 0) {
      weight = -1; label = "Hasn't specified age groups served"; direction = "negative";
    } else if (t.ageGroupsServed.includes(intake.ageRange)) {
      weight = 3; label = "Serves your age group"; direction = "positive";
    } else {
      weight = -5; label = "Doesn't list your age group as served"; direction = "negative";
    }
    score += weight;
    factors.push({ key: "ageGroup", label, weight, direction });
  }

  // Modality preference is a soft nice-to-have (like language) — only a bonus
  // for a match, never a penalty for not listing it or not matching. Checked
  // against both the dedicated `modalities` field and the legacy `specializations`
  // list, since older therapist rows may still have a modality tag (e.g.
  // "Psychodynamic") mixed into `specializations` from before the two were split.
  if (intake.modalityPreference && intake.modalityPreference !== "no_preference") {
    const modalityTags = [...t.modalities, ...t.specializations].map((s) => s.toLowerCase());
    const matched = modalityTags.includes(intake.modalityPreference.toLowerCase());
    const weight = matched ? 5 : 0;
    score += weight;
    if (matched) {
      factors.push({ key: "modality", label: `Uses your preferred approach (${intake.modalityPreference})`, weight, direction: "positive", matchedValues: [intake.modalityPreference] });
    }
  }

  // Affirming-care fit is a soft, stacking preference — like modality, never a
  // penalty for a therapist who hasn't (yet) tagged themselves, since this field
  // is new and most existing therapist rows start with none set.
  if (intake.affirmingCarePreferences && intake.affirmingCarePreferences.length > 0) {
    const sharedTags = intake.affirmingCarePreferences.filter((tag) => t.affirmingCareTags.includes(tag));
    const weight = sharedTags.length * 8;
    score += weight;
    if (sharedTags.length > 0) {
      factors.push({ key: "affirmingCare", label: `Offers affirming care around: ${sharedTags.join(", ")}`, weight, direction: "positive", matchedValues: sharedTags });
    }
  }

  // Small nudge from real client+therapist match-quality feedback — see feedbackModifiersFor.
  // Intentionally small relative to the dominant +100 concern-overlap term: it can break ties
  // among comparable candidates, never override clinical fit.
  if (t.feedbackModifier) {
    factors.push({
      key: "fitFeedback",
      label: t.feedbackModifier > 0 ? "Past clients have reported a good fit" : "Past match-quality feedback was mixed",
      weight: t.feedbackModifier,
      direction: t.feedbackModifier > 0 ? "positive" : "negative",
    });
    score += t.feedbackModifier;
  }

  return { score, factors };
}

// Batched: one groupBy query for every candidate therapist, rather than N queries.
// Below FEEDBACK_MIN_SAMPLE submitted responses, a therapist gets no modifier at all —
// one bad or good report shouldn't swing future matching.
async function feedbackModifiersFor(therapistIds: string[]): Promise<Map<string, number>> {
  if (therapistIds.length === 0) return new Map();
  const grouped = await db.matchFeedback.groupBy({
    by: ["therapistId"],
    where: { status: "submitted", therapistId: { in: therapistIds }, rating: { not: null } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const modifiers = new Map<string, number>();
  for (const g of grouped) {
    if (g._count.rating < FEEDBACK_MIN_SAMPLE || g._avg.rating == null) continue;
    modifiers.set(g.therapistId, clamp(Math.round((g._avg.rating - 3) * 2), -FEEDBACK_MAX_MODIFIER, FEEDBACK_MAX_MODIFIER));
  }
  return modifiers;
}

// Scores every approved, non-full therapist against a client's intake answers and
// returns the single best match (with its full score/factors breakdown), or null if no
// therapist is available at all. Concern overlap dominates the score (+100 each) so it can
// never be outweighed by language/gender alone — those only meaningfully break ties among
// therapists who already share at least one relevant concern with the client.
export async function findBestMatch(intake: IntakeAnswers): Promise<MatchedTherapist | null> {
  const candidates = await db.therapist.findMany({
    where: { verificationStatus: "approved" },
    select: {
      id: true, userId: true, specializations: true, languages: true, gender: true,
      maxClients: true, title: true, ageGroupsServed: true, modalities: true,
      affirmingCareTags: true, yearsOfExperience: true,
      user: { select: { name: true } },
      _count: { select: { clients: true } },
    },
  });

  const withRoom = candidates.filter((t) => t.maxClients == null || t._count.clients < t.maxClients);
  if (withRoom.length === 0) return null;

  const feedbackModifiers = await feedbackModifiersFor(withRoom.map((t) => t.id));

  const scored = withRoom.map((t) => {
    const { score, factors } = scoreTherapistMatch(intake, { ...t, feedbackModifier: feedbackModifiers.get(t.id) });
    return { therapist: t, score, factors };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  return {
    id: best.therapist.id,
    userId: best.therapist.userId,
    name: best.therapist.user.name,
    title: best.therapist.title,
    specializations: best.therapist.specializations,
    yearsOfExperience: best.therapist.yearsOfExperience,
    score: best.score,
    factors: best.factors,
  };
}

async function feedbackModifierFor(therapistId: string): Promise<number | undefined> {
  const map = await feedbackModifiersFor([therapistId]);
  return map.get(therapistId);
}

// Scores one specific therapist against a client's own intake — used by the self-service
// "request this therapist" and waitlist-accept paths, where the therapist is already chosen
// by the client/therapist rather than being algorithmically selected from all candidates.
// Returns null if the client has no ClientIntake on file (e.g. joined via a clinic invite
// code and skipped onboarding) — nothing to score against, not an error.
export async function scoreClientAgainstTherapist(clientId: string, therapistId: string): Promise<{ score: number; factors: MatchReasonFactor[] } | null> {
  const intake = await db.clientIntake.findUnique({ where: { userId: clientId } });
  if (!intake) return null;

  const therapist = await db.therapist.findUnique({
    where: { id: therapistId },
    select: { specializations: true, languages: true, gender: true, ageGroupsServed: true, modalities: true, affirmingCareTags: true },
  });
  if (!therapist) return null;

  const feedbackModifier = await feedbackModifierFor(therapistId);

  return scoreTherapistMatch(
    {
      concerns: intake.concerns,
      languagePreference: intake.languagePreference,
      genderPreference: intake.genderPreference,
      ageRange: intake.ageRange,
      modalityPreference: intake.modalityPreference,
      affirmingCarePreferences: intake.affirmingCarePreferences,
    },
    { ...therapist, feedbackModifier }
  );
}
