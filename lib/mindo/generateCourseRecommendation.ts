import { anthropic, MINDO_MODEL } from "@/lib/anthropic";
import { MINDO_COURSE_RECOMMENDATION_PROMPT } from "@/lib/mindo/prompts";
import { passesNumericGuardrail } from "@/lib/mindo/numericGuardrail";

export type CourseRecommendationResult = { text: string; model: string; softened: boolean };

function templateFallback(concern: string, courseTitle: string): string {
  return `You told Mindo that ${concern.toLowerCase()} was one of the things bringing you here, so "${courseTitle}" felt like a good place to start.`;
}

export async function generateCourseRecommendationReason(
  concern: string,
  goals: string | null,
  course: { title: string; description: string | null }
): Promise<CourseRecommendationResult> {
  const facts = { concern, goals, course: { title: course.title, description: course.description } };

  try {
    const response = await anthropic.messages.create({
      model: MINDO_MODEL,
      max_tokens: 150,
      output_config: { effort: "low" },
      system: [{ type: "text", text: MINDO_COURSE_RECOMMENDATION_PROMPT, cache_control: { type: "ephemeral", ttl: "1h" } }],
      messages: [{ role: "user", content: `${JSON.stringify(facts)}\n\nWrite the recommendation line.` }],
    });

    if (response.stop_reason === "refusal") {
      return { text: templateFallback(concern, course.title), model: "template-fallback", softened: true };
    }

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";

    if (!text || !passesNumericGuardrail(text, facts)) {
      return { text: templateFallback(concern, course.title), model: "template-fallback", softened: true };
    }

    return { text, model: MINDO_MODEL, softened: false };
  } catch {
    return { text: templateFallback(concern, course.title), model: "template-fallback", softened: true };
  }
}
