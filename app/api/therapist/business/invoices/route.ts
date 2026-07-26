import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reconcileSubscription } from "@/lib/subscriptionBilling";

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

  const invoices = await db.invoice.findMany({
    where: {
      therapistId: therapist.id,
      issuedAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
    },
    orderBy: { issuedAt: "desc" },
  });

  return NextResponse.json({ invoices, year });
}
