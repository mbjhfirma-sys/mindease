import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      therapistId: true,
      assignedTherapist: {
        include: {
          user: { select: { name: true, email: true, avatar: true } },
        },
      },
    },
  });

  if (!user?.assignedTherapist) {
    return NextResponse.json({ therapist: null });
  }

  const t = user.assignedTherapist;

  // Count completed sessions for this client
  const sessionCount = await db.appointment.count({
    where: { clientId: session.user.id, therapistId: t.id, status: "completed" },
  });

  // Next upcoming appointment
  const next = await db.appointment.findFirst({
    where: {
      clientId: session.user.id,
      therapistId: t.id,
      status: { in: ["pending", "confirmed"] },
      date: { gte: new Date() },
    },
    orderBy: { date: "asc" },
    select: { date: true, type: true, status: true, duration: true },
  });

  return NextResponse.json({
    therapist: {
      id: t.id,
      userId: t.userId,
      name: t.user.name,
      email: t.user.email,
      avatar: t.user.avatar ?? null,
      title: t.title,
      specializations: t.specializations ?? [],
      bio: t.bio ?? null,
      approach: t.approach ?? null,
      yearsOfExperience: t.yearsOfExperience ?? null,
      education: t.education ?? [],
      languages: t.languages ?? [],
      licenseNumber: t.licenseNumber ?? null,
      rating: t.rating,
      totalSessions: t.totalSessions,
      sessionsWithMe: sessionCount,
      nextAppointment: next ?? null,
    },
  });
}
