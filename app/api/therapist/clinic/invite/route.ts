import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notify";

const postSchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const clinic = await db.clinic.findUnique({ where: { ownerTherapistId: therapist.id } });
  if (!clinic) return NextResponse.json({ error: "You don't own a clinic" }, { status: 404 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const invitee = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, role: true, therapistProfile: { select: { id: true } } },
  });
  if (!invitee || invitee.role !== "THERAPIST" || !invitee.therapistProfile) {
    return NextResponse.json({ error: "No therapist account found with that email" }, { status: 404 });
  }
  if (invitee.therapistProfile.id === therapist.id) {
    return NextResponse.json({ error: "You can't invite yourself" }, { status: 400 });
  }

  const existingElsewhere = await db.clinicMembership.findFirst({
    where: { therapistId: invitee.therapistProfile.id, status: { in: ["invited", "active"] } },
  });
  if (existingElsewhere) {
    return NextResponse.json({ error: "That therapist is already part of a clinic" }, { status: 400 });
  }
  const alsoOwnsAClinic = await db.clinic.findUnique({ where: { ownerTherapistId: invitee.therapistProfile.id } });
  if (alsoOwnsAClinic) {
    return NextResponse.json({ error: "That therapist already owns their own clinic" }, { status: 400 });
  }

  const membership = await db.clinicMembership.create({
    data: { clinicId: clinic.id, therapistId: invitee.therapistProfile.id },
  });

  await createNotification(invitee.id, {
    title: "Clinic invite",
    body: `You've been invited to join ${clinic.name} on YouMindo.`,
    icon: "🏥",
    href: "/therapist/business/subscription",
  }).catch(() => {});

  return NextResponse.json({ membership });
}
