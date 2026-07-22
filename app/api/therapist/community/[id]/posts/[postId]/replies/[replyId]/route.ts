import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const likeSchema = z.object({
  action: z.enum(["like", "unlike"]),
});

async function getTherapistUserId(groupId: string) {
  const g = await db.therapistGroup.findUnique({
    where: { id: groupId },
    include: { therapist: { select: { userId: true } } },
  });
  return g?.therapist.userId ?? null;
}

// PATCH — like/unlike a reply (any member or the owning therapist)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string; replyId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId, postId, replyId } = await params;
  const reply = await db.therapistGroupPostReply.findUnique({ where: { id: replyId } });
  if (!reply || reply.postId !== postId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = likeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const userId = session.user.id;
  const therapistUserId = await getTherapistUserId(groupId);
  if (userId !== therapistUserId) {
    const member = await db.therapistGroupMembership.findUnique({
      where: { groupId_clientId: { groupId, clientId: userId } },
    });
    if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  if (parsed.data.action === "like") {
    await db.therapistGroupPostReplyLike.upsert({
      where: { replyId_userId: { replyId, userId } },
      update: {},
      create: { replyId, userId },
    });
  } else {
    await db.therapistGroupPostReplyLike.deleteMany({ where: { replyId, userId } });
  }

  return NextResponse.json({ ok: true });
}
