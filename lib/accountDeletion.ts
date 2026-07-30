import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const PLACEHOLDER_EMAIL = "deleted-user@system.mindease.internal";

// Reassigning authorship (rather than deleting) preserves other people's replies/likes on
// this user's posts — CommunityPost/TherapistGroupPost/TherapistGroupPostReply all cascade
// on their required author relation, so deleting the post itself would take those with it.
export async function getOrCreateDeletedUserPlaceholder() {
  const existing = await db.user.findUnique({ where: { email: PLACEHOLDER_EMAIL } });
  if (existing) return existing;

  const unusablePassword = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
  return db.user.create({
    data: {
      email: PLACEHOLDER_EMAIL,
      name: "Deleted user",
      password: unusablePassword,
      role: "CLIENT",
      hasOnboarded: true,
    },
  });
}

// Engagement rows (likes) are left to cascade-delete as today — they're signals about the
// deleted user, not content someone else's context depends on existing.
export async function anonymizeUserContent(userId: string, placeholderId: string) {
  await db.communityPost.updateMany({ where: { userId }, data: { userId: placeholderId } });
  await db.postReply.updateMany({ where: { userId }, data: { userId: placeholderId } });
  await db.therapistGroupPost.updateMany({ where: { authorId: userId }, data: { authorId: placeholderId } });
  await db.therapistGroupPostReply.updateMany({ where: { authorId: userId }, data: { authorId: placeholderId } });
}

export async function deleteUserAccount(userId: string, opts: { anonymizeCommunityContent: boolean }) {
  if (opts.anonymizeCommunityContent) {
    const placeholder = await getOrCreateDeletedUserPlaceholder();
    await anonymizeUserContent(userId, placeholder.id);
  }
  await db.user.delete({ where: { id: userId } });
}
