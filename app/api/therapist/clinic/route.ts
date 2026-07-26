import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function getTherapist(userId: string) {
  return db.therapist.findUnique({ where: { userId } });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await getTherapist(session.user.id);
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const owned = await db.clinic.findUnique({
    where: { ownerTherapistId: therapist.id },
    include: {
      memberships: {
        include: { therapist: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { invitedAt: "asc" },
      },
    },
  });

  if (owned) {
    const seatCount = owned.memberships.filter((m) => m.status === "active").length + 1; // +1 for the owner's own seat
    const extraSeats = Math.max(0, seatCount - owned.includedSeats);
    return NextResponse.json({
      role: "owner",
      clinic: {
        id: owned.id,
        name: owned.name,
        includedSeats: owned.includedSeats,
        extraSeatPriceCents: owned.extraSeatPriceCents,
        currency: owned.currency,
        seatCount,
        extraSeats,
        extraSeatCostCents: extraSeats * owned.extraSeatPriceCents,
        members: owned.memberships.map((m) => ({
          id: m.id,
          name: m.therapist.user.name,
          email: m.therapist.user.email,
          status: m.status,
          invitedAt: m.invitedAt,
          joinedAt: m.joinedAt,
        })),
      },
    });
  }

  const membership = await db.clinicMembership.findFirst({
    where: { therapistId: therapist.id, status: { in: ["invited", "active"] } },
    include: { clinic: { include: { owner: { include: { user: { select: { name: true } } } } } } },
  });

  if (membership) {
    return NextResponse.json({
      role: membership.status, // "invited" | "active"
      membership: {
        id: membership.id,
        clinicName: membership.clinic.name,
        ownerName: membership.clinic.owner.user.name,
        invitedAt: membership.invitedAt,
      },
    });
  }

  return NextResponse.json({ role: "none" });
}

const postSchema = z.object({ name: z.string().min(2).max(80) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await getTherapist(session.user.id);
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const existingOwned = await db.clinic.findUnique({ where: { ownerTherapistId: therapist.id } });
  if (existingOwned) return NextResponse.json({ error: "You already own a clinic" }, { status: 400 });

  const existingMembership = await db.clinicMembership.findFirst({
    where: { therapistId: therapist.id, status: { in: ["invited", "active"] } },
  });
  if (existingMembership) return NextResponse.json({ error: "You're already part of a clinic" }, { status: 400 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const clinic = await db.clinic.create({ data: { name: parsed.data.name, ownerTherapistId: therapist.id } });
  return NextResponse.json({ clinic });
}

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  includedSeats: z.number().int().min(1).optional(),
  extraSeatPriceCents: z.number().int().min(0).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await getTherapist(session.user.id);
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const owned = await db.clinic.findUnique({ where: { ownerTherapistId: therapist.id } });
  if (!owned) return NextResponse.json({ error: "You don't own a clinic" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const clinic = await db.clinic.update({ where: { id: owned.id }, data: parsed.data });
  return NextResponse.json({ clinic });
}
