import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "video/mp4", "video/webm", "video/quicktime",
  "audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/webm",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const formData = await req.formData();
  const postId = formData.get("postId");
  const postSource = formData.get("postSource");
  const file = formData.get("file");

  if (typeof postId !== "string" || !postId) return NextResponse.json({ error: "postId is required" }, { status: 400 });
  if (postSource !== "support" && postSource !== "therapist") return NextResponse.json({ error: "Invalid postSource" }, { status: 400 });
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "file is required" }, { status: 400 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "File storage is not configured (missing BLOB_READ_WRITE_TOKEN)" }, { status: 503 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File is too large (15MB max)" }, { status: 400 });
  }
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  // Only the post's own author can attach to it — the compose flow always uploads
  // immediately after creating the post, so this never needs to support later edits.
  if (postSource === "therapist") {
    const post = await db.therapistGroupPost.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (post.authorId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const blob = await put(`community-posts/${postId}/${Date.now()}-${file.name}`, file, { access: "public" });
    const attachment = await db.therapistGroupPostAttachment.create({
      data: { postId, name: file.name, size: file.size, mimeType: file.type || "application/octet-stream", url: blob.url },
    });
    return NextResponse.json({ ok: true, attachment }, { status: 201 });
  }

  const post = await db.communityPost.findUnique({ where: { id: postId }, select: { userId: true } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (post.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const blob = await put(`community-posts/${postId}/${Date.now()}-${file.name}`, file, { access: "public" });
  const attachment = await db.communityPostAttachment.create({
    data: { postId, name: file.name, size: file.size, mimeType: file.type || "application/octet-stream", url: blob.url },
  });
  return NextResponse.json({ ok: true, attachment }, { status: 201 });
}
