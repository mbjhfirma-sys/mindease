import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await db.user.findMany({
    where: { role: "CLIENT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, avatar: true, plan: true, xp: true, level: true, createdAt: true,
      assignedTherapist: { select: { id: true, user: { select: { name: true } } } },
      missionCompletions: { select: { id: true }, take: 1 },
    },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      plan: u.plan,
      xp: u.xp,
      level: u.level,
      createdAt: u.createdAt,
      therapistId: u.assignedTherapist?.id ?? null,
      therapistName: u.assignedTherapist?.user.name ?? null,
      lastActivity: u.missionCompletions.length > 0 ? "recent" : "inactive",
    })),
  });
}
