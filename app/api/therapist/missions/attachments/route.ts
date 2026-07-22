import { NextRequest, NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function requireOwnedMission(therapistId: string, missionId: string) {
  const mission = await db.mission.findUnique({ where: { id: missionId } });
  if (!mission || mission.therapistId !== therapistId) return null;
  return mission;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "File storage is not configured (missing BLOB_READ_WRITE_TOKEN)" }, { status: 503 });
  }

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const formData = await req.formData();
  const missionId = formData.get("missionId");
  const file = formData.get("file");
  if (typeof missionId !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "missionId and file are required" }, { status: 400 });
  }

  const mission = await requireOwnedMission(therapist.id, missionId);
  if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 });

  const blob = await put(`missions/${missionId}/${Date.now()}-${file.name}`, file, { access: "public" });

  const attachment = await db.missionAttachment.create({
    data: { missionId, name: file.name, size: file.size, mimeType: file.type || "application/octet-stream", url: blob.url },
  });

  return NextResponse.json({ ok: true, attachment }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const body = await req.json();
  const attachmentId = typeof body.attachmentId === "string" ? body.attachmentId : "";
  if (!attachmentId) return NextResponse.json({ error: "attachmentId is required" }, { status: 400 });

  const attachment = await db.missionAttachment.findUnique({ where: { id: attachmentId }, include: { mission: true } });
  if (!attachment || attachment.mission.therapistId !== therapist.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await del(attachment.url).catch(() => {});
  }
  await db.missionAttachment.delete({ where: { id: attachmentId } });

  return NextResponse.json({ ok: true });
}
