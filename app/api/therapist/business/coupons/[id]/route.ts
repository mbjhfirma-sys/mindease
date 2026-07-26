import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function ownedCoupon(therapistId: string, id: string) {
  const coupon = await db.coupon.findUnique({ where: { id }, include: { _count: { select: { redemptions: true } } } });
  if (!coupon || coupon.ownerTherapistId !== therapistId) return null;
  return coupon;
}

const patchSchema = z.object({ active: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const { id } = await params;
  const existing = await ownedCoupon(therapist.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const coupon = await db.coupon.update({ where: { id }, data: { active: parsed.data.active } });
  return NextResponse.json({ coupon });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const { id } = await params;
  const existing = await ownedCoupon(therapist.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing._count.redemptions > 0) {
    return NextResponse.json({ error: "This code has already been redeemed — deactivate it instead of deleting" }, { status: 400 });
  }

  await db.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
