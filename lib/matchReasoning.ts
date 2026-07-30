import { db } from "@/lib/db";
import type { MatchMethod } from "@prisma/client";
import type { MatchReasonFactor } from "@/lib/matching";

// Kept separate from lib/therapistAssignment.ts's assignClientToTherapist on purpose — that
// helper is explicitly single-purpose ("commit the assignment + side effects") and carries no
// scoring context. Called at every commit site right where a MatchedTherapist's score/factors
// are actually available, never from inside assignClientToTherapist itself.
export async function recordMatchReasoning(clientId: string, therapistId: string, score: number, factors: MatchReasonFactor[], method: MatchMethod) {
  return db.matchReasoning.upsert({
    where: { clientId },
    create: { clientId, therapistId, method, totalScore: score, factors: factors as unknown as object },
    update: { therapistId, method, totalScore: score, factors: factors as unknown as object },
  });
}
