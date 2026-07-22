import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET /api/therapist/missions/assign?missionId=xxx — which clients have this mission
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!therapist) return NextResponse.json({ error: "Therapist not found" }, { status: 404 });

  const missionId = req.nextUrl.searchParams.get("missionId");
  if (!missionId) return NextResponse.json({ error: "missionId required" }, { status: 400 });

  const assignments = await db.missionAssignment.findMany({
    where: { missionId },
    select: { clientId: true },
  });

  return NextResponse.json({ assignedClientIds: assignments.map((a) => a.clientId) });
}

// POST /api/therapist/missions/assign — assign a mission to clients
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({
    where: { userId: session.user.id },
    select: { id: true, clients: { select: { id: true } } },
  });
  if (!therapist) return NextResponse.json({ error: "Therapist not found" }, { status: 404 });

  const body = await req.json();
  const missionId: string = body.missionId;
  const clientIds: string[] = Array.isArray(body.clientIds) ? body.clientIds : [];

  if (!missionId) return NextResponse.json({ error: "missionId required" }, { status: 400 });

  // Verify the mission belongs to this therapist
  const mission = await db.mission.findUnique({ where: { id: missionId }, select: { therapistId: true } });
  if (!mission || mission.therapistId !== therapist.id) {
    return NextResponse.json({ error: "Mission not found or not yours" }, { status: 404 });
  }

  // Only allow assigning to own clients
  const ownClientIds = new Set(therapist.clients.map((c) => c.id));
  const validClientIds = clientIds.filter((id) => ownClientIds.has(id));

  // Remove all existing assignments for this mission, then re-create for the selected set
  await db.missionAssignment.deleteMany({ where: { missionId } });

  if (validClientIds.length > 0) {
    await db.missionAssignment.createMany({
      data: validClientIds.map((clientId) => ({ missionId, clientId })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ ok: true, assignedCount: validClientIds.length });
}
