import { db } from "@/lib/db";

export async function createNotification(
  userId: string,
  data: { title: string; body: string; icon?: string; href?: string }
) {
  await db.notification.create({ data: { userId, ...data } });
}

export async function notifyAdmins(data: { title: string; body: string; icon?: string; href?: string }) {
  const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await Promise.all(admins.map((a) => createNotification(a.id, data)));
}

export async function notifyOfRiskFlag(user: { id: string; name: string; therapistId: string | null }, detail: string) {
  if (user.therapistId) {
    const therapist = await db.therapist.findUnique({ where: { id: user.therapistId }, select: { userId: true } });
    if (therapist) {
      await createNotification(therapist.userId, {
        title: `⚠️ Risk flag for ${user.name}`,
        body: detail,
        icon: "⚠️",
        href: "/therapist",
      });
      return;
    }
  }
  await notifyAdmins({
    title: `⚠️ Risk flag for ${user.name}`,
    body: `${detail} (no assigned therapist)`,
    icon: "⚠️",
    href: `/admin/users/${user.id}`,
  });
}
