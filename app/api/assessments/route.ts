import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifyOfRiskFlag } from "@/lib/notify";

const postSchema = z.object({
  assessmentId: z.string(),
  score: z.number().int().min(0),
  label: z.string(),
  answers: z.array(z.number()),
  safetyFlagged: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assessmentId = req.nextUrl.searchParams.get("assessmentId");
  const where = assessmentId
    ? { userId: session.user.id, assessmentId }
    : { userId: session.user.id };

  const results = await db.assessmentResult.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Return latest result per assessment type
  const latestByType: Record<string, typeof results[0]> = {};
  for (const r of results) {
    if (!latestByType[r.assessmentId]) latestByType[r.assessmentId] = r;
  }

  return NextResponse.json({ results, latest: latestByType });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await db.assessmentResult.create({
    data: { userId: session.user.id, ...parsed.data },
  });

  if (parsed.data.safetyFlagged) {
    await db.riskFlag.create({
      data: {
        userId: session.user.id, source: "assessment", sourceId: result.id,
        severity: "high", detail: `${parsed.data.assessmentId.toUpperCase()} assessment flagged a safety-relevant item.`,
      },
    });
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true, therapistId: true } });
    if (user) await notifyOfRiskFlag({ id: session.user.id, name: user.name, therapistId: user.therapistId }, `Assessment result may need review.`);
  }

  return NextResponse.json({ ok: true, result }, { status: 201 });
}
