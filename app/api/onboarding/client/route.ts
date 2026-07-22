import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { findBestMatch } from "@/lib/matching";
import { assignClientToTherapist } from "@/lib/therapistAssignment";
import { AGE_GROUPS, type AgeGroupId } from "@/lib/ageGroups";

const AGE_GROUP_IDS = AGE_GROUPS.map((g) => g.id) as [AgeGroupId, ...AgeGroupId[]];

const bodySchema = z.object({
  concerns: z.array(z.string()).min(1),
  languagePreference: z.string().optional(),
  genderPreference: z.enum(["male", "female", "no_preference"]).optional(),
  ageRange: z.enum(AGE_GROUP_IDS).optional(),
  priorTherapyExperience: z.enum(["yes", "no", "unsure"]).optional(),
  goals: z.string().max(2000).optional(),
  modalityPreference: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { concerns, languagePreference, genderPreference, ageRange, priorTherapyExperience, goals, modalityPreference } = parsed.data;

  await db.clientIntake.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, concerns, languagePreference, genderPreference, ageRange, priorTherapyExperience, goals, modalityPreference },
    update: { concerns, languagePreference, genderPreference, ageRange, priorTherapyExperience, goals, modalityPreference },
  });

  const client = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, therapistId: true },
  });

  // Already connected (e.g. via an earlier code-based link) — don't reassign.
  if (client?.therapistId) {
    const therapist = await db.therapist.findUnique({
      where: { id: client.therapistId },
      select: { title: true, user: { select: { name: true } } },
    });
    await db.user.update({ where: { id: session.user.id }, data: { hasOnboarded: true } });
    return NextResponse.json({
      alreadyAssigned: true,
      therapist: therapist ? { name: therapist.user.name, title: therapist.title } : null,
    });
  }

  const match = await findBestMatch({ concerns, languagePreference, genderPreference, ageRange, modalityPreference });

  if (match) {
    await assignClientToTherapist(session.user.id, client?.name ?? "A client", match.id);
    await db.user.update({ where: { id: session.user.id }, data: { hasOnboarded: true } });
    return NextResponse.json({ matched: true, therapist: { name: match.name, title: match.title } });
  }

  await db.user.update({ where: { id: session.user.id }, data: { hasOnboarded: true } });
  return NextResponse.json({ matched: false });
}
