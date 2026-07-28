import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureCourseRecommendation } from "@/lib/mindo/ensureCourseRecommendation";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT") return NextResponse.json({ recommendation: null });

  const result = await ensureCourseRecommendation(session.user.id);
  if (!result.enabled) return NextResponse.json({ recommendation: null });

  return NextResponse.json({ recommendation: result.recommendation });
}
