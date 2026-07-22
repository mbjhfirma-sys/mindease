import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const therapist = await db.therapist.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      title: true,
      specializations: true,
      rating: true,
      totalSessions: true,
      _count: { select: { clients: true } },
    },
  });

  if (!therapist) return NextResponse.json({ error: "Not a therapist" }, { status: 403 });

  const [pendingAppointments, unreadMessages] = await Promise.all([
    db.appointment.count({ where: { therapistId: therapist.id, status: "pending" } }),
    db.message.count({
      where: { conversation: { therapistId: therapist.id }, read: false, fromUserId: { not: session.user.id } },
    }),
  ]);

  return NextResponse.json({
    profile: {
      title: therapist.title ?? "Therapist",
      specializations: therapist.specializations,
      rating: therapist.rating ?? 0,
    },
    stats: {
      activeClients: therapist._count.clients,
      totalSessions: therapist.totalSessions,
      pendingAppointments,
      unreadMessages,
    },
  });
}
