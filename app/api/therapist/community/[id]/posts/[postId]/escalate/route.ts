import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const escalateSchema = z.object({
  severity: z.enum(["high", "moderate"]),
  note: z.string().max(500).optional(),
});

function excerpt(text: string, max = 140): string {
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

// POST — a therapist escalates a community post to the individual risk-review queue
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: groupId, postId } = await params;
  const group = await db.therapistGroup.findUnique({
    where: { id: groupId },
    include: { therapist: { select: { id: true, userId: true } } },
  });
  if (!group || group.therapist.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const post = await db.therapistGroupPost.findUnique({ where: { id: postId } });
  if (!post || post.groupId !== groupId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = escalateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const detail = parsed.data.note?.trim() || `Escalated from a post in "${group.name}": "${excerpt(post.content)}"`;

  const existing = await db.riskFlag.findFirst({
    where: { source: "community", sourceId: post.id, status: "open" },
  });

  const [flag] = await Promise.all([
    existing
      ? db.riskFlag.update({ where: { id: existing.id }, data: { severity: parsed.data.severity, detail } })
      : db.riskFlag.create({
          data: { userId: post.authorId, source: "community", sourceId: post.id, severity: parsed.data.severity, detail },
        }),
    db.therapistGroupPost.update({ where: { id: postId }, data: { flagged: true } }),
  ]);

  return NextResponse.json({ ok: true, flag });
}
