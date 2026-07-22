import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const therapists = await db.therapist.findMany({
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
      _count: {
        select: { clients: true, appointments: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const formatted = therapists.map((t) => ({
    id: t.id,
    userId: t.userId,
    name: t.user.name,
    avatar: t.user.avatar ?? null,
    title: t.title,
    specializations: t.specializations,
    bio: t.bio,
    rating: t.rating,
    totalSessions: t.totalSessions,
    activeClients: t._count.clients,
    maxClients: t.maxClients,
    isFull: t.maxClients != null && t._count.clients >= t.maxClients,
  }));

  return NextResponse.json({ therapists: formatted });
}
