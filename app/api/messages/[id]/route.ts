import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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
      messages: { orderBy: { createdAt: "asc" } },
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
  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "text is required" }, { status: 400 });

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: { therapist: { select: { userId: true } } },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = session.user.id;
  const isParticipant =
    conversation.clientId === userId ||
    conversation.therapist.userId === userId;
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const message = await db.message.create({
    data: { conversationId: id, fromUserId: userId, text: text.trim() },
  });

  return NextResponse.json({
    ok: true,
    message: {
      id: message.id,
      from: "me",
      text: message.text,
      time: new Date(message.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      createdAt: message.createdAt,
    },
  });
}
