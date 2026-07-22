import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      moodEntries: true,
      journalEntries: true,
      missionCompletions: { include: { mission: { select: { title: true, category: true } } } },
      receivedMissions: { include: { mission: { select: { title: true, category: true } } } },
      assessmentResults: true,
      clientAppointments: { include: { therapist: { select: { user: { select: { name: true } } } } } },
      communityPosts: true,
      postReplies: true,
      postLikes: true,
      therapistGroupPosts: true,
      therapistGroupPostReplies: true,
      therapistGroupPostLikes: true,
      therapistGroupPostReplyLikes: true,
      groupMemberships: { include: { group: { select: { name: true } } } },
      therapistGroupMemberships: { include: { group: { select: { name: true } } } },
      challengeParticipations: true,
      courseProgress: true,
      courseEnrollments: true,
      clientConversations: {
        include: {
          messages: true,
          therapist: { select: { user: { select: { name: true } } } },
        },
      },
      notifications: true,
      safetyPlan: true,
      waitlistEntries: { include: { therapist: { select: { user: { select: { name: true } } } } } },
      achievements: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { password: _password, twoFactorSecret: _twoFactorSecret, ...safeUser } = user;

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      id: safeUser.id, name: safeUser.name, email: safeUser.email, role: safeUser.role,
      phone: safeUser.phone, dob: safeUser.dob, timezone: safeUser.timezone, language: safeUser.language,
      createdAt: safeUser.createdAt, plan: safeUser.plan, xp: safeUser.xp, level: safeUser.level,
    },
    moodEntries: safeUser.moodEntries,
    journalEntries: safeUser.journalEntries,
    missionCompletions: safeUser.missionCompletions,
    missionAssignments: safeUser.receivedMissions,
    assessmentResults: safeUser.assessmentResults,
    appointments: safeUser.clientAppointments,
    communityPosts: safeUser.communityPosts,
    communityPostReplies: safeUser.postReplies,
    communityPostLikes: safeUser.postLikes,
    therapistGroupPosts: safeUser.therapistGroupPosts,
    therapistGroupPostReplies: safeUser.therapistGroupPostReplies,
    therapistGroupPostLikes: safeUser.therapistGroupPostLikes,
    therapistGroupPostReplyLikes: safeUser.therapistGroupPostReplyLikes,
    groupMemberships: safeUser.groupMemberships,
    therapistGroupMemberships: safeUser.therapistGroupMemberships,
    challengeParticipations: safeUser.challengeParticipations,
    courseProgress: safeUser.courseProgress,
    courseEnrollments: safeUser.courseEnrollments,
    conversations: safeUser.clientConversations,
    notifications: safeUser.notifications,
    safetyPlan: safeUser.safetyPlan,
    waitlistEntries: safeUser.waitlistEntries,
    achievements: safeUser.achievements,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="youmindo-data-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
