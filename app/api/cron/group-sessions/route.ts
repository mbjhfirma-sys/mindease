import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processInBatches } from "@/lib/cronBatch";
import { createNotification } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 8;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // ── RSVP reminders, ~24h ahead ────────────────────────────────────────────
  const upcoming = await db.groupSession.findMany({
    where: {
      status: "scheduled",
      scheduledStart: { gt: now, lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
      reminderSentAt: null,
    },
    include: {
      therapistGroup: { select: { name: true } },
      rsvps: { select: { userId: true } },
      host: { select: { id: true } },
    },
  });

  let reminders = 0;
  await processInBatches(upcoming, BATCH_SIZE, async (s) => {
    const when = s.scheduledStart.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    for (const rsvp of s.rsvps) {
      await createNotification(rsvp.userId, {
        title: "Group session reminder",
        body: `"${s.therapistGroup.name}" is coming up on ${when}.`,
        icon: "👥",
        href: "/dashboard/community",
      });
    }
    await createNotification(s.host.id, {
      title: "Group session reminder",
      body: `You're hosting "${s.therapistGroup.name}" on ${when}.`,
      icon: "👥",
      href: "/therapist/community",
    });
    await db.groupSession.update({ where: { id: s.id }, data: { reminderSentAt: now } });
    reminders++;
  });

  // ── Stale session hygiene — backstop only, same pattern as VideoSession's sweep ──
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const staleSweep = await db.groupSession.updateMany({
    where: { status: "scheduled", updatedAt: { lt: oneDayAgo } },
    data: { status: "ended", endedAt: now },
  });
  await db.groupSessionSignal.deleteMany({ where: { deliveredAt: { lt: oneDayAgo } } });

  return NextResponse.json({ ok: true, reminders, staleSessionsEnded: staleSweep.count });
}
