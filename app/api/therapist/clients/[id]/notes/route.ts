import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const createSchema = z.object({
  date: z.string().datetime(),
  sessionType: z.enum(["individual", "group", "assessment", "crisis", "phone", "email"]),
  content: z.string().min(1).max(5000),
  noteFormat: z.enum(["freeform", "soap"]).default("freeform"),
  subjective: z.string().max(2000).optional(),
  objective: z.string().max(2000).optional(),
  clinicalAssessment: z.string().max(2000).optional(),
  affect: z.string().max(200).optional(),
  riskLevel: z.enum(["low", "medium", "high"]),
  nextSteps: z.string().max(1000).optional(),
  tags: z.array(z.string()).default([]),
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

  const notes = await db.clinicalNote.findMany({
    where: { therapistId: therapist.id, clientId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;
  const { therapist, ok } = await requireTherapistAndClient(session.user.id, clientId);
  if (!therapist || !ok) return NextResponse.json({ error: "Client not found or not assigned" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const note = await db.clinicalNote.create({
    data: {
      therapistId: therapist.id,
      clientId,
      date: new Date(parsed.data.date),
      sessionType: parsed.data.sessionType,
      content: parsed.data.content,
      noteFormat: parsed.data.noteFormat,
      subjective: parsed.data.subjective,
      objective: parsed.data.objective,
      clinicalAssessment: parsed.data.clinicalAssessment,
      affect: parsed.data.affect,
      riskLevel: parsed.data.riskLevel,
      nextSteps: parsed.data.nextSteps,
      tags: parsed.data.tags,
    },
  });

  return NextResponse.json({ ok: true, note }, { status: 201 });
}
