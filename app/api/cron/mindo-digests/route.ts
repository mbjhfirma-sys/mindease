import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { ensureWeeklyDigest } from "@/lib/mindo/ensureWeeklyDigest";
import { processInBatches } from "@/lib/cronBatch";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 8;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await db.user.findMany({
    where: { role: "CLIENT", therapistId: { not: null } },
    select: { id: true, therapistId: true },
  });

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  await processInBatches(clients, BATCH_SIZE, async (client) => {
    if (!client.therapistId) return;
    try {
      const result = await ensureWeeklyDigest(client.id, client.therapistId);
      if (!result.enabled) {
        skipped++;
        return;
      }
      if (result.created) {
        generated++;
        const therapist = await db.therapist.findUnique({ where: { id: client.therapistId }, select: { userId: true } });
        if (therapist) {
          await createNotification(therapist.userId, {
            title: "New Mindo weekly digest ready",
            body: result.digest.digestText.slice(0, 140),
            icon: "📊",
            href: `/therapist/clients/${client.id}?tab=insights`,
          }).catch(() => {});
        }
      }
    } catch {
      failed++;
    }
  });

  return NextResponse.json({ ok: true, total: clients.length, generated, skipped, failed });
}
