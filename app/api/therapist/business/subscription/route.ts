import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reconcileSubscription, createInvoiceForPeriod } from "@/lib/subscriptionBilling";
import { THERAPIST_PLANS, planById } from "@/lib/therapistPlans";

async function getTherapist(userId: string) {
  return db.therapist.findUnique({ where: { userId } });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await getTherapist(session.user.id);
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const existing = await db.therapistSubscription.findUnique({ where: { therapistId: therapist.id } });
  const subscription = existing ? await reconcileSubscription(existing.id) : null;

  return NextResponse.json({ subscription, plans: THERAPIST_PLANS });
}

const postSchema = z.object({ planId: z.enum(["starter", "professional", "practice"]) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await getTherapist(session.user.id);
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const existing = await db.therapistSubscription.findUnique({ where: { therapistId: therapist.id } });
  if (existing) return NextResponse.json({ error: "Subscription already exists — use PATCH to change plan" }, { status: 400 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const plan = planById(parsed.data.planId);
  if (!plan) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const subscription = await db.therapistSubscription.create({
    data: {
      therapistId: therapist.id,
      planId: plan.id,
      priceCents: plan.priceCents,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  // Seed the first period's invoice immediately (and accrue any referral commission on it)
  // rather than waiting for reconciliation to catch up a full cycle later.
  await createInvoiceForPeriod(subscription, now, periodEnd);

  return NextResponse.json({ subscription });
}

const patchSchema = z.object({
  planId: z.enum(["starter", "professional", "practice"]).optional(),
  autoRenew: z.boolean().optional(),
  cancel: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await getTherapist(session.user.id);
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const existing = await db.therapistSubscription.findUnique({ where: { therapistId: therapist.id } });
  if (!existing) return NextResponse.json({ error: "No subscription yet" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data: { planId?: string; priceCents?: number; autoRenew?: boolean; status?: "active" | "canceled"; canceledAt?: Date } = {};
  if (parsed.data.planId) {
    const plan = planById(parsed.data.planId);
    if (!plan) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
    data.planId = plan.id;
    data.priceCents = plan.priceCents;
  }
  if (parsed.data.autoRenew !== undefined) data.autoRenew = parsed.data.autoRenew;
  if (parsed.data.cancel) {
    data.status = "canceled";
    data.canceledAt = new Date();
  }

  const subscription = await db.therapistSubscription.update({ where: { id: existing.id }, data });
  return NextResponse.json({ subscription });
}
