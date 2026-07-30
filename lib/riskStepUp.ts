import { db } from "@/lib/db";
import type { RiskFlag, RiskStepUpWindow } from "@prisma/client";
import { createNotification, notifyAdmins } from "@/lib/notify";

// Business decisions, documented defaults — trivially adjustable later without a schema change.
export const STEP_UP_WINDOW_DAYS = 7;
export const STEP_UP_CHECKIN_INTERVAL_HOURS = 48;
// ~4 days unacknowledged (2 pings x 48h) before admins are looped in alongside the therapist.
export const STEP_UP_ADMIN_ESCALATION_AFTER_PINGS = 2;

const FALLBACK_CONTACT_LABEL = "MindEase Clinical Team";

// Opens (or refreshes) the client's elevated-monitoring window whenever their highest-severity
// RiskFlag fires. Self-guards on severity, safe to call unconditionally after every RiskFlag
// creation. A second high flag while a window is already active refreshes windowEnd rather
// than stacking a second window — "one active elevated-monitoring state per client."
export async function ensureRiskStepUpWindow(flag: RiskFlag) {
  if (flag.severity !== "high") return null;

  const windowEnd = new Date(Date.now() + STEP_UP_WINDOW_DAYS * 86_400_000);

  // No @@unique on (userId, status: "active") — Prisma can't express a partial/conditional
  // unique index. Enforced here at the API layer instead, mirroring ClinicMembership's
  // identical documented tradeoff. A low-probability, low-harm race (two near-simultaneous
  // high flags for one user) could briefly create two active windows; the cron just
  // processes both, so this isn't worth blocking on.
  const existing = await db.riskStepUpWindow.findFirst({ where: { userId: flag.userId, status: "active" } });
  if (existing) {
    return db.riskStepUpWindow.update({
      where: { id: existing.id },
      data: { triggerFlagId: flag.id, windowEnd },
    });
  }

  const user = await db.user.findUnique({
    where: { id: flag.userId },
    select: {
      assignedTherapist: { select: { userId: true, title: true, user: { select: { name: true } } } },
    },
  });

  const contactUserId = user?.assignedTherapist?.userId ?? null;
  const contactLabel = user?.assignedTherapist
    ? `${user.assignedTherapist.user.name}, ${user.assignedTherapist.title}`
    : FALLBACK_CONTACT_LABEL;

  return db.riskStepUpWindow.create({
    data: { userId: flag.userId, triggerFlagId: flag.id, contactUserId, contactLabel, windowEnd },
  });
}

// contactUserId is null exactly when there's no assigned therapist (the FALLBACK_CONTACT_LABEL
// case) — the "contact" in that case IS the admin team, so this notifies whichever is correct
// rather than the caller needing to branch on it.
async function notifyStepUpContact(window: RiskStepUpWindow, title: string, body: string) {
  if (window.contactUserId) {
    await createNotification(window.contactUserId, { title, body, icon: "⚠️", href: `/therapist/clients/${window.userId}` });
  } else {
    await notifyAdmins({ title, body, icon: "⚠️", href: `/admin/users/${window.userId}` });
  }
}

// Processes one active window for one cron tick. Called from the daily risk-stepup cron via
// lib/cronBatch.ts's processInBatches, one call per active window — mirrors the
// ensureDailyBriefing/ensureWeeklyDigest pattern of "the real logic lives in a lib function,
// the cron route itself just fetches + batches + calls it."
export async function processStepUpWindowTick(window: RiskStepUpWindow, now: Date = new Date()) {
  if (now >= window.windowEnd) {
    await db.riskStepUpWindow.update({ where: { id: window.id }, data: { status: "expired" } });
    return { action: "expired" as const };
  }

  const intervalMs = window.checkInIntervalHrs * 3_600_000;
  const client = await db.user.findUnique({ where: { id: window.userId }, select: { name: true, lastDailyReminderSentAt: true } });
  if (!client) return { action: "skipped_missing_user" as const };

  // Contact-ping check: re-queried fresh every tick (not tied to the original triggerFlagId),
  // so it correctly reflects "any open high flag for this user right now," including new ones
  // that fired mid-window. Acknowledging the underlying flag (PATCH /api/risk-flags/[id],
  // unchanged) stops this from re-triggering, but does not close the window itself.
  const openHighFlag = await db.riskFlag.findFirst({ where: { userId: window.userId, severity: "high", status: "open" } });

  const dueForPing = openHighFlag && (!window.lastContactPingAt || now.getTime() - window.lastContactPingAt.getTime() >= intervalMs);
  let pingCountUpdate = window.contactPingCount;
  let escalatedToAdminsAtUpdate = window.escalatedToAdminsAt;
  let lastContactPingAtUpdate = window.lastContactPingAt;

  if (dueForPing) {
    pingCountUpdate = window.contactPingCount + 1;
    lastContactPingAtUpdate = now;
    const hoursOpen = window.checkInIntervalHrs * pingCountUpdate;
    const pingBody = pingCountUpdate === 1
      ? `${client.name}'s high-severity risk flag is still open — please review.`
      : `Still unacknowledged: ${client.name}'s high-severity risk flag has been open for over ${hoursOpen}h.`;
    await notifyStepUpContact(window, `⚠️ Elevated monitoring: ${client.name}`, pingBody);

    // Admin escalation only makes sense when the contact was a therapist (not already
    // admins) and only fires once per window.
    if (window.contactUserId && pingCountUpdate >= STEP_UP_ADMIN_ESCALATION_AFTER_PINGS && !window.escalatedToAdminsAt) {
      await notifyAdmins({
        title: `⚠️ Unacknowledged risk flag: ${client.name}`,
        body: `${client.name}'s high-severity risk flag has gone unacknowledged for over ${hoursOpen}h despite repeated reminders to their therapist.`,
        icon: "⚠️",
        href: `/admin/users/${window.userId}`,
      });
      escalatedToAdminsAtUpdate = now;
    }
  }

  // Client-activity check: has the client logged a mood/journal entry within the interval?
  const dueForActivityCheck = !window.lastClientActivityCheckAt || now.getTime() - window.lastClientActivityCheckAt.getTime() >= intervalMs;
  let missedCheckInsUpdate = window.missedClientCheckIns;

  if (dueForActivityCheck) {
    const since = new Date(now.getTime() - intervalMs);
    const [recentMood, recentJournal] = await Promise.all([
      db.moodEntry.findFirst({ where: { userId: window.userId, createdAt: { gte: since } }, select: { id: true } }),
      db.journalEntry.findFirst({ where: { userId: window.userId, createdAt: { gte: since } }, select: { id: true } }),
    ]);

    if (!recentMood && !recentJournal) {
      missedCheckInsUpdate = window.missedClientCheckIns + 1;
      await notifyStepUpContact(
        window,
        `${client.name} has gone quiet`,
        `${client.name} hasn't logged a mood or journal entry in over ${window.checkInIntervalHrs}h during an active elevated-monitoring window.`
      );

      // De-dupe against the existing daily-reminders cron — don't send a second,
      // differently-worded nudge to the client on the same calendar day.
      const alreadyRemindedToday = client.lastDailyReminderSentAt
        && client.lastDailyReminderSentAt.toDateString() === now.toDateString();
      if (!alreadyRemindedToday) {
        await createNotification(window.userId, {
          title: "Checking in",
          body: "We haven't heard from you in a bit — no pressure, just here if you want to log how you're doing.",
          icon: "💛",
          href: "/dashboard",
        });
      }
    }
  }

  await db.riskStepUpWindow.update({
    where: { id: window.id },
    data: {
      lastContactPingAt: lastContactPingAtUpdate,
      contactPingCount: pingCountUpdate,
      escalatedToAdminsAt: escalatedToAdminsAtUpdate,
      lastClientActivityCheckAt: dueForActivityCheck ? now : window.lastClientActivityCheckAt,
      missedClientCheckIns: missedCheckInsUpdate,
    },
  });

  return { action: "ticked" as const, pinged: !!dueForPing, activityChecked: dueForActivityCheck };
}
