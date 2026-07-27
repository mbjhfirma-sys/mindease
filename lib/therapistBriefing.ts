type BriefingSession = { clientName: string; time: string };
type BriefingRiskFlag = { clientName: string; severity: "high" | "moderate"; detail: string };

function joinNames(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function buildBriefingText({
  greeting, userName, sessions, riskFlags, inactiveClientNames, pendingCount, communityFlagCount,
}: {
  greeting: string;
  userName: string;
  sessions: BriefingSession[];
  riskFlags: BriefingRiskFlag[];
  inactiveClientNames: string[];
  pendingCount: number;
  communityFlagCount: number;
}): string {
  const parts: string[] = [`${greeting}, ${userName} —`];

  if (sessions.length > 0) {
    parts.push(`you have ${sessions.length} session${sessions.length === 1 ? "" : "s"} today, starting with ${sessions[0].clientName} at ${sessions[0].time}.`);
  } else {
    parts.push("no sessions on the books today.");
  }

  if (riskFlags.length > 0) {
    const top = riskFlags.find((f) => f.severity === "high") ?? riskFlags[0];
    parts.push(`${top.clientName} has an open ${top.severity === "high" ? "high-severity" : "moderate"} risk flag — ${top.detail}.`);
  }

  if (inactiveClientNames.length > 0) {
    const verb = inactiveClientNames.length === 1 ? "hasn't" : "haven't";
    parts.push(`${joinNames(inactiveClientNames)} ${verb} been active recently.`);
  }

  const waiting: string[] = [];
  if (pendingCount > 0) waiting.push(`${pendingCount} booking request${pendingCount === 1 ? "" : "s"}`);
  if (communityFlagCount > 0) waiting.push(`${communityFlagCount} community post${communityFlagCount === 1 ? "" : "s"}`);
  if (waiting.length > 0) {
    parts.push(`You also have ${waiting.join(" and ")} waiting on your review.`);
  } else if (riskFlags.length === 0 && inactiveClientNames.length === 0) {
    parts.push("Nothing else needs your attention right now.");
  }

  return parts.join(" ");
}
