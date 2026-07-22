import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { verifyTwoFactorAttempt } from "@/lib/twoFactor";

const schema = z.object({ password: z.string().min(1), code: z.string().min(6).max(20) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { password: true, twoFactorEnabled: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!user.twoFactorEnabled) return NextResponse.json({ error: "Two-factor authentication is not enabled" }, { status: 409 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Password and a verification code are required" }, { status: 400 });

  const passwordValid = await bcrypt.compare(parsed.data.password, user.password);
  if (!passwordValid) return NextResponse.json({ error: "Incorrect password" }, { status: 400 });

  const { ok, lockedOut } = await verifyTwoFactorAttempt(session.user.id, parsed.data.code);
  if (lockedOut) return NextResponse.json({ error: "Too many failed attempts. Try again in a few minutes." }, { status: 429 });
  if (!ok) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  await db.$transaction([
    db.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorFailedAttempts: 0, twoFactorLockedUntil: null },
    }),
    db.backupCode.deleteMany({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
