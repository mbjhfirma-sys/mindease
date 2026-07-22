import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { authorizeVideoParticipant } from "@/lib/videoAuth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { appointmentId } = await params;
  const authz = await authorizeVideoParticipant(appointmentId, session.user.id);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.status === 404 ? "Not found" : "Forbidden" }, { status: authz.status });
  }
  const { role } = authz;

  const videoSession = await db.videoSession.findUnique({ where: { appointmentId } });
  if (!videoSession || videoSession.status === "ended") {
    return NextResponse.json({ ok: true });
  }

  const now = new Date();
  if (role === "offerer") {
    await db.videoSession.update({
      where: { appointmentId },
      data: { therapistLeftAt: now, status: "ended", endedAt: now, endedReason: "therapist_left" },
    });
  } else {
    await db.videoSession.update({
      where: { appointmentId },
      data: { clientLeftAt: now, status: "ended", endedAt: now, endedReason: "client_left" },
    });
  }

  return NextResponse.json({ ok: true });
}
