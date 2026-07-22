import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { AppointmentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// Matches the client-side defaults in app/dashboard/settings/page.tsx so a user
// who has never opened Settings is treated the same as one who saved the defaults.
const DEFAULT_PREFS = { dailyReminder: true, missionReminder: true, moodReminder: false, weeklyReport: true };

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function startOfUtcWeek(d: Date) {
  const start = startOfUtcDay(d);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  return start;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const weekStart = startOfUtcWeek(now);
  const counts = { sessionReminders: 0, dailyReminders: 0, missionReminders: 0, moodReminders: 0, weeklyDigests: 0, staleVideoSessions: 0 };

  // ── Session reminders ──────────────────────────────────────────────────
  const upcoming = await db.appointment.findMany({
    where: {
      status: { in: [AppointmentStatus.pending, AppointmentStatus.confirmed] },
      date: { gt: now, lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
      reminderSentAt: null,
    },
    include: {
      client: { select: { id: true, name: true } },
      therapist: { select: { userId: true, user: { select: { name: true } } } },
    },
  });

  for (const appt of upcoming) {
    const when = appt.date.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    await createNotification(appt.client.id, {
      title: "Upcoming session reminder",
      body: `Your session with ${appt.therapist.user.name} is coming up on ${when}.`,
      icon: "⏰",
      href: "/dashboard/schedule",
    });
    await createNotification(appt.therapist.userId, {
      title: "Upcoming session reminder",
      body: `Your session with ${appt.client.name} is coming up on ${when}.`,
      icon: "⏰",
      href: "/therapist/appointments",
    });
    await db.appointment.update({ where: { id: appt.id }, data: { reminderSentAt: now } });
    counts.sessionReminders++;
  }

  // ── Daily / mission / mood reminders + weekly digest ───────────────────
  const clients = await db.user.findMany({
    where: { role: "CLIENT" },
    select: {
      id: true, notificationPrefs: true,
      lastDailyReminderSentAt: true, lastMissionReminderSentAt: true,
      lastMoodReminderSentAt: true, lastWeeklyDigestSentAt: true,
    },
  });

  for (const user of clients) {
    const prefs = { ...DEFAULT_PREFS, ...(user.notificationPrefs as Record<string, unknown> | null ?? {}) };

    if (prefs.dailyReminder && (!user.lastDailyReminderSentAt || user.lastDailyReminderSentAt < todayStart)) {
      const moodToday = await db.moodEntry.findFirst({ where: { userId: user.id, createdAt: { gte: todayStart } } });
      if (!moodToday) {
        await createNotification(user.id, { title: "Daily check-in reminder", body: "Take a moment to log how you're feeling today.", icon: "💭", href: "/dashboard/journal" });
      }
      await db.user.update({ where: { id: user.id }, data: { lastDailyReminderSentAt: now } });
      counts.dailyReminders++;
    }

    if (prefs.missionReminder && (!user.lastMissionReminderSentAt || user.lastMissionReminderSentAt < todayStart)) {
      const missionToday = await db.missionCompletion.findFirst({ where: { userId: user.id, completedAt: { gte: todayStart } } });
      if (!missionToday) {
        await createNotification(user.id, { title: "Mission reminders", body: "You have daily missions waiting for you.", icon: "✅", href: "/dashboard/missions" });
      }
      await db.user.update({ where: { id: user.id }, data: { lastMissionReminderSentAt: now } });
      counts.missionReminders++;
    }

    if (prefs.moodReminder && (!user.lastMoodReminderSentAt || user.lastMoodReminderSentAt < todayStart)) {
      const journalToday = await db.journalEntry.findFirst({ where: { userId: user.id, createdAt: { gte: todayStart } } });
      if (!journalToday) {
        await createNotification(user.id, { title: "Evening reflection prompt", body: "Take a few minutes to journal before bed.", icon: "🌙", href: "/dashboard/journal" });
      }
      await db.user.update({ where: { id: user.id }, data: { lastMoodReminderSentAt: now } });
      counts.moodReminders++;
    }

    if (now.getUTCDay() === 0 && prefs.weeklyReport && (!user.lastWeeklyDigestSentAt || user.lastWeeklyDigestSentAt < weekStart)) {
      const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const [moods, missions, journals] = await Promise.all([
        db.moodEntry.findMany({ where: { userId: user.id, createdAt: { gte: since } }, select: { score: true } }),
        db.missionCompletion.count({ where: { userId: user.id, completedAt: { gte: since } } }),
        db.journalEntry.count({ where: { userId: user.id, createdAt: { gte: since } } }),
      ]);
      const avgMood = moods.length ? (moods.reduce((s, m) => s + m.score, 0) / moods.length).toFixed(1) : "—";
      await createNotification(user.id, {
        title: "Your weekly progress report",
        body: `This week: ${moods.length} mood ${moods.length === 1 ? "entry" : "entries"} (avg ${avgMood}/5), ${missions} mission${missions === 1 ? "" : "s"} completed, ${journals} journal ${journals === 1 ? "entry" : "entries"}.`,
        icon: "📊",
        href: "/dashboard/achievements",
      });
      await db.user.update({ where: { id: user.id }, data: { lastWeeklyDigestSentAt: now } });
      counts.weeklyDigests++;
    }
  }

  // ── Stale video session hygiene ─────────────────────────────────────────
  // Backstop only — live call correctness relies on RTCPeerConnection state
  // and a client-side watchdog, not this sweep. Catches sessions where a tab
  // crashed before the `leave` beacon could fire.
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const staleSweep = await db.videoSession.updateMany({
    where: { status: "open", updatedAt: { lt: oneDayAgo } },
    data: { status: "ended", endedAt: now, endedReason: "expired" },
  });
  counts.staleVideoSessions = staleSweep.count;
  await db.videoSignal.deleteMany({ where: { deliveredAt: { lt: oneDayAgo } } });

  return NextResponse.json({ ok: true, ...counts });
}
