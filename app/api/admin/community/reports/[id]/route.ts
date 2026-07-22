import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const schema = z.object({
  action: z.enum(["dismiss", "remove"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const report = await db.communityReport.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  if (parsed.data.action === "dismiss") {
    await db.communityReport.update({ where: { id }, data: { status: "dismissed" } });
    await db.adminAuditLog.create({
      data: { adminId: session.user.id, action: "report.dismissed", targetType: "CommunityReport", targetId: id },
    });
    return NextResponse.json({ ok: true, status: "dismissed" });
  }

  // action === "remove" — delete the underlying content. The report's targetId may point
  // at a plain community post/reply OR a therapist-group post/reply (see the GET route for
  // why); try the plain table first, then the therapist-group table. Already-gone is fine.
  if (report.targetType === "post") {
    const deleted = await db.communityPost.deleteMany({ where: { id: report.targetId } });
    if (deleted.count === 0) {
      await db.therapistGroupPost.deleteMany({ where: { id: report.targetId } });
    }
  } else if (report.targetType === "reply") {
    const deleted = await db.postReply.deleteMany({ where: { id: report.targetId } });
    if (deleted.count === 0) {
      await db.therapistGroupPostReply.deleteMany({ where: { id: report.targetId } });
    }
  }

  await db.communityReport.update({ where: { id }, data: { status: "resolved" } });
  await db.adminAuditLog.create({
    data: { adminId: session.user.id, action: "report.content_removed", targetType: "CommunityReport", targetId: id },
  });

  return NextResponse.json({ ok: true, status: "resolved" });
}
