import { db } from "@/lib/db";

export type CommunityFacts = {
  scope: "overview" | "group";
  scopeName: string;
  groupCount: number;
  memberCount: number;
  postsThisWeek: number;
  repliesThisWeek: number;
  flaggedOpenCount: number;
  mostActiveMemberName: string | null;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// therapistUserId excludes the therapist's own replies from "most active member" —
// top-level posts are always therapist-authored (schema-enforced), so only replies
// can ever surface a client's name here.
export async function computeCommunityFacts(
  therapistId: string,
  therapistUserId: string,
  groupId?: string
): Promise<CommunityFacts> {
  const weekAgo = new Date(Date.now() - WEEK_MS);

  const groups = await db.therapistGroup.findMany({
    where: groupId ? { id: groupId, therapistId } : { therapistId },
    select: { id: true, name: true },
  });
  const groupIds = groups.map((g) => g.id);

  if (groupIds.length === 0) {
    return {
      scope: groupId ? "group" : "overview",
      scopeName: groupId ? "This community" : "Your communities",
      groupCount: 0,
      memberCount: 0,
      postsThisWeek: 0,
      repliesThisWeek: 0,
      flaggedOpenCount: 0,
      mostActiveMemberName: null,
    };
  }

  const [memberships, postsThisWeekCount, flaggedOpenCount, weekReplies] = await Promise.all([
    db.therapistGroupMembership.findMany({ where: { groupId: { in: groupIds } }, select: { clientId: true } }),
    db.therapistGroupPost.count({ where: { groupId: { in: groupIds }, createdAt: { gte: weekAgo } } }),
    db.therapistGroupPost.count({ where: { groupId: { in: groupIds }, flagged: true } }),
    db.therapistGroupPostReply.findMany({
      where: { post: { groupId: { in: groupIds } }, createdAt: { gte: weekAgo } },
      select: { authorId: true },
    }),
  ]);

  const memberCount = new Set(memberships.map((m) => m.clientId)).size;

  const replyCountByAuthor = new Map<string, number>();
  for (const r of weekReplies) {
    if (r.authorId === therapistUserId) continue;
    replyCountByAuthor.set(r.authorId, (replyCountByAuthor.get(r.authorId) ?? 0) + 1);
  }

  let mostActiveMemberName: string | null = null;
  if (replyCountByAuthor.size > 0) {
    const [topAuthorId] = [...replyCountByAuthor.entries()].sort((a, b) => b[1] - a[1])[0];
    const author = await db.user.findUnique({ where: { id: topAuthorId }, select: { name: true } });
    mostActiveMemberName = author?.name ?? null;
  }

  const scopeName = groupId
    ? groups[0].name
    : groups.length === 1
    ? groups[0].name
    : `your ${groups.length} communities`;

  return {
    scope: groupId ? "group" : "overview",
    scopeName,
    groupCount: groups.length,
    memberCount,
    postsThisWeek: postsThisWeekCount,
    repliesThisWeek: weekReplies.length,
    flaggedOpenCount,
    mostActiveMemberName,
  };
}
