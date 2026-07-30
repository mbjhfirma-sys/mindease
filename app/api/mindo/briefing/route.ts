import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureDailyBriefing } from "@/lib/mindo/ensureDailyBriefing";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await ensureDailyBriefing(session.user.id);
  if (!result.enabled) return NextResponse.json({ enabled: false });

  return NextResponse.json({
    enabled: true,
    briefingText: result.briefing.briefingText,
    date: result.briefing.date,
    facts: result.briefing.facts,
  });
}
