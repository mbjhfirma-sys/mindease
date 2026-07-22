import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const schema = z.object({
  status: z.enum(["open", "acknowledged"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const flag = await db.riskFlag.findUnique({ where: { id }, include: { user: { select: { therapistId: true } } } });
  if (!flag) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "ADMIN") {
    // allowed
  } else if (session.user.role === "THERAPIST") {
    const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
    if (!therapist || flag.user.therapistId !== therapist.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await db.riskFlag.update({
    where: { id },
    data: {
      status: parsed.data.status,
      acknowledgedAt: parsed.data.status === "acknowledged" ? new Date() : null,
      acknowledgedById: parsed.data.status === "acknowledged" ? session.user.id : null,
    },
  });

  return NextResponse.json({ ok: true, flag: updated });
}
