// Deterministic, best-effort keyword/phrase flagging — not a diagnostic tool and not an
// LLM. Errs toward flagging: ambiguous phrasing is treated as "moderate" rather than ignored,
// since a missed risk signal is worse than a false positive in a mental-health context.

export type RiskSeverity = "high" | "moderate";
export type RiskMatch = { severity: RiskSeverity; matched: string };

const HIGH_SEVERITY: RegExp[] = [
  /kill (myself|me)/i,
  /end (my|this) life/i,
  /\bsuicid(e|al)\b/i,
  /want(ed)? to die/i,
  /wish i (was|were) dead/i,
  /better off dead/i,
  /no reason (to|for) liv(e|ing)/i,
  /hurt(ing)? myself/i,
  /self.?harm/i,
  /cutting myself/i,
  /(overdos(e|ing)|took too many pills)/i,
  /planning (to|my) suicide/i,
];

const MODERATE_SEVERITY: RegExp[] = [
  /can'?t (go on|do this anymore)/i,
  /can'?t take (it|this) anymore/i,
  /(want to |wanna )?give up/i,
  /\bhopeless(ness)?\b/i,
  /\bworthless\b/i,
  /no point (in )?(living|anything|trying)/i,
  /nobody (would|will) (miss|notice) me/i,
  /everyone('s| is) better off without me/i,
];

export function detectRisk(text: string | null | undefined): RiskMatch | null {
  if (!text || !text.trim()) return null;
  for (const re of HIGH_SEVERITY) {
    const m = text.match(re);
    if (m) return { severity: "high", matched: m[0] };
  }
  for (const re of MODERATE_SEVERITY) {
    const m = text.match(re);
    if (m) return { severity: "moderate", matched: m[0] };
  }
  return null;
}
