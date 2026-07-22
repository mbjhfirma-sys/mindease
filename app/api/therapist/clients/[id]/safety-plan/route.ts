import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;
  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Not a therapist" }, { status: 403 });

  const client = await db.user.findFirst({ where: { id: clientId, therapistId: therapist.id } });
  if (!client) return NextResponse.json({ error: "Client not found or not assigned" }, { status: 404 });

  const plan = await db.safetyPlan.findUnique({ where: { userId: clientId } });

  if (!plan || !plan.sharedWithTherapist) {
    return NextResponse.json({ plan: null, shared: false });
  }

  return NextResponse.json({ plan, shared: true });
}
