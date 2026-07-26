import { anthropic, MINDO_MODEL } from "@/lib/anthropic";
import { MINDO_CLIENT_BRIEFING_PROMPT } from "@/lib/mindo/prompts";
import { passesNumericGuardrail } from "@/lib/mindo/numericGuardrail";
import type { DailyFacts } from "@/lib/mindo/facts";

export type BriefingResult = { text: string; model: string; softened: boolean };

function templateFallback(facts: DailyFacts): string {
  if (facts.todaysAssignedMissions.length > 0) {
    return `Here's a suggestion for today: try "${facts.todaysAssignedMissions[0].title}" when you have a few minutes.`;
  }
  if (facts.last7Days.currentStreak > 0) {
    return `You're keeping up a nice streak — take a moment today to check in with how you're feeling.`;
  }
  return `Take a moment today to check in with how you're feeling.`;
}

export async function generateDailyBriefing(facts: DailyFacts): Promise<BriefingResult> {
  try {
    const response = await anthropic.messages.create({
      model: MINDO_MODEL,
      max_tokens: 300,
      output_config: { effort: "low" },
      system: [{ type: "text", text: MINDO_CLIENT_BRIEFING_PROMPT, cache_control: { type: "ephemeral", ttl: "1h" } }],
      messages: [{ role: "user", content: `${JSON.stringify(facts)}\n\nWrite today's briefing.` }],
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
