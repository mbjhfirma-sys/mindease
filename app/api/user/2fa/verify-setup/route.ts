import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateBackupCodes, hashBackupCode, verifyTwoFactorAttempt } from "@/lib/twoFactor";

const schema = z.object({ code: z.string().min(6).max(20) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { twoFactorEnabled: true, twoFactorSecret: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.twoFactorEnabled) return NextResponse.json({ error: "Two-factor authentication is already enabled" }, { status: 409 });
  if (!user.twoFactorSecret) return NextResponse.json({ error: "No setup in progress — start enrollment first" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "A verification code is required" }, { status: 400 });

  const { ok, lockedOut } = await verifyTwoFactorAttempt(session.user.id, parsed.data.code);
  if (lockedOut) return NextResponse.json({ error: "Too many failed attempts. Try again in a few minutes." }, { status: 429 });
  if (!ok) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  const backupCodes = generateBackupCodes();
  const hashed = await Promise.all(backupCodes.map((c) => hashBackupCode(c)));

  await db.$transaction([
    db.user.update({ where: { id: session.user.id }, data: { twoFactorEnabled: true } }),
    db.backupCode.createMany({ data: hashed.map((codeHash) => ({ userId: session.user.id, codeHash })) }),
  ]);

  return NextResponse.json({ ok: true, backupCodes });
}
