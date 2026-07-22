import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const flags = await db.riskFlag.findMany({
    where: { status: "open", user: { therapistId: therapist.id } },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    flags: flags.map((f) => ({
      id: f.id, clientId: f.user.id, clientName: f.user.name, source: f.source,
      severity: f.severity, detail: f.detail, createdAt: f.createdAt,
    })),
  });
}
