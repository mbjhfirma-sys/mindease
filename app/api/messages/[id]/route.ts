import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notify";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function formatAttachment(a: { id: string; name: string; size: number; mimeType: string; url: string }) {
  return { id: a.id, name: a.name, size: a.size, mimeType: a.mimeType, url: a.url };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, avatar: true } },
      therapist: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      messages: { orderBy: { createdAt: "asc" }, include: { attachment: true } },
    },
  });

  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = session.user.id;
  const isParticipant =
    conversation.clientId === userId ||
    conversation.therapist.userId === userId;
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Mark unread messages as read
  await db.message.updateMany({
    where: { conversationId: id, read: false, fromUserId: { not: userId } },
    data: { read: true },
  });

  const other =
    userId === conversation.clientId
      ? conversation.therapist.user
      : conversation.client;

  const formatted = {
    id: conversation.id,
    sender: other.name,
    avatar: other.avatar ?? other.name.slice(0, 2).toUpperCase(),
    messages: conversation.messages.map((m) => ({
      id: m.id,
      from: m.fromUserId === userId ? "me" : "them",
      text: m.text,
      time: new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      createdAt: m.createdAt,
      attachment: m.attachment ? formatAttachment(m.attachment) : null,
    })),
  };

  return NextResponse.json({ conversation: formatted });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const formData = await req.formData();
  const rawText = formData.get("text");
  const text = typeof rawText === "string" ? rawText.trim() : "";
  const file = formData.get("file");
  const hasFile = file instanceof File && file.size > 0;

  if (!text && !hasFile) return NextResponse.json({ error: "text or file is required" }, { status: 400 });

  if (hasFile) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "File storage is not configured (missing BLOB_READ_WRITE_TOKEN)" }, { status: 503 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File is too large (15MB max)" }, { status: 400 });
    }
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
  }

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      therapist: { select: { userId: true, user: { select: { name: true } } } },
    },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = session.user.id;
  const isParticipant =
    conversation.clientId === userId ||
    conversation.therapist.userId === userId;
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let blobUrl: string | null = null;
  if (hasFile) {
    const blob = await put(`messages/${id}/${Date.now()}-${file.name}`, file, { access: "public" });
    blobUrl = blob.url;
  }

  const message = await db.message.create({
    data: {
      conversationId: id,
      fromUserId: userId,
      text,
      ...(hasFile && blobUrl
        ? { attachment: { create: { name: file.name, size: file.size, mimeType: file.type || "application/octet-stream", url: blobUrl } } }
        : {}),
    },
    include: { attachment: true },
  });

  const senderIsClient = userId === conversation.clientId;
  const senderName = senderIsClient ? conversation.client.name : conversation.therapist.user.name;
  const recipientId = senderIsClient ? conversation.therapist.userId : conversation.client.id;
  const notificationBody = text || (hasFile ? `📎 ${file.name}` : "");
  await createNotification(recipientId, {
    title: `New message from ${senderName}`,
    body: notificationBody.slice(0, 140),
    icon: "💬",
    href: senderIsClient ? "/therapist/messages" : `/dashboard/messages?open=${id}`,
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    message: {
      id: message.id,
      from: "me",
      text: message.text,
      time: new Date(message.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      createdAt: message.createdAt,
      attachment: message.attachment ? formatAttachment(message.attachment) : null,
    },
  });
}
