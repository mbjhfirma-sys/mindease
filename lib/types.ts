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
