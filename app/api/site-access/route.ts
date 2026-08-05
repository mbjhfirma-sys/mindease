import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const accessCode = process.env.SITE_ACCESS_CODE;
  if (!accessCode) {
    return NextResponse.json({ error: "Access isn't configured yet." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const submitted = typeof body?.code === "string" ? body.code.trim() : "";
  if (submitted !== accessCode) {
    return NextResponse.json({ error: "That code isn't right." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("site_access", accessCode, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
