import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reconcileSubscription } from "@/lib/subscriptionBilling";
import { toCsv, csvResponseHeaders } from "@/lib/csv";
import { formatCents } from "@/lib/money";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const subscription = await db.therapistSubscription.findUnique({ where: { therapistId: therapist.id } });
  if (subscription) await reconcileSubscription(subscription.id);

  const yearParam = req.nextUrl.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const [earnings, invoices] = await Promise.all([
    db.sessionEarning.findMany({
      where: { therapistId: therapist.id, sessionDate: { gte: yearStart, lt: yearEnd } },
      include: { client: { select: { name: true } } },
      orderBy: { sessionDate: "asc" },
    }),
    db.invoice.findMany({
      where: { therapistId: therapist.id, issuedAt: { gte: yearStart, lt: yearEnd } },
      orderBy: { issuedAt: "asc" },
    }),
  ]);

  const incomeRows = earnings.map((e) => ({
    "Type": "Income",
    "Date": e.sessionDate.toISOString().slice(0, 10),
    "Description": `Session with ${e.client.name}`,
    "Amount": formatCents(e.netAmountCents, e.currency),
  }));
  const expenseRows = invoices.map((inv) => ({
    "Type": "Expense",
    "Date": inv.issuedAt.toISOString().slice(0, 10),
    "Description": "YouMindo platform subscription",
    "Amount": `-${formatCents(inv.amountCents, inv.currency)}`,
  }));

  const totalIncomeCents = earnings.reduce((sum, e) => sum + e.netAmountCents, 0);
  const totalExpenseCents = invoices.reduce((sum, inv) => sum + inv.amountCents, 0);

  const summary = [
    `Total income,${formatCents(totalIncomeCents)}`,
    `Total platform subscription cost,${formatCents(totalExpenseCents)}`,
    `Net,${formatCents(totalIncomeCents - totalExpenseCents)}`,
    "",
  ].join("\n");

  const table = toCsv([...incomeRows, ...expenseRows]);

  return new NextResponse(`${summary}\n${table}`, { headers: csvResponseHeaders(`youmindo-tax-report-${year}.csv`) });
}
