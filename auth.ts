import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { verifyTwoFactorAttempt } from "@/lib/twoFactor";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  totpCode: z.string().optional(),
});

// Thrown instead of returning null so the login form can tell "needs a 2FA code"
// apart from "wrong password" without a separate precheck round-trip — see the
// login page, which used to call /api/auth/requires-2fa before every sign-in
// attempt. Checking 2FA status only after the password already verified is also
// stricter than the old precheck, which revealed an email's 2FA status to anyone
// who typed it in, before checking whether they even knew the password.
class RequiresTwoFactor extends CredentialsSignin {
  code = "requires-2fa";
}
class InvalidTwoFactorCode extends CredentialsSignin {
  code = "invalid-2fa";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          select: { id: true, email: true, name: true, role: true, password: true, twoFactorEnabled: true },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        if (user.twoFactorEnabled) {
          if (!parsed.data.totpCode) throw new RequiresTwoFactor();
          const { ok } = await verifyTwoFactorAttempt(user.id, parsed.data.totpCode);
          if (!ok) throw new InvalidTwoFactorCode();
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.statusCheckedAt = 0; // force a fresh status lookup right after sign-in
      }
      // Back-fill role from DB for tokens issued before role was stored in JWT
      if (!token.role && token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        if (dbUser) token.role = dbUser.role;
      }
      // `auth()` runs as middleware on nearly every request (see proxy.ts), so this
      // callback fires on every page load and every API call — not just at sign-in.
      // Re-querying therapistStatus/hasOnboarded on every single one of those was
      // adding a full extra DB round-trip (to a remote Neon instance) to every
      // request in the app, which is what made login — and everything after it —
      // feel slow. A short TTL keeps "approval takes effect without signing out"
      // true in practice while cutting the query down from every-request to
      // roughly once per STATUS_TTL_MS.
      const STATUS_TTL_MS = 30_000;
      const statusIsStale =
        trigger === "update" || Date.now() - ((token.statusCheckedAt as number) ?? 0) > STATUS_TTL_MS;

      if (statusIsStale && token.role === "THERAPIST" && token.id) {
        const therapist = await db.therapist.findUnique({
          where: { userId: token.id as string },
          select: { verificationStatus: true, profileCompleted: true },
        });
        token.therapistStatus = therapist?.verificationStatus ?? null;
        token.profileCompleted = therapist?.profileCompleted ?? true;
        token.statusCheckedAt = Date.now();
      }
      // Scoped to CLIENT only — mirrors the therapist-only check above so
      // other roles gain zero extra DB load per request.
      if (statusIsStale && token.role === "CLIENT" && token.id) {
        const client = await db.user.findUnique({
          where: { id: token.id as string },
          select: { hasOnboarded: true },
        });
        token.hasOnboarded = client?.hasOnboarded ?? true;
        token.statusCheckedAt = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "CLIENT" | "THERAPIST" | "ADMIN";
        session.user.therapistStatus =
          (token.therapistStatus as "pending" | "approved" | "rejected" | null) ?? null;
        session.user.hasOnboarded = token.hasOnboarded as boolean | undefined;
        session.user.profileCompleted = token.profileCompleted as boolean | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
