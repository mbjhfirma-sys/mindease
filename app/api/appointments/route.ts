import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AppointmentStatus, AppointmentType } from "@prisma/client";
import { createNotification } from "@/lib/notify";
import { findConflictingAppointment } from "@/lib/appointmentConflict";

const VALID_STATUSES = new Set(Object.values(AppointmentStatus));

const createSchema = z.object({
  therapistId: z.string().optional(),
  clientId: z.string().optional(),
  date: z.string().datetime(),
  type: z.enum(["video", "in_person", "phone"]).default("video"),
  duration: z.number().int().default(50),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const userRole = session.user.role;
  const statusParam = req.nextUrl.searchParams.get("status");
  const status = statusParam && VALID_STATUSES.has(statusParam as AppointmentStatus)
    ? (statusParam as AppointmentStatus)
    : undefined;

  const baseWhere = userRole === "THERAPIST"
    ? { therapist: { userId } }
    : { clientId: userId };

  const where = status ? { ...baseWhere, status } : baseWhere;

  const appointments = await db.appointment.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, avatar: true } },
      therapist: { include: { user: { select: { id: true, name: true, avatar: true } } } },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ appointments });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let therapistId: string;
  let clientId: string;

  if (session.user.role === "THERAPIST") {
    const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
    if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });
    if (!parsed.data.clientId) return NextResponse.json({ error: "clientId is required" }, { status: 400 });

    const client = await db.user.findUnique({ where: { id: parsed.data.clientId }, select: { therapistId: true } });
    if (!client || client.therapistId !== therapist.id) {
      return NextResponse.json({ error: "You can only book sessions for your own clients" }, { status: 403 });
    }

    therapistId = therapist.id;
    clientId = parsed.data.clientId;
  } else {
    if (!parsed.data.therapistId) return NextResponse.json({ error: "therapistId is required" }, { status: 400 });
    const therapist = await db.therapist.findUnique({ where: { id: parsed.data.therapistId } });
    if (!therapist) return NextResponse.json({ error: "Therapist not found" }, { status: 404 });

    const bookingClient = await db.user.findUnique({ where: { id: session.user.id }, select: { therapistId: true } });
    if (bookingClient?.therapistId !== therapist.id) {
      return NextResponse.json({ error: "You can only book with your assigned therapist" }, { status: 403 });
    }

    therapistId = therapist.id;
    clientId = session.user.id;
  }

  const apptDate = new Date(parsed.data.date);
  const durationMs = parsed.data.duration * 60 * 1000;
  const conflict = await findConflictingAppointment(therapistId, apptDate, durationMs);
  if (conflict) return NextResponse.json({ error: "Therapist is not available at this time" }, { status: 409 });

  const appointment = await db.appointment.create({
    data: {
      clientId,
      therapistId,
      date: new Date(parsed.data.date),
      type: parsed.data.type as AppointmentType,
      duration: parsed.data.duration,
      notes: parsed.data.notes,
      status: AppointmentStatus.pending,
      isNew: true,
    },
    include: {
      client: { select: { id: true, name: true, avatar: true } },
      therapist: { include: { user: { select: { id: true, name: true, avatar: true } } } },
    },
  });

  const apptDay = apptDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const apptTime = apptDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (session.user.role === "THERAPIST") {
    await createNotification(appointment.client.id, {
      title: "New session scheduled",
      body: `${appointment.therapist.user.name} booked a ${appointment.type} session for ${apptDay} at ${apptTime}.`,
      icon: "📅",
      href: "/dashboard/schedule",
    }).catch(() => {});
  } else {
    await createNotification(appointment.therapist.user.id, {
      title: "New session request",
      body: `${appointment.client.name} requested a ${appointment.type} session for ${apptDay} at ${apptTime}.`,
      icon: "📅",
      href: "/therapist/appointments",
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, appointment }, { status: 201 });
}
