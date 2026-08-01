import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as { anthropic: Anthropic };

function createAnthropicClient(): Anthropic {
  if (globalForAnthropic.anthropic) return globalForAnthropic.anthropic;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "Anthropic is not configured (ANTHROPIC_API_KEY is missing) — Mindo's AI narration is unavailable."
    );
  }
  const client = new Anthropic();
  if (process.env.NODE_ENV !== "production") globalForAnthropic.anthropic = client;
  return client;
}

// Same lazy-construction reasoning as lib/stripe.ts: constructing eagerly at
// module scope meant a missing ANTHROPIC_API_KEY failed the *entire* production
// build (Next.js evaluates every route's module graph at build time), not just
// the Mindo routes that actually need it. Every real call site already catches
// generation failures and falls back to a deterministic template (see
// lib/mindo/generateBriefing.ts / generateDigest.ts), so a thrown error here is
// handled the same way a live AuthenticationError from the API would be.
export const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    const client = createAnthropicClient();
    return Reflect.get(client, prop, client);
  },
});

export const MINDO_MODEL = "claude-opus-4-8";
