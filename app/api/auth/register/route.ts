import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { notifyAdmins } from "@/lib/notify";
import { PROFESSION_TYPES, type ProfessionTypeId } from "@/lib/professionTypes";

const PROFESSION_TYPE_IDS = PROFESSION_TYPES.map((p) => p.id) as [ProfessionTypeId, ...ProfessionTypeId[]];

const schema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["CLIENT", "THERAPIST"]).default("CLIENT"),
    title: z.string().optional(),
    therapistCode: z.string().optional(),
    professionType: z.enum(PROFESSION_TYPE_IDS).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "THERAPIST" && !data.professionType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select your profession",
        path: ["professionType"],
      });
    }
  });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, password, role, title, therapistCode, professionType } = parsed.data;

  // A matching code approves a therapist instantly; otherwise they still get
  // an account, but sit as "pending" until the YouMindo team reviews them.
  const requiredCode = process.env.THERAPIST_REGISTRATION_CODE;
  const codeMatches = Boolean(requiredCode) && therapistCode === requiredCode;

  const hashed = await bcrypt.hash(password, 12);

  try {
    const user = await db.user.create({
      data: { name, email, password: hashed, role, hasSeenClientTour: role === "CLIENT" ? false : undefined },
      select: { id: true, name: true, email: true, role: true },
    });

    if (role === "THERAPIST") {
      await db.therapist.create({
        data: {
          userId: user.id,
          title: title?.trim() || "Licensed Therapist",
          specializations: [],
          professionType,
          profileCompleted: false,
          verificationStatus: codeMatches ? "approved" : "pending",
          verifiedAt: codeMatches ? new Date() : null,
        },
      });

      if (!codeMatches) {
        await notifyAdmins({
          title: "New therapist pending review",
          body: `${name} signed up as a therapist`,
          href: "/admin/therapists",
        });
      }
    }

    return NextResponse.json({ user, pendingReview: role === "THERAPIST" && !codeMatches }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    throw err;
  }
}
