import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AppointmentStatus, AppointmentType } from "@prisma/client";

const VALID_STATUSES = new Set(Object.values(AppointmentStatus));

const createSchema = z.object({
  therapistId: z.string(),
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

  const therapist = await db.therapist.findUnique({ where: { id: parsed.data.therapistId } });
  if (!therapist) return NextResponse.json({ error: "Therapist not found" }, { status: 404 });

  const appointment = await db.appointment.create({
    data: {
      clientId: session.user.id,
      therapistId: parsed.data.therapistId,
      date: new Date(parsed.data.date),
      type: parsed.data.type as AppointmentType,
      duration: parsed.data.duration,
      notes: parsed.data.notes,
      status: AppointmentStatus.pending,
      isNew: true,
    },
  });

  return NextResponse.json({ ok: true, appointment }, { status: 201 });
}
