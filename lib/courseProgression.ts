// Pure — no db/auth import, so both the client-component course player and the
// server-side progress route can import the exact same rule instead of each
// reimplementing "is this lesson locked" independently.
//
// A lesson is locked if it isn't completed AND some earlier lesson in the course
// isn't completed either. Walking the whole prefix (not just the immediately
// preceding lesson) matters because this gating is retrofitted onto a system that
// never enforced order before — a lesson completed out of sequence in old data
// stays viewable rather than getting hidden, but everything genuinely incomplete
// past the first real gap stays locked regardless of what got completed later.
export function computeLockedLessonIds(
  lessonsSortedByOrder: { id: string }[],
  completedLessonIds: Set<string>
): Set<string> {
  const locked = new Set<string>();
  let chainIntact = true;
  for (const lesson of lessonsSortedByOrder) {
    const isCompleted = completedLessonIds.has(lesson.id);
    if (!chainIntact && !isCompleted) locked.add(lesson.id);
    if (!isCompleted) chainIntact = false;
  }
  return locked;
}
