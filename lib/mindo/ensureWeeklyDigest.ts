import { db } from "@/lib/db";
import { dayKeyInTimeZone, offsetDateKey, resolveTimeZone } from "@/lib/dateKey";
import { computeClientWeeklyFacts } from "@/lib/mindo/facts";
import { generateWeeklyDigest } from "@/lib/mindo/generateDigest";
import type { WeeklyDigest } from "@prisma/client";

export type EnsureWeeklyDigestResult =
  | { enabled: false }
  | { enabled: true; digest: WeeklyDigest; created: boolean };

export async function ensureWeeklyDigest(clientId: string, therapistId: string): Promise<EnsureWeeklyDigestResult> {
  const [client, therapist] = await Promise.all([
    db.user.findUnique({ where: { id: clientId }, select: { timezone: true, therapistId: true, privacyPrefs: true } }),
    db.therapist.findUnique({ where: { id: therapistId }, select: { mindoDigestsEnabled: true } }),
  ]);
  if (!client || !therapist) return { enabled: false };
  if (client.therapistId !== therapistId) return { enabled: false };

  const privacyPrefs = (client.privacyPrefs as Record<string, boolean> | null) ?? {};
  if (privacyPrefs.mindoTherapistDigestEnabled === false) return { enabled: false };
  if (!therapist.mindoDigestsEnabled) return { enabled: false };

  const shareJournalWithTherapist = privacyPrefs.shareJournalWithTherapist === true;
  const timeZone = resolveTimeZone(client.timezone);
  const weekEnd = dayKeyInTimeZone(new Date(), timeZone);
  const weekStart = offsetDateKey(weekEnd, -6);

  const existing = await db.weeklyDigest.findUnique({ where: { clientId_therapistId_weekStart: { clientId, therapistId, weekStart } } });
  if (existing) return { enabled: true, digest: existing, created: false };

  const facts = await computeClientWeeklyFacts(clientId, timeZone, new Date(), shareJournalWithTherapist);
  const result = await generateWeeklyDigest(facts);
  const data = {
    digestText: result.text,
    facts: facts as unknown as object,
    model: result.model,
    promptVersion: 1,
    journalIncluded: shareJournalWithTherapist,
  };
  const digest = await db.weeklyDigest.upsert({
    where: { clientId_therapistId_weekStart: { clientId, therapistId, weekStart } },
    create: { clientId, therapistId, weekStart, ...data },
    update: data,
  });
  return { enabled: true, digest, created: true };
}
