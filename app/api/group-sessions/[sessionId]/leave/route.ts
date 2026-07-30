import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { authorizeGroupSessionParticipant } from "@/lib/groupSessionAuth";
import { getActiveParticipants } from "@/lib/groupSession";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const auth_ = await auth();
  if (!auth_?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = auth_.user.id;

  const { sessionId } = await params;
  const authz = await authorizeGroupSessionParticipant(sessionId, userId);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.status === 404 ? "Not found" : "Forbidden" }, { status: authz.status });
  }
  const { session: groupSession, isHost } = authz;

  if (groupSession.status !== "scheduled") {
    return NextResponse.json({ ok: true });
  }

  const now = new Date();
  await db.groupSessionParticipant.updateMany({
    where: { groupSessionId: sessionId, userId, leftAt: null },
    data: { leftAt: now },
  });

  // A therapist-led session isn't peer-continuable — the host leaving ends it for
  // everyone, mirroring the clinical seriousness this app already applies elsewhere
  // to therapist-led sessions. Zero remaining participants also force-ends it.
  const remaining = await getActiveParticipants(sessionId);
  if (isHost || remaining.length === 0) {
    await db.groupSession.update({
      where: { id: sessionId },
      data: { status: "ended", endedAt: now },
    });
  }

  return NextResponse.json({ ok: true });
}
