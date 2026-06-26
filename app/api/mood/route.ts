import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const MOOD_LABELS: Record<number, string> = {
  1: "Very Low", 2: "Low", 3: "Okay", 4: "Good", 5: "Great",
};

const postSchema = z.object({
  score: z.number().int().min(1).max(5),
  note: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const entries = await db.moodEntry.findMany({
    where: { userId: session.user.id, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const entry = await db.moodEntry.create({
    data: {
      userId: session.user.id,
      score: parsed.data.score,
      label: MOOD_LABELS[parsed.data.score],
      note: parsed.data.note,
    },
  });

  return NextResponse.json({ ok: true, entry });
}
