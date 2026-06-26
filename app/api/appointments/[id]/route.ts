import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AppointmentStatus } from "@prisma/client";

const patchSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]).optional(),
  notes: z.string().optional(),
  date: z.string().datetime().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id;
  const userRole = session.user.role;

  const appt = await db.appointment.findUnique({
    where: { id },
    include: { therapist: { select: { userId: true } } },
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isParticipant = appt.clientId === userId || appt.therapist.userId === userId;
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (userRole !== "THERAPIST" && parsed.data.status && parsed.data.status !== "cancelled") {
    return NextResponse.json({ error: "Clients can only cancel appointments" }, { status: 403 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.date) data.date = new Date(parsed.data.date);
  if (parsed.data.status) data.status = parsed.data.status as AppointmentStatus;

  const updated = await db.appointment.update({ where: { id }, data });
  return NextResponse.json({ ok: true, appointment: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const appt = await db.appointment.findUnique({
    where: { id },
    include: { therapist: { select: { userId: true } } },
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isParticipant = appt.clientId === session.user.id || appt.therapist.userId === session.user.id;
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.appointment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
