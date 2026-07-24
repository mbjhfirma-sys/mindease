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
  if (client?.therapistId === therapistId) {
    return NextResponse.json({ error: "This is already your assigned therapist" }, { status: 409 });
  }

  const therapist = await db.therapist.findUnique({
    where: { id: therapistId },
    select: { id: true, userId: true, maxClients: true, verificationStatus: true, _count: { select: { clients: true } } },
  });
  if (!therapist || therapist.verificationStatus !== "approved") {
    return NextResponse.json({ error: "Therapist not found" }, { status: 404 });
  }

  const hasRoom = therapist.maxClients == null || therapist._count.clients < therapist.maxClients;

  if (hasRoom) {
    // Switching away from a current therapist (as opposed to a first-time pick) —
    // let the outgoing therapist know so the client doesn't just silently vanish
    // from their caseload.
    if (client?.therapistId) {
      const previousTherapist = await db.therapist.findUnique({ where: { id: client.therapistId }, select: { userId: true } });
      if (previousTherapist) {
        await createNotification(previousTherapist.userId, {
          title: "Client switched therapists",
          body: `${client?.name ?? "A client"} has moved to a different therapist on YouMindo.`,
          icon: "↪️",
          href: "/therapist/clients",
        });
      }
    }
    await assignClientToTherapist(session.user.id, client?.name ?? "A client", therapist.id);
    return NextResponse.json({ ok: true, assigned: true });
  }

  // Waitlisting for a new therapist never touches the client's current
  // assignment — they keep working with whoever they have now (if anyone)
  // until the waitlisted therapist actually has room.
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
