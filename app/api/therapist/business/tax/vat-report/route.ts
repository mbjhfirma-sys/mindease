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

  const billing = await db.therapistBilling.findUnique({ where: { therapistId: therapist.id } });

  const yearParam = req.nextUrl.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  const earnings = await db.sessionEarning.findMany({
    where: { therapistId: therapist.id, sessionDate: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
    include: { client: { select: { name: true } } },
    orderBy: { sessionDate: "asc" },
  });

  const header = [
    `Company,${billing?.invoiceCompanyName ?? ""}`,
    `VAT number,${billing?.vatNumber ?? ""}`,
    `Year,${year}`,
    "",
  ].join("\n");

  const table = toCsv(earnings.map((e) => ({
    "Date": e.sessionDate.toISOString().slice(0, 10),
    "Client": e.client.name,
    "Net earnings": formatCents(e.netAmountCents, e.currency),
    "VAT": "Not calculated — no VAT rate configured on this platform",
  })));

  return new NextResponse(`${header}\n${table}`, { headers: csvResponseHeaders(`youmindo-vat-report-${year}.csv`) });
}
