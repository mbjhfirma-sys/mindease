import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createConnectAccountIfNeeded, createConnectOnboardingLink } from "@/lib/stripeConnect";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({ where: { userId: session.user.id } });
  if (!therapist) return NextResponse.json({ error: "Therapist profile not found" }, { status: 404 });

  const accountId = await createConnectAccountIfNeeded(therapist.id);
  const origin = req.nextUrl.origin;
  const url = await createConnectOnboardingLink(
    accountId,
    `${origin}/therapist/business`,
    `${origin}/therapist/business`
  );

  return NextResponse.json({ url });
}
