export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export type CouponRedemption = {
  discountValueSnapshot: number;
  coupon: { code: string; discountType: "percent" | "fixed"; owner: { user: { name: string } } };
};

export function discountedPriceCents(priceCents: number, redemption: CouponRedemption): number {
  if (priceCents === 0) return 0;
  const discounted = redemption.coupon.discountType === "percent"
    ? priceCents * (1 - redemption.discountValueSnapshot / 100)
    : priceCents - redemption.discountValueSnapshot;
  return Math.max(0, Math.round(discounted));
}
