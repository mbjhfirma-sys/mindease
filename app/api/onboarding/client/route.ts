import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { findBestMatch } from "@/lib/matching";
import { assignClientToTherapist } from "@/lib/therapistAssignment";
import { recordMatchReasoning } from "@/lib/matchReasoning";
import { AGE_GROUPS, type AgeGroupId } from "@/lib/ageGroups";
import { AFFIRMING_CARE_TAGS, type AffirmingCareTagId } from "@/lib/affirmingCare";

const AGE_GROUP_IDS = AGE_GROUPS.map((g) => g.id) as [AgeGroupId, ...AgeGroupId[]];
const AFFIRMING_CARE_IDS = AFFIRMING_CARE_TAGS.map((t) => t.id) as [AffirmingCareTagId, ...AffirmingCareTagId[]];

const bodySchema = z.object({
  concerns: z.array(z.string()).min(1),
  languagePreference: z.string().optional(),
  genderPreference: z.enum(["male", "female", "no_preference"]).optional(),
  ageRange: z.enum(AGE_GROUP_IDS).optional(),
  priorTherapyExperience: z.enum(["yes", "no", "unsure"]).optional(),
  goals: z.string().max(2000).optional(),
  modalityPreference: z.string().optional(),
  affirmingCarePreferences: z.array(z.enum(AFFIRMING_CARE_IDS)).optional(),
  genderIdentity: z.enum(["woman", "man", "non_binary", "prefer_not_to_say"]).optional(),
  preferredCommunication: z.enum(["video", "messaging", "both"]).optional(),
  takingMedication: z.enum(["yes", "no", "prefer_not_to_say"]).optional(),
  relationshipStatus: z.enum(["single", "relationship", "married", "divorced", "widowed", "prefer_not_to_say"]).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const {
    concerns, languagePreference, genderPreference, ageRange, priorTherapyExperience, goals, modalityPreference,
    affirmingCarePreferences, genderIdentity, preferredCommunication, takingMedication, relationshipStatus,
  } = parsed.data;

  const intakeData = {
    concerns, languagePreference, genderPreference, ageRange, priorTherapyExperience, goals, modalityPreference,
    affirmingCarePreferences, genderIdentity, preferredCommunication, takingMedication, relationshipStatus,
  };

  await db.clientIntake.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...intakeData },
    update: intakeData,
  });

  const client = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, therapistId: true },
  });

  // Already connected (e.g. via an earlier code-based link) — don't reassign.
  if (client?.therapistId) {
    const therapist = await db.therapist.findUnique({
      where: { id: client.therapistId },
      select: { title: true, specializations: true, yearsOfExperience: true, user: { select: { name: true } } },
    });
    await db.user.update({ where: { id: session.user.id }, data: { hasOnboarded: true } });
    return NextResponse.json({
      alreadyAssigned: true,
      therapist: therapist
        ? { name: therapist.user.name, title: therapist.title, specializations: therapist.specializations, yearsOfExperience: therapist.yearsOfExperience }
        : null,
    });
  }

  const match = await findBestMatch({ concerns, languagePreference, genderPreference, ageRange, modalityPreference, affirmingCarePreferences });

  if (match) {
    await assignClientToTherapist(session.user.id, client?.name ?? "A client", match.id);
    await recordMatchReasoning(session.user.id, match.id, match.score, match.factors, "auto");
    await db.user.update({ where: { id: session.user.id }, data: { hasOnboarded: true } });
    return NextResponse.json({
      matched: true,
      therapist: { name: match.name, title: match.title, specializations: match.specializations, yearsOfExperience: match.yearsOfExperience },
      score: match.score,
      factors: match.factors,
    });
  }

  await db.user.update({ where: { id: session.user.id }, data: { hasOnboarded: true } });
  return NextResponse.json({ matched: false });
}
