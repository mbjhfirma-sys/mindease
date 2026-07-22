import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const contactSchema = z.object({ name: z.string(), phone: z.string().optional(), note: z.string().optional() });

const putSchema = z.object({
  warningSigns: z.array(z.string()).default([]),
  copingStrategies: z.array(z.string()).default([]),
  distractionContacts: z.array(contactSchema).default([]),
  supportContacts: z.array(contactSchema).default([]),
  professionalContacts: z.array(contactSchema).default([]),
  safeEnvironmentSteps: z.array(z.string()).default([]),
  sharedWithTherapist: z.boolean().default(false),
});

const EMPTY = {
  warningSigns: [], copingStrategies: [], distractionContacts: [], supportContacts: [],
  professionalContacts: [], safeEnvironmentSteps: [], sharedWithTherapist: false,
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await db.safetyPlan.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ plan: plan ?? EMPTY });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const plan = await db.safetyPlan.upsert({
    where: { userId: session.user.id },
    update: parsed.data,
    create: { userId: session.user.id, ...parsed.data },
  });

  return NextResponse.json({ ok: true, plan });
}
