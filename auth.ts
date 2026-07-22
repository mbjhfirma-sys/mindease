import NextAuth from "next-auth";
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
          if (!parsed.data.totpCode) return null;
          const { ok } = await verifyTwoFactorAttempt(user.id, parsed.data.totpCode);
          if (!ok) return null;
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      // Back-fill role from DB for tokens issued before role was stored in JWT
      if (!token.role && token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        if (dbUser) token.role = dbUser.role;
      }
      // Re-checked on every session access so an admin approval takes effect
      // immediately, without the therapist needing to sign out and back in.
      if (token.role === "THERAPIST" && token.id) {
        const therapist = await db.therapist.findUnique({
          where: { userId: token.id as string },
          select: { verificationStatus: true, profileCompleted: true },
        });
        token.therapistStatus = therapist?.verificationStatus ?? null;
        token.profileCompleted = therapist?.profileCompleted ?? true;
      }
      // Scoped to CLIENT only — mirrors the therapist-only check above so
      // other roles gain zero extra DB load per request.
      if (token.role === "CLIENT" && token.id) {
        const client = await db.user.findUnique({
          where: { id: token.id as string },
          select: { hasOnboarded: true },
        });
        token.hasOnboarded = client?.hasOnboarded ?? true;
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
