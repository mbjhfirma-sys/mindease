import { db } from "@/lib/db";
import { dayKeyInTimeZone, offsetDateKey, resolveTimeZone } from "@/lib/dateKey";

// Advances a user's login streak by at most one day per calendar day (in their own
// timezone). Called from auth.ts's `jwt` callback, which runs on nearly every
// authenticated request (see proxy.ts) — so this must stay a cheap no-op once the
// day is already synced, rather than something callers remember to invoke once at
// actual credential sign-in (sessions persist for weeks, so real sign-in events are
// too rare to drive a daily streak).
export async function syncLoginStreak(userId: string, now: Date = new Date()): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { timezone: true, lastActiveDay: true, loginStreak: true },
  });
  if (!user) return;

  const timeZone = resolveTimeZone(user.timezone);
  const today = dayKeyInTimeZone(now, timeZone);
  if (user.lastActiveDay === today) return;

  const wasYesterday = user.lastActiveDay === offsetDateKey(today, -1);
  await db.user.update({
    where: { id: userId },
    data: {
      lastActiveDay: today,
      loginStreak: wasYesterday ? user.loginStreak + 1 : 1,
    },
  });
}
