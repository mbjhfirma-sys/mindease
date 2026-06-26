import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({
    where: { userId: session.user.id },
    include: {
      clients: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          plan: true,
          xp: true,
          level: true,
          createdAt: true,
          missionCompletions: {
            select: { id: true },
            orderBy: { completedAt: "desc" },
            take: 1,
          },
          moodEntries: {
            select: { score: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 7,
          },
        },
      },
    },
  });

  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const clients = therapist.clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    avatar: c.avatar,
    plan: c.plan,
    xp: c.xp,
    level: c.level,
    joinedAt: c.createdAt,
    recentMoods: c.moodEntries.map((m) => ({ score: m.score, date: m.createdAt })),
    lastActivity: c.missionCompletions[0]?.id ? "recent" : "inactive",
  }));

  return NextResponse.json({ clients });
}
