import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, clients, therapistUsers, admins, newLast7d,
    totalTherapists, pending, approved, rejected,
    openReports, flaggedPosts, totalPosts,
    openRiskFlags,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "CLIENT" } }),
    db.user.count({ where: { role: "THERAPIST" } }),
    db.user.count({ where: { role: "ADMIN" } }),
    db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.therapist.count(),
    db.therapist.count({ where: { verificationStatus: "pending" } }),
    db.therapist.count({ where: { verificationStatus: "approved" } }),
    db.therapist.count({ where: { verificationStatus: "rejected" } }),
    db.communityReport.count({ where: { status: "open" } }),
    db.therapistGroupPost.count({ where: { flagged: true } }),
    db.communityPost.count(),
    db.riskFlag.count({ where: { status: "open" } }),
  ]);

  return NextResponse.json({
    users: { total: totalUsers, clients, therapists: therapistUsers, admins, newLast7d },
    therapists: { total: totalTherapists, pending, approved, rejected },
    community: { openReports, flaggedPosts, totalPosts },
    safety: { openRiskFlags },
  });
}
