import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Not a therapist" }, { status: 403 });

  const client = await db.user.findFirst({ where: { id: clientId, therapistId: therapist.id }, select: { id: true } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 12, 26);
  const digests = await db.weeklyDigest.findMany({
    where: { clientId, therapistId: therapist.id },
    orderBy: { weekStart: "desc" },
    take: limit,
    select: { id: true, weekStart: true, digestText: true },
  });

  return NextResponse.json({ digests });
}
