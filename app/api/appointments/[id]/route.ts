import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AppointmentStatus } from "@prisma/client";
import { createNotification } from "@/lib/notify";
import { recordSessionEarningForAppointment } from "@/lib/earnings";
import { getCancellationOutcome } from "@/lib/cancellationPolicy";
import { settleSessionCharge } from "@/lib/sessionSettlement";

const patchSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]).optional(),
  notes: z.string().optional(),
  date: z.string().datetime().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id;
  const userRole = session.user.role;

  const appt = await db.appointment.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      therapist: { select: { userId: true, user: { select: { name: true } } } },
    },
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isParticipant = appt.clientId === userId || appt.therapist.userId === userId;
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (userRole !== "THERAPIST") {
    if (parsed.data.notes !== undefined || parsed.data.date !== undefined) {
      return NextResponse.json({ error: "Clients can only cancel appointments" }, { status: 403 });
    }
    if (parsed.data.status && parsed.data.status !== "cancelled") {
      return NextResponse.json({ error: "Clients can only cancel appointments" }, { status: 403 });
    }
  }

  if (parsed.data.status === "confirmed") {
    const charge = await db.sessionCharge.findUnique({ where: { appointmentId: id } });
    if (charge && (charge.status === "requires_payment" || charge.status === "failed")) {
      return NextResponse.json({ error: "payment_required" }, { status: 403 });
    }
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.date) data.date = new Date(parsed.data.date);
  if (parsed.data.status) data.status = parsed.data.status as AppointmentStatus;

  const updated = await db.appointment.update({ where: { id }, data });

  if (parsed.data.status === "completed") {
    // A Premium free-credit session never pays the therapist through any channel — skip
    // the normal earnings ledger entirely rather than let it create a payable entry for a
    // session the client didn't pay for.
    const completedCharge = await db.sessionCharge.findUnique({ where: { appointmentId: id } });
    if (completedCharge?.fundingSource !== "premium_credit") {
      await recordSessionEarningForAppointment(id).catch(() => {});
    }
    await settleSessionCharge(id, "completed");
  } else if (parsed.data.status === "no_show") {
    await settleSessionCharge(id, "no_show");
  } else if (parsed.data.status === "cancelled") {
    // A therapist canceling (or declining a still-pending request) is unconditionally a
    // full refund/credit-release — the client didn't cause the disruption, so the notice
    // window that protects the therapist's calendar doesn't apply against them here.
    const outcome = userRole === "THERAPIST" || getCancellationOutcome(appt.date).isEligibleForRefund
      ? "early_cancellation"
      : "late_cancellation";
    await settleSessionCharge(id, outcome);
  }

  const isTherapist = userRole === "THERAPIST";
  const otherUserId = isTherapist ? appt.client.id : appt.therapist.userId;
  const actorName = isTherapist ? appt.therapist.user.name : appt.client.name;

  if (parsed.data.status) {
    const STATUS_LABEL: Record<string, string> = {
      confirmed: "confirmed", cancelled: "cancelled", completed: "marked complete", no_show: "marked as a no-show",
    };
    await createNotification(otherUserId, {
      title: `Session ${STATUS_LABEL[parsed.data.status] ?? "updated"}`,
      body: `${actorName} ${STATUS_LABEL[parsed.data.status] ?? "updated"} your session on ${new Date(updated.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
      icon: "📅",
      href: isTherapist ? "/dashboard/schedule" : "/therapist/appointments",
    }).catch(() => {});
  } else if (parsed.data.date) {
    await createNotification(otherUserId, {
      title: "Session rescheduled",
      body: `${actorName} rescheduled your session to ${new Date(updated.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${new Date(updated.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`,
      icon: "📅",
      href: isTherapist ? "/dashboard/schedule" : "/therapist/appointments",
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, appointment: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const appt = await db.appointment.findUnique({
    where: { id },
    include: { therapist: { select: { userId: true } } },
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role !== "THERAPIST") {
    return NextResponse.json({ error: "Only therapists can delete appointments" }, { status: 403 });
  }
  if (appt.therapist.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const charge = await db.sessionCharge.findUnique({ where: { appointmentId: id } });
  if (charge) {
    return NextResponse.json({ error: "This session has a payment on record — cancel it instead of deleting it." }, { status: 409 });
  }

  await db.appointment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
