import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { verifyTwoFactorAttempt } from "@/lib/twoFactor";

const deleteSchema = z.object({
  password: z.string().min(1),
  code: z.string().optional(),
});

const notificationPrefsSchema = z.object({
  dailyReminder:     z.boolean().optional(),
  missionReminder:   z.boolean().optional(),
  moodReminder:      z.boolean().optional(),
  therapistMessages: z.boolean().optional(),
  communityUpdates:  z.boolean().optional(),
  weeklyReport:      z.boolean().optional(),
  reminderTime:      z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

const privacyPrefsSchema = z.object({
  shareJournalWithTherapist: z.boolean().optional(),
  showInLeaderboard:         z.boolean().optional(),
  anonymousCommunity:        z.boolean().optional(),
  dataForResearch:           z.boolean().optional(),
});

const patchSchema = z.object({
  name:              z.string().min(2).optional(),
  phone:             z.string().optional(),
  dob:               z.string().refine((v) => !isNaN(new Date(v).getTime()), { message: "Invalid date" }).optional(),
  timezone:          z.string().optional(),
  language:          z.string().optional(),
  avatar:            z.string().max(200000).optional(),
  notificationPrefs: notificationPrefsSchema.optional(),
  privacyPrefs:      privacyPrefsSchema.optional(),
  hasOnboarded:      z.boolean().optional(),
  hasSeenClientTour: z.boolean().optional(),
  peerMatchingOptIn: z.boolean().optional(),
});

const DEFAULT_NOTIFICATION_PREFS = {
  dailyReminder: true, missionReminder: true, moodReminder: false,
  therapistMessages: true, communityUpdates: false, weeklyReport: true,
  reminderTime: "08:00",
};

const DEFAULT_PRIVACY_PREFS = {
  shareJournalWithTherapist: false, showInLeaderboard: false,
  anonymousCommunity: true, dataForResearch: false,
};

function generateClientCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "MC-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, email: true, role: true, avatar: true,
        plan: true, phone: true, dob: true, timezone: true, language: true, xp: true, level: true,
        createdAt: true, clientCode: true, hasOnboarded: true, hasSeenClientTour: true,
        notificationPrefs: true, privacyPrefs: true, twoFactorEnabled: true, peerMatchingOptIn: true,
        assignedTherapist: {
          include: { user: { select: { name: true, avatar: true } } },
        },
        therapistProfile: { select: { id: true, title: true, specializations: true, rating: true } },
      },
    });

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Lazy-generate clientCode for existing users who don't have one
    if (!user.clientCode) {
      let code = "";
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = generateClientCode();
        const collision = await db.user.findUnique({ where: { clientCode: candidate }, select: { id: true } });
        if (!collision) { code = candidate; break; }
      }
      if (!code) return NextResponse.json({ error: "Failed to generate client code" }, { status: 500 });
      try {
        await db.user.update({ where: { id: session.user.id }, data: { clientCode: code } });
      } catch (err: unknown) {
        if ((err as { code?: string }).code !== "P2002") throw err;
        // Another concurrent request won the race — re-fetch and return
        const refreshed = await db.user.findUnique({ where: { id: session.user.id }, select: { clientCode: true } });
        code = refreshed?.clientCode ?? code;
      }
      return NextResponse.json({
        user: {
          ...user,
          clientCode: code,
          notificationPrefs: user.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS,
          privacyPrefs: user.privacyPrefs ?? DEFAULT_PRIVACY_PREFS,
        },
      });
    }

    return NextResponse.json({
      user: {
        ...user,
        notificationPrefs: user.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS,
        privacyPrefs: user.privacyPrefs ?? DEFAULT_PRIVACY_PREFS,
      },
    });
  } catch (err) {
    console.error("[/api/user GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { notificationPrefs, privacyPrefs, dob, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  if (dob) data.dob = new Date(dob);

  if (notificationPrefs) {
    const existing = await db.user.findUnique({
      where: { id: session.user.id },
      select: { notificationPrefs: true },
    });
    const current = (existing?.notificationPrefs as Record<string, unknown>) ?? DEFAULT_NOTIFICATION_PREFS;
    data.notificationPrefs = { ...current, ...notificationPrefs };
  }

  if (privacyPrefs) {
    const existing = await db.user.findUnique({
      where: { id: session.user.id },
      select: { privacyPrefs: true },
    });
    const current = (existing?.privacyPrefs as Record<string, unknown>) ?? DEFAULT_PRIVACY_PREFS;
    data.privacyPrefs = { ...current, ...privacyPrefs };
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true, name: true, email: true, role: true, avatar: true,
      plan: true, phone: true, dob: true, timezone: true, language: true,
      notificationPrefs: true, privacyPrefs: true, hasOnboarded: true, hasSeenClientTour: true, peerMatchingOptIn: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Password is required" }, { status: 400 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { password: true, role: true, twoFactorEnabled: true, therapistProfile: { select: { id: true } } },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const passwordValid = await bcrypt.compare(parsed.data.password, user.password);
  if (!passwordValid) return NextResponse.json({ error: "Incorrect password" }, { status: 400 });

  if (user.twoFactorEnabled) {
    if (!parsed.data.code) return NextResponse.json({ error: "A verification code is required" }, { status: 400 });
    const { ok, lockedOut } = await verifyTwoFactorAttempt(session.user.id, parsed.data.code);
    if (lockedOut) return NextResponse.json({ error: "Too many failed attempts. Try again in a few minutes." }, { status: 429 });
    if (!ok) return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  if (user.role === "ADMIN") {
    return NextResponse.json({ error: "Admin accounts can't be self-deleted; ask another administrator." }, { status: 403 });
  }

  if (user.role === "THERAPIST" && user.therapistProfile) {
    const activeClientCount = await db.user.count({ where: { therapistId: user.therapistProfile.id } });
    if (activeClientCount > 0) {
      return NextResponse.json(
        { error: `You have ${activeClientCount} active client${activeClientCount === 1 ? "" : "s"} — they need to be reassigned before you can delete your account.` },
        { status: 409 }
      );
    }
  }

  await db.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ ok: true });
}
