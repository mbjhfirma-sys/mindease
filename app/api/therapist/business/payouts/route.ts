import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const postSchema = z.object({
  earningIds: z.array(z.string()).default([]),
  commissionIds: z.array(z.string()).default([]),
}).refine((d) => d.earningIds.length > 0 || d.commissionIds.length > 0, {
  message: "Select at least one earning or commission",
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const [pendingEarnings, pendingCommissions, payouts, billing] = await Promise.all([
    db.sessionEarning.findMany({
      where: { therapistId: therapist.id, payoutId: null },
      include: { client: { select: { name: true } } },
      orderBy: { sessionDate: "desc" },
    }),
    db.affiliateCommission.findMany({
      where: { ownerTherapistId: therapist.id, payoutId: null },
      orderBy: { accruedAt: "desc" },
    }),
    db.payout.findMany({
      where: { therapistId: therapist.id },
      include: { earnings: true, commissions: true },
      orderBy: { createdAt: "desc" },
    }),
    db.therapistBilling.findUnique({ where: { therapistId: therapist.id } }),
  ]);

  return NextResponse.json({
    pendingEarnings,
    pendingCommissions,
    payouts,
    stripeConnectChargesEnabled: billing?.stripeConnectChargesEnabled ?? false,
    stripeConnectPayoutsEnabled: billing?.stripeConnectPayoutsEnabled ?? false,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [earnings, commissions] = await Promise.all([
    parsed.data.earningIds.length > 0
      ? db.sessionEarning.findMany({ where: { id: { in: parsed.data.earningIds }, therapistId: therapist.id, payoutId: null } })
      : Promise.resolve([]),
    parsed.data.commissionIds.length > 0
      ? db.affiliateCommission.findMany({ where: { id: { in: parsed.data.commissionIds }, ownerTherapistId: therapist.id, payoutId: null } })
      : Promise.resolve([]),
  ]);
  if (earnings.length === 0 && commissions.length === 0) {
    return NextResponse.json({ error: "No eligible earnings or commissions found" }, { status: 400 });
  }

  // A batch backed by a real SessionCharge (an actual Stripe payment) must never mix with
  // legacy bookkeeping-only earnings or commissions — either would over- or under-transfer
  // relative to what was genuinely collected via Stripe.
  const chargedAppointmentIds = earnings.length > 0
    ? new Set((await db.sessionCharge.findMany({
        where: { appointmentId: { in: earnings.map((e) => e.appointmentId) }, status: "paid" },
        select: { appointmentId: true },
      })).map((c) => c.appointmentId))
    : new Set<string>();
  const chargedCount = earnings.filter((e) => chargedAppointmentIds.has(e.appointmentId)).length;
  const isRealBatch = chargedCount > 0;
  if (isRealBatch && (chargedCount !== earnings.length || commissions.length > 0)) {
    return NextResponse.json(
      { error: "Real session payments can't be requested in the same payout as bookkeeping-only earnings or commissions — split them into separate requests." },
      { status: 400 }
    );
  }
  if (isRealBatch) {
    const billing = await db.therapistBilling.findUnique({ where: { therapistId: therapist.id } });
    if (!billing?.stripeConnectChargesEnabled || !billing.stripeConnectPayoutsEnabled) {
      return NextResponse.json({ error: "Connect your Stripe payout account first" }, { status: 403 });
    }
  }

  const totalAmountCents = earnings.reduce((sum, e) => sum + e.netAmountCents, 0)
    + commissions.reduce((sum, c) => sum + c.amountCents, 0);
  const currency = earnings[0]?.currency ?? commissions[0]?.currency ?? "USD";

  const payout = await db.$transaction(async (tx) => {
    const created = await tx.payout.create({
      data: { therapistId: therapist.id, totalAmountCents, currency },
    });
    if (earnings.length > 0) {
      await tx.sessionEarning.updateMany({
        where: { id: { in: earnings.map((e) => e.id) } },
        data: { payoutId: created.id },
      });
    }
    if (commissions.length > 0) {
      await tx.affiliateCommission.updateMany({
        where: { id: { in: commissions.map((c) => c.id) } },
        data: { payoutId: created.id },
      });
    }
    return created;
  });

  return NextResponse.json({ payout });
}
