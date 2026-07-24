import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!therapist) return NextResponse.json({ error: "Not a therapist" }, { status: 403 });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const digests = await db.weeklyDigest.findMany({
    where: { therapistId: therapist.id, createdAt: { gte: sevenDaysAgo } },
    orderBy: { createdAt: "desc" },
    select: { id: true, clientId: true, digestText: true, createdAt: true, client: { select: { name: true } } },
  });

  return NextResponse.json({
    digests: digests.map((d) => ({
      id: d.id,
      clientId: d.clientId,
      clientName: d.client.name,
      digestText: d.digestText,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}
