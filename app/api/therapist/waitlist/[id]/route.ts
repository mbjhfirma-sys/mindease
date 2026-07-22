import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notify";

const schema = z.object({ action: z.enum(["accept", "decline"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const entry = await db.waitlistEntry.findUnique({ where: { id }, include: { user: { select: { id: true, name: true, therapistId: true } } } });
  if (!entry || entry.therapistId !== therapist.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.status !== "waiting") return NextResponse.json({ error: "Already resolved" }, { status: 409 });

  if (parsed.data.action === "accept") {
    if (entry.user.therapistId) {
      return NextResponse.json({ error: "This client is already assigned to a therapist" }, { status: 409 });
    }
    await db.user.update({ where: { id: entry.user.id }, data: { therapistId: therapist.id } });
    await db.waitlistEntry.updateMany({ where: { userId: entry.user.id, status: "waiting" }, data: { status: "resolved" } });
    await createNotification(entry.user.id, {
      title: "You've been matched with a therapist",
      body: "Your waitlist request was accepted — you can now message and book sessions.",
      icon: "🤝",
      href: "/dashboard/my-therapist",
    });
  } else {
    await db.waitlistEntry.update({ where: { id }, data: { status: "resolved" } });
  }

  return NextResponse.json({ ok: true });
}
