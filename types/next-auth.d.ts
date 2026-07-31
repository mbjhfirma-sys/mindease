import type { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CLIENT" | "THERAPIST" | "ADMIN";
      therapistStatus?: "pending" | "approved" | "rejected" | null;
      hasOnboarded?: boolean;
      hasIntake?: boolean;
      profileCompleted?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "CLIENT" | "THERAPIST" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "CLIENT" | "THERAPIST" | "ADMIN";
    therapistStatus?: "pending" | "approved" | "rejected" | null;
    hasOnboarded?: boolean;
    hasIntake?: boolean;
    profileCompleted?: boolean;
    /** Epoch ms of the last therapistStatus/hasOnboarded/hasIntake DB refresh — see auth.ts's jwt callback. */
    statusCheckedAt?: number;
    /** Epoch ms of the last login-streak sync — see auth.ts's jwt callback and lib/loginStreak.ts. */
    streakSyncedAt?: number;
  }
}
