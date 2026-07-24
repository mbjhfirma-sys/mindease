import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ensureWeeklyDigest } from "@/lib/mindo/ensureWeeklyDigest";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Not a therapist" }, { status: 403 });

  const client = await db.user.findFirst({ where: { id: clientId, therapistId: therapist.id }, select: { id: true } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await ensureWeeklyDigest(clientId, therapist.id);
  if (!result.enabled) return NextResponse.json({ enabled: false });

  return NextResponse.json({
    enabled: true,
    digestText: result.digest.digestText,
    facts: result.digest.facts,
    weekStart: result.digest.weekStart,
    journalIncluded: result.digest.journalIncluded,
  });
}
