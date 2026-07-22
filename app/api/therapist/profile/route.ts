import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PROFESSION_TYPES, type ProfessionTypeId } from "@/lib/professionTypes";
import { AGE_GROUPS, type AgeGroupId } from "@/lib/ageGroups";

const PROFESSION_TYPE_IDS = PROFESSION_TYPES.map((p) => p.id) as [ProfessionTypeId, ...ProfessionTypeId[]];
const AGE_GROUP_IDS = AGE_GROUPS.map((g) => g.id) as [AgeGroupId, ...AgeGroupId[]];

const patchSchema = z.object({
  title:             z.string().min(1).optional(),
  bio:               z.string().optional(),
  approach:          z.string().optional(),
  yearsOfExperience: z.number().int().min(0).max(60).nullable().optional(),
  specializations:   z.array(z.string()).optional(),
  education:         z.array(z.string()).optional(),
  languages:         z.array(z.string()).optional(),
  licenseNumber:     z.string().optional(),
  maxClients:        z.number().int().min(1).max(500).nullable().optional(),
  professionType:    z.enum(PROFESSION_TYPE_IDS).optional(),
  gender:            z.string().optional(),
  ageGroupsServed:   z.array(z.enum(AGE_GROUP_IDS)).optional(),
  modalities:        z.array(z.string()).optional(),
  completeOnboarding: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const therapist = await db.therapist.findUnique({
    where: { userId: session.user.id },
    select: {
      title: true, bio: true, approach: true, yearsOfExperience: true,
      specializations: true, education: true, languages: true, licenseNumber: true,
      rating: true, totalSessions: true, maxClients: true, professionType: true, gender: true,
      ageGroupsServed: true, modalities: true,
      _count: { select: { clients: true } },
    },
  });
  if (!therapist) return NextResponse.json({ error: "Not a therapist" }, { status: 403 });

  return NextResponse.json({ profile: { ...therapist, activeClients: therapist._count.clients } });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const therapist = await db.therapist.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!therapist) return NextResponse.json({ error: "Not a therapist" }, { status: 403 });

  try {
    // completeOnboarding is a control flag, not a real column — destructure it out
    // before spreading the rest into the update, and translate it into the real
    // profileCompleted field instead (matches app/api/user/route.ts's handling of
    // its own non-column control fields).
    const { completeOnboarding, ...rest } = parsed.data;
    const data = { ...rest, ...(completeOnboarding ? { profileCompleted: true } : {}) };

    const updated = await db.therapist.update({
      where: { id: therapist.id },
      data,
      select: {
        title: true, bio: true, approach: true, yearsOfExperience: true,
        specializations: true, education: true, languages: true, licenseNumber: true, maxClients: true,
        professionType: true, gender: true, profileCompleted: true, ageGroupsServed: true, modalities: true,
      },
    });
    return NextResponse.json({ ok: true, profile: updated });
  } catch (err) {
    console.error("[therapist/profile PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DB error" },
      { status: 500 }
    );
  }
}
