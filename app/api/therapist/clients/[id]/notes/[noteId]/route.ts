import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId, noteId } = await params;
  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Not a therapist" }, { status: 403 });

  const note = await db.clinicalNote.findUnique({ where: { id: noteId } });
  if (!note || note.therapistId !== therapist.id || note.clientId !== clientId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.clinicalNote.delete({ where: { id: noteId } });
  return NextResponse.json({ ok: true });
}
