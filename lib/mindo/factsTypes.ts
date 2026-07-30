// Pure type definitions for Mindo's deterministic facts layer, split out of facts.ts so
// UI code (e.g. the client/therapist fact-transparency grids) can import the real shapes
// without pulling in facts.ts's server-only Prisma/db imports, and so those shapes can never
// silently drift out of sync with a hand-duplicated local copy (as the therapist client-detail
// page's old local `DigestFacts` type had).

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
