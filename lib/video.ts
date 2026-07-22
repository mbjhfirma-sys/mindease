export type VideoRole = "offerer" | "answerer";

export const JOIN_WINDOW_BEFORE_MIN = 10;
export const JOIN_WINDOW_AFTER_MIN = 15;

export type JoinWindow = {
  opensAt: Date;
  closesAt: Date;
  isOpen: boolean;
  opensInMs: number;
};

export function getJoinWindow(date: Date, durationMin: number, now: Date = new Date()): JoinWindow {
  const opensAt = new Date(date.getTime() - JOIN_WINDOW_BEFORE_MIN * 60_000);
  const closesAt = new Date(date.getTime() + (durationMin + JOIN_WINDOW_AFTER_MIN) * 60_000);
  const nowMs = now.getTime();
  return {
    opensAt,
    closesAt,
    isOpen: nowMs >= opensAt.getTime() && nowMs <= closesAt.getTime(),
    opensInMs: Math.max(0, opensAt.getTime() - nowMs),
  };
}
