import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { toCsv, csvResponseHeaders } from "@/lib/csv";
import { formatCents } from "@/lib/money";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const yearParam = req.nextUrl.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  const earnings = await db.sessionEarning.findMany({
    where: { therapistId: therapist.id, sessionDate: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
    include: { client: { select: { name: true } } },
    orderBy: { sessionDate: "asc" },
  });

  const csv = toCsv(earnings.map((e) => ({
    "Date": e.sessionDate.toISOString().slice(0, 10),
    "Client": e.client.name,
    "Duration (min)": Math.round(e.durationMinutes),
    "Gross": formatCents(e.grossAmountCents, e.currency),
    "Platform fee": formatCents(e.platformFeeCents, e.currency),
    "Net earnings": formatCents(e.netAmountCents, e.currency),
  })));

  return new NextResponse(csv, { headers: csvResponseHeaders(`youmindo-annual-earnings-${year}.csv`) });
}
