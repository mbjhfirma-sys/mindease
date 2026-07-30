import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const patchSchema = z.object({
  scheduledStart: z.string().refine((v) => !isNaN(new Date(v).getTime()), { message: "Invalid date" }).optional(),
  action: z.enum(["cancel", "end"]).optional(),
});

async function getTherapistId(userId: string) {
  const t = await db.therapist.findUnique({ where: { userId }, select: { id: true } });
  return t?.id ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapistId = await getTherapistId(session.user.id);
  if (!therapistId) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const { id, sessionId } = await params;
  const existing = await db.groupSession.findUnique({
    where: { id: sessionId },
    include: { therapistGroup: { select: { therapistId: true } } },
  });
  if (!existing || existing.therapistGroupId !== id || existing.therapistGroup.therapistId !== therapistId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (parsed.data.scheduledStart) data.scheduledStart = new Date(parsed.data.scheduledStart);
  if (parsed.data.action === "cancel") data.status = "canceled";
  if (parsed.data.action === "end") { data.status = "ended"; data.endedAt = new Date(); }

  const updated = await db.groupSession.update({ where: { id: sessionId }, data });
  return NextResponse.json({ ok: true, session: updated });
}
