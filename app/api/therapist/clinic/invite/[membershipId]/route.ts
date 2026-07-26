import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const patchSchema = z.object({ accept: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ membershipId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const { membershipId } = await params;
  const membership = await db.clinicMembership.findUnique({ where: { id: membershipId } });
  if (!membership || membership.therapistId !== therapist.id || membership.status !== "invited") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await db.clinicMembership.update({
    where: { id: membershipId },
    data: parsed.data.accept
      ? { status: "active", joinedAt: new Date() }
      : { status: "removed", removedAt: new Date() },
  });

  return NextResponse.json({ membership: updated });
}
