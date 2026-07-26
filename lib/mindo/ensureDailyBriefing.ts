import { db } from "@/lib/db";
import { dayKeyInTimeZone, resolveTimeZone } from "@/lib/dateKey";
import { computeClientDailyFacts } from "@/lib/mindo/facts";
import { generateDailyBriefing } from "@/lib/mindo/generateBriefing";
import type { DailyBriefing } from "@prisma/client";

export type EnsureDailyBriefingResult =
  | { enabled: false }
  | { enabled: true; briefing: DailyBriefing; created: boolean };

export async function ensureDailyBriefing(userId: string): Promise<EnsureDailyBriefingResult> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { timezone: true, privacyPrefs: true } });
  if (!user) return { enabled: false };

  const privacyPrefs = (user.privacyPrefs as Record<string, boolean> | null) ?? {};
  if (privacyPrefs.mindoClientBriefingEnabled === false) return { enabled: false };

  const timeZone = resolveTimeZone(user.timezone);
  const dateKey = dayKeyInTimeZone(new Date(), timeZone);

  const existing = await db.dailyBriefing.findUnique({ where: { userId_date: { userId, date: dateKey } } });
  if (existing) return { enabled: true, briefing: existing, created: false };

  const facts = await computeClientDailyFacts(userId, timeZone, new Date());

  // Generating personalized AI copy during an active risk situation is an
  // unnecessary risk surface — the existing rule-based RiskFlag/notification
  // system is the correct response channel, not Mindo. Skip the LLM entirely.
  if (facts.openRiskFlag?.severity === "high") {
    const softData = {
      briefingText: "However you're feeling today, your care team is here for you — check in with your support resources whenever you need to.",
      facts: facts as unknown as object,
      model: "template-fallback",
      softened: true,
    };
    const briefing = await db.dailyBriefing.upsert({
      where: { userId_date: { userId, date: dateKey } },
      create: { userId, date: dateKey, ...softData },
      update: softData,
    });
    return { enabled: true, briefing, created: true };
  }

  const result = await generateDailyBriefing(facts);
  const data = {
    briefingText: result.text,
    facts: facts as unknown as object,
    model: result.model,
    softened: result.softened,
  };
  const briefing = await db.dailyBriefing.upsert({
    where: { userId_date: { userId, date: dateKey } },
    create: { userId, date: dateKey, ...data },
    update: data,
  });
  return { enabled: true, briefing, created: true };
}
