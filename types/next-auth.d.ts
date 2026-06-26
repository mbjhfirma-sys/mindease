import type { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CLIENT" | "THERAPIST" | "ADMIN";
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
  }
}
