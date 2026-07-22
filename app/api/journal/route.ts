import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { detectRisk } from "@/lib/riskDetection";
import { notifyOfRiskFlag } from "@/lib/notify";

const postSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  mood: z.number().int().min(1).max(5),
  emotions: z.array(z.string()).default([]),
  sleepQuality: z.number().int().min(1).max(5).optional(),
  triggers: z.array(z.string()).default([]),
  type: z.string().default("text"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50");
  const offset = parseInt(req.nextUrl.searchParams.get("offset") ?? "0");

  const [entries, total] = await Promise.all([
    db.journalEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.journalEntry.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ entries, total });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { title, content, mood, emotions, sleepQuality, triggers, type } = parsed.data;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  const entry = await db.journalEntry.create({
    data: { userId: session.user.id, title, content, mood, emotions, sleepQuality, triggers, type, wordCount },
  });

  const risk = detectRisk(`${title} ${content}`);
  if (risk) {
    await db.riskFlag.create({
      data: {
        userId: session.user.id, source: "journal", sourceId: entry.id,
        severity: risk.severity, detail: `Journal entry matched: "${risk.matched}"`,
      },
    });
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true, therapistId: true } });
    if (user) await notifyOfRiskFlag({ id: session.user.id, name: user.name, therapistId: user.therapistId }, `Journal entry may need review.`);
  }

  return NextResponse.json({ ok: true, entry }, { status: 201 });
}
