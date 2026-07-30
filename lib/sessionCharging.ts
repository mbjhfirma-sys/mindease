// Mirrors lib/earnings.ts's fee-split math but operates on *scheduled* duration at booking
// time, before any VideoSession exists — deliberately kept separate from earnings.ts since
// a real charge is fixed up front, while earnings.ts reports actual measured call duration
// for tax-export/analytics. Never merge the two back together.
export function computeSessionChargeAmounts(
  ratePerMinuteCents: number,
  scheduledMinutes: number,
  platformFeeBps: number
): { amountCents: number; platformFeeCents: number; therapistAmountCents: number } {
  const amountCents = Math.round(ratePerMinuteCents * scheduledMinutes);
  const platformFeeCents = Math.round((amountCents * platformFeeBps) / 10000);
  const therapistAmountCents = amountCents - platformFeeCents;
  return { amountCents, platformFeeCents, therapistAmountCents };
}
