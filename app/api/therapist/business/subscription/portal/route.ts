import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "THERAPIST") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapist = await db.therapist.findUnique({
    where: { userId: session.user.id },
    include: { billing: { select: { stripeCustomerId: true } } },
  });
  if (!therapist?.billing?.stripeCustomerId) return NextResponse.json({ error: "No billing account yet" }, { status: 400 });

  const origin = req.nextUrl.origin;
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: therapist.billing.stripeCustomerId,
    return_url: `${origin}/therapist/business/subscription`,
  });

  return NextResponse.json({ url: portalSession.url });
}
