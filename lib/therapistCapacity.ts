// A therapist's own self-set maxClients can only ever set a *lower* personal preference
// than their plan allows, never exceed it — Starter's real ceiling of 5 always wins over a
// higher (or unset/unlimited) self-set value.
export function getEffectiveMaxClients(
  maxClients: number | null,
  subscriptionPlanId: string | null | undefined
): number | null {
  if (subscriptionPlanId === "starter") return Math.min(maxClients ?? 5, 5);
  return maxClients;
}
