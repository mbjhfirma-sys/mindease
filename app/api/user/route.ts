import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { verifyTwoFactorAttempt } from "@/lib/twoFactor";
import { deleteUserAccount } from "@/lib/accountDeletion";

const deleteSchema = z.object({
  password: z.string().min(1),
  code: z.string().optional(),
  confirmText: z.literal("DELETE"),
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
  shareJournalWithTherapist:    z.boolean().optional(),
  showInLeaderboard:            z.boolean().optional(),
  anonymousCommunity:           z.boolean().optional(),
  dataForResearch:              z.boolean().optional(),
  mindoClientBriefingEnabled:   z.boolean().optional(),
  mindoTherapistDigestEnabled:  z.boolean().optional(),
  mindoIntroSeen:               z.boolean().optional(),
});

const dataDirectiveSchema = z.object({
  legalDiscovery:   z.string().max(500).optional(),
  incapacitation:   z.string().max(500).optional(),
  trustedContact: z.object({
    name:         z.string().min(1).max(100),
    relationship: z.string().min(1).max(100),
    email:        z.string().email(),
  }).optional(),
});

const patchSchema = z.object({
  name:                        z.string().min(2).optional(),
  phone:                       z.string().optional(),
  dob:                         z.string().refine((v) => !isNaN(new Date(v).getTime()), { message: "Invalid date" }).optional(),
  timezone:                    z.string().optional(),
  language:                    z.string().optional(),
  avatar:                      z.string().max(200000).optional(),
  notificationPrefs:           notificationPrefsSchema.optional(),
  privacyPrefs:                privacyPrefsSchema.optional(),
  hasOnboarded:                z.boolean().optional(),
  hasSeenClientTour:           z.boolean().optional(),
  peerMatchingOptIn:           z.boolean().optional(),
  communityContentOnDeletion:  z.enum(["delete", "anonymize"]).optional(),
  dataDirective:               dataDirectiveSchema.optional(),
});

const DEFAULT_NOTIFICATION_PREFS = {
  dailyReminder: true, missionReminder: true, moodReminder: false,
  therapistMessages: true, communityUpdates: false, weeklyReport: true,
  reminderTime: "08:00",
};

const DEFAULT_PRIVACY_PREFS = {
  shareJournalWithTherapist: false, showInLeaderboard: false,
  anonymousCommunity: true, dataForResearch: false,
  mindoClientBriefingEnabled: true, mindoTherapistDigestEnabled: true, mindoIntroSeen: false,
};

const DEFAULT_DATA_DIRECTIVE = {};

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
        communityContentOnDeletion: true, dataDirective: true,
        assignedTherapist: {
          include: { user: { select: { name: true, avatar: true } } },
        },
        therapistProfile: { select: { id: true, title: true, specializations: true, rating: true } },
        couponRedemption: {
          select: {
            discountValueSnapshot: true,
            coupon: { select: { code: true, discountType: true, owner: { select: { user: { select: { name: true } } } } } },
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let premiumCreditAvailable = false;
    if (user.plan === "premium") {
      const subscription = await db.clientSubscription.findUnique({ where: { userId: user.id } });
      if (subscription?.status === "active") {
        const usedThisPeriod = await db.clientSessionCredit.findFirst({
          where: { clientSubscriptionId: subscription.id, periodStart: subscription.currentPeriodStart },
        });
        premiumCreditAvailable = !usedThisPeriod;
      }
    }

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
          dataDirective: user.dataDirective ?? DEFAULT_DATA_DIRECTIVE,
          premiumCreditAvailable,
        },
      });
    }

    return NextResponse.json({
      user: {
        ...user,
        notificationPrefs: user.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS,
        privacyPrefs: user.privacyPrefs ?? DEFAULT_PRIVACY_PREFS,
        dataDirective: user.dataDirective ?? DEFAULT_DATA_DIRECTIVE,
        premiumCreditAvailable,
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

  const { notificationPrefs, privacyPrefs, dataDirective, dob, ...rest } = parsed.data;
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

  if (dataDirective) {
    const existing = await db.user.findUnique({
      where: { id: session.user.id },
      select: { dataDirective: true },
    });
    const current = (existing?.dataDirective as Record<string, unknown>) ?? DEFAULT_DATA_DIRECTIVE;
    data.dataDirective = { ...current, ...dataDirective, updatedAt: new Date().toISOString() };
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true, name: true, email: true, role: true, avatar: true,
      plan: true, phone: true, dob: true, timezone: true, language: true,
      notificationPrefs: true, privacyPrefs: true, hasOnboarded: true, hasSeenClientTour: true, peerMatchingOptIn: true,
      communityContentOnDeletion: true, dataDirective: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Password and confirmation are required" }, { status: 400 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { password: true, role: true, twoFactorEnabled: true, communityContentOnDeletion: true, therapistProfile: { select: { id: true } } },
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

  const nonTerminalChargeCount = await db.sessionCharge.count({
    where: {
      status: { in: ["requires_payment", "paid"] },
      ...(user.role === "THERAPIST" && user.therapistProfile
        ? { therapistId: user.therapistProfile.id }
        : { clientId: session.user.id }),
    },
  });
  if (nonTerminalChargeCount > 0) {
    return NextResponse.json(
      { error: "You have a session payment in progress — it needs to be resolved (completed, cancelled, or paid out) before you can delete your account." },
      { status: 409 }
    );
  }

  await deleteUserAccount(session.user.id, { anonymizeCommunityContent: user.communityContentOnDeletion === "anonymize" });

  return NextResponse.json({ ok: true });
}
