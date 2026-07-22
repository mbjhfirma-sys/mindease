import { db } from "@/lib/db";

export type IntakeAnswers = {
  concerns: string[];
  languagePreference?: string | null;
  genderPreference?: string | null; // "male" | "female" | "no_preference"
  ageRange?: string | null; // one of lib/ageGroups.ts AGE_GROUPS ids
  modalityPreference?: string | null; // one of lib/specializations.ts MODALITY_SUGGESTIONS, or "no_preference"
};

export type MatchedTherapist = {
  id: string;
  userId: string;
  name: string;
  title: string;
  specializations: string[];
};

// Scores every approved, non-full therapist against a client's intake answers and
// returns the single best match, or null if no therapist is available at all.
// Concern overlap dominates the score (+100 each) so it can never be outweighed by
// language/gender alone — those only meaningfully break ties among therapists who
// already share at least one relevant concern with the client.
export async function findBestMatch(intake: IntakeAnswers): Promise<MatchedTherapist | null> {
  const candidates = await db.therapist.findMany({
    where: { verificationStatus: "approved" },
    select: {
      id: true, userId: true, specializations: true, languages: true, gender: true,
      maxClients: true, title: true, ageGroupsServed: true, modalities: true,
      user: { select: { name: true } },
      _count: { select: { clients: true } },
    },
  });

  const withRoom = candidates.filter((t) => t.maxClients == null || t._count.clients < t.maxClients);
  if (withRoom.length === 0) return null;

  const concerns = intake.concerns.map((c) => c.toLowerCase());

  const scored = withRoom.map((t) => {
    let score = 0;

    const therapistTags = t.specializations.map((s) => s.toLowerCase());
    const sharedConcerns = concerns.filter((c) => therapistTags.includes(c)).length;
    score += sharedConcerns * 100;

    if (intake.languagePreference && t.languages.includes(intake.languagePreference)) {
      score += 5;
    }

    if (intake.genderPreference && intake.genderPreference !== "no_preference") {
      if (!t.gender) score -= 1;
      else if (t.gender === intake.genderPreference) score += 3;
      else score -= 5;
    }

    // Age-group fit is a real constraint (like gender) — a therapist who doesn't
    // list a client's bracket may genuinely not be equipped for it.
    if (intake.ageRange) {
      if (t.ageGroupsServed.length === 0) score -= 1;
      else if (t.ageGroupsServed.includes(intake.ageRange)) score += 3;
      else score -= 5;
    }

    // Modality preference is a soft nice-to-have (like language) — only a bonus
    // for a match, never a penalty for not listing it or not matching. Checked
    // against both the dedicated `modalities` field and the legacy `specializations`
    // list, since older therapist rows may still have a modality tag (e.g.
    // "Psychodynamic") mixed into `specializations` from before the two were split.
    if (intake.modalityPreference && intake.modalityPreference !== "no_preference") {
      const modalityTags = [...t.modalities, ...t.specializations].map((s) => s.toLowerCase());
      if (modalityTags.includes(intake.modalityPreference.toLowerCase())) score += 5;
    }

    return { therapist: t, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0].therapist;

  return {
    id: best.id,
    userId: best.userId,
    name: best.user.name,
    title: best.title,
    specializations: best.specializations,
  };
}
