import { NextResponse } from "next/server";
import { courses } from "@/lib/mockData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.toLowerCase();

  let result = courses;
  if (category && category !== "All") {
    result = result.filter((c) => c.category === category);
  }
  if (q) {
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({ courses: result, total: result.length });
}
