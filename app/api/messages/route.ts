import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const userRole = (session.user as { role?: string }).role;

  const conversations = await db.conversation.findMany({
    where: userRole === "THERAPIST"
      ? { therapist: { userId } }
      : { clientId: userId },
    include: {
      client: { select: { id: true, name: true, avatar: true, role: true } },
      therapist: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { read: false, fromUserId: { not: userId } } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = conversations.map((c) => {
    const other = userRole === "THERAPIST" ? c.client : c.therapist.user;
    const lastMsg = c.messages[0];
    const unread = c._count.messages;
    return {
      id: c.id,
      otherId: other.id,
      sender: other.name,
      avatar: other.avatar ?? other.name.slice(0, 2).toUpperCase(),
      role: userRole === "THERAPIST" ? "Client" : "Therapist",
      preview: lastMsg?.text ?? "No messages yet",
      time: lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "",
      unread,
    };
  });

  return NextResponse.json({ conversations: formatted });
}
