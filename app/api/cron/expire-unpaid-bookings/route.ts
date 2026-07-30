import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notify";

export const dynamic = "force-dynamic";

// A client-initiated booking with no completed Checkout after this long is treated as
// abandoned — the appointment slot is freed rather than blocking the therapist's calendar
// indefinitely for a session nobody ever paid for.
const UNPAID_TTL_MS = 30 * 60 * 1000;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stale = await db.sessionCharge.findMany({
    where: { status: "requires_payment", createdAt: { lt: new Date(Date.now() - UNPAID_TTL_MS) } },
    include: { appointment: true },
  });

  let expired = 0;
  for (const charge of stale) {
    if (charge.appointment.status !== "pending") continue; // Already resolved some other way.
    await db.$transaction([
      db.sessionCharge.update({ where: { id: charge.id }, data: { status: "failed" } }),
      db.appointment.update({ where: { id: charge.appointmentId }, data: { status: "cancelled" } }),
    ]);
    await createNotification(charge.clientId, {
      title: "Session request expired",
      body: "Your session request was cancelled because payment wasn't completed in time. Feel free to book again.",
      icon: "⏰",
      href: "/dashboard/schedule",
    }).catch(() => {});
    expired++;
  }

  return NextResponse.json({ ok: true, expired });
}
