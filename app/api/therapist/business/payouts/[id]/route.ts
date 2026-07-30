import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

const patchSchema = z.object({
  status: z.literal("paid"),
  note: z.string().max(300).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const payout = await db.payout.findUnique({ where: { id }, include: { earnings: true } });
  if (!payout || payout.therapistId !== therapist.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (payout.status === "paid") {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  // Real-money-backed payouts (this batch's earnings trace back to an actual Stripe
  // SessionCharge) get a genuine Transfer; legacy bookkeeping-only payouts keep today's
  // self-attested flow unchanged.
  const appointmentIds = payout.earnings.map((e) => e.appointmentId);
  const charges = appointmentIds.length > 0
    ? await db.sessionCharge.findMany({ where: { appointmentId: { in: appointmentIds }, status: "paid" } })
    : [];

  if (charges.length > 0) {
    const billing = await db.therapistBilling.findUnique({ where: { therapistId: therapist.id } });
    if (!billing?.stripeConnectAccountId || !billing.stripeConnectChargesEnabled || !billing.stripeConnectPayoutsEnabled) {
      return NextResponse.json({ error: "Connect your Stripe payout account first" }, { status: 403 });
    }

    try {
      const transfer = await stripe.transfers.create({
        amount: payout.totalAmountCents,
        currency: payout.currency.toLowerCase(),
        destination: billing.stripeConnectAccountId,
      });
      await db.sessionCharge.updateMany({
        where: { id: { in: charges.map((c) => c.id) } },
        data: { status: "transferred", stripeTransferId: transfer.id },
      });
    } catch (err) {
      console.error("[payouts PATCH] transfer failed", id, err);
      return NextResponse.json({ error: "Transfer failed — try again or contact support" }, { status: 502 });
    }
  }

  const updated = await db.payout.update({
    where: { id },
    data: { status: "paid", paidAt: new Date(), note: parsed.data.note },
  });

  return NextResponse.json({ payout: updated });
}
