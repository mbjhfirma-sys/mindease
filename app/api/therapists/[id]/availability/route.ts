import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { weekdayOf, timeSlotToDate } from "@/lib/scheduling";
import { findConflictingAppointment } from "@/lib/appointmentConflict";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const date = req.nextUrl.searchParams.get("date");
  const durationParam = req.nextUrl.searchParams.get("duration");
  const duration = durationParam ? parseInt(durationParam, 10) : 50;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json({ error: "Valid date and duration are required" }, { status: 400 });
  }

  const therapist = await db.therapist.findUnique({ where: { id }, select: { id: true } });
  if (!therapist) return NextResponse.json({ error: "Therapist not found" }, { status: 404 });

  const weekday = weekdayOf(date);
  const slots = await db.availabilitySlot.findMany({
    where: { therapistId: therapist.id, day: weekday },
    select: { time: true },
  });

  const durationMs = duration * 60 * 1000;
  const available: string[] = [];
  for (const slot of slots) {
    const slotDate = timeSlotToDate(date, slot.time);
    const conflict = await findConflictingAppointment(therapist.id, slotDate, durationMs);
    if (!conflict) available.push(slot.time);
  }

  return NextResponse.json({ slots: available });
}
