import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processInBatches } from "@/lib/cronBatch";
import { ensurePendingMatchFeedback } from "@/lib/matchFeedback";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 8;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reasonings = await db.matchReasoning.findMany({ select: { clientId: true } });

  let created = 0;
  let skipped = 0;
  let failed = 0;

  await processInBatches(reasonings, BATCH_SIZE, async (r) => {
    try {
      const result = await ensurePendingMatchFeedback(r.clientId);
      if (result.created) created++;
      else skipped++;
    } catch {
      failed++;
    }
  });

  return NextResponse.json({ ok: true, total: reasonings.length, created, skipped, failed });
}
