import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PROTECTED: Record<string, string[]> = {
  "/dashboard": ["CLIENT", "ADMIN"],
  "/therapist": ["THERAPIST", "ADMIN"],
};

export default auth((req) => {
  // Skip auth in development so you can design without a DB
  if (process.env.NODE_ENV === "development") return NextResponse.next();

  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  for (const [prefix, roles] of Object.entries(PROTECTED)) {
    if (!pathname.startsWith(prefix)) continue;

    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (!roles.includes(user.role ?? "")) {
      // Wrong portal — redirect to the right one
      const redirect = user.role === "THERAPIST" ? "/therapist" : "/dashboard";
      return NextResponse.redirect(new URL(redirect, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)"],
};
