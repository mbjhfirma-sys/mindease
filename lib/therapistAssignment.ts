import { db } from "@/lib/db";
import { createNotification } from "@/lib/notify";

// Assigns a client to a therapist, resolves any of that client's pending
// waitlist entries, and notifies the therapist. Used by both the manual
// "Request this therapist" flow and the automated intake-quiz matching.
export async function assignClientToTherapist(clientId: string, clientName: string, therapistId: string) {
  const therapist = await db.therapist.findUnique({ where: { id: therapistId }, select: { userId: true } });
  if (!therapist) throw new Error("Therapist not found");

  await db.user.update({ where: { id: clientId }, data: { therapistId } });
  await db.waitlistEntry.updateMany({
    where: { userId: clientId, status: "waiting" },
    data: { status: "resolved" },
  });
  await createNotification(therapist.userId, {
    title: "New client assigned",
    body: `${clientName} has been matched with you.`,
    icon: "🤝",
    href: "/therapist/clients",
  });
}
