import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const entries = await db.waitlistEntry.findMany({
    where: { therapistId: therapist.id, status: "waiting" },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
  });

  return NextResponse.json({
    entries: entries.map((e) => ({ id: e.id, userId: e.user.id, name: e.user.name, avatar: e.user.avatar, email: e.user.email, createdAt: e.createdAt })),
  });
}
