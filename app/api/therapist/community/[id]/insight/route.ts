import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { computeCommunityFacts } from "@/lib/mindo/communityFacts";
import { generateCommunityInsight } from "@/lib/mindo/generateCommunityInsight";

export const dynamic = "force-dynamic";

// GET /api/therapist/community/[id]/insight — Mindo's read on activity in one community
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const { id } = await params;
  const group = await db.therapistGroup.findUnique({ where: { id }, select: { therapistId: true } });
  if (!group || group.therapistId !== therapist.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  const facts = await computeCommunityFacts(therapist.id, session.user.id, id);
  const result = await generateCommunityInsight(facts);

  return NextResponse.json({ facts, insight: result.text, model: result.model });
}
