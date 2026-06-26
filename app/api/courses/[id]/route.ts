import { NextResponse } from "next/server";
import { courses, courseLessons } from "@/lib/mockData";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const course = courses.find((c) => c.id === id);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const lessons = courseLessons[id] ?? [];
  return NextResponse.json({ course, lessons, lessonCount: lessons.length });
}
