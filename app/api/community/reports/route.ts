import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifyAdmins } from "@/lib/notify";

const schema = z.object({
  targetId:   z.string(),
  targetType: z.enum(["post", "reply"]),
  reason:     z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await db.communityReport.create({
    data: {
      targetId:   parsed.data.targetId,
      targetType: parsed.data.targetType,
      reporterId: session.user.id,
      reason:     parsed.data.reason,
    },
  });

  await notifyAdmins({
    title: "New content report",
    body: parsed.data.reason,
    href: "/admin/community",
  });

  return NextResponse.json({ ok: true });
}
