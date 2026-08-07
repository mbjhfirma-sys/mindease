import { db } from "@/lib/db";
import { createNotification } from "@/lib/notify";

// Business decision, documented default — trivially adjustable later without a schema change.
export const MATCH_FEEDBACK_DELAY_DAYS = 14;

// Idempotently creates the pair of pending MatchFeedback rows (client + therapist) once a
// match has had time to actually be experienced. Safe to call repeatedly (e.g. from a daily
// cron sweep) — returns early on every "not yet due" condition without creating duplicates.
export async function ensurePendingMatchFeedback(clientId: string) {
  const reasoning = await db.matchReasoning.findUnique({ where: { clientId } });
  if (!reasoning) return { skipped: "no_reasoning" as const };

  const client = await db.user.findUnique({ where: { id: clientId }, select: { therapistId: true, name: true } });
  // Client has since switched therapists — this reasoning snapshot is stale, not the
  // current match. Don't prompt for feedback on a relationship that no longer exists.
  if (!client || client.therapistId !== reasoning.therapistId) return { skipped: "stale_reasoning" as const };

  const ageMs = Date.now() - reasoning.createdAt.getTime();
  if (ageMs < MATCH_FEEDBACK_DELAY_DAYS * 86_400_000) return { skipped: "too_early" as const };

  // Prompting "was this a good fit?" during active crisis monitoring is tone-deaf —
  // deferred, not cancelled; becomes eligible again next tick once the window resolves.
  const activeStepUp = await db.riskStepUpWindow.findFirst({ where: { userId: clientId, status: "active" } });
  if (activeStepUp) return { skipped: "active_stepup_window" as const };

  const existingForClient = await db.matchFeedback.findUnique({
    where: { clientId_therapistId_respondentId: { clientId, therapistId: reasoning.therapistId, respondentId: clientId } },
  });
  if (existingForClient) return { skipped: "already_exists" as const };

  const therapist = await db.therapist.findUnique({
    where: { id: reasoning.therapistId },
    select: { userId: true, user: { select: { name: true } } },
  });
  if (!therapist || !client.name) return { skipped: "missing_therapist" as const };

  await db.$transaction([
    db.matchFeedback.create({ data: { clientId, therapistId: reasoning.therapistId, respondentId: clientId, respondentRole: "CLIENT" } }),
    db.matchFeedback.create({ data: { clientId, therapistId: reasoning.therapistId, respondentId: therapist.userId, respondentRole: "THERAPIST" } }),
  ]);

  await createNotification(clientId, {
    title: "Quick check-in",
    body: `Has working with ${therapist.user.name} felt like a good fit? We'd love your feedback.`,
    icon: "💬",
    href: "/dashboard/schedule",
  });
  await createNotification(therapist.userId, {
    title: "Quick check-in",
    body: `How has the fit been with ${client.name}? We'd love your feedback.`,
    icon: "💬",
    href: `/therapist/clients/${clientId}`,
  });

  return { created: true as const };
}
