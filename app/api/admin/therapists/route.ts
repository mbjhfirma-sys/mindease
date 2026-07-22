import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const therapists = await db.therapist.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      licenseNumber: true,
      verificationStatus: true,
      verifiedAt: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({
    therapists: therapists.map((t) => ({
      id: t.id,
      name: t.user.name,
      email: t.user.email,
      title: t.title,
      licenseNumber: t.licenseNumber,
      status: t.verificationStatus,
      verifiedAt: t.verifiedAt,
      createdAt: t.createdAt,
    })),
  });
}
