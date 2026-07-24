import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getMindoChatHistory, sendMindoChatMessage } from "@/lib/mindo/chat";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await getMindoChatHistory(session.user.id);
  return NextResponse.json({ messages });
}

const postSchema = z.object({ message: z.string().min(1).max(4000) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { reply } = await sendMindoChatMessage(session.user.id, parsed.data.message);
  return NextResponse.json({ reply });
}
