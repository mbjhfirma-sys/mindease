import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ requires2FA: false });

  const user = await db.user.findUnique({ where: { email: parsed.data.email }, select: { twoFactorEnabled: true } });
  return NextResponse.json({ requires2FA: user?.twoFactorEnabled ?? false });
}
