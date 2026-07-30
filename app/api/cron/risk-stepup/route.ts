import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processInBatches } from "@/lib/cronBatch";
import { processStepUpWindowTick } from "@/lib/riskStepUp";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 8;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const windows = await db.riskStepUpWindow.findMany({ where: { status: "active" } });

  let expired = 0;
  let ticked = 0;
  let pinged = 0;
  let failed = 0;

  await processInBatches(windows, BATCH_SIZE, async (window) => {
    try {
      const result = await processStepUpWindowTick(window);
      if (result.action === "expired") expired++;
      else if (result.action === "ticked") {
        ticked++;
        if (result.pinged) pinged++;
      }
    } catch {
      failed++;
    }
  });

  return NextResponse.json({ ok: true, total: windows.length, ticked, pinged, expired, failed });
}
