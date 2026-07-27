import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { computeCommunityFacts } from "@/lib/mindo/communityFacts";
import { generateCommunityInsight } from "@/lib/mindo/generateCommunityInsight";

export const dynamic = "force-dynamic";

// GET /api/therapist/community/insight — Mindo's read on activity across all of a therapist's communities
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const facts = await computeCommunityFacts(therapist.id, session.user.id);
  const result = await generateCommunityInsight(facts);

  return NextResponse.json({ facts, insight: result.text, model: result.model });
}
