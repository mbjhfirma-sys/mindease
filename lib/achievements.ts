export type BadgeCategory = "streak" | "mission" | "course" | "journal" | "community" | "special";

export type BadgeDef = {
  badgeId: string;
  category: BadgeCategory;
  label: string;
  desc: string;
};

export const BADGE_DEFINITIONS: BadgeDef[] = [
  { badgeId: "streak_7",      category: "streak",    label: "7-day consistency",   desc: "Logged mood 7 days in a row" },
  { badgeId: "streak_30",     category: "streak",    label: "Monthly practice",    desc: "Logged mood 30 days in a row" },
  { badgeId: "mission_10",    category: "mission",   label: "10 tasks completed",  desc: "Completed 10 daily missions" },
  { badgeId: "mission_50",    category: "mission",   label: "50 tasks completed",  desc: "Completed 50 daily missions" },
  { badgeId: "journal_5",     category: "journal",   label: "Journalling habit",   desc: "Wrote 5 journal entries" },
  { badgeId: "journal_30",    category: "journal",   label: "Reflective writer",   desc: "Wrote 30 journal entries" },
  { badgeId: "course_1",      category: "course",    label: "First lesson",        desc: "Completed your first course lesson" },
  { badgeId: "course_10",     category: "course",    label: "Dedicated learner",   desc: "Completed 10 course lessons" },
  { badgeId: "community_1",   category: "community", label: "Community member",    desc: "Joined your first support group" },
  { badgeId: "special_first", category: "special",   label: "Welcome to YouMindo", desc: "Created your account" },
];

export type UserStats = {
  streak: number;
  missionsCompleted: number;
  journalEntries: number;
  lessonsCompleted: number;
  moodEntries: number;
  communityGroups: number;
};

export const BADGE_ELIGIBILITY: Record<string, (s: UserStats) => boolean> = {
  streak_7:      (s) => s.streak >= 7,
  streak_30:     (s) => s.streak >= 30,
  mission_10:    (s) => s.missionsCompleted >= 10,
  mission_50:    (s) => s.missionsCompleted >= 50,
  journal_5:     (s) => s.journalEntries >= 5,
  journal_30:    (s) => s.journalEntries >= 30,
  course_1:      (s) => s.lessonsCompleted >= 1,
  course_10:     (s) => s.lessonsCompleted >= 10,
  community_1:   (s) => s.communityGroups >= 1,
  special_first: () => true,
};
