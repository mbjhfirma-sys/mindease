import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { assignClientToTherapist } from "@/lib/therapistAssignment";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: therapistId } = await params;

  const client = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, therapistId: true } });
  if (client?.therapistId) {
    return NextResponse.json({ error: "You already have an assigned therapist" }, { status: 409 });
  }

  const therapist = await db.therapist.findUnique({
    where: { id: therapistId },
    select: { id: true, userId: true, maxClients: true, _count: { select: { clients: true } } },
  });
  if (!therapist) return NextResponse.json({ error: "Therapist not found" }, { status: 404 });

  const hasRoom = therapist.maxClients == null || therapist._count.clients < therapist.maxClients;

  if (hasRoom) {
    await assignClientToTherapist(session.user.id, client?.name ?? "A client", therapist.id);
    return NextResponse.json({ ok: true, assigned: true });
  }

  const existing = await db.waitlistEntry.findUnique({
    where: { therapistId_userId: { therapistId: therapist.id, userId: session.user.id } },
  });
  if (existing) return NextResponse.json({ error: "You're already on this therapist's waitlist" }, { status: 409 });

  await db.waitlistEntry.create({ data: { therapistId: therapist.id, userId: session.user.id } });
  await createNotification(therapist.userId, {
    title: "New waitlist request",
    body: `${client?.name ?? "A client"} joined your waitlist.`,
    icon: "⏳",
    href: "/therapist/clients",
  });

  return NextResponse.json({ ok: true, assigned: false, waitlisted: true });
}
