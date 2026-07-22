import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    include: {
      assignedTherapist: { select: { id: true, title: true, rating: true, user: { select: { name: true } } } },
      moodEntries: { orderBy: { createdAt: "desc" }, take: 30, select: { score: true, note: true, createdAt: true } },
      journalEntries: { orderBy: { createdAt: "desc" }, take: 50 },
      missionCompletions: {
        orderBy: { completedAt: "desc" },
        take: 50,
        select: { id: true, completedAt: true, responseData: true, mission: { select: { id: true, title: true, category: true, xp: true, activityType: true } } },
      },
      achievements: { orderBy: { earnedAt: "desc" } },
      courseEnrollments: { orderBy: { assignedAt: "desc" } },
      courseProgress: true,
      assessmentResults: { orderBy: { createdAt: "desc" }, take: 20 },
      clientAppointments: {
        orderBy: { date: "desc" },
        take: 50,
        select: { id: true, date: true, duration: true, type: true, status: true, notes: true, therapist: { select: { user: { select: { name: true } } } } },
      },
      communityPosts: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, content: true, createdAt: true, group: { select: { name: true } }, _count: { select: { likes: true, replies: true } } },
      },
      postReplies: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, content: true, postId: true, createdAt: true } },
      groupMemberships: { include: { group: { select: { name: true } } } },
      therapistGroupMemberships: { include: { group: { select: { name: true } } } },
      clinicalNotes: { orderBy: { date: "desc" }, include: { therapist: { select: { user: { select: { name: true } } } } } },
      treatmentPlans: { orderBy: { updatedAt: "desc" }, include: { therapist: { select: { user: { select: { name: true } } } } } },
      clientConversations: {
        include: {
          therapist: { select: { user: { select: { name: true } } } },
          messages: { orderBy: { createdAt: "asc" } },
        },
      },
      riskFlags: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!user || user.role !== "CLIENT") return NextResponse.json({ error: "User not found" }, { status: 404 });

  const courseIds = [...new Set(user.courseProgress.map((cp) => cp.courseId))];
  const courses = courseIds.length
    ? await db.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, title: true, lessonCount: true } })
    : [];
  const courseProgress = courses.map((c) => ({
    courseId: c.id,
    courseTitle: c.title,
    completedLessons: user.courseProgress.filter((cp) => cp.courseId === c.id && cp.completed).length,
    totalLessons: c.lessonCount,
  }));

  await db.adminAuditLog.create({
    data: { adminId: session.user.id, action: "user.viewed", targetType: "User", targetId: id },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan,
      phone: user.phone,
      dob: user.dob,
      timezone: user.timezone,
      language: user.language,
      xp: user.xp,
      level: user.level,
      createdAt: user.createdAt,
      twoFactorEnabled: user.twoFactorEnabled,
      hasOnboarded: user.hasOnboarded,
      clientCode: user.clientCode,
      assignedTherapist: user.assignedTherapist
        ? { id: user.assignedTherapist.id, title: user.assignedTherapist.title, rating: user.assignedTherapist.rating, name: user.assignedTherapist.user.name }
        : null,
      moodEntries: user.moodEntries,
      journalEntries: user.journalEntries,
      missionCompletions: user.missionCompletions,
      achievements: user.achievements,
      courseEnrollments: user.courseEnrollments,
      courseProgress,
      assessmentResults: user.assessmentResults,
      appointments: user.clientAppointments.map((a) => ({
        id: a.id, date: a.date, duration: a.duration, type: a.type, status: a.status, notes: a.notes,
        clientName: user.name, therapistName: a.therapist.user.name,
      })),
      communityPosts: user.communityPosts.map((p) => ({
        id: p.id, content: p.content, group: p.group?.name ?? null, likes: p._count.likes, replies: p._count.replies, createdAt: p.createdAt,
      })),
      postReplies: user.postReplies,
      groupMemberships: user.groupMemberships.map((m) => ({ id: m.id, groupName: m.group.name, joinedAt: m.joinedAt })),
      therapistGroupMemberships: user.therapistGroupMemberships.map((m) => ({ id: m.id, groupName: m.group.name, joinedAt: m.joinedAt })),
      clinicalNotes: user.clinicalNotes.map((n) => ({
        id: n.id, date: n.date, sessionType: n.sessionType, content: n.content, affect: n.affect,
        riskLevel: n.riskLevel, nextSteps: n.nextSteps, tags: n.tags, therapistName: n.therapist.user.name,
      })),
      treatmentPlans: user.treatmentPlans.map((p) => ({
        id: p.id, diagnosis: p.diagnosis, approach: p.approach, frequency: p.frequency,
        shortTermGoals: p.shortTermGoals, longTermGoals: p.longTermGoals, phase: p.phase,
        riskLevel: p.riskLevel, safetyPlan: p.safetyPlan, emergencyContacts: p.emergencyContacts,
        lastAssessed: p.lastAssessed, therapistName: p.therapist.user.name,
      })),
      conversations: user.clientConversations.map((c) => ({
        id: c.id,
        therapistName: c.therapist.user.name,
        messages: c.messages.map((m) => ({ id: m.id, from: m.fromUserId === user.id ? "user" : "other", text: m.text, createdAt: m.createdAt })),
      })),
      riskFlags: user.riskFlags.map((f) => ({
        id: f.id, source: f.source, severity: f.severity, detail: f.detail, status: f.status, createdAt: f.createdAt,
      })),
    },
  });
}
