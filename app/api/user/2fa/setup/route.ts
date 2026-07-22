import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateSecret, keyUri } from "@/lib/twoFactor";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { email: true, twoFactorEnabled: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.twoFactorEnabled) return NextResponse.json({ error: "Two-factor authentication is already enabled" }, { status: 409 });

  const secret = generateSecret();
  await db.user.update({ where: { id: session.user.id }, data: { twoFactorSecret: secret } });

  const qrCodeDataUrl = await QRCode.toDataURL(keyUri(user.email, secret));

  return NextResponse.json({ qrCodeDataUrl, secret });
}
