import { db } from "@/lib/db";
import { AppointmentStatus } from "@prisma/client";

export function findConflictingAppointment(therapistId: string, date: Date, durationMs: number) {
  return db.appointment.findFirst({
    where: {
      therapistId,
      date: { gt: new Date(date.getTime() - durationMs), lt: new Date(date.getTime() + durationMs) },
      status: { in: [AppointmentStatus.pending, AppointmentStatus.confirmed] },
    },
  });
}
