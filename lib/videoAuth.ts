import { db } from "@/lib/db";
import type { VideoRole } from "@/lib/video";

type AppointmentParticipants = Awaited<ReturnType<typeof loadAppointment>>;

async function loadAppointment(appointmentId: string) {
  return db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: { select: { id: true, name: true } },
      therapist: { select: { userId: true, user: { select: { name: true } } } },
    },
  });
}

export type AuthorizedAppointment =
  | { ok: true; appointment: NonNullable<AppointmentParticipants>; role: VideoRole }
  | { ok: false; status: 404 | 403 };

/** Therapist is always the WebRTC offerer, client always the answerer — fixed, no negotiation. */
export async function authorizeVideoParticipant(appointmentId: string, userId: string): Promise<AuthorizedAppointment> {
  const appointment = await loadAppointment(appointmentId);
  if (!appointment) return { ok: false, status: 404 };

  const isClient = appointment.clientId === userId;
  const isTherapist = appointment.therapist.userId === userId;
  if (!isClient && !isTherapist) return { ok: false, status: 403 };

  return { ok: true, appointment, role: isTherapist ? "offerer" : "answerer" };
}
