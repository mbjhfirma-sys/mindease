import { db } from "@/lib/db";
import { planById } from "@/lib/clientPlans";

// A therapist assigning a specific course to their client is a clinical decision and
// bypasses the Free-tier restriction — a client's subscription tier should never block
// their own therapist from assigning them any published course.
export async function canAccessCourse(
  userId: string,
  plan: string,
  course: { id: string; isFreeTier: boolean }
): Promise<boolean> {
  if (planById(plan).features.fullCourseLibrary) return true;
  if (course.isFreeTier) return true;
  const assigned = await db.courseEnrollment.findFirst({ where: { clientId: userId, courseId: course.id } });
  return assigned != null;
}
