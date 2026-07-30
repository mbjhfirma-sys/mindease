import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("submit"),
    rating: z.number().int().min(1).max(5),
    wouldRecommend: z.boolean().optional(),
    comment: z.string().max(1000).optional(),
  }),
  z.object({ action: z.literal("skip") }),
]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const feedback = await db.matchFeedback.findUnique({ where: { id } });
  if (!feedback) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (feedback.respondentId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (feedback.status !== "pending") return NextResponse.json({ error: "Already responded" }, { status: 409 });

  const updated = parsed.data.action === "submit"
    ? await db.matchFeedback.update({
        where: { id },
        data: {
          status: "submitted",
          rating: parsed.data.rating,
          wouldRecommend: parsed.data.wouldRecommend,
          comment: parsed.data.comment,
          respondedAt: new Date(),
        },
      })
    : await db.matchFeedback.update({ where: { id }, data: { status: "skipped", respondedAt: new Date() } });

  return NextResponse.json({ ok: true, feedback: updated });
}
