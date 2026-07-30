import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const flags = await db.riskFlag.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          assignedTherapist: { select: { title: true, user: { select: { name: true } } } },
          riskStepUpWindows: {
            where: { status: "active" },
            select: { windowEnd: true, contactLabel: true, checkInIntervalHrs: true },
            take: 1,
          },
        },
      },
    },
  });

  // Prisma can't ORDER BY CASE on a plain string column — sort high-then-moderate in JS,
  // most-recent-first within each severity (matches the query's own createdAt desc order).
  const sorted = [...flags].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1));

  return NextResponse.json({
    flags: sorted.map((f) => ({
      id: f.id,
      userId: f.userId,
      userName: f.user.name,
      source: f.source,
      severity: f.severity,
      detail: f.detail,
      status: f.status,
      createdAt: f.createdAt,
      therapistName: f.user.assignedTherapist ? `${f.user.assignedTherapist.user.name}, ${f.user.assignedTherapist.title}` : null,
      activeStepUpWindow: f.user.riskStepUpWindows[0] ?? null,
    })),
  });
}
