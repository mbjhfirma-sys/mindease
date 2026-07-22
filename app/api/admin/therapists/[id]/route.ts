import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notify";

const schema = z.object({
  status: z.enum(["approved", "rejected", "pending"]),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const therapist = await db.therapist.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, avatar: true } },
      clients: {
        select: {
          id: true, name: true, email: true, avatar: true, plan: true, xp: true, level: true, createdAt: true,
          missionCompletions: { select: { id: true }, take: 1 },
        },
      },
      appointments: {
        orderBy: { date: "desc" },
        take: 50,
        select: { id: true, date: true, duration: true, type: true, status: true, notes: true, client: { select: { name: true } } },
      },
      groups: {
        select: { id: true, name: true, category: true, status: true, _count: { select: { memberships: true, posts: true } } },
      },
      missions: {
        select: { id: true, title: true, category: true, _count: { select: { completions: true } } },
      },
    },
  });

  if (!therapist) return NextResponse.json({ error: "Therapist not found" }, { status: 404 });

  const [clinicalNoteCount, treatmentPlanCount, courseEnrollmentCount] = await Promise.all([
    db.clinicalNote.count({ where: { therapistId: id } }),
    db.treatmentPlan.count({ where: { therapistId: id } }),
    db.courseEnrollment.count({ where: { therapistId: id } }),
  ]);

  await db.adminAuditLog.create({
    data: { adminId: session.user.id, action: "therapist.viewed", targetType: "Therapist", targetId: id },
  });

  return NextResponse.json({
    therapist: {
      id: therapist.id,
      name: therapist.user.name,
      email: therapist.user.email,
      avatar: therapist.user.avatar,
      title: therapist.title,
      bio: therapist.bio,
      approach: therapist.approach,
      specializations: therapist.specializations,
      education: therapist.education,
      languages: therapist.languages,
      licenseNumber: therapist.licenseNumber,
      yearsOfExperience: therapist.yearsOfExperience,
      rating: therapist.rating,
      verificationStatus: therapist.verificationStatus,
      verifiedAt: therapist.verifiedAt,
      createdAt: therapist.createdAt,
      clients: therapist.clients.map((c) => ({
        id: c.id, name: c.name, email: c.email, avatar: c.avatar, plan: c.plan, xp: c.xp, level: c.level, createdAt: c.createdAt,
        therapistId: therapist.id, therapistName: therapist.user.name,
        lastActivity: c.missionCompletions.length > 0 ? "recent" : "inactive",
      })),
      appointments: therapist.appointments.map((a) => ({
        id: a.id, date: a.date, duration: a.duration, type: a.type, status: a.status, notes: a.notes,
        clientName: a.client.name, therapistName: therapist.user.name,
      })),
      groups: therapist.groups.map((g) => ({
        id: g.id, name: g.name, category: g.category, memberCount: g._count.memberships, postCount: g._count.posts, status: g.status,
      })),
      missions: therapist.missions.map((m) => ({ id: m.id, title: m.title, category: m.category, completions: m._count.completions })),
      clinicalNoteCount,
      treatmentPlanCount,
      courseEnrollmentCount,
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const therapist = await db.therapist.findUnique({ where: { id } });
  if (!therapist) return NextResponse.json({ error: "Therapist not found" }, { status: 404 });

  const updated = await db.therapist.update({
    where: { id },
    data: {
      verificationStatus: parsed.data.status,
      verifiedAt: parsed.data.status === "approved" ? new Date() : null,
    },
  });

  await db.adminAuditLog.create({
    data: {
      adminId: session.user.id,
      action: `therapist.${parsed.data.status}`,
      targetType: "Therapist",
      targetId: id,
    },
  });

  if (parsed.data.status === "approved") {
    await createNotification(therapist.userId, {
      title: "Your account is verified",
      body: "Your therapist account has been verified. You can now be matched with clients.",
      icon: "✅",
      href: "/therapist",
    });
  } else if (parsed.data.status === "rejected") {
    await createNotification(therapist.userId, {
      title: "Your verification was not approved",
      body: "We weren't able to verify your therapist account at this time. Please contact support for details.",
      icon: "ℹ️",
      href: "/therapist-pending",
    });
  }

  return NextResponse.json({ ok: true, status: updated.verificationStatus });
}
