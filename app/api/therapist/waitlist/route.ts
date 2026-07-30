import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { scoreClientAgainstTherapist } from "@/lib/matching";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const entries = await db.waitlistEntry.findMany({
    where: { therapistId: therapist.id, status: "waiting" },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true, name: true, avatar: true, email: true,
          clientIntake: { select: { concerns: true, ageRange: true, languagePreference: true, modalityPreference: true, affirmingCarePreferences: true, goals: true } },
        },
      },
    },
  });

  // Previously showed only name/email/wait-date — the therapist had zero intake or fit
  // context for their accept/decline decision. N+1 here is acceptable: waitlists are small
  // (per-therapist, "waiting" status only), not worth batching for.
  const withScoring = await Promise.all(entries.map(async (e) => {
    const scoring = await scoreClientAgainstTherapist(e.user.id, therapist.id);
    return {
      id: e.id, userId: e.user.id, name: e.user.name, avatar: e.user.avatar, email: e.user.email, createdAt: e.createdAt,
      intake: e.user.clientIntake,
      matchScore: scoring?.score ?? null,
      matchFactors: scoring?.factors ?? [],
    };
  }));

  return NextResponse.json({ entries: withScoring });
}
