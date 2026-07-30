// Same isomorphic, no-db shape as lib/video.ts's getJoinWindow — usable identically
// client- and server-side. Applies only when the CLIENT cancels: a therapist canceling
// (or declining a still-pending request) is unconditionally a full refund/credit-release
// regardless of timing, since the disruption wasn't the client's doing. The caller picks
// the branch by actor role; this function is only ever consulted for the client-cancels case.
export const CANCELLATION_WINDOW_HOURS = 24;

export function getCancellationOutcome(appointmentDate: Date, now: Date = new Date()) {
  const cutoff = new Date(appointmentDate.getTime() - CANCELLATION_WINDOW_HOURS * 60 * 60_000);
  return { isEligibleForRefund: now < cutoff, cutoff };
}
