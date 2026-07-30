import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const feedback = await db.matchFeedback.findFirst({
    where: { respondentId: session.user.id, status: "pending" },
    orderBy: { promptedAt: "desc" },
    select: {
      id: true,
      respondentRole: true,
      promptedAt: true,
      client: { select: { name: true } },
      therapist: { select: { user: { select: { name: true } } } },
    },
  });

  if (!feedback) return NextResponse.json({ pending: null });

  const isRespondentTheClient = feedback.respondentRole === "CLIENT";

  return NextResponse.json({
    pending: {
      id: feedback.id,
      counterpartName: isRespondentTheClient ? feedback.therapist.user.name : feedback.client.name,
      counterpartRole: isRespondentTheClient ? "THERAPIST" : "CLIENT",
      matchedSince: feedback.promptedAt,
    },
  });
}
