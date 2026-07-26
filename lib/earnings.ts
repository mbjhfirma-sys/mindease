import { db } from "@/lib/db";
import type { AppointmentType, VideoSession } from "@prisma/client";

export function computeSessionDuration(
  appointmentType: AppointmentType,
  vs: VideoSession | null,
  scheduledMinutes: number
): { minutes: number; source: "actual" | "scheduled_fallback" } {
  // Non-video appointments (in_person, phone) have no VideoSession row at all by design —
  // go straight to the scheduled fallback, this is not a "missing data" edge case.
  if (appointmentType !== "video" || !vs) {
    return { minutes: scheduledMinutes, source: "scheduled_fallback" };
  }

  const start = vs.clientJoinedAt && vs.therapistJoinedAt
    ? new Date(Math.max(+vs.clientJoinedAt, +vs.therapistJoinedAt))
    : null;
  const clientEnd = vs.clientLeftAt ?? vs.endedAt;
  const therapistEnd = vs.therapistLeftAt ?? vs.endedAt;
  const end = clientEnd && therapistEnd
    ? new Date(Math.min(+clientEnd, +therapistEnd))
    : null;

  if (!start || !end || end <= start) {
    // Call never showed a genuine simultaneous overlap (crashed tab, one party never joined,
    // etc). Don't fabricate a measured duration — fall back to scheduled length, clearly
    // flagged via `source` so the UI can show it was estimated, not measured.
    return { minutes: scheduledMinutes, source: "scheduled_fallback" };
  }
  const minutes = (+end - +start) / 60000;
  // Clamp against clock-skew/runaway values.
  return { minutes: Math.min(minutes, scheduledMinutes * 2), source: "actual" };
}

export async function recordSessionEarningForAppointment(appointmentId: string) {
  const existing = await db.sessionEarning.findUnique({ where: { appointmentId } });
  if (existing) return;

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { videoSession: true },
  });
  if (!appointment) return;

  const billing = await db.therapistBilling.findUnique({ where: { therapistId: appointment.therapistId } });
  if (!billing || billing.ratePerMinuteCents == null) return;

  const duration = computeSessionDuration(appointment.type, appointment.videoSession, appointment.duration);
  const grossAmountCents = Math.round(duration.minutes * billing.ratePerMinuteCents);
  const platformFeeCents = Math.round((grossAmountCents * billing.platformFeeBps) / 10000);
  const netAmountCents = grossAmountCents - platformFeeCents;

  await db.sessionEarning.create({
    data: {
      appointmentId: appointment.id,
      therapistId: appointment.therapistId,
      clientId: appointment.clientId,
      sessionDate: appointment.date,
      durationMinutes: duration.minutes,
      durationSource: duration.source,
      ratePerMinuteCents: billing.ratePerMinuteCents,
      grossAmountCents,
      platformFeeBps: billing.platformFeeBps,
      platformFeeCents,
      netAmountCents,
      currency: billing.currency,
    },
  });
}
