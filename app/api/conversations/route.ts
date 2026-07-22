import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const createSchema = z.object({
  therapistId: z.string().optional(),
  clientId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let clientId: string;
  let therapistId: string;

  if (session.user.role === "THERAPIST") {
    const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });
    if (!parsed.data.clientId) return NextResponse.json({ error: "clientId is required" }, { status: 400 });

    const client = await db.user.findUnique({ where: { id: parsed.data.clientId }, select: { therapistId: true } });
    if (!client || client.therapistId !== therapist.id) {
      return NextResponse.json({ error: "You can only message your own clients" }, { status: 403 });
    }

    clientId = parsed.data.clientId;
    therapistId = therapist.id;
  } else if (session.user.role === "CLIENT") {
    if (!parsed.data.therapistId) return NextResponse.json({ error: "therapistId is required" }, { status: 400 });
    const therapist = await db.therapist.findUnique({ where: { id: parsed.data.therapistId }, select: { id: true } });
    if (!therapist) return NextResponse.json({ error: "Therapist not found" }, { status: 404 });

    const msgClient = await db.user.findUnique({ where: { id: session.user.id }, select: { therapistId: true } });
    if (msgClient?.therapistId !== therapist.id) {
      return NextResponse.json({ error: "You can only message your assigned therapist" }, { status: 403 });
    }

    clientId = session.user.id;
    therapistId = therapist.id;
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const conversation = await db.conversation.upsert({
    where: { clientId_therapistId: { clientId, therapistId } },
    update: {},
    create: { clientId, therapistId },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, conversationId: conversation.id }, { status: 201 });
}
