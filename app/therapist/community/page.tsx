"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Plus, X, Check, Users, Globe, Lock, Pencil, Trash2,
  MessageCircle, Pin, ChevronRight, ChevronLeft, Heart, Send, ShieldCheck,
  Sparkles, Flag, UserPlus, Paperclip, Activity,
} from "lucide-react";
import { IDENTITY_TAGS } from "@/lib/identityTags";
import { AGE_GROUPS } from "@/lib/ageGroups";
import { getJoinWindow } from "@/lib/video";
import GroupCallRoom from "@/components/video/GroupCallRoom";
import AttachmentGallery, { type Attachment } from "@/components/dashboard/AttachmentGallery";

const ATTACHMENT_ACCEPT = "image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/ogg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type GroupSessionItem = {
  id: string; scheduledStart: string; durationMin: number;
  maxParticipants: number; status: "scheduled" | "ended" | "canceled"; rsvpCount: number;
};

type Privacy = "open" | "invite";
type CommunityStatus = "active" | "archived";
type RiskLevel = "high" | "medium" | "low";
type Severity = "high" | "moderate";

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  privacy: Privacy;
  status: CommunityStatus;
  identityTags: string[];
  ageGroup: string | null;
  members: number;
  postCount: number;
  createdAt: string;
  isOwner: boolean;
  createdByName?: string;
}

interface CommunityPost {
  id: string;
  communityId: string;
  author: string;
  authorId: string;
  authorRiskLevel: RiskLevel;
  content: string;
  time: string;
  likes: number;
  liked: boolean;
  replies: number;
  pinned: boolean;
  flagged: boolean;
  escalated: boolean;
  escalationSeverity: Severity | null;
  escalationDetail: string | null;
  attachments: Attachment[];
}

interface Reply {
  id: string;
  author: string;
  authorRiskLevel: RiskLevel;
  content: string;
  time: string;
  liked: boolean;
  likes: number;
  escalated: boolean;
  escalationSeverity: Severity | null;
}

interface FlaggedPost {
  id: string;
  groupId: string;
  groupName: string;
  authorName: string;
  content: string;
  createdAt: string;
  severity: Severity;
  detail: string | null;
  otherOpenRiskFlagCount: number;
}

interface ActivityItem {
  id: string;
  type: "post" | "reply" | "join";
  groupId: string;
  groupName: string;
  authorName: string;
  content: string | null;
  createdAt: string;
}

interface GroupMember {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
}

interface GroupInvite {
  clientId: string;
  clientName: string;
  sentAt: string;
  accepted: boolean;
}

interface ClientOption {
  id: string;
  name: string;
  riskLevel: RiskLevel;
}

interface EscalateTarget {
  kind: "post" | "reply";
  postId: string;
  replyId?: string;
  defaultNote: string;
}

const ACTIVITY_PREVIEW_COUNT = 3;

const CATEGORIES = [
  "Anxiety", "Depression", "Grief", "Sleep", "Trauma",
  "Relationships", "Stress", "Mindfulness", "Self-esteem", "Other",
];

const ICON_OPTIONS = ["🌿", "🌙", "🕊️", "💚", "🌱", "☀️", "🌊", "🍃", "🌷", "🔥", "🧘", "💬"];

const BLANK_FORM = {
  name: "",
  description: "",
  category: "Anxiety",
  icon: "🌿",
  privacy: "open" as Privacy,
  identityTags: [] as string[],
  ageGroup: "",
};

type Mode = "list" | "create" | "edit" | "view";

const RISK_DOT: Record<RiskLevel, string> = {
  high: "bg-console-risk-high",
  medium: "bg-console-risk-medium",
  low: "bg-console-risk-low",
};

function RiskDot({ level }: { level: RiskLevel }) {
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${RISK_DOT[level]}`} title={`${level} risk`} />;
}

function SeverityChip({ severity }: { severity: Severity }) {
  const cls = severity === "high"
    ? "bg-console-banner-high-bg text-console-banner-high-text"
    : "bg-console-banner-moderate-bg text-console-banner-moderate-text";
  return <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded flex-shrink-0 ${cls}`}>{severity}</span>;
}

function PrivacyBadge({ privacy }: { privacy: Privacy }) {
  if (privacy === "open") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-console-privacy-open-text bg-console-privacy-open-bg px-2 py-0.5 rounded-full">
        <Globe size={9} strokeWidth={2} /> Open to all
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-console-privacy-invite-text bg-console-privacy-invite-bg px-2 py-0.5 rounded-full">
      <Lock size={9} strokeWidth={2} /> Invite only
    </span>
  );
}

function KpiCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="bg-console-panel border border-console-line rounded-xl p-3.5">
      <div className="text-[11px] font-semibold text-console-muted mb-1.5">{label}</div>
      <div className={`text-xl font-bold ${highlight ? "text-console-risk-high" : "text-console-ink"}`}>{value}</div>
    </div>
  );
}

function MindoCard({ tag, text }: { tag: string; text: string | null }) {
  return (
    <div className="bg-gradient-to-br from-console-mindo-soft to-white border border-console-line rounded-xl p-4 flex gap-3 items-start">
      <div className="w-7 h-7 rounded-lg bg-console-mindo text-white flex items-center justify-center flex-shrink-0">
        <Sparkles size={14} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] font-bold text-console-mindo uppercase tracking-wide mb-1">{tag}</div>
        {text === null ? (
          <p className="text-sm text-console-dim">Thinking…</p>
        ) : (
          <p className="text-sm text-console-ink leading-relaxed">{text}</p>
        )}
      </div>
    </div>
  );
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function TherapistCommunityPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [totalMemberCount, setTotalMemberCount] = useState(0);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [mode, setMode] = useState<Mode>("list");
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState("");

  const [repliesByPost, setRepliesByPost] = useState<Record<string, Reply[]>>({});
  const [loadedReplyPosts, setLoadedReplyPosts] = useState<Set<string>>(new Set());
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [loadingFlagged, setLoadingFlagged] = useState(true);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [overviewInsight, setOverviewInsight] = useState<string | null>(null);
  const [groupInsight, setGroupInsight] = useState<string | null>(null);

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [invites, setInvites] = useState<GroupInvite[]>([]);

  const [sessions, setSessions] = useState<GroupSessionItem[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [activeGroupCall, setActiveGroupCall] = useState<{ sessionId: string; groupName: string } | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [allClients, setAllClients] = useState<ClientOption[]>([]);
  const [selectedInviteIds, setSelectedInviteIds] = useState<Set<string>>(new Set());
  const [invitingBusy, setInvitingBusy] = useState(false);

  const [escalateTarget, setEscalateTarget] = useState<EscalateTarget | null>(null);
  const [escalateSeverity, setEscalateSeverity] = useState<Severity>("moderate");
  const [escalateNote, setEscalateNote] = useState("");
  const [escalating, setEscalating] = useState(false);

  const loadCommunities = useCallback(() => {
    fetch("/api/therapist/community", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((d) => {
        const groups = (d.groups ?? []).map((g: {
          id: string; name: string; description: string | null; category: string; icon: string;
          privacy: Privacy; status: CommunityStatus; identityTags: string[]; ageGroup: string | null;
          memberCount: number; postCount: number; createdAt: string;
        }) => ({
          id: g.id,
          name: g.name,
          description: g.description ?? "",
          category: g.category,
          icon: g.icon,
          privacy: g.privacy,
          status: g.status,
          identityTags: g.identityTags,
          ageGroup: g.ageGroup,
          members: g.memberCount,
          postCount: g.postCount,
          createdAt: g.createdAt,
          isOwner: true,
        }));
        setCommunities(groups);
        setTotalMemberCount(d.totalMembers ?? 0);
        setFetchError(null);
      })
      .catch((e: Error) => setFetchError(e.message))
      .finally(() => setLoadingCommunities(false));
  }, []);

  const loadFlagged = useCallback(() => {
    fetch("/api/therapist/community/flagged", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setFlaggedPosts(d.posts ?? []))
      .catch(() => setFlaggedPosts([]))
      .finally(() => setLoadingFlagged(false));
  }, []);

  const loadActivity = useCallback(() => {
    fetch("/api/therapist/community/activity", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setActivity(d.activity ?? []))
      .catch(() => setActivity([]))
      .finally(() => setLoadingActivity(false));
  }, []);

  useEffect(() => { loadCommunities(); loadFlagged(); loadActivity(); }, [loadCommunities, loadFlagged, loadActivity]);

  useEffect(() => {
    if (mode !== "list") return;
    fetch("/api/therapist/community/insight", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setOverviewInsight(d.insight))
      .catch(() => setOverviewInsight("Insight unavailable right now."));
  }, [mode]);

  const loadPosts = useCallback((communityId: string) => {
    setLoadingPosts(true);
    fetch(`/api/therapist/community/${communityId}/posts`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => {
        const formatted: CommunityPost[] = (d.posts ?? []).map((p: {
          id: string; groupId: string; author: string; authorId: string; authorRiskLevel: RiskLevel; content: string;
          pinned: boolean; flagged: boolean; escalated: boolean; escalationSeverity: Severity | null; escalationDetail: string | null;
          likes: number; liked: boolean; replyCount: number; createdAt: string; attachments?: Attachment[];
        }) => ({
          id: p.id,
          communityId: p.groupId,
          author: p.author,
          authorId: p.authorId,
          authorRiskLevel: p.authorRiskLevel,
          content: p.content,
          time: timeAgo(new Date(p.createdAt)),
          likes: p.likes,
          liked: p.liked,
          replies: p.replyCount,
          pinned: p.pinned,
          flagged: p.flagged,
          escalated: p.escalated,
          escalationSeverity: p.escalationSeverity,
          escalationDetail: p.escalationDetail,
          attachments: p.attachments ?? [],
        }));
        setPosts(formatted);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoadingPosts(false));
  }, []);

  const loadMembers = useCallback((communityId: string) => {
    setLoadingMembers(true);
    fetch(`/api/therapist/community/${communityId}/members`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => { setMembers(d.members ?? []); setInvites(d.invites ?? []); })
      .catch(() => { setMembers([]); setInvites([]); })
      .finally(() => setLoadingMembers(false));
  }, []);

  const loadGroupInsight = useCallback((communityId: string) => {
    setGroupInsight(null);
    fetch(`/api/therapist/community/${communityId}/insight`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setGroupInsight(d.insight))
      .catch(() => setGroupInsight("Insight unavailable right now."));
  }, []);

  const loadSessions = useCallback((communityId: string) => {
    fetch(`/api/therapist/community/${communityId}/sessions`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => setSessions([]));
  }, []);

  async function scheduleSession() {
    if (!activeCommunityId || !scheduleDate || !scheduleTime || scheduling) return;
    setScheduling(true);
    try {
      const scheduledStart = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      const res = await fetch(`/api/therapist/community/${activeCommunityId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledStart }),
      });
      if (res.ok) {
        setShowScheduleForm(false);
        setScheduleDate(""); setScheduleTime("");
        loadSessions(activeCommunityId);
      }
    } finally {
      setScheduling(false);
    }
  }

  async function cancelSession(sessionId: string) {
    if (!activeCommunityId) return;
    await fetch(`/api/therapist/community/${activeCommunityId}/sessions/${sessionId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }),
    });
    loadSessions(activeCommunityId);
  }

  const activeCommunity = useMemo(() => communities.find((c) => c.id === activeCommunityId) ?? null, [communities, activeCommunityId]);

  const activePosts = useMemo(
    () => posts
      .filter((p) => p.communityId === activeCommunityId)
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    [posts, activeCommunityId]
  );

  const notYetInGroup = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.id));
    const invitedIds = new Set(invites.map((i) => i.clientId));
    return allClients.filter((c) => !memberIds.has(c.id) && !invitedIds.has(c.id));
  }, [allClients, members, invites]);

  function openCreate() { setForm(BLANK_FORM); setSaved(false); setMode("create"); }

  function openEdit(c: Community) {
    setEditingId(c.id);
    setForm({
      name: c.name, description: c.description, category: c.category, icon: c.icon, privacy: c.privacy,
      identityTags: c.identityTags, ageGroup: c.ageGroup ?? "",
    });
    setSaved(false);
    setMode("edit");
  }

  function openView(id: string) {
    setActiveCommunityId(id);
    setNewPost("");
    setPosts([]);
    setMembers([]);
    setInvites([]);
    setSessions([]);
    setMode("view");
    loadPosts(id);
    loadMembers(id);
    loadGroupInsight(id);
    loadSessions(id);
  }

  function goList() {
    setMode("list");
    setEditingId(null);
    setActiveCommunityId(null);
    setSaved(false);
    loadFlagged();
  }

  async function commitCreate() {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/therapist/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ageGroup: form.ageGroup || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      setSaved(true);
      loadCommunities();
      setTimeout(goList, 1200);
    } finally {
      setSaving(false);
    }
  }

  async function commitEdit() {
    if (!form.name.trim() || !editingId || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/therapist/community/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ageGroup: form.ageGroup || null }),
      });
      if (!res.ok) throw new Error("Failed");
      setSaved(true);
      loadCommunities();
      setTimeout(goList, 1200);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await fetch(`/api/therapist/community/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    loadCommunities();
  }

  function toggleLike(id: string) {
    const post = posts.find((p) => p.id === id);
    if (!post || !activeCommunityId) return;
    const action = post.liked ? "unlike" : "like";
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
    fetch(`/api/therapist/community/${activeCommunityId}/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  }

  function loadReplies(postId: string, force = false) {
    if (!activeCommunityId) return;
    if (!force && loadedReplyPosts.has(postId)) return;
    fetch(`/api/therapist/community/${activeCommunityId}/posts/${postId}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => {
        const formatted: Reply[] = (d.replies ?? []).map((r: {
          id: string; author: string; authorRiskLevel: RiskLevel; content: string; createdAt: string;
          likes: number; liked: boolean; escalated: boolean; escalationSeverity: Severity | null;
        }) => ({
          id: r.id, author: r.author, authorRiskLevel: r.authorRiskLevel, content: r.content,
          time: timeAgo(new Date(r.createdAt)), likes: r.likes, liked: r.liked,
          escalated: r.escalated, escalationSeverity: r.escalationSeverity,
        }));
        setRepliesByPost((prev) => ({ ...prev, [postId]: formatted }));
        setLoadedReplyPosts((prev) => new Set(prev).add(postId));
      })
      .catch(() => {});
  }

  function refreshReplies(postId: string) {
    loadReplies(postId, true);
  }

  function toggleReplyLike(postId: string, replyId: string) {
    if (!activeCommunityId) return;
    const reply = (repliesByPost[postId] ?? []).find((r) => r.id === replyId);
    if (!reply) return;
    const action = reply.liked ? "unlike" : "like";
    setRepliesByPost((prev) => ({
      ...prev,
      [postId]: (prev[postId] ?? []).map((r) =>
        r.id === replyId ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 } : r
      ),
    }));
    fetch(`/api/therapist/community/${activeCommunityId}/posts/${postId}/replies/${replyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  }

  async function submitReply(postId: string) {
    const text = replyInputs[postId]?.trim();
    if (!text || !activeCommunityId) return;
    setReplyInputs((prev) => ({ ...prev, [postId]: "" }));
    const res = await fetch(`/api/therapist/community/${activeCommunityId}/posts/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    const d = await res.json();
    if (res.ok && d.reply) {
      const reply: Reply = {
        id: d.reply.id, author: d.reply.author, authorRiskLevel: "low", content: d.reply.content,
        time: "Just now", liked: false, likes: 0, escalated: false, escalationSeverity: null,
      };
      setRepliesByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), reply] }));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, replies: p.replies + 1 } : p));
    }
  }

  function togglePin(id: string) {
    const post = posts.find((p) => p.id === id);
    if (!post || !activeCommunityId) return;
    const pinned = !post.pinned;
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, pinned } : p));
    fetch(`/api/therapist/community/${activeCommunityId}/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned }),
    });
  }

  async function deletePost(id: string) {
    const post = posts.find((p) => p.id === id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    if (post && activeCommunityId) {
      setCommunities((prev) => prev.map((c) => c.id === activeCommunityId ? { ...c, postCount: Math.max(0, c.postCount - 1) } : c));
      await fetch(`/api/therapist/community/${activeCommunityId}/posts/${id}`, { method: "DELETE" }).catch(() => {});
    }
  }

  async function submitPost() {
    if (!newPost.trim() || !activeCommunityId || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/therapist/community/${activeCommunityId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPost.trim() }),
      });
      if (res.ok) {
        const d = await res.json();
        const postId: string | undefined = d.post?.id;
        if (postId && pendingAttachments.length > 0) {
          await Promise.all(
            pendingAttachments.map((file) => {
              const form = new FormData();
              form.append("postId", postId);
              form.append("postSource", "therapist");
              form.append("file", file);
              return fetch("/api/community/posts/attachments", { method: "POST", body: form }).catch(() => null);
            })
          );
        }
        setNewPost("");
        setPendingAttachments([]);
        loadPosts(activeCommunityId);
        setCommunities((prev) => prev.map((c) => c.id === activeCommunityId ? { ...c, postCount: c.postCount + 1 } : c));
      }
    } finally {
      setPosting(false);
    }
  }

  function handleAttachmentSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const oversized = files.find((f) => f.size > MAX_ATTACHMENT_BYTES);
    if (oversized) {
      setAttachmentError(`${oversized.name} is too large (15MB max)`);
      return;
    }
    setAttachmentError("");
    setPendingAttachments((prev) => [...prev, ...files]);
  }

  function removePendingAttachment(index: number) {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function dismissFlagged(fp: FlaggedPost) {
    setFlaggedPosts((prev) => prev.filter((p) => p.id !== fp.id));
    await fetch(`/api/therapist/community/${fp.groupId}/posts/${fp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flagged: false }),
    }).catch(() => {});
    if (activeCommunityId === fp.groupId) loadPosts(fp.groupId);
  }

  function excerptOf(text: string) {
    return text.length > 140 ? `${text.slice(0, 140).trim()}…` : text;
  }

  function openEscalate(kind: "post" | "reply", postId: string, replyId: string | undefined, content: string) {
    const groupName = activeCommunity?.name ?? "this community";
    setEscalateTarget({
      kind, postId, replyId,
      defaultNote: `Escalated from a ${kind} in "${groupName}": "${excerptOf(content)}"`,
    });
    setEscalateSeverity("moderate");
    setEscalateNote("");
  }

  async function confirmEscalate() {
    if (!escalateTarget || !activeCommunityId || escalating) return;
    setEscalating(true);
    try {
      const url = escalateTarget.kind === "post"
        ? `/api/therapist/community/${activeCommunityId}/posts/${escalateTarget.postId}/escalate`
        : `/api/therapist/community/${activeCommunityId}/posts/${escalateTarget.postId}/replies/${escalateTarget.replyId}/escalate`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ severity: escalateSeverity, note: escalateNote.trim() || undefined }),
      });
      if (res.ok) {
        const target = escalateTarget;
        setEscalateTarget(null);
        loadPosts(activeCommunityId);
        loadFlagged();
        if (target.kind === "reply") refreshReplies(target.postId);
      }
    } finally {
      setEscalating(false);
    }
  }

  function openInvite() {
    setInviteModalOpen(true);
    setSelectedInviteIds(new Set());
    fetch("/api/therapist/clients", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setAllClients((d.clients ?? []).map((c: { id: string; name: string; riskLevel: RiskLevel }) => ({
        id: c.id, name: c.name, riskLevel: c.riskLevel,
      }))))
      .catch(() => setAllClients([]));
  }

  function toggleInviteSelect(id: string) {
    setSelectedInviteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function submitInvites() {
    if (!activeCommunityId || selectedInviteIds.size === 0 || invitingBusy) return;
    setInvitingBusy(true);
    try {
      const res = await fetch(`/api/therapist/community/${activeCommunityId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientIds: [...selectedInviteIds] }),
      });
      if (res.ok) {
        setInviteModalOpen(false);
        loadMembers(activeCommunityId);
      }
    } finally {
      setInvitingBusy(false);
    }
  }

  async function removeMember(clientId: string) {
    if (!activeCommunityId) return;
    setMembers((prev) => prev.filter((m) => m.id !== clientId));
    await fetch(`/api/therapist/community/${activeCommunityId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    }).catch(() => {});
  }

  const kpi = {
    activeCommunities: communities.length,
    totalMembers: totalMemberCount,
    totalPosts: communities.reduce((s, c) => s + c.postCount, 0),
    flagged: flaggedPosts.length,
  };

  const pendingInvites = invites.filter((i) => !i.accepted);

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mode !== "list" && (
            <button onClick={goList} className="text-console-muted hover:text-console-navy transition-colors">
              <X size={18} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-console-ink">
              {mode === "create" ? "New Community"
                : mode === "edit" ? "Edit Community"
                : mode === "view" && activeCommunity ? activeCommunity.name
                : "Community Console"}
            </h1>
            {mode === "list" && <p className="text-sm text-console-muted mt-1">Trust & safety overview for your peer support communities</p>}
            {mode === "view" && activeCommunity && (
              <p className="text-sm text-console-muted mt-0.5">{activeCommunity.category} · {activeCommunity.members} members</p>
            )}
          </div>
        </div>

        {mode === "list" && (
          <button onClick={openCreate} className="flex items-center gap-1.5 bg-console-navy text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
            <Plus size={15} strokeWidth={2} /> Create community
          </button>
        )}
        {mode === "view" && activeCommunity && (
          <button onClick={() => openEdit(activeCommunity)} className="flex items-center gap-1.5 border border-console-line text-console-muted text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-console-bg transition-colors">
            <Pencil size={13} strokeWidth={1.5} /> Edit
          </button>
        )}
      </div>

      {/* ══ Create / Edit form ══════════════════════════════════════════════════ */}
      {(mode === "create" || mode === "edit") && (
        <div className="bg-console-panel border border-console-line rounded-xl p-6">
          {saved ? (
            <div className="py-14 text-center">
              <div className="w-10 h-10 bg-console-navy rounded-full flex items-center justify-center mx-auto mb-3">
                <Check size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <p className="text-sm font-medium text-console-ink">
                {mode === "edit" ? "Changes saved" : "Community created"}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-console-dim uppercase tracking-widest block mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button key={icon} type="button" onClick={() => setForm({ ...form, icon })}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${form.icon === icon ? "bg-console-navy ring-2 ring-console-navy ring-offset-1" : "bg-console-bg hover:bg-console-line/40 border border-console-line"}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-console-dim uppercase tracking-widest block mb-1.5">Community name <span className="text-red-400">*</span></label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Anxiety & Calm"
                  className="w-full border border-console-line rounded-lg px-3 py-2.5 text-sm text-console-ink focus:outline-none focus:border-console-navy transition-colors" />
              </div>

              <div>
                <label className="text-xs font-medium text-console-dim uppercase tracking-widest block mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What is this community about? Who should join?"
                  rows={3} className="w-full border border-console-line rounded-lg px-3 py-2.5 text-sm text-console-ink resize-none focus:outline-none focus:border-console-navy transition-colors" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-console-dim uppercase tracking-widest block mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-console-line rounded-lg px-3 py-2.5 text-sm text-console-ink focus:outline-none focus:border-console-navy transition-colors">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-console-dim uppercase tracking-widest block mb-1.5">Visibility</label>
                  <div className="flex gap-2">
                    {(["open", "invite"] as Privacy[]).map((p) => (
                      <button key={p} type="button" onClick={() => setForm({ ...form, privacy: p })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-sm font-medium transition-all ${form.privacy === p ? "bg-console-navy border-console-navy text-white" : "border-console-line text-console-muted hover:border-console-navy"}`}>
                        {p === "open" ? <Globe size={13} strokeWidth={1.5} /> : <Lock size={13} strokeWidth={1.5} />}
                        {p === "open" ? "Open to all" : "Invite only"}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-console-dim mt-1.5">
                    {form.privacy === "open"
                      ? "Any user on the platform can discover and join."
                      : "Only clients you invite can join."}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-console-dim uppercase tracking-widest block mb-1.5">Age group (optional)</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setForm({ ...form, ageGroup: "" })}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${!form.ageGroup ? "bg-console-navy border-console-navy text-white" : "border-console-line text-console-muted hover:border-console-navy"}`}>
                    Any
                  </button>
                  {AGE_GROUPS.map((a) => (
                    <button key={a.id} type="button" onClick={() => setForm({ ...form, ageGroup: a.id })}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${form.ageGroup === a.id ? "bg-console-navy border-console-navy text-white" : "border-console-line text-console-muted hover:border-console-navy"}`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-console-dim uppercase tracking-widest block mb-1.5">Identity tags (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {IDENTITY_TAGS.map((t) => {
                    const active = form.identityTags.includes(t.id);
                    return (
                      <button key={t.id} type="button" title={t.description}
                        onClick={() => setForm({
                          ...form,
                          identityTags: active ? form.identityTags.filter((id) => id !== t.id) : [...form.identityTags, t.id],
                        })}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${active ? "bg-console-navy border-console-navy text-white" : "border-console-line text-console-muted hover:border-console-navy"}`}>
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-console-line">
                <button type="button" onClick={goList} className="flex-1 border border-console-line text-sm py-2.5 rounded-lg hover:bg-console-bg transition-colors text-console-muted">
                  Cancel
                </button>
                <button type="button" onClick={mode === "create" ? commitCreate : commitEdit}
                  disabled={!form.name.trim() || saving}
                  className="flex-1 bg-console-navy text-white text-sm font-medium py-2.5 rounded-lg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity">
                  {saving ? "Saving…" : mode === "create" ? "Create community" : "Save changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ Group detail (Console) ══════════════════════════════════════════════ */}
      {mode === "view" && activeCommunity && (
        <div className="space-y-4">
          <button onClick={goList} className="inline-flex items-center gap-1.5 text-xs font-semibold text-console-muted hover:text-console-navy transition-colors">
            <ChevronLeft size={14} strokeWidth={2} /> Back to communities
          </button>

          <div className="bg-console-panel border border-console-line rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-console-bg rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              {activeCommunity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-semibold text-console-muted bg-console-bg px-2 py-0.5 rounded-full">{activeCommunity.category}</span>
                <PrivacyBadge privacy={activeCommunity.privacy} />
              </div>
              <p className="text-sm text-console-muted leading-relaxed">{activeCommunity.description || <span className="italic text-console-dim">No description</span>}</p>
            </div>
            <div className="flex flex-col items-end gap-1 text-right flex-shrink-0">
              <div className="text-sm font-semibold text-console-ink">{activeCommunity.members}</div>
              <div className="text-[10px] text-console-dim">members</div>
              <div className="text-sm font-semibold text-console-ink mt-1">{activeCommunity.postCount}</div>
              <div className="text-[10px] text-console-dim">posts</div>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-console-bg border border-console-line rounded-lg px-4 py-3 text-xs text-console-muted">
            <ShieldCheck size={13} strokeWidth={1.5} className="flex-shrink-0 mt-0.5 text-console-dim" />
            <span>You are the moderator. Members post anonymously to each other — you post as yourself.</span>
          </div>

          <MindoCard tag="Mindo insight" text={groupInsight} />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
            <div className="space-y-4 min-w-0">
              <div className="bg-console-panel border border-console-line rounded-xl p-4">
                <label className="text-xs font-medium text-console-muted mb-2 block">Post an announcement or message</label>
                <div className="flex gap-3 mb-3">
                  <div className="w-7 h-7 bg-console-navy rounded-full flex items-center justify-center text-xs text-white flex-shrink-0 mt-0.5">🧑‍⚕️</div>
                  <textarea value={newPost} onChange={(e) => setNewPost(e.target.value.slice(0, 500))}
                    placeholder="Write something for your community…" rows={3}
                    className="flex-1 text-sm text-console-ink placeholder-console-dim resize-none focus:outline-none leading-relaxed" />
                </div>
                {pendingAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {pendingAttachments.map((file, i) => (
                      <span key={`${file.name}-${i}`} className="flex items-center gap-1.5 text-[11px] bg-console-bg border border-console-line text-console-muted rounded-full pl-2.5 pr-1.5 py-1">
                        <span className="max-w-[140px] truncate">{file.name}</span>
                        <span className="text-console-dim">{formatBytes(file.size)}</span>
                        <button onClick={() => removePendingAttachment(i)} className="text-console-dim hover:text-console-risk-high transition-colors">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {attachmentError && <p className="text-[11px] text-console-risk-high mb-3">{attachmentError}</p>}
                <div className="flex items-center justify-between border-t border-console-line pt-3">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-console-muted hover:text-console-ink cursor-pointer transition-colors">
                      <Paperclip size={14} strokeWidth={1.5} />
                      <span className="hidden sm:inline">Attach</span>
                      <input type="file" multiple accept={ATTACHMENT_ACCEPT} onChange={handleAttachmentSelect} className="hidden" />
                    </label>
                    <span className="text-[10px] text-console-dim">{newPost.length}/500</span>
                  </div>
                  <button onClick={submitPost} disabled={!newPost.trim() || posting}
                    className="bg-console-navy text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity flex items-center gap-1.5">
                    <Send size={11} strokeWidth={2} />
                    {posting ? "Posting…" : "Post"}
                  </button>
                </div>
              </div>

              {loadingPosts && (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-console-panel border border-console-line rounded-xl" />)}
                </div>
              )}

              {!loadingPosts && activePosts.length === 0 && (
                <div className="bg-console-panel border border-console-line rounded-xl py-12 text-center">
                  <p className="text-sm font-medium text-console-ink mb-1">No posts yet</p>
                  <p className="text-xs text-console-dim">Be the first to post — your community members will see it here.</p>
                </div>
              )}

              {activePosts.map((post) => {
                const isExpanded = expandedPost === post.id;
                const postReplies = repliesByPost[post.id] ?? [];
                return (
                  <div key={post.id} className={`bg-console-panel border rounded-2xl overflow-hidden ${post.pinned ? "border-console-navy border-l-4" : "border-console-line"}`}>
                    <div className="p-4">
                      {post.pinned && (
                        <div className="flex items-center gap-1 text-[10px] text-console-navy font-bold uppercase tracking-wider mb-2">
                          <Pin size={10} strokeWidth={2} /> Pinned
                        </div>
                      )}
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="relative w-7 h-7 bg-console-bg rounded-full flex items-center justify-center text-xs flex-shrink-0">
                          🧑‍⚕️
                          {post.authorRiskLevel !== "low" && (
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-console-panel ${RISK_DOT[post.authorRiskLevel]}`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-console-ink">{post.author}</div>
                          <div className="text-[10px] text-console-dim">{post.time}</div>
                        </div>
                        {post.escalated && post.escalationSeverity && <SeverityChip severity={post.escalationSeverity} />}
                      </div>
                      <p className="text-sm text-console-muted leading-relaxed">{post.content}</p>
                      {post.attachments.length > 0 && (
                        <div className="mt-3">
                          <AttachmentGallery attachments={post.attachments} />
                        </div>
                      )}
                      {post.escalated && post.escalationDetail && (
                        <div className="mt-2 flex items-start gap-1.5 text-[11px] text-console-risk-high bg-console-banner-high-bg border border-console-banner-high-border rounded-lg px-2.5 py-1.5">
                          <Flag size={11} strokeWidth={1.8} className="flex-shrink-0 mt-0.5" />
                          <span>{post.escalationDetail}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-console-line">
                        <button onClick={() => toggleLike(post.id)}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${post.liked ? "text-rose-500" : "text-console-dim hover:text-console-muted"}`}>
                          <Heart size={13} strokeWidth={1.5} fill={post.liked ? "currentColor" : "none"} /> {post.likes}
                        </button>
                        <button onClick={() => { setExpandedPost(isExpanded ? null : post.id); if (!isExpanded) loadReplies(post.id); }}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${isExpanded ? "text-console-ink font-medium" : "text-console-dim hover:text-console-muted"}`}>
                          <MessageCircle size={13} strokeWidth={1.5} />
                          {post.replies} {post.replies === 1 ? "reply" : "replies"}
                        </button>
                        <div className="ml-auto flex items-center gap-1">
                          {post.escalated ? (
                            <span className="text-[11px] font-semibold text-console-risk-high flex items-center gap-1 px-1.5">
                              <Flag size={11} strokeWidth={2} /> Escalated
                            </span>
                          ) : (
                            <button onClick={() => openEscalate("post", post.id, undefined, post.content)} title="Escalate to risk review"
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-console-dim hover:bg-console-banner-high-bg hover:text-console-risk-high transition-colors">
                              <Flag size={12} strokeWidth={1.5} />
                            </button>
                          )}
                          <button onClick={() => togglePin(post.id)} title={post.pinned ? "Unpin" : "Pin"}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${post.pinned ? "bg-console-navy text-white" : "text-console-dim hover:bg-console-bg hover:text-console-ink"}`}>
                            <Pin size={12} strokeWidth={1.5} />
                          </button>
                          <button onClick={() => deletePost(post.id)} title="Remove"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-console-dim hover:bg-red-50 hover:text-red-500 transition-all">
                            <Trash2 size={12} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-console-line bg-console-bg/60">
                        {postReplies.length > 0 ? (
                          <div className="divide-y divide-console-line">
                            {postReplies.map((reply) => (
                              <div key={reply.id} className="px-5 py-4 flex gap-2.5">
                                <div className="relative w-6 h-6 bg-console-bg rounded-full flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5">
                                  🙂
                                  {reply.authorRiskLevel !== "low" && (
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-console-panel ${RISK_DOT[reply.authorRiskLevel]}`} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[11px] font-medium text-console-ink">{reply.author}</span>
                                    <span className="text-[10px] text-console-dim">{reply.time}</span>
                                    {reply.escalated && reply.escalationSeverity && <SeverityChip severity={reply.escalationSeverity} />}
                                  </div>
                                  <p className="text-xs text-console-muted leading-relaxed">{reply.content}</p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <button onClick={() => toggleReplyLike(post.id, reply.id)}
                                      className={`flex items-center gap-1 text-[11px] transition-colors ${reply.liked ? "text-rose-500" : "text-console-dim hover:text-console-muted"}`}>
                                      <Heart size={11} strokeWidth={1.5} fill={reply.liked ? "currentColor" : "none"} /> {reply.likes}
                                    </button>
                                    {reply.escalated ? (
                                      <span className="text-[10.5px] font-semibold text-console-risk-high">Escalated for follow-up</span>
                                    ) : (
                                      <button onClick={() => openEscalate("reply", post.id, reply.id, reply.content)}
                                        className="text-[10.5px] font-semibold text-console-dim hover:text-console-risk-high transition-colors">
                                        Escalate to risk review
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="px-5 py-4 text-xs text-console-dim">No replies yet.</p>
                        )}
                        <div className="px-4 py-3 border-t border-console-line flex gap-2.5 items-center">
                          <div className="w-6 h-6 bg-console-navy rounded-full flex items-center justify-center text-[11px] text-white flex-shrink-0">🧑‍⚕️</div>
                          <input value={replyInputs[post.id] ?? ""}
                            onChange={(e) => setReplyInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitReply(post.id)}
                            placeholder="Write a reply…"
                            className="flex-1 text-xs text-console-ink placeholder-console-dim bg-white border border-console-line rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-console-navy" />
                          <button onClick={() => submitReply(post.id)} disabled={!replyInputs[post.id]?.trim()}
                            className="text-xs bg-console-navy text-white px-2.5 py-1.5 rounded-lg disabled:opacity-30 hover:opacity-90 transition-opacity flex-shrink-0">
                            <Send size={10} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
            <div className="bg-console-panel border border-console-line rounded-xl p-4 space-y-3">
              <div className="text-sm font-semibold text-console-ink">Members ({members.length})</div>
              {loadingMembers ? (
                <div className="text-xs text-console-dim">Loading…</div>
              ) : (
                <div className="space-y-2">
                  {members.map((m) => (
                    <div key={m.id} className="group flex items-center gap-2.5 bg-console-bg rounded-lg px-2.5 py-2">
                      <div className="w-7 h-7 rounded-full bg-white border border-console-line flex items-center justify-center text-[10px] font-bold text-console-ink flex-shrink-0">
                        {initials(m.name)}
                      </div>
                      <span className="flex-1 min-w-0 text-xs font-semibold text-console-ink truncate">{m.name}</span>
                      <button onClick={() => removeMember(m.id)} title="Remove from community"
                        className="opacity-0 group-hover:opacity-100 text-console-dim hover:text-red-500 transition-opacity flex-shrink-0">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  {members.length === 0 && <p className="text-xs text-console-dim">No members yet.</p>}
                </div>
              )}
              {pendingInvites.length > 0 && (
                <div className="pt-2 border-t border-console-line space-y-1.5">
                  <div className="text-[10px] font-semibold text-console-dim uppercase tracking-wide">Invited, not yet joined</div>
                  {pendingInvites.map((i) => (
                    <div key={i.clientId} className="text-xs text-console-muted">{i.clientName}</div>
                  ))}
                </div>
              )}
              <button onClick={openInvite}
                className="w-full text-xs font-semibold text-console-muted border border-dashed border-console-line rounded-lg py-2 hover:border-console-navy hover:text-console-navy transition-colors flex items-center justify-center gap-1.5">
                <UserPlus size={13} strokeWidth={1.8} /> Invite a client
              </button>
            </div>

            <div className="bg-console-panel border border-console-line rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-console-ink">Live sessions</div>
                <button onClick={() => setShowScheduleForm((v) => !v)} className="text-xs font-medium text-console-navy hover:opacity-80 transition-opacity">
                  {showScheduleForm ? "Cancel" : "+ Schedule"}
                </button>
              </div>

              {showScheduleForm && (
                <div className="space-y-2 bg-console-bg border border-console-line rounded-lg p-3">
                  <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full border border-console-line rounded-lg px-2.5 py-1.5 text-xs" />
                  <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full border border-console-line rounded-lg px-2.5 py-1.5 text-xs" />
                  <p className="text-[10px] text-console-dim">50 minutes · up to 6 participants</p>
                  <button onClick={scheduleSession} disabled={!scheduleDate || !scheduleTime || scheduling}
                    className="w-full bg-console-navy text-white text-xs font-medium py-1.5 rounded-lg hover:opacity-90 disabled:opacity-30 transition-opacity">
                    {scheduling ? "Scheduling…" : "Schedule session"}
                  </button>
                </div>
              )}

              {sessions.filter((s) => s.status === "scheduled").length === 0 ? (
                <p className="text-xs text-console-dim">No upcoming sessions.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.filter((s) => s.status === "scheduled").map((s) => {
                    const start = new Date(s.scheduledStart);
                    const jw = getJoinWindow(start, s.durationMin);
                    return (
                      <div key={s.id} className="bg-console-bg rounded-lg px-2.5 py-2 space-y-1.5">
                        <div className="text-xs font-semibold text-console-ink">
                          {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                          {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-console-dim">{s.rsvpCount} RSVP&apos;d</span>
                          <div className="flex items-center gap-2">
                            {jw.isOpen ? (
                              <button
                                onClick={() => activeCommunity && setActiveGroupCall({ sessionId: s.id, groupName: activeCommunity.name })}
                                className="text-[11px] font-semibold bg-console-navy text-white px-2.5 py-1 rounded-lg hover:opacity-90 transition-opacity"
                              >
                                Start
                              </button>
                            ) : (
                              <button onClick={() => cancelSession(s.id)} className="text-[11px] text-console-dim hover:text-red-500 transition-colors">
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ List (Console dashboard) ═════════════════════════════════════════════ */}
      {mode === "list" && (
        <>
          {loadingCommunities && (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map((i) => <div key={i} className="h-32 bg-console-panel border border-console-line rounded-xl" />)}
            </div>
          )}

          {!loadingCommunities && fetchError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
              <p className="font-medium mb-1">Could not load communities</p>
              <p className="text-xs text-red-500 font-mono">{fetchError}</p>
              <button onClick={loadCommunities} className="mt-3 text-xs font-medium text-red-700 underline">Retry</button>
            </div>
          )}

          {!loadingCommunities && !fetchError && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard label="Active communities" value={kpi.activeCommunities} />
                <KpiCard label="Total members" value={kpi.totalMembers} />
                <KpiCard label="Total posts" value={kpi.totalPosts} />
                <KpiCard label="Flagged awaiting review" value={kpi.flagged} highlight={kpi.flagged > 0} />
              </div>

              <MindoCard tag="Mindo weekly community briefing" text={overviewInsight} />

              <div className="bg-console-panel border border-console-line rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-console-line">
                  <Flag size={14} strokeWidth={1.8} className="text-console-muted" />
                  <span className="text-sm font-semibold text-console-ink">Flagged posts</span>
                  {flaggedPosts.length > 0 && (
                    <span className="text-[11px] font-bold text-white bg-console-risk-high px-2 py-0.5 rounded-full">{flaggedPosts.length}</span>
                  )}
                </div>
                {loadingFlagged ? (
                  <div className="py-8 text-center text-sm text-console-dim">Loading…</div>
                ) : flaggedPosts.length === 0 ? (
                  <div className="py-8 text-center text-sm text-console-dim">Nothing flagged right now — you are all caught up.</div>
                ) : (
                  <div className="divide-y divide-console-line">
                    {flaggedPosts.map((fp) => (
                      <div key={fp.id} className="p-4 flex gap-3">
                        <SeverityChip severity={fp.severity} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-console-ink mb-1">
                            {fp.authorName}
                            <span className="text-console-dim font-normal"> · {fp.groupName} · {fmtDate(fp.createdAt)}</span>
                          </div>
                          <p className="text-xs text-console-muted leading-relaxed mb-2">{fp.content}</p>
                          {fp.detail && (
                            <div className="text-[11px] text-console-navy bg-console-navy-soft rounded-lg px-2.5 py-1.5 mb-2">{fp.detail}</div>
                          )}
                          {fp.otherOpenRiskFlagCount > 0 && (
                            <div className="flex items-start gap-1.5 text-[11px] text-console-banner-high-text bg-console-banner-high-bg border border-console-banner-high-border rounded-lg px-2.5 py-1.5 mb-2">
                              <ShieldCheck size={12} strokeWidth={1.8} className="flex-shrink-0 mt-0.5" />
                              <span>This client has {fp.otherOpenRiskFlagCount} other open risk flag{fp.otherOpenRiskFlagCount === 1 ? "" : "s"} — review before their next session.</span>
                            </div>
                          )}
                          <button onClick={() => dismissFlagged(fp)}
                            className="text-[11.5px] font-semibold border border-console-line rounded-lg px-3 py-1.5 text-console-muted hover:text-console-ink hover:bg-console-bg transition-colors">
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-console-panel border border-console-line rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-console-line">
                  <Activity size={14} strokeWidth={1.8} className="text-console-muted" />
                  <span className="text-sm font-semibold text-console-ink">Recent activity</span>
                  {activity.length > 0 && (
                    <span className="text-[11px] font-bold text-white bg-console-navy px-2 py-0.5 rounded-full">{activity.length}</span>
                  )}
                </div>
                {loadingActivity ? (
                  <div className="py-8 text-center text-sm text-console-dim">Loading…</div>
                ) : activity.length === 0 ? (
                  <div className="py-8 text-center text-sm text-console-dim">No new posts, replies, or members yet.</div>
                ) : (
                  <>
                    <div className="divide-y divide-console-line">
                      {(activityExpanded ? activity : activity.slice(0, ACTIVITY_PREVIEW_COUNT)).map((a) => (
                        <button
                          key={a.id}
                          onClick={() => openView(a.groupId)}
                          className="w-full text-left p-4 flex gap-3 hover:bg-console-bg/60 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-console-bg flex items-center justify-center flex-shrink-0 text-sm">
                            {a.type === "post" ? "📝" : a.type === "reply" ? "💬" : "🤝"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-console-ink mb-1">
                              {a.authorName}
                              <span className="text-console-dim font-normal">
                                {" "}
                                {a.type === "join" ? "joined" : a.type === "reply" ? "replied in" : "posted in"} {a.groupName} · {timeAgo(new Date(a.createdAt))}
                              </span>
                            </div>
                            {a.content && <p className="text-xs text-console-muted leading-relaxed line-clamp-2">{a.content}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                    {activity.length > ACTIVITY_PREVIEW_COUNT && (
                      <div className="border-t border-console-line px-4 py-2.5 text-center">
                        <button
                          onClick={() => setActivityExpanded((v) => !v)}
                          className="text-xs font-medium text-console-muted hover:text-console-ink transition-colors"
                        >
                          {activityExpanded ? "Show less" : `Show all ${activity.length}`}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bg-console-panel border border-console-line rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-console-line text-sm font-semibold text-console-ink">Your communities</div>
                {communities.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-12 h-12 bg-console-bg rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users size={22} strokeWidth={1.5} className="text-console-dim" />
                    </div>
                    <p className="text-sm font-medium text-console-ink mb-1">No communities yet</p>
                    <p className="text-xs text-console-dim mb-5">Create a community so clients can connect and support each other.</p>
                    <button onClick={openCreate} className="inline-flex items-center gap-1.5 bg-console-navy text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                      <Plus size={14} strokeWidth={2} /> Create your first community
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-console-bg">
                          <th className="text-left px-4 py-2.5 text-[10.5px] font-bold text-console-muted uppercase tracking-wide whitespace-nowrap">Community</th>
                          <th className="text-left px-4 py-2.5 text-[10.5px] font-bold text-console-muted uppercase tracking-wide whitespace-nowrap">Category</th>
                          <th className="text-left px-4 py-2.5 text-[10.5px] font-bold text-console-muted uppercase tracking-wide whitespace-nowrap">Privacy</th>
                          <th className="text-left px-4 py-2.5 text-[10.5px] font-bold text-console-muted uppercase tracking-wide whitespace-nowrap">Members</th>
                          <th className="text-left px-4 py-2.5 text-[10.5px] font-bold text-console-muted uppercase tracking-wide whitespace-nowrap">Posts</th>
                          <th className="text-left px-4 py-2.5 text-[10.5px] font-bold text-console-muted uppercase tracking-wide whitespace-nowrap">Created</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {communities.map((c) => (
                          <tr key={c.id} onClick={() => openView(c.id)} className="border-t border-console-line cursor-pointer hover:bg-console-bg/60 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-console-bg flex items-center justify-center text-sm flex-shrink-0">{c.icon}</span>
                                <span className="font-semibold text-console-ink">{c.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-console-muted">{c.category}</td>
                            <td className="px-4 py-2.5"><PrivacyBadge privacy={c.privacy} /></td>
                            <td className="px-4 py-2.5 text-console-muted">{c.members}</td>
                            <td className="px-4 py-2.5 text-console-muted">{c.postCount}</td>
                            <td className="px-4 py-2.5 text-console-dim text-xs whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => openEdit(c)} title="Edit" className="w-7 h-7 flex items-center justify-center rounded-lg text-console-dim hover:bg-console-bg hover:text-console-ink transition-colors">
                                  <Pencil size={13} strokeWidth={1.5} />
                                </button>
                                <button onClick={() => setDeleteId(c.id)} title="Delete" className="w-7 h-7 flex items-center justify-center rounded-lg text-console-dim hover:bg-red-50 hover:text-red-500 transition-colors">
                                  <Trash2 size={13} strokeWidth={1.5} />
                                </button>
                                <ChevronRight size={14} className="text-console-dim" />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ══ Delete confirmation ══════════════════════════════════════════════════ */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-console-ink mb-1">Delete this community?</h3>
            <p className="text-xs text-console-muted leading-relaxed mb-5">
              <span className="font-medium text-console-ink">&ldquo;{communities.find((c) => c.id === deleteId)?.name}&rdquo;</span>{" "}
              and all its posts will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-console-line text-sm py-2.5 rounded-lg text-console-muted hover:bg-console-bg transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Invite modal ═════════════════════════════════════════════════════════ */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setInviteModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[80vh] flex flex-col z-10">
            <div className="px-5 py-4 border-b border-console-line flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-semibold text-console-ink">Invite a client</h3>
              <button onClick={() => setInviteModalOpen(false)} className="text-console-dim hover:text-console-ink"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {notYetInGroup.length === 0 ? (
                <p className="text-xs text-console-dim text-center py-6">All your clients are already members or invited.</p>
              ) : notYetInGroup.map((c) => (
                <label key={c.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-console-bg cursor-pointer">
                  <input type="checkbox" checked={selectedInviteIds.has(c.id)} onChange={() => toggleInviteSelect(c.id)} className="accent-console-navy" />
                  <RiskDot level={c.riskLevel} />
                  <span className="text-xs font-medium text-console-ink">{c.name}</span>
                </label>
              ))}
            </div>
            <div className="p-3 border-t border-console-line flex gap-2 flex-shrink-0">
              <button onClick={() => setInviteModalOpen(false)} className="flex-1 border border-console-line text-sm py-2 rounded-lg text-console-muted hover:bg-console-bg transition-colors">Cancel</button>
              <button onClick={submitInvites} disabled={selectedInviteIds.size === 0 || invitingBusy}
                className="flex-1 bg-console-navy text-white text-sm font-medium py-2 rounded-lg disabled:opacity-30 transition-opacity">
                {invitingBusy ? "Sending…" : selectedInviteIds.size > 0 ? `Invite ${selectedInviteIds.size}` : "Invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Escalate modal ═══════════════════════════════════════════════════════ */}
      {escalateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEscalateTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-5 z-10 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-console-banner-high-bg rounded-lg flex items-center justify-center flex-shrink-0">
                <Flag size={15} className="text-console-risk-high" strokeWidth={1.8} />
              </div>
              <h3 className="text-sm font-semibold text-console-ink">Escalate to risk review</h3>
            </div>
            <p className="text-xs text-console-muted leading-relaxed">
              This creates a risk flag on this client&rsquo;s individual profile so it surfaces before their next session.
            </p>
            <div>
              <label className="text-[10.5px] font-semibold text-console-dim uppercase tracking-wide block mb-1.5">Severity</label>
              <div className="flex gap-2">
                {(["moderate", "high"] as Severity[]).map((sev) => (
                  <button key={sev} type="button" onClick={() => setEscalateSeverity(sev)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-semibold capitalize transition-colors ${escalateSeverity === sev ? "bg-console-navy border-console-navy text-white" : "border-console-line text-console-muted hover:border-console-navy"}`}>
                    {sev}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10.5px] font-semibold text-console-dim uppercase tracking-wide block mb-1.5">Note</label>
              <textarea value={escalateNote} onChange={(e) => setEscalateNote(e.target.value.slice(0, 500))}
                placeholder={escalateTarget.defaultNote} rows={3}
                className="w-full border border-console-line rounded-lg px-3 py-2 text-xs text-console-ink resize-none focus:outline-none focus:border-console-navy transition-colors" />
              <p className="text-[10px] text-console-dim mt-1">Leave blank to use the auto-generated excerpt.</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEscalateTarget(null)} className="flex-1 border border-console-line text-sm py-2.5 rounded-lg text-console-muted hover:bg-console-bg transition-colors">Cancel</button>
              <button onClick={confirmEscalate} disabled={escalating}
                className="flex-1 bg-console-risk-high text-white text-sm font-medium py-2.5 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity">
                {escalating ? "Escalating…" : "Escalate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeGroupCall && (
        <GroupCallRoom
          sessionId={activeGroupCall.sessionId}
          groupName={activeGroupCall.groupName}
          onEnd={() => setActiveGroupCall(null)}
        />
      )}
    </div>
  );
}
