import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const putSchema = z.object({
  slots: z.array(z.object({ day: z.string().min(1).max(20), time: z.string().min(1).max(20) })),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const slots = await db.availabilitySlot.findMany({ where: { therapistId: therapist.id } });
  return NextResponse.json({ slots: slots.map((s) => ({ day: s.day, time: s.time })) });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const body = await req.json();
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await db.$transaction([
    db.availabilitySlot.deleteMany({ where: { therapistId: therapist.id } }),
    db.availabilitySlot.createMany({
      data: parsed.data.slots.map((s) => ({ therapistId: therapist.id, day: s.day, time: s.time })),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
