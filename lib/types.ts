// ── Utility helpers ────────────────────────────────────────────────────────────

export type InferType<T> = T extends Promise<infer U> ? U : T;

export type Role = "CLIENT" | "THERAPIST" | "ADMIN";

// ── API response wrappers ──────────────────────────────────────────────────────

export type ApiOk<T = Record<string, never>> = { ok: true } & T;
export type ApiError = { error: string | Record<string, unknown> };
export type ApiResponse<T = Record<string, never>> = ApiOk<T> | ApiError;

// ── User / Auth ───────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  image?: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  plan: string;
  phone: string | null;
  dob: string | null;
  timezone: string;
  language: string;
  xp: number;
  level: number;
  createdAt: string;
  assignedTherapist?: {
    id: string;
    title: string;
    specializations: string[];
    rating: number;
    user: { name: string; avatar: string | null };
  } | null;
  therapistProfile?: {
    id: string;
    title: string;
    specializations: string[];
    rating: number;
  } | null;
}

// ── Mood ──────────────────────────────────────────────────────────────────────

export interface MoodEntry {
  id: string;
  score: number;
  label: string;
  note: string | null;
  createdAt: string;
}

// ── Journal ───────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: number;
  emotions: string[];
  wordCount: number;
  type: string;
  createdAt: string;
  updatedAt: string;
}

// ── Safety Plan ───────────────────────────────────────────────────────────────

export interface SafetyPlanContact {
  name: string;
  phone?: string;
  note?: string;
}

export interface SafetyPlan {
  warningSigns: string[];
  copingStrategies: string[];
  distractionContacts: SafetyPlanContact[];
  supportContacts: SafetyPlanContact[];
  professionalContacts: SafetyPlanContact[];
  safeEnvironmentSteps: string[];
  sharedWithTherapist: boolean;
}

// ── Missions ──────────────────────────────────────────────────────────────────

export interface MissionItem {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  xp: number;
  recurring: boolean;
  completed: boolean;
  therapistId: string | null;
}

// ── Achievements ──────────────────────────────────────────────────────────────

export interface AchievementStats {
  streak: number;
  moodEntries: number;
  journalEntries: number;
  missionsCompleted: number;
  lessonsCompleted: number;
}

// ── Courses ───────────────────────────────────────────────────────────────────

export interface CourseProgressState {
  courseId: string | null;
  completedLessonIds: string[];
  lastLessonId: string | null;
}

// ── Assessments ───────────────────────────────────────────────────────────────

export interface AssessmentResultItem {
  id: string;
  assessmentId: string;
  score: number;
  label: string;
  answers: number[];
  safetyFlagged: boolean;
  createdAt: string;
}

// ── Community (client support groups) ────────────────────────────────────────

export interface SupportGroupItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  nextSession: string | null;
  members: number;
  joined: boolean;
}

export interface CommunityPostItem {
  id: string;
  author: string;
  avatar: string;
  group: string | null;
  content: string;
  time: string;
  likes: number;
  replies: number;
  liked: boolean;
  createdAt: string;
}

export interface PostReplyItem {
  id: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
}

// ── Therapist communities ─────────────────────────────────────────────────────

export type CommunityPrivacy = "open" | "invite";
export type CommunityStatus = "active" | "archived";

export interface TherapistGroupItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string;
  privacy: CommunityPrivacy;
  status: CommunityStatus;
  memberCount: number;
  postCount: number;
  createdAt: string;
  isOwner: boolean;
}

export interface TherapistGroupPostItem {
  id: string;
  groupId: string;
  author: string;
  authorId: string;
  content: string;
  pinned: boolean;
  flagged: boolean;
  likes: number;
  liked: boolean;
  replyCount: number;
  createdAt: string;
}

export interface TherapistGroupPostReplyItem {
  id: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface TherapistGroupInviteItem {
  clientId: string;
  clientName: string;
  sentAt: string;
  accepted: boolean;
}

// ── Therapist portal ──────────────────────────────────────────────────────────

export interface TherapistClient {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  plan: string;
  xp: number;
  level: number;
  joinedAt: string;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface AdminTherapistItem {
  id: string;
  name: string;
  email: string;
  title: string;
  licenseNumber: string | null;
  status: "pending" | "approved" | "rejected";
  verifiedAt: string | null;
  createdAt: string;
}

export interface AdminReportItem {
  id: string;
  reporter: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  preview: string | null;
  author: string | null;
  createdAt: string;
}

export interface AdminFlaggedPostItem {
  id: string;
  author: string;
  group: string;
  content: string;
  createdAt: string;
}

export interface AdminStats {
  users: { total: number; clients: number; therapists: number; admins: number; newLast7d: number };
  therapists: { total: number; pending: number; approved: number; rejected: number };
  community: { openReports: number; flaggedPosts: number; totalPosts: number };
  safety: { openRiskFlags: number };
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  plan: string;
  xp: number;
  level: number;
  createdAt: string;
  therapistId: string | null;
  therapistName: string | null;
  lastActivity: "recent" | "inactive";
}

export interface AdminAppointmentItem {
  id: string;
  date: string;
  duration: number;
  type: string;
  status: string;
  notes: string | null;
  clientName: string;
  therapistName: string;
}

export interface AdminMissionCompletionItem {
  id: string;
  completedAt: string;
  responseData: Record<string, unknown> | null;
  mission: { id: string; title: string; category: string; xp: number; activityType: string };
}

export interface AdminCourseProgressSummary {
  courseId: string;
  courseTitle: string;
  completedLessons: number;
  totalLessons: number;
}

export interface AdminClinicalNoteItem {
  id: string;
  date: string;
  sessionType: string;
  content: string;
  affect: string | null;
  riskLevel: string;
  nextSteps: string | null;
  tags: string[];
  therapistName: string;
}

export interface AdminTreatmentPlanItem {
  id: string;
  diagnosis: string;
  approach: string;
  frequency: string;
  shortTermGoals: string;
  longTermGoals: string;
  phase: string;
  riskLevel: string;
  safetyPlan: boolean;
  emergencyContacts: boolean;
  lastAssessed: string | null;
  therapistName: string;
}

export interface AdminConversationMessageItem {
  id: string;
  from: "user" | "other";
  text: string;
  createdAt: string;
}

export interface AdminConversationItem {
  id: string;
  therapistName: string;
  messages: AdminConversationMessageItem[];
}

export interface AdminRiskFlagItem {
  id: string;
  source: string;
  severity: "high" | "moderate";
  detail: string;
  status: "open" | "acknowledged";
  createdAt: string;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  plan: string;
  phone: string | null;
  dob: string | null;
  timezone: string;
  language: string;
  xp: number;
  level: number;
  createdAt: string;
  twoFactorEnabled: boolean;
  hasOnboarded: boolean;
  clientCode: string | null;
  assignedTherapist: { id: string; title: string; rating: number; name: string } | null;
  moodEntries: { score: number; note: string | null; createdAt: string }[];
  journalEntries: JournalEntry[];
  missionCompletions: AdminMissionCompletionItem[];
  achievements: { id: string; badgeId: string; earnedAt: string }[];
  courseEnrollments: { id: string; courseName: string; status: string; assignedAt: string }[];
  courseProgress: AdminCourseProgressSummary[];
  assessmentResults: AssessmentResultItem[];
  appointments: AdminAppointmentItem[];
  communityPosts: { id: string; content: string; group: string | null; likes: number; replies: number; createdAt: string }[];
  postReplies: { id: string; content: string; postId: string; createdAt: string }[];
  groupMemberships: { id: string; groupName: string; joinedAt: string }[];
  therapistGroupMemberships: { id: string; groupName: string; joinedAt: string }[];
  clinicalNotes: AdminClinicalNoteItem[];
  treatmentPlans: AdminTreatmentPlanItem[];
  conversations: AdminConversationItem[];
  riskFlags: AdminRiskFlagItem[];
}

export interface AdminTherapistDetail {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  title: string;
  bio: string | null;
  approach: string | null;
  specializations: string[];
  education: string[];
  languages: string[];
  licenseNumber: string | null;
  yearsOfExperience: number | null;
  rating: number;
  verificationStatus: "pending" | "approved" | "rejected";
  verifiedAt: string | null;
  createdAt: string;
  clients: AdminUserItem[];
  appointments: AdminAppointmentItem[];
  groups: { id: string; name: string; category: string; memberCount: number; postCount: number; status: string }[];
  missions: { id: string; title: string; category: string; completions: number }[];
  clinicalNoteCount: number;
  treatmentPlanCount: number;
  courseEnrollmentCount: number;
}

export type AdminLessonType = "video" | "quiz" | "reflection" | "exercise" | "audio";

export interface AdminCourseItem {
  id: string;
  title: string;
  instructor: string;
  category: string;
  level: string;
  tags: string[];
  enrolled: number;
  description: string | null;
  duration: string | null;
  rating: number;
  thumbnail: string | null;
  color: string | null;
  published: boolean;
  lessonCount: number;
  createdAt: string;
}

export interface AdminQuizQuestionItem {
  id: string;
  order: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface AdminLessonItem {
  id: string;
  courseId: string;
  module: string;
  order: number;
  title: string;
  type: AdminLessonType;
  duration: string;
  content: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  exerciseType: string | null;
  questions: AdminQuizQuestionItem[];
}

export interface AdminCourseDetail extends AdminCourseItem {
  lessons: AdminLessonItem[];
}

// ── Appointments ──────────────────────────────────────────────────────────────

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
export type AppointmentType = "video" | "in_person" | "phone";

export interface AppointmentItem {
  id: string;
  date: string;
  duration: number;
  type: AppointmentType;
  status: AppointmentStatus;
  notes: string | null;
  isNew: boolean;
  client: { id: string; name: string; avatar: string | null };
  therapist: { id: string; user: { id: string; name: string; avatar: string | null } };
}

// ── Messaging ─────────────────────────────────────────────────────────────────

export interface ConversationSummary {
  id: string;
  sender: string;
  avatar: string;
  role: string;
  preview: string;
  time: string;
  unread: number;
}

export interface MessageItem {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  sender: string;
  avatar: string;
  messages: MessageItem[];
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  icon: string | null;
  href: string | null;
  read: boolean;
  createdAt: string;
}

// ── Provider finder ───────────────────────────────────────────────────────────

export interface ProviderResult {
  id: string;
  name: string;
  credential: string;
  gender: string;
  specialty: string;
  address: { street: string; city: string; state: string; zip: string };
  phone: string;
  website: string;
  lat: number | null;
  lon: number | null;
  isIndividual: boolean;
  country: string;
  source: string;
  distKm?: number;
}
