import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  dob: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  avatar: z.string().optional(),
  plan: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, role: true, avatar: true,
      plan: true, phone: true, dob: true, timezone: true, language: true,
      createdAt: true,
      assignedTherapist: {
        include: { user: { select: { name: true, avatar: true } } },
      },
      therapistProfile: { select: { id: true, title: true, specializations: true, rating: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = { ...parsed.data } as Record<string, unknown>;
  if (parsed.data.dob) data.dob = new Date(parsed.data.dob);

  const user = await db.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true, name: true, email: true, role: true, avatar: true,
      plan: true, phone: true, dob: true, timezone: true, language: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}
