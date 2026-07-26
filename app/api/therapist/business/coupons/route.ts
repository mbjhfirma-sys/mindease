import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

function randomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const coupons = await db.coupon.findMany({
    where: { ownerTherapistId: therapist.id },
    include: { _count: { select: { redemptions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ coupons });
}

const postSchema = z.object({
  code: z.string().min(3).max(24).regex(/^[A-Za-z0-9_-]+$/).optional(),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.number().int().positive(),
  maxRedemptions: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
}).refine((d) => d.discountType !== "percent" || d.discountValue <= 100, {
  message: "Percent discount must be 100 or less",
  path: ["discountValue"],
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const code = (parsed.data.code ?? randomCode()).toUpperCase();

  try {
    const coupon = await db.coupon.create({
      data: {
        code,
        ownerTherapistId: therapist.id,
        discountType: parsed.data.discountType,
        discountValue: parsed.data.discountValue,
        maxRedemptions: parsed.data.maxRedemptions,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      },
    });
    return NextResponse.json({ coupon });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "That code is already taken" }, { status: 409 });
    }
    throw err;
  }
}
