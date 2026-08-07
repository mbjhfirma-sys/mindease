"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// My Therapist was merged into the Sessions page (/dashboard/schedule) — this route stays
// only so old links, bookmarks, and notifications don't 404.
export default function MyTherapistRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/schedule"); }, [router]);
  return null;
}
