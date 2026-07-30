import { db } from "@/lib/db";

type GroupSessionWithGroup = Awaited<ReturnType<typeof loadGroupSession>>;

async function loadGroupSession(groupSessionId: string) {
  return db.groupSession.findUnique({
    where: { id: groupSessionId },
    include: { therapistGroup: { select: { id: true } } },
  });
}

export type AuthorizedGroupSession =
  | { ok: true; session: NonNullable<GroupSessionWithGroup>; isHost: boolean }
  | { ok: false; status: 404 | 403 };

export async function authorizeGroupSessionParticipant(groupSessionId: string, userId: string): Promise<AuthorizedGroupSession> {
  const session = await loadGroupSession(groupSessionId);
  if (!session) return { ok: false, status: 404 };

  const isHost = session.hostUserId === userId;
  if (isHost) return { ok: true, session, isHost: true };

  const membership = await db.therapistGroupMembership.findUnique({
    where: { groupId_clientId: { groupId: session.therapistGroupId, clientId: userId } },
  });
  if (!membership) return { ok: false, status: 403 };

  return { ok: true, session, isHost: false };
}
