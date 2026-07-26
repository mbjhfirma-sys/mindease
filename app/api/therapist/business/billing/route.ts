import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const patchSchema = z.object({
  ratePerMinuteCents: z.number().int().positive().optional(),
  currency: z.string().min(3).max(3).optional(),
  billingEmail: z.string().email().max(200).nullable().optional(),
  invoiceCompanyName: z.string().max(200).nullable().optional(),
  vatNumber: z.string().max(50).nullable().optional(),
  paymentNotificationsEnabled: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const billing = await db.therapistBilling.findUnique({ where: { therapistId: therapist.id } });

  return NextResponse.json({
    billing: billing ?? {
      ratePerMinuteCents: null, currency: "USD", platformFeeBps: 0,
      billingEmail: null, invoiceCompanyName: null, vatNumber: null, paymentNotificationsEnabled: true,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const billing = await db.therapistBilling.upsert({
    where: { therapistId: therapist.id },
    create: { therapistId: therapist.id, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json({ billing });
}
