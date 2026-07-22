import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PROTECTED: Record<string, string[]> = {
  "/dashboard": ["CLIENT", "ADMIN"],
  "/therapist": ["THERAPIST", "ADMIN"],
  "/admin": ["ADMIN"],
  "/api/admin": ["ADMIN"],
};

function homeFor(role?: string) {
  if (role === "THERAPIST") return "/therapist";
  if (role === "ADMIN") return "/admin";
  return "/dashboard";
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // Holding pen for therapists who registered without an approval code.
  if (pathname.startsWith("/therapist-pending")) {
    if (!user) return NextResponse.redirect(new URL("/login", req.url));
    if (user.role !== "THERAPIST") {
      return NextResponse.redirect(new URL(homeFor(user.role), req.url));
    }
    if (user.therapistStatus === "approved") {
      return NextResponse.redirect(new URL("/therapist", req.url));
    }
    return NextResponse.next();
  }

  // Client intake/matching quiz — special-cased before the PROTECTED loop
  // since "/onboarding" doesn't share a prefix with any protected bucket.
  if (pathname.startsWith("/onboarding")) {
    if (!user) return NextResponse.redirect(new URL("/login", req.url));
    if (user.role !== "CLIENT") {
      return NextResponse.redirect(new URL(homeFor(user.role), req.url));
    }
    if (user.hasOnboarded) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Therapist profile-completion wizard — must be its own pre-loop block:
  // "/therapist-onboarding".startsWith("/therapist") is true, so nesting this
  // inside the /therapist branch below would risk redirecting the wizard back
  // to itself in a loop.
  if (pathname.startsWith("/therapist-onboarding")) {
    if (!user) return NextResponse.redirect(new URL("/login", req.url));
    if (user.role !== "THERAPIST") {
      return NextResponse.redirect(new URL(homeFor(user.role), req.url));
    }
    if (user.therapistStatus !== "approved") {
      return NextResponse.redirect(new URL("/therapist-pending", req.url));
    }
    if (user.profileCompleted) {
      return NextResponse.redirect(new URL("/therapist", req.url));
    }
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api/");

  for (const [prefix, roles] of Object.entries(PROTECTED)) {
    if (!pathname.startsWith(prefix)) continue;

    if (!user) {
      return isApi
        ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        : NextResponse.redirect(new URL("/login", req.url));
    }

    if (!roles.includes(user.role ?? "")) {
      // Wrong portal — redirect to the right one
      return isApi
        ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
        : NextResponse.redirect(new URL(homeFor(user.role), req.url));
    }

    // Therapists without an approved profile don't get into the portal yet.
    if (prefix === "/therapist" && user.role === "THERAPIST" && user.therapistStatus !== "approved") {
      return NextResponse.redirect(new URL("/therapist-pending", req.url));
    }

    // Approved therapists still need to finish the profile wizard first.
    if (prefix === "/therapist" && user.role === "THERAPIST" && user.therapistStatus === "approved" && !user.profileCompleted) {
      return NextResponse.redirect(new URL("/therapist-onboarding", req.url));
    }

    // Clients who haven't taken the intake quiz yet get routed there first.
    if (prefix === "/dashboard" && user.role === "CLIENT" && !user.hasOnboarded) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)"],
};
