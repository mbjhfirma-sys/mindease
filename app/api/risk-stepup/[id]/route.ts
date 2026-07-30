import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const schema = z.object({ action: z.literal("resolve") });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const window_ = await db.riskStepUpWindow.findUnique({
    where: { id },
    include: { user: { select: { therapistId: true } } },
  });
  if (!window_) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "ADMIN") {
    // allowed
  } else if (session.user.role === "THERAPIST") {
    const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    const isCurrentTherapist = therapist && window_.user.therapistId === therapist.id;
    const isSnapshottedContact = window_.contactUserId === session.user.id;
    if (!isCurrentTherapist && !isSnapshottedContact) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (window_.status !== "active") {
    return NextResponse.json({ error: "Window is not active" }, { status: 400 });
  }

  const updated = await db.riskStepUpWindow.update({
    where: { id },
    data: { status: "resolved", resolvedAt: new Date(), resolvedById: session.user.id },
  });

  return NextResponse.json({ ok: true, window: updated });
}
