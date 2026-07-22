import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const posts = await db.therapistGroupPost.findMany({
    where: { flagged: true },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
      group: { select: { name: true } },
    },
  });

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      author: p.author.name,
      group: p.group.name,
      content: p.content,
      createdAt: p.createdAt,
    })),
  });
}
