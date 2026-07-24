import { db } from "@/lib/db";
import { anthropic, MINDO_MODEL } from "@/lib/anthropic";
import { MINDO_CHAT_PROMPT } from "@/lib/mindo/prompts";
import { computeClientDailyFacts } from "@/lib/mindo/facts";
import { resolveTimeZone } from "@/lib/dateKey";

// Bounded recent-window context, not full-history retrieval (that would need a
// vector-search/RAG pipeline this app doesn't have — an explicit, deliberate
// scope decision, not an oversight). Large enough to feel complete for the
// vast majority of users without unbounded context growth.
const HISTORY_LIMIT = 20;
const JOURNAL_CONTEXT_LIMIT = 20;

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; createdAt: string };

export async function getMindoChatHistory(userId: string): Promise<ChatMessage[]> {
  const rows = await db.mindoChatMessage.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, take: 100 });
  return rows.map((r) => ({ id: r.id, role: r.role as "user" | "assistant", content: r.content, createdAt: r.createdAt.toISOString() }));
}

export async function sendMindoChatMessage(userId: string, userMessage: string): Promise<{ reply: string }> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { timezone: true } });
  const timeZone = resolveTimeZone(user?.timezone);

  const [facts, recentJournals, priorTurns] = await Promise.all([
    computeClientDailyFacts(userId, timeZone, new Date()),
    db.journalEntry.findMany({
      where: { userId }, orderBy: { createdAt: "desc" }, take: JOURNAL_CONTEXT_LIMIT,
      select: { content: true, mood: true, sleepQuality: true, createdAt: true },
    }),
    db.mindoChatMessage.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: HISTORY_LIMIT }),
  ]);

  const orderedPriorTurns = priorTurns.reverse();

  const context = {
    dailyFacts: facts,
    recentJournalEntries: recentJournals.map((j) => ({ content: j.content, mood: j.mood, sleepQuality: j.sleepQuality, createdAt: j.createdAt.toISOString() })),
    contextWindowNote: `This is a bounded recent window (last ${JOURNAL_CONTEXT_LIMIT} journal entries), not the client's full history.`,
  };

  // Context is injected fresh every turn via a synthetic (unpersisted) exchange
  // rather than baked into the stored conversation — keeps the DB history
  // clean (only what the client actually typed) while still refreshing on
  // every request without needing to edit the cached system prompt.
  const messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: `Background context for this conversation (not something the client said):\n${JSON.stringify(context)}` },
    { role: "assistant", content: "Understood — I have the client's recent context and will use it naturally in our conversation." },
    ...orderedPriorTurns.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: userMessage },
  ];

  let reply: string;
  try {
    const response = await anthropic.messages.create({
      model: MINDO_MODEL,
      max_tokens: 700,
      output_config: { effort: "low" },
      system: [{ type: "text", text: MINDO_CHAT_PROMPT, cache_control: { type: "ephemeral", ttl: "1h" } }],
      messages,
    });
    if (response.stop_reason === "refusal") {
      reply = "I'm not able to help with that particular request, but I'm here if you'd like to talk about something else.";
    } else {
      const textBlock = response.content.find((b) => b.type === "text");
      reply = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";
      if (!reply) reply = "I'm having trouble responding right now — could you try rephrasing that?";
    }
  } catch {
    reply = "I'm having a little trouble connecting right now. Please try again in a moment.";
  }

  await db.$transaction([
    db.mindoChatMessage.create({ data: { userId, role: "user", content: userMessage } }),
    db.mindoChatMessage.create({ data: { userId, role: "assistant", content: reply } }),
  ]);

  return { reply };
}
