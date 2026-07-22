import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const schema = z.object({
  action: z.enum(["unflag", "remove"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const post = await db.therapistGroupPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  if (parsed.data.action === "unflag") {
    await db.therapistGroupPost.update({ where: { id }, data: { flagged: false } });
    await db.adminAuditLog.create({
      data: { adminId: session.user.id, action: "post.unflagged", targetType: "TherapistGroupPost", targetId: id },
    });
    return NextResponse.json({ ok: true, status: "unflagged" });
  }

  await db.therapistGroupPost.delete({ where: { id } });
  await db.adminAuditLog.create({
    data: { adminId: session.user.id, action: "post.removed", targetType: "TherapistGroupPost", targetId: id },
  });

  return NextResponse.json({ ok: true, status: "removed" });
}
