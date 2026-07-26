import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ membershipId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const { membershipId } = await params;
  const membership = await db.clinicMembership.findUnique({ where: { id: membershipId }, include: { clinic: true } });
  if (!membership || membership.clinic.ownerTherapistId !== therapist.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.clinicMembership.update({
    where: { id: membershipId },
    data: { status: "removed", removedAt: new Date() },
  });

  return NextResponse.json({ membership: updated });
}
