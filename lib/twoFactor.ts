import { authenticator } from "otplib";
import { randomBytes, createHmac } from "crypto";
import { db } from "@/lib/db";

const ISSUER = "YouMindo";
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MINUTES = 5;

export function generateSecret(): string {
  return authenticator.generateSecret();
}

export function keyUri(email: string, secret: string): string {
  return authenticator.keyuri(email, ISSUER, secret);
}

export function verifyToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = randomBytes(4).toString("hex").toUpperCase(); // 8 hex chars
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }
  return codes;
}

// Backup codes are high-entropy, randomly-generated tokens (never user-chosen),
// so a fast keyed hash is appropriate here — unlike passwords, there's no
// dictionary/rainbow-table risk to slow down, and a user can hold up to 10 of
// these at once, so a slow hash (bcrypt) turns every failed-TOTP fallback check
// into a multi-second sequential scan. HMAC-SHA256 keyed with AUTH_SECRET keeps
// this a fast, indexable equality check while still requiring the server secret
// to precompute hashes for guessed codes offline.
export function hashBackupCode(code: string): string {
  return createHmac("sha256", process.env.AUTH_SECRET!).update(normalizeBackupCode(code)).digest("hex");
}

export function verifyBackupCode(code: string, hash: string): boolean {
  return hashBackupCode(code) === hash;
}

function normalizeBackupCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

// Verifies a TOTP or backup code against a user's enrolled secret, applying a
// shared lockout: 5 minutes after 5 consecutive failed attempts. Used by login,
// 2FA setup confirmation, and 2FA disable — the one place any code is checked.
export async function verifyTwoFactorAttempt(userId: string, code: string): Promise<{ ok: boolean; lockedOut: boolean }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorFailedAttempts: true, twoFactorLockedUntil: true },
  });
  if (!user) return { ok: false, lockedOut: false };

  if (user.twoFactorLockedUntil && user.twoFactorLockedUntil > new Date()) {
    return { ok: false, lockedOut: true };
  }

  let valid = user.twoFactorSecret ? verifyToken(code, user.twoFactorSecret) : false;

  if (!valid) {
    const codeHash = hashBackupCode(code);
    const match = await db.backupCode.findFirst({ where: { userId, codeHash, usedAt: null } });
    if (match) {
      const result = await db.backupCode.updateMany({ where: { id: match.id, usedAt: null }, data: { usedAt: new Date() } });
      valid = result.count === 1;
    }
  }

  if (valid) {
    await db.user.update({ where: { id: userId }, data: { twoFactorFailedAttempts: 0, twoFactorLockedUntil: null } });
    return { ok: true, lockedOut: false };
  }

  const attempts = user.twoFactorFailedAttempts + 1;
  const lockedUntil = attempts >= LOCKOUT_THRESHOLD ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null;
  await db.user.update({ where: { id: userId }, data: { twoFactorFailedAttempts: attempts, twoFactorLockedUntil: lockedUntil } });
  return { ok: false, lockedOut: false };
}
