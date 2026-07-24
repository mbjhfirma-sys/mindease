// ~10 years of days: bounds query/loop cost without capping any realistic streak.
const STREAK_LOOKBACK_DAYS = 3650;

export function dayKeyInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function resolveTimeZone(timezone: string | null | undefined): string {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone || "UTC" });
    return timezone || "UTC";
  } catch {
    return "UTC";
  }
}

export function offsetDateKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Converts "local midnight of dateKey, in timeZone" to the equivalent UTC instant.
// Iterates because the UTC offset for a given wall-clock time can only be found by
// formatting a guess and re-adjusting — 3 rounds comfortably converges even across
// a DST transition landing exactly at that midnight.
function localMidnightToUtc(dateKey: string, timeZone: string): Date {
  let guess = new Date(`${dateKey}T00:00:00Z`);
  const wantUtcMs = guess.getTime();
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(guess);
    const get = (t: string) => parts.find((p) => p.type === t)!.value;
    const hour = get("hour") === "24" ? "00" : get("hour");
    const gotUtcMs = new Date(`${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}:00Z`).getTime();
    guess = new Date(guess.getTime() + (wantUtcMs - gotUtcMs));
  }
  return guess;
}

// The UTC instant range covering one calendar day as experienced in the user's own
// timezone — for Prisma range queries (`createdAt: { gte: start, lt: end }`). Each
// boundary is resolved independently so a day either side of a DST transition still
// gets its correct (23h/25h) length instead of assuming a fixed 24h offset.
export function getUserDayRange(dateKey: string, timeZone: string): { start: Date; end: Date } {
  return {
    start: localMidnightToUtc(dateKey, timeZone),
    end: localMidnightToUtc(offsetDateKey(dateKey, 1), timeZone),
  };
}

// Consecutive-day streak over a set of entry timestamps, walking backward from "today"
// in the user's timezone. Shared by achievements' mood streak and Mindo's daily facts
// so the two surfaces never silently disagree on what "N-day streak" means.
export function computeConsecutiveDayStreak(entryDates: Date[], timeZone: string, now: Date = new Date()): number {
  const entryDayKeys = new Set(entryDates.map((d) => dayKeyInTimeZone(d, timeZone)));
  let streak = 0;
  const todayUtcMidnight = new Date(`${dayKeyInTimeZone(now, timeZone)}T00:00:00Z`);
  for (let i = 0; i < STREAK_LOOKBACK_DAYS; i++) {
    const dayUtcMidnight = new Date(todayUtcMidnight);
    dayUtcMidnight.setUTCDate(dayUtcMidnight.getUTCDate() - i);
    const hasEntry = entryDayKeys.has(dayUtcMidnight.toISOString().slice(0, 10));
    if (!hasEntry && i > 0) break;
    if (hasEntry) streak++;
  }
  return streak;
}

export const STREAK_LOOKBACK = STREAK_LOOKBACK_DAYS;
