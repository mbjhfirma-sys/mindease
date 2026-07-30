import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 30, 90);
  const briefings = await db.dailyBriefing.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: limit,
    select: { id: true, date: true, briefingText: true, softened: true, facts: true },
  });

  return NextResponse.json({ briefings });
}
