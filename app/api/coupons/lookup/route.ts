import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public, unauthenticated — used by the signup form to give real-time feedback on a
// referral/promo code before an account exists. Recomputes the exact same validity check
// as /api/auth/register so the live "✓ X% off" preview can never disagree with what
// actually gets applied at signup. Only returns what a prospective signer-upper needs to
// see — never the coupon id, owner id, or commission rate.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim();
  if (!code) return NextResponse.json({ valid: false });

  const coupon = await db.coupon.findUnique({
    where: { code },
    include: {
      _count: { select: { redemptions: true } },
      owner: { select: { user: { select: { name: true } } } },
    },
  });

  const isValid = !!coupon && coupon.active
    && (!coupon.expiresAt || coupon.expiresAt > new Date())
    && (coupon.maxRedemptions == null || coupon._count.redemptions < coupon.maxRedemptions);

  if (!isValid || !coupon) return NextResponse.json({ valid: false });

  return NextResponse.json({
    valid: true,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    therapistName: coupon.owner.user.name,
  });
}
