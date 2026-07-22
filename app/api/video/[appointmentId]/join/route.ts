import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { authorizeVideoParticipant } from "@/lib/videoAuth";
import { getJoinWindow } from "@/lib/video";

const STUN_ICE_SERVERS = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

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
  const { appointment, role } = authz;

  if (appointment.type !== "video") {
    return NextResponse.json({ error: "not_a_video_appointment" }, { status: 400 });
  }

  const window = getJoinWindow(appointment.date, appointment.duration);
  const now = new Date();
  if (now < window.opensAt) {
    return NextResponse.json(
      { error: "join_window_not_open", opensAt: window.opensAt, closesAt: window.closesAt },
      { status: 403 }
    );
  }
  if (now > window.closesAt) {
    return NextResponse.json(
      { error: "join_window_closed", opensAt: window.opensAt, closesAt: window.closesAt },
      { status: 403 }
    );
  }

  const videoSession =
    role === "offerer"
      ? await db.videoSession.upsert({
          where: { appointmentId },
          create: { appointmentId, status: "open", therapistJoinedAt: now },
          update: { status: "open", therapistJoinedAt: now, therapistLeftAt: null },
        })
      : await db.videoSession.upsert({
          where: { appointmentId },
          create: { appointmentId, status: "open", clientJoinedAt: now },
          update: { status: "open", clientJoinedAt: now, clientLeftAt: null },
        });

  const otherJoined =
    role === "offerer"
      ? !!videoSession.clientJoinedAt && !videoSession.clientLeftAt
      : !!videoSession.therapistJoinedAt && !videoSession.therapistLeftAt;

  return NextResponse.json({ role, otherJoined, iceServers: STUN_ICE_SERVERS });
}
