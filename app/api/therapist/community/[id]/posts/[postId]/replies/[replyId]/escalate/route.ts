import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifyOfRiskFlag } from "@/lib/notify";
import { ensureRiskStepUpWindow } from "@/lib/riskStepUp";

const escalateSchema = z.object({
  severity: z.enum(["high", "moderate"]),
  note: z.string().max(500).optional(),
});

function excerpt(text: string, max = 140): string {
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

// POST — a therapist escalates a reply (the only client-authored content in a
// community thread — top-level posts are always therapist-authored) to the
// individual risk-review queue. Replies have no `flagged` column in the schema,
// so escalation here lives entirely as a RiskFlag cross-reference.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string; replyId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: groupId, postId, replyId } = await params;
  const group = await db.therapistGroup.findUnique({
    where: { id: groupId },
    include: { therapist: { select: { userId: true } } },
  });
  if (!group || group.therapist.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reply = await db.therapistGroupPostReply.findUnique({ where: { id: replyId } });
  if (!reply || reply.postId !== postId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = escalateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const detail = parsed.data.note?.trim() || `Escalated from a reply in "${group.name}": "${excerpt(reply.content)}"`;

  const existing = await db.riskFlag.findFirst({
    where: { source: "community", sourceId: reply.id, status: "open" },
  });

  const flag = existing
    ? await db.riskFlag.update({ where: { id: existing.id }, data: { severity: parsed.data.severity, detail } })
    : await db.riskFlag.create({
        data: { userId: reply.authorId, source: "community", sourceId: reply.id, severity: parsed.data.severity, detail },
      });

  await ensureRiskStepUpWindow(flag);

  // Community escalation previously created a RiskFlag with no notification at all —
  // fixed here. Skip notifying if the flagged author is the escalating therapist
  // themselves (they just took this action; don't self-notify).
  if (reply.authorId !== session.user.id) {
    const flaggedUser = await db.user.findUnique({ where: { id: reply.authorId }, select: { name: true, therapistId: true } });
    if (flaggedUser) {
      await notifyOfRiskFlag({ id: reply.authorId, name: flaggedUser.name, therapistId: flaggedUser.therapistId }, detail, parsed.data.severity);
    }
  }

  return NextResponse.json({ ok: true, flag });
}
