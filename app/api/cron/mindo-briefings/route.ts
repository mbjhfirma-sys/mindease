import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { ensureDailyBriefing } from "@/lib/mindo/ensureDailyBriefing";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 8;

async function processInBatches<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await db.user.findMany({ where: { role: "CLIENT" }, select: { id: true } });

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  await processInBatches(clients, BATCH_SIZE, async (client) => {
    try {
      const result = await ensureDailyBriefing(client.id);
      if (!result.enabled) {
        skipped++;
        return;
      }
      if (result.created) {
        generated++;
        await createNotification(client.id, {
          title: "Your Mindo morning briefing is ready",
          body: result.briefing.briefingText.slice(0, 140),
          icon: "✨",
          href: "/dashboard",
        }).catch(() => {});
      }
    } catch {
      failed++;
    }
  });

  return NextResponse.json({ ok: true, total: clients.length, generated, skipped, failed });
}
