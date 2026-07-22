import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const planSchema = z.object({
  diagnosis: z.string().max(500),
  approach: z.string().max(1000),
  frequency: z.string().max(200),
  shortTermGoals: z.string().max(2000),
  longTermGoals: z.string().max(2000),
  phase: z.string().max(200),
  riskLevel: z.enum(["low", "medium", "high"]),
  safetyPlan: z.boolean(),
  emergencyContacts: z.boolean(),
});

async function requireTherapistAndClient(userId: string, clientId: string) {
  const therapist = await db.therapist.findUnique({ where: { userId } });
  if (!therapist) return { therapist: null, ok: false as const };
  const client = await db.user.findFirst({ where: { id: clientId, therapistId: therapist.id } });
  return { therapist, ok: !!client };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;
  const { therapist, ok } = await requireTherapistAndClient(session.user.id, clientId);
  if (!therapist || !ok) return NextResponse.json({ error: "Client not found or not assigned" }, { status: 404 });

  const plan = await db.treatmentPlan.findUnique({
    where: { therapistId_clientId: { therapistId: therapist.id, clientId } },
  });

  return NextResponse.json({ plan });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;
  const { therapist, ok } = await requireTherapistAndClient(session.user.id, clientId);
  if (!therapist || !ok) return NextResponse.json({ error: "Client not found or not assigned" }, { status: 404 });

  const body = await req.json();
  const parsed = planSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const plan = await db.treatmentPlan.upsert({
    where: { therapistId_clientId: { therapistId: therapist.id, clientId } },
    update: { ...parsed.data, lastAssessed: new Date() },
    create: { therapistId: therapist.id, clientId, ...parsed.data, lastAssessed: new Date() },
  });

  return NextResponse.json({ ok: true, plan });
}
