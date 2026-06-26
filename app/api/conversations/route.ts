import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const createSchema = z.object({
  therapistId: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT") return NextResponse.json({ error: "Only clients can start conversations" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const therapist = await db.therapist.findUnique({
    where: { id: parsed.data.therapistId },
    select: { id: true },
  });
  if (!therapist) return NextResponse.json({ error: "Therapist not found" }, { status: 404 });

  const conversation = await db.conversation.upsert({
    where: { clientId_therapistId: { clientId: session.user.id, therapistId: therapist.id } },
    update: {},
    create: { clientId: session.user.id, therapistId: therapist.id },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, conversationId: conversation.id }, { status: 201 });
}
