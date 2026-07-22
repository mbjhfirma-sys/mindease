import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const createSchema = z.object({
  courseName: z.string().min(1).max(200),
});

const updateSchema = z.object({
  enrollmentId: z.string(),
  status: z.enum(["in_progress", "completed", "paused"]),
});

const deleteSchema = z.object({
  enrollmentId: z.string(),
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

  const enrollments = await db.courseEnrollment.findMany({
    where: { therapistId: therapist.id, clientId },
    orderBy: { assignedAt: "asc" },
  });

  return NextResponse.json({ enrollments });
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

  const enrollment = await db.courseEnrollment.upsert({
    where: { clientId_courseName: { clientId, courseName: parsed.data.courseName } },
    update: {},
    create: { therapistId: therapist.id, clientId, courseName: parsed.data.courseName },
  });

  return NextResponse.json({ ok: true, enrollment }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;
  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Not a therapist" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await db.courseEnrollment.findUnique({ where: { id: parsed.data.enrollmentId } });
  if (!existing || existing.therapistId !== therapist.id || existing.clientId !== clientId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const enrollment = await db.courseEnrollment.update({
    where: { id: parsed.data.enrollmentId },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true, enrollment });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;
  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Not a therapist" }, { status: 403 });

  const body = await req.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await db.courseEnrollment.findUnique({ where: { id: parsed.data.enrollmentId } });
  if (!existing || existing.therapistId !== therapist.id || existing.clientId !== clientId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.courseEnrollment.delete({ where: { id: parsed.data.enrollmentId } });
  return NextResponse.json({ ok: true });
}
