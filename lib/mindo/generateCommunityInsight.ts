import { anthropic, MINDO_MODEL } from "@/lib/anthropic";
import { MINDO_COMMUNITY_INSIGHT_PROMPT } from "@/lib/mindo/prompts";
import { passesNumericGuardrail } from "@/lib/mindo/numericGuardrail";
import type { CommunityFacts } from "@/lib/mindo/communityFacts";

export type CommunityInsightResult = { text: string; model: string; softened: boolean };

function templateFallback(facts: CommunityFacts): string {
  if (facts.postsThisWeek === 0 && facts.repliesThisWeek === 0) {
    return `${facts.scopeName} has ${facts.memberCount} member${facts.memberCount === 1 ? "" : "s"} and no new activity this week.`;
  }
  const parts: string[] = [
    `${facts.scopeName} had ${facts.postsThisWeek} post${facts.postsThisWeek === 1 ? "" : "s"} and ${facts.repliesThisWeek} repl${facts.repliesThisWeek === 1 ? "y" : "ies"} this week across ${facts.memberCount} member${facts.memberCount === 1 ? "" : "s"}.`,
  ];
  if (facts.mostActiveMemberName) {
    parts.push(`${facts.mostActiveMemberName} was the most active voice in the group.`);
  }
  if (facts.flaggedOpenCount > 0) {
    parts.push(`${facts.flaggedOpenCount} post${facts.flaggedOpenCount === 1 ? " is" : "s are"} still awaiting your review.`);
  }
  return parts.join(" ");
}

export async function generateCommunityInsight(facts: CommunityFacts): Promise<CommunityInsightResult> {
  try {
    const response = await anthropic.messages.create({
      model: MINDO_MODEL,
      max_tokens: 300,
      output_config: { effort: "low" },
      system: [{ type: "text", text: MINDO_COMMUNITY_INSIGHT_PROMPT, cache_control: { type: "ephemeral", ttl: "1h" } }],
      messages: [{ role: "user", content: `${JSON.stringify(facts)}\n\nWrite this insight.` }],
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
