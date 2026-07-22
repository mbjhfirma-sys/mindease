import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";

const MAX_SIZE: Record<string, number> = {
  video: 300 * 1024 * 1024,
  audio: 60 * 1024 * 1024,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "File storage is not configured (missing BLOB_READ_WRITE_TOKEN)" }, { status: 503 });
  }

  const formData = await req.formData();
  const kind = formData.get("kind");
  const file = formData.get("file");

  if ((kind !== "video" && kind !== "audio") || !(file instanceof File)) {
    return NextResponse.json({ error: "kind ('video'|'audio') and file are required" }, { status: 400 });
  }

  if (!file.type.startsWith(`${kind}/`)) {
    return NextResponse.json({ error: `File must be a ${kind} file` }, { status: 400 });
  }

  if (file.size > MAX_SIZE[kind]) {
    return NextResponse.json({ error: `File exceeds the ${MAX_SIZE[kind] / (1024 * 1024)}MB limit for ${kind}` }, { status: 413 });
  }

  const blob = await put(`courses/${kind}/${Date.now()}-${file.name}`, file, { access: "public" });

  return NextResponse.json({ ok: true, url: blob.url }, { status: 201 });
}
