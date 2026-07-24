import { anthropic, MINDO_MODEL } from "@/lib/anthropic";
import { MINDO_THERAPIST_DIGEST_PROMPT } from "@/lib/mindo/prompts";
import { passesNumericGuardrail } from "@/lib/mindo/numericGuardrail";
import type { WeeklyFacts } from "@/lib/mindo/facts";

export type DigestResult = { text: string; model: string; softened: boolean };

function templateFallback(facts: WeeklyFacts): string {
  const parts: string[] = [];
  if (facts.completion.rate !== null) {
    parts.push(`Your client completed ${Math.round(facts.completion.rate * 100)}% of assigned missions this week.`);
  }
  parts.push(`Mood was ${facts.moodSummary.trend === "insufficient_data" ? "not consistently tracked" : facts.moodSummary.trend} this week.`);
  if (facts.riskFlagsThisWeek.length > 0) {
    const flagCount = facts.riskFlagsThisWeek.length;
    parts.push(`${flagCount} risk flag${flagCount === 1 ? "" : "s"} ${flagCount === 1 ? "was" : "were"} raised this week — see Risk Alerts for details.`);
  }
  return parts.join(" ");
}

export async function generateWeeklyDigest(facts: WeeklyFacts): Promise<DigestResult> {
  try {
    const response = await anthropic.messages.create({
      model: MINDO_MODEL,
      max_tokens: 500,
      output_config: { effort: "low" },
      system: [{ type: "text", text: MINDO_THERAPIST_DIGEST_PROMPT, cache_control: { type: "ephemeral", ttl: "1h" } }],
      messages: [{ role: "user", content: `${JSON.stringify(facts)}\n\nWrite this week's digest.` }],
    });

    if (response.stop_reason === "refusal") {
      return { text: templateFallback(facts), model: "template-fallback", softened: true };
    }

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";

    if (!text || !passesNumericGuardrail(text, facts)) {
      return { text: templateFallback(facts), model: "template-fallback", softened: true };
    }

    return { text, model: MINDO_MODEL, softened: false };
  } catch {
    return { text: templateFallback(facts), model: "template-fallback", softened: true };
  }
}
