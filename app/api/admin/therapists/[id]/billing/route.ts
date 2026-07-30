import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const patchSchema = z.object({
  platformFeeBps: z.number().int().min(0).max(10000),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const therapist = await db.therapist.findUnique({ where: { id } });
  if (!therapist) return NextResponse.json({ error: "Therapist not found" }, { status: 404 });

  const billing = await db.therapistBilling.upsert({
    where: { therapistId: id },
    create: { therapistId: id, platformFeeBps: parsed.data.platformFeeBps },
    update: { platformFeeBps: parsed.data.platformFeeBps },
  });

  await db.adminAuditLog.create({
    data: { adminId: session.user.id, action: "therapist.platformFeeBps.updated", targetType: "Therapist", targetId: id },
  });

  return NextResponse.json({ ok: true, platformFeeBps: billing.platformFeeBps });
}
