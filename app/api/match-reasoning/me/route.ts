import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reasoning = await db.matchReasoning.findUnique({
    where: { clientId: session.user.id },
    select: { totalScore: true, factors: true, createdAt: true, therapist: { select: { id: true, title: true, user: { select: { name: true } } } } },
  });

  if (!reasoning) return NextResponse.json({ reasoning: null });

  // A client may have switched therapists since this snapshot was taken — don't present a
  // stale reasoning as if it explains who they're matched with right now.
  const client = await db.user.findUnique({ where: { id: session.user.id }, select: { therapistId: true } });
  if (client?.therapistId !== reasoning.therapist.id) return NextResponse.json({ reasoning: null });

  return NextResponse.json({
    reasoning: {
      therapistName: reasoning.therapist.user.name,
      totalScore: reasoning.totalScore,
      factors: reasoning.factors,
      createdAt: reasoning.createdAt,
    },
  });
}
