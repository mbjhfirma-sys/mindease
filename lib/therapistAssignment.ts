import { db } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { getEffectiveMaxClients } from "@/lib/therapistCapacity";

// Assigns a client to a therapist, resolves any of that client's pending
// waitlist entries, and notifies the therapist. Used by both the manual
// "Request this therapist" flow and the automated intake-quiz matching.
//
// Enforces the therapist's effective client-count cap (Starter's real ceiling of 5, folded
// with any lower self-set maxClients) by default — every caller except admin reassignment
// should let this reject rather than pre-check on their own, so the invariant holds by
// construction rather than by every call site remembering to check first.
export async function assignClientToTherapist(
  clientId: string,
  clientName: string,
  therapistId: string,
  opts?: { bypassCapacityCheck?: boolean }
): Promise<{ ok: true } | { ok: false; reason: "at_capacity" }> {
  const therapist = await db.therapist.findUnique({
    where: { id: therapistId },
    select: {
      userId: true, title: true, maxClients: true, user: { select: { name: true } },
      subscription: { select: { planId: true } },
      _count: { select: { clients: true } },
    },
  });
  if (!therapist) throw new Error("Therapist not found");

  if (!opts?.bypassCapacityCheck) {
    const effectiveCap = getEffectiveMaxClients(therapist.maxClients, therapist.subscription?.planId);
    if (effectiveCap != null && therapist._count.clients >= effectiveCap) {
      return { ok: false, reason: "at_capacity" };
    }
  }

  await db.user.update({ where: { id: clientId }, data: { therapistId } });
  await db.waitlistEntry.updateMany({
    where: { userId: clientId, status: "waiting" },
    data: { status: "resolved" },
  });

  // If this client has an active crisis step-up window, the clinical contact should
  // follow them to their new therapist rather than staying pointed at the old one.
  await db.riskStepUpWindow.updateMany({
    where: { userId: clientId, status: "active" },
    data: { contactUserId: therapist.userId, contactLabel: `${therapist.user.name}, ${therapist.title}` },
  });

  await createNotification(therapist.userId, {
    title: "New client assigned",
    body: `${clientName} has been matched with you.`,
    icon: "🤝",
    href: "/therapist/clients",
  });

  return { ok: true };
}
