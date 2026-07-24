import { db } from "@/lib/db";
import { dayKeyInTimeZone, getUserDayRange, offsetDateKey, computeConsecutiveDayStreak, STREAK_LOOKBACK } from "@/lib/dateKey";

export type MoodTrend = "improving" | "declining" | "stable" | "insufficient_data";

export type DailyFacts = {
  dateKey: string;
  yesterday: {
    dateKey: string;
    moodEntries: { score: number; label: string; note: string | null; createdAt: string }[];
    avgMood: number | null;
    journalEntries: { content: string; sleepQuality: number | null; mood: number; triggers: string[]; createdAt: string }[];
    missionsAssigned: number;
    missionsCompleted: number;
    completionRate: number | null;
  };
  last7Days: {
    avgMood: number | null;
    moodTrend: MoodTrend;
    completionRate: number | null;
    currentStreak: number;
  };
  activeTreatmentGoals: { shortTermGoals: string; longTermGoals: string; approach: string | null } | null;
  todaysAssignedMissions: { title: string; activityType: string }[];
  openRiskFlag: { severity: string; createdAt: string } | null;
};

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
}

// Noise threshold of 0.5 (on a 1-5 mood scale) avoids reading small week-to-week
// wobble as a real trend — only a genuine half-point-or-more shift gets narrated.
function classifyTrend(recentAvg: number | null, priorAvg: number | null): MoodTrend {
  if (recentAvg === null || priorAvg === null) return "insufficient_data";
  const delta = recentAvg - priorAvg;
  if (Math.abs(delta) < 0.5) return "stable";
  return delta > 0 ? "improving" : "declining";
}

export async function computeClientDailyFacts(userId: string, timeZone: string, now: Date = new Date()): Promise<DailyFacts> {
  const todayKey = dayKeyInTimeZone(now, timeZone);
  const yesterdayKey = offsetDateKey(todayKey, -1);
  const weekAgoKey = offsetDateKey(todayKey, -7);
  const twoWeeksAgoKey = offsetDateKey(todayKey, -14);

  const todayRange = getUserDayRange(todayKey, timeZone);
  const yesterdayRange = getUserDayRange(yesterdayKey, timeZone);
  const last7Start = getUserDayRange(weekAgoKey, timeZone).start;
  const prior7Start = getUserDayRange(twoWeeksAgoKey, timeZone).start;

  const [user, streakMoods, yesterdayMoods, yesterdayJournals, last7Moods, prior7Moods, assignments, recentCompletions, openFlags] =
    await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { therapistId: true } }),
      db.moodEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: STREAK_LOOKBACK, select: { createdAt: true } }),
      db.moodEntry.findMany({ where: { userId, createdAt: { gte: yesterdayRange.start, lt: yesterdayRange.end } }, orderBy: { createdAt: "asc" } }),
      db.journalEntry.findMany({ where: { userId, createdAt: { gte: yesterdayRange.start, lt: yesterdayRange.end } }, orderBy: { createdAt: "asc" } }),
      db.moodEntry.findMany({ where: { userId, createdAt: { gte: last7Start, lt: todayRange.start } }, select: { score: true } }),
      db.moodEntry.findMany({ where: { userId, createdAt: { gte: prior7Start, lt: last7Start } }, select: { score: true } }),
      db.missionAssignment.findMany({ where: { clientId: userId }, include: { mission: true } }),
      db.missionCompletion.findMany({ where: { userId, completedAt: { gte: prior7Start } }, select: { missionId: true, completedAt: true } }),
      db.riskFlag.findMany({ where: { userId, status: "open" }, orderBy: { createdAt: "desc" } }),
    ]);

  const currentStreak = computeConsecutiveDayStreak(streakMoods.map((m) => m.createdAt), timeZone, now);

  const assignedMissionIds = new Set(assignments.map((a) => a.missionId));
  const completedIdsByDay = new Map<string, Set<string>>();
  const everCompletedAssignedIds = new Set<string>();
  for (const c of recentCompletions) {
    const key = dayKeyInTimeZone(c.completedAt, timeZone);
    if (!completedIdsByDay.has(key)) completedIdsByDay.set(key, new Set());
    completedIdsByDay.get(key)!.add(c.missionId);
    if (assignedMissionIds.has(c.missionId)) everCompletedAssignedIds.add(c.missionId);
  }

  const completedYesterday = completedIdsByDay.get(yesterdayKey) ?? new Set<string>();
  const missionsAssignedYesterday = assignments.length;
  const missionsCompletedYesterday = assignments.filter((a) => completedYesterday.has(a.missionId)).length;

  let completedInLast7 = 0;
  let cursor = weekAgoKey;
  while (cursor !== todayKey) {
    completedInLast7 += assignments.filter((a) => (completedIdsByDay.get(cursor) ?? new Set()).has(a.missionId)).length;
    cursor = offsetDateKey(cursor, 1);
  }
  const possibleCompletionsLast7 = assignments.length * 7;

  const completedToday = completedIdsByDay.get(todayKey) ?? new Set<string>();
  const todaysAssignedMissions = assignments
    .filter((a) => {
      if (a.mission.recurring) return !completedToday.has(a.missionId);
      return !everCompletedAssignedIds.has(a.missionId);
    })
    .map((a) => ({ title: a.mission.title, activityType: a.mission.activityType }));

  const activeTreatmentGoals = user?.therapistId
    ? await db.treatmentPlan
        .findUnique({ where: { therapistId_clientId: { therapistId: user.therapistId, clientId: userId } } })
        .then((plan) => (plan ? { shortTermGoals: plan.shortTermGoals, longTermGoals: plan.longTermGoals, approach: plan.approach || null } : null))
    : null;

  const openRiskFlag = (() => {
    if (openFlags.length === 0) return null;
    const high = openFlags.find((f) => f.severity === "high");
    const chosen = high ?? openFlags[0];
    return { severity: chosen.severity, createdAt: chosen.createdAt.toISOString() };
  })();

  return {
    dateKey: todayKey,
    yesterday: {
      dateKey: yesterdayKey,
      moodEntries: yesterdayMoods.map((m) => ({ score: m.score, label: m.label, note: m.note, createdAt: m.createdAt.toISOString() })),
      avgMood: average(yesterdayMoods.map((m) => m.score)),
      journalEntries: yesterdayJournals.map((j) => ({
        content: j.content, sleepQuality: j.sleepQuality, mood: j.mood, triggers: j.triggers, createdAt: j.createdAt.toISOString(),
      })),
      missionsAssigned: missionsAssignedYesterday,
      missionsCompleted: missionsCompletedYesterday,
      completionRate: missionsAssignedYesterday > 0 ? Math.round((missionsCompletedYesterday / missionsAssignedYesterday) * 100) / 100 : null,
    },
    last7Days: {
      avgMood: average(last7Moods.map((m) => m.score)),
      moodTrend: classifyTrend(average(last7Moods.map((m) => m.score)), average(prior7Moods.map((m) => m.score))),
      completionRate: possibleCompletionsLast7 > 0 ? Math.round((completedInLast7 / possibleCompletionsLast7) * 100) / 100 : null,
      currentStreak,
    },
    activeTreatmentGoals,
    todaysAssignedMissions,
    openRiskFlag,
  };
}

export type SleepMoodDirection = "negative_impact" | "positive_impact" | "no_clear_pattern" | "insufficient_data";
export type RateTrend = "improving" | "declining" | "stable" | "insufficient_data";

export type WeeklyFacts = {
  weekStart: string;
  weekEnd: string;
  completion: { assigned: number; completed: number; rate: number | null };
  moodSummary: { avg: number | null; min: number | null; max: number | null; entryCount: number; trend: MoodTrend };
  sleepMoodImpact: {
    moodDeltaOnPoorSleepDays: number | null;
    nPoorSleepDays: number;
    nGoodSleepDays: number;
    pearsonR: number | null;
    direction: SleepMoodDirection;
  } | null;
  categoryCompletionTrend: { activityType: string; thisWeekRate: number; priorFourWeekAvgRate: number | null; direction: RateTrend }[];
  lowestCompletionCategory: { activityType: string; rate: number } | null;
  riskFlagsThisWeek: { severity: string; status: string; createdAt: string }[];
};

// Rate deltas live on a 0-1 scale (unlike the 1-5 mood scale), so a much smaller
// absolute threshold still represents a meaningful, narratable shift.
function classifyRateTrend(recentRate: number | null, priorRate: number | null): RateTrend {
  if (recentRate === null || priorRate === null) return "insufficient_data";
  const delta = recentRate - priorRate;
  if (Math.abs(delta) < 0.1) return "stable";
  return delta > 0 ? "improving" : "declining";
}

function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;
  const xMean = xs.reduce((s, v) => s + v, 0) / n;
  const yMean = ys.reduce((s, v) => s + v, 0) / n;
  let cov = 0, xVar = 0, yVar = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - xMean;
    const dy = ys[i] - yMean;
    cov += dx * dy;
    xVar += dx * dx;
    yVar += dy * dy;
  }
  if (xVar === 0 || yVar === 0) return null;
  return Math.round((cov / Math.sqrt(xVar * yVar)) * 100) / 100;
}

export async function computeClientWeeklyFacts(clientId: string, timeZone: string, weekEndDate: Date, shareJournalWithTherapist: boolean): Promise<WeeklyFacts> {
  const weekEnd = dayKeyInTimeZone(weekEndDate, timeZone);
  const weekStart = offsetDateKey(weekEnd, -6);
  const nextDayAfterWeekEnd = offsetDateKey(weekEnd, 1);
  const weekRange = { start: getUserDayRange(weekStart, timeZone).start, end: getUserDayRange(nextDayAfterWeekEnd, timeZone).start };

  const priorWeekStart = offsetDateKey(weekStart, -7);
  const priorWeekRange = { start: getUserDayRange(priorWeekStart, timeZone).start, end: weekRange.start };

  const sixtyDaysAgo = offsetDateKey(weekEnd, -60);
  const rollingStart = getUserDayRange(sixtyDaysAgo, timeZone).start;

  const [weekMoodsFull, priorWeekMoods, assignments, weekCompletions, priorFourWeeksCompletions, weekJournals, rollingMoods, rollingJournals, riskFlags] =
    await Promise.all([
      db.moodEntry.findMany({ where: { userId: clientId, createdAt: { gte: weekRange.start, lt: weekRange.end } }, select: { score: true, createdAt: true } }),
      db.moodEntry.findMany({ where: { userId: clientId, createdAt: { gte: priorWeekRange.start, lt: priorWeekRange.end } }, select: { score: true } }),
      db.missionAssignment.findMany({ where: { clientId }, include: { mission: true } }),
      db.missionCompletion.findMany({ where: { userId: clientId, completedAt: { gte: weekRange.start, lt: weekRange.end } }, select: { missionId: true, completedAt: true } }),
      db.missionCompletion.findMany({ where: { userId: clientId, completedAt: { gte: getUserDayRange(offsetDateKey(weekStart, -28), timeZone).start, lt: weekRange.start } }, select: { missionId: true, completedAt: true } }),
      shareJournalWithTherapist
        ? db.journalEntry.findMany({ where: { userId: clientId, createdAt: { gte: weekRange.start, lt: weekRange.end } }, select: { sleepQuality: true, createdAt: true } })
        : Promise.resolve([]),
      shareJournalWithTherapist
        ? db.moodEntry.findMany({ where: { userId: clientId, createdAt: { gte: rollingStart, lt: weekRange.end } }, select: { score: true, createdAt: true } })
        : Promise.resolve([]),
      shareJournalWithTherapist
        ? db.journalEntry.findMany({ where: { userId: clientId, createdAt: { gte: rollingStart, lt: weekRange.end } }, select: { sleepQuality: true, createdAt: true } })
        : Promise.resolve([]),
      db.riskFlag.findMany({ where: { userId: clientId, createdAt: { gte: weekRange.start, lt: weekRange.end } }, orderBy: { createdAt: "desc" } }),
    ]);

  // Completion: reuses the exact "assignments x 7 possible days" denominator
  // from computeClientDailyFacts' last7Days.completionRate, so the two
  // "completion rate" numbers the app shows never quietly disagree.
  const completedIdsByDay = new Map<string, Set<string>>();
  for (const c of weekCompletions) {
    const key = dayKeyInTimeZone(c.completedAt, timeZone);
    if (!completedIdsByDay.has(key)) completedIdsByDay.set(key, new Set());
    completedIdsByDay.get(key)!.add(c.missionId);
  }
  let completedThisWeek = 0;
  let cursor = weekStart;
  while (cursor !== nextDayAfterWeekEnd) {
    completedThisWeek += assignments.filter((a) => (completedIdsByDay.get(cursor) ?? new Set()).has(a.missionId)).length;
    cursor = offsetDateKey(cursor, 1);
  }
  const possibleThisWeek = assignments.length * 7;

  const weekMoodScores = weekMoodsFull.map((m) => m.score);
  const priorWeekMoodScores = priorWeekMoods.map((m) => m.score);

  let sleepMoodImpact: WeeklyFacts["sleepMoodImpact"] = null;
  if (shareJournalWithTherapist) {
    const dailyMood = new Map<string, number[]>();
    const dailySleep = new Map<string, number>();
    for (const m of weekMoodsFull) {
      const key = dayKeyInTimeZone(m.createdAt, timeZone);
      if (!dailyMood.has(key)) dailyMood.set(key, []);
      dailyMood.get(key)!.push(m.score);
    }
    for (const j of weekJournals) {
      if (j.sleepQuality == null) continue;
      const key = dayKeyInTimeZone(j.createdAt, timeZone);
      dailySleep.set(key, j.sleepQuality);
    }
    const poorDayMoods: number[] = [];
    const goodDayMoods: number[] = [];
    for (const [day, sleep] of dailySleep) {
      const moods = dailyMood.get(day);
      if (!moods || moods.length === 0) continue;
      const dayAvgMood = moods.reduce((s, v) => s + v, 0) / moods.length;
      if (sleep <= 2) poorDayMoods.push(dayAvgMood);
      else if (sleep >= 4) goodDayMoods.push(dayAvgMood);
    }
    const poorAvg = average(poorDayMoods);
    const goodAvg = average(goodDayMoods);
    const moodDelta = poorAvg !== null && goodAvg !== null ? Math.round((poorAvg - goodAvg) * 10) / 10 : null;

    // Secondary, more robust signal: Pearson r over a rolling 60-day window,
    // only once enough paired days exist for a coefficient to mean anything.
    const rollingMoodByDay = new Map<string, number[]>();
    for (const m of rollingMoods) {
      const key = dayKeyInTimeZone(m.createdAt, timeZone);
      if (!rollingMoodByDay.has(key)) rollingMoodByDay.set(key, []);
      rollingMoodByDay.get(key)!.push(m.score);
    }
    const rollingSleepByDay = new Map<string, number>();
    for (const j of rollingJournals) {
      if (j.sleepQuality == null) continue;
      rollingSleepByDay.set(dayKeyInTimeZone(j.createdAt, timeZone), j.sleepQuality);
    }
    const pairedSleep: number[] = [];
    const pairedMood: number[] = [];
    for (const [day, sleep] of rollingSleepByDay) {
      const moods = rollingMoodByDay.get(day);
      if (!moods || moods.length === 0) continue;
      pairedSleep.push(sleep);
      pairedMood.push(moods.reduce((s, v) => s + v, 0) / moods.length);
    }
    const pearsonR = pairedSleep.length >= 14 ? pearsonCorrelation(pairedSleep, pairedMood) : null;

    let direction: SleepMoodDirection = "insufficient_data";
    if (moodDelta !== null) {
      direction = Math.abs(moodDelta) < 0.5 ? "no_clear_pattern" : moodDelta < 0 ? "negative_impact" : "positive_impact";
    }

    sleepMoodImpact = {
      moodDeltaOnPoorSleepDays: moodDelta,
      nPoorSleepDays: poorDayMoods.length,
      nGoodSleepDays: goodDayMoods.length,
      pearsonR,
      direction,
    };
  }

  // Per-category completion trend, generalized over whatever activityType
  // values this client's actual assignments use (no hardcoded taxonomy).
  const priorCompletedIdsByDay = new Map<string, Set<string>>();
  for (const c of priorFourWeeksCompletions) {
    const key = dayKeyInTimeZone(c.completedAt, timeZone);
    if (!priorCompletedIdsByDay.has(key)) priorCompletedIdsByDay.set(key, new Set());
    priorCompletedIdsByDay.get(key)!.add(c.missionId);
  }
  const byCategory = new Map<string, { missionIds: Set<string> }>();
  for (const a of assignments) {
    const cat = a.mission.activityType;
    if (!byCategory.has(cat)) byCategory.set(cat, { missionIds: new Set() });
    byCategory.get(cat)!.missionIds.add(a.missionId);
  }
  const categoryCompletionTrend: WeeklyFacts["categoryCompletionTrend"] = [];
  for (const [activityType, { missionIds }] of byCategory) {
    let thisWeekCount = 0;
    let c1 = weekStart;
    while (c1 !== nextDayAfterWeekEnd) {
      const done = completedIdsByDay.get(c1) ?? new Set();
      thisWeekCount += [...missionIds].filter((id) => done.has(id)).length;
      c1 = offsetDateKey(c1, 1);
    }
    const thisWeekRate = missionIds.size > 0 ? Math.round((thisWeekCount / (missionIds.size * 7)) * 100) / 100 : 0;

    let priorCount = 0;
    let c2 = offsetDateKey(weekStart, -28);
    while (c2 !== weekStart) {
      const done = priorCompletedIdsByDay.get(c2) ?? new Set();
      priorCount += [...missionIds].filter((id) => done.has(id)).length;
      c2 = offsetDateKey(c2, 1);
    }
    const priorFourWeekAvgRate = missionIds.size > 0 ? Math.round((priorCount / (missionIds.size * 7 * 4)) * 100) / 100 : null;

    categoryCompletionTrend.push({
      activityType,
      thisWeekRate,
      priorFourWeekAvgRate,
      direction: classifyRateTrend(thisWeekRate, priorFourWeekAvgRate),
    });
  }
  const lowestCompletionCategory = categoryCompletionTrend.length > 0
    ? categoryCompletionTrend.reduce((min, c) => (c.thisWeekRate < min.thisWeekRate ? c : min))
    : null;

  return {
    weekStart,
    weekEnd,
    completion: {
      assigned: assignments.length,
      completed: completedThisWeek,
      rate: possibleThisWeek > 0 ? Math.round((completedThisWeek / possibleThisWeek) * 100) / 100 : null,
    },
    moodSummary: {
      avg: average(weekMoodScores),
      min: weekMoodScores.length > 0 ? Math.min(...weekMoodScores) : null,
      max: weekMoodScores.length > 0 ? Math.max(...weekMoodScores) : null,
      entryCount: weekMoodScores.length,
      trend: classifyTrend(average(weekMoodScores), average(priorWeekMoodScores)),
    },
    sleepMoodImpact,
    categoryCompletionTrend,
    lowestCompletionCategory: lowestCompletionCategory ? { activityType: lowestCompletionCategory.activityType, rate: lowestCompletionCategory.thisWeekRate } : null,
    riskFlagsThisWeek: riskFlags.map((f) => ({ severity: f.severity, status: f.status, createdAt: f.createdAt.toISOString() })),
  };
}
