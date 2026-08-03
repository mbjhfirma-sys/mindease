"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Rss, Compass, Target, ShieldAlert, Send, X, Heart, MessageCircle, Sparkles, Mail, Plus, Paperclip } from "lucide-react";
import TaskActivityModal from "@/components/dashboard/TaskActivityModal";
import UpgradeModal from "@/components/dashboard/UpgradeModal";
import AttachmentGallery, { type Attachment } from "@/components/dashboard/AttachmentGallery";
import { useAchievementCheck } from "@/components/dashboard/AchievementToast";
import { IDENTITY_TAGS } from "@/lib/identityTags";
import { AGE_GROUPS } from "@/lib/ageGroups";
import { getJoinWindow } from "@/lib/video";
import { planById } from "@/lib/clientPlans";
import GroupCallRoom from "@/components/video/GroupCallRoom";

type GroupSessionItem = {
  id: string; scheduledStart: string; durationMin: number;
  maxParticipants: number; rsvpCount: number; hasRsvped: boolean;
};

type Post = {
  id: string; author: string; avatar: string; group: string | null; content: string;
  time: string; likes: number; replies: number; liked: boolean; pinned?: boolean;
  source?: "support" | "therapist";
  attachments?: Attachment[];
};

const ATTACHMENT_ACCEPT = "image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/ogg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Group = {
  id: string; name: string; description: string; category: string;
  icon: string; color: string; nextSession: string | null; members: number; joined: boolean;
  source?: "support" | "therapist"; createdByName?: string | null;
  invited?: boolean; privacy?: "open" | "invite";
  identityTags: string[]; ageGroup: string | null;
};

// ─── Enrichment constants ─────────────────────────────────────────────────────

const GROUP_META: Record<
  string,
  {
    weeklyPosts: number;
    onlineNow: number;
    activity: "active" | "moderate" | "quiet";
    accentBorder: string;
    tagColor: string;
  }
> = {
  sg1: { weeklyPosts: 23, onlineNow: 12, activity: "active",   accentBorder: "border-l-4 border-blue-400",    tagColor: "bg-blue-50 text-blue-700" },
  sg2: { weeklyPosts: 31, onlineNow: 18, activity: "active",   accentBorder: "border-l-4 border-sage-400",    tagColor: "bg-sage-50 text-sage-700" },
  sg3: { weeklyPosts: 9,  onlineNow: 5,  activity: "moderate", accentBorder: "border-l-4 border-purple-400",  tagColor: "bg-purple-50 text-purple-700" },
  sg4: { weeklyPosts: 14, onlineNow: 8,  activity: "moderate", accentBorder: "border-l-4 border-amber-400",   tagColor: "bg-amber-50 text-amber-700" },
  sg5: { weeklyPosts: 7,  onlineNow: 4,  activity: "quiet",    accentBorder: "border-l-4 border-emerald-400", tagColor: "bg-emerald-50 text-emerald-700" },
};

const DEFAULT_META = { weeklyPosts: 8, onlineNow: 4, activity: "moderate" as const, accentBorder: "border-l-4 border-stone-200", tagColor: "bg-stone-50 text-stone-600" };
function getGroupMeta(id: string) { return GROUP_META[id] ?? DEFAULT_META; }

type Challenge = {
  id: string; title: string; description: string; category: string; difficulty: string;
  totalDays: number; activityType: string;
  participantCount: number; joined: boolean; progress: number; completed: boolean; canLogToday: boolean;
};

// ─── Static data ──────────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, React.ReactNode> = {
  feed:       <Rss     size={15} strokeWidth={1.5} />,
  discover:   <Compass size={15} strokeWidth={1.5} />,
  challenges: <Target  size={15} strokeWidth={1.5} />,
  peers:      <Sparkles size={15} strokeWidth={1.5} />,
};

const SECTION_LABELS: Record<Section, string> = {
  feed: "Feed", discover: "Discover", challenges: "Challenges", peers: "Peers",
};

type Section = "feed" | "discover" | "challenges" | "peers";

type PeerMatch = { id: string; name: string; avatar: string | null; sharedGroups: { id: string; name: string }[] };
type FeedFilter = "all" | "mygroups" | "trending";

type Reply = {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  liked: boolean;
  likes: number;
};

const SEED_REPLIES: Record<string, Reply[]> = {
  p1: [
    { id: "r1-1", author: "Anonymous", avatar: "🌊", content: "This made my whole morning. So proud of you — a full week is huge!",                                                       time: "1h ago",   liked: false, likes: 11 },
    { id: "r1-2", author: "Anonymous", avatar: "🌻", content: "I remember my first panic-free week. It really does get easier from there. Keep going 💛",                                  time: "1h ago",   liked: true,  likes: 8  },
    { id: "r1-3", author: "Anonymous", avatar: "☁️", content: "Which breathing technique clicked for you? I'm still searching for the one that works for me.",                             time: "30m ago",  liked: false, likes: 4  },
  ],
  p2: [
    { id: "r2-1", author: "Anonymous", avatar: "🍃", content: "Noticing that your mind wanders IS the practice. That's literally what meditation is training. You're doing it right.",     time: "3h ago",   liked: false, likes: 19 },
    { id: "r2-2", author: "Anonymous", avatar: "🌷", content: "3 weeks in is the hardest part — it clicked for me around week 5. Hang in there!",                                          time: "3.5h ago", liked: true,  likes: 12 },
    { id: "r2-3", author: "Anonymous", avatar: "🐚", content: "Guided meditations helped me way more than silent ones at the start. Have you tried those?",                                time: "2h ago",   liked: false, likes: 7  },
  ],
  p3: [
    { id: "r3-1", author: "Anonymous", avatar: "🌙", content: "Sleep restriction was the most counterintuitive thing my therapist ever suggested and also the most effective. Glad it worked for you!", time: "5h ago",   liked: true,  likes: 14 },
    { id: "r3-2", author: "Anonymous", avatar: "⭐", content: "Can you share what the protocol looked like? I'm curious but my therapist hasn't mentioned it.",                            time: "4.5h ago", liked: false, likes: 6  },
  ],
  p4: [
    { id: "r4-1", author: "Anonymous", avatar: "☀️", content: "No phone for the first hour changed my whole mood in the mornings. Such a simple thing.",                                   time: "23h ago",  liked: false, likes: 22 },
    { id: "r4-2", author: "Anonymous", avatar: "🌿", content: "Saving this. Going to try the walk tomorrow — I always skip it because I 'don't have time' but I definitely do.",           time: "22h ago",  liked: true,  likes: 17 },
    { id: "r4-3", author: "Anonymous", avatar: "💛", content: "The one glass of water before coffee is so easy and I always forget. Adding it today!",                                     time: "20h ago",  liked: false, likes: 9  },
    { id: "r4-4", author: "Anonymous", avatar: "🌸", content: "Thank you for sharing this. Routine posts always help me remember it doesn't have to be complicated.",                      time: "18h ago",  liked: false, likes: 5  },
  ],
  p5: [
    { id: "r5-1", author: "Anonymous", avatar: "💚", content: "I finished exposure therapy 6 months ago. It's hard but absolutely worth it. You've got this.",                             time: "1d ago",   liked: false, likes: 28 },
    { id: "r5-2", author: "Anonymous", avatar: "🌻", content: "Currently in the middle of it. The first few sessions are the toughest — after that your brain starts to learn. Good luck!", time: "23h ago",  liked: true,  likes: 15 },
    { id: "r5-3", author: "Anonymous", avatar: "🍀", content: "It helped me more than anything else I've tried. The nervousness you feel now is completely normal — your therapist will pace it with you.", time: "20h ago", liked: false, likes: 11 },
  ],
};

const REPORT_REASONS = [
  "Harmful or dangerous content",
  "Spam or advertising",
  "Misinformation",
  "Harassment or bullying",
  "Other",
];

interface ReportTarget {
  id: string;
  type: "post" | "reply";
}

// ─── Helper components ────────────────────────────────────────────────────────

function ActivityDot({ activity }: { activity: "active" | "moderate" | "quiet" }) {
  if (activity === "active") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        Active now
      </span>
    );
  }
  if (activity === "moderate") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
        <span className="inline-flex rounded-full h-2 w-2 bg-amber-400" />
        Moderate
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] text-stone-400 font-medium">
      <span className="inline-flex rounded-full h-2 w-2 bg-stone-300" />
      Quiet
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CommunityPage() {
  return (
    <Suspense fallback={null}>
      <CommunityPageInner />
    </Suspense>
  );
}

function CommunityPageInner() {
  const searchParams = useSearchParams();
  const checkAchievements = useAchievementCheck();
  const requestedTab = searchParams.get("tab");
  // "groups" is a legacy alias — the old Groups tab is now split across the sidebar's
  // "Your groups" list and the Discover section, and some already-sent Notification rows
  // in the DB still carry the old ?tab=groups link.
  const initialSection: Section =
    requestedTab === "groups"
      ? "discover"
      : (["feed", "discover", "challenges", "peers"] as const).includes(requestedTab as Section)
      ? (requestedTab as Section)
      : "feed";
  const [section, setSection] = useState<Section>(initialSection);
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [sessionsByGroup, setSessionsByGroup] = useState<Record<string, GroupSessionItem[]>>({});
  const [activeGroupCall, setActiveGroupCall] = useState<{ sessionId: string; groupName: string } | null>(null);
  const [hasLiveSessionAccess, setHasLiveSessionAccess] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => { if (d.user) setHasLiveSessionAccess(planById(d.user.plan).features.liveGroupSessions); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/community/groups")
      .then((r) => r.json())
      .then((d) => {
        const g: Group[] = d.groups ?? [];
        setGroups(g);
      });
    fetch("/api/community/posts")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []));
  }, []);

  useEffect(() => {
    const therapistJoined = groups.filter((g) => g.joined && g.source === "therapist");
    therapistJoined.forEach((g) => {
      fetch(`/api/community/groups/${g.id}/sessions`)
        .then((r) => (r.ok ? r.json() : { sessions: [] }))
        .then((d) => setSessionsByGroup((prev) => ({ ...prev, [g.id]: d.sessions ?? [] })))
        .catch(() => {});
    });
  }, [groups]);

  async function toggleRsvp(groupId: string, sessionId: string, currentlyRsvped: boolean) {
    setSessionsByGroup((prev) => ({
      ...prev,
      [groupId]: (prev[groupId] ?? []).map((s) =>
        s.id === sessionId
          ? { ...s, hasRsvped: !currentlyRsvped, rsvpCount: s.rsvpCount + (currentlyRsvped ? -1 : 1) }
          : s
      ),
    }));
    const res = await fetch(`/api/community/groups/${groupId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupSessionId: sessionId, action: currentlyRsvped ? "cancel_rsvp" : "rsvp" }),
    }).catch(() => null);
    if (!res || !res.ok) {
      // Revert the optimistic update — the plan gate (or another error) rejected it server-side.
      setSessionsByGroup((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] ?? []).map((s) => (s.id === sessionId ? { ...s, hasRsvped: currentlyRsvped, rsvpCount: s.rsvpCount } : s)),
      }));
      if (res && res.status === 403) setHasLiveSessionAccess(false);
    }
  }

  // Feed filter
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");
  const [filterGroupName, setFilterGroupName] = useState<string | null>(null);

  // Discover-groups filter
  const [identityFilter, setIdentityFilter] = useState<string | null>(null);
  const [ageFilter, setAgeFilter] = useState<string | null>(null);

  // Replies
  const [repliesByPost, setRepliesByPost] = useState<Record<string, Reply[]>>(SEED_REPLIES);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  // Report
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Challenges
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [openChallengeTask, setOpenChallengeTask] = useState<Challenge | null>(null);

  const [peerMatches, setPeerMatches] = useState<PeerMatch[]>([]);
  const [peerLoading, setPeerLoading] = useState(false);
  const [peerError, setPeerError] = useState<string | null>(null);

  useEffect(() => {
    if (section !== "peers") return;
    setPeerLoading(true);
    setPeerError(null);
    fetch("/api/community/peers")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) { setPeerError(d.error ?? "Something went wrong"); return; }
        setPeerMatches(d.matches ?? []);
      })
      .catch(() => setPeerError("Something went wrong"))
      .finally(() => setPeerLoading(false));
  }, [section]);

  useEffect(() => {
    fetch("/api/community/challenges")
      .then((r) => r.json())
      .then((d) => setChallenges(d.challenges ?? []));
  }, []);

  // ── Derived state ──────────────────────────────────────────────────────────

  const joinedGroupNames = useMemo(
    () => new Set(groups.filter((g) => g.joined).map((g) => g.name)),
    [groups]
  );

  const filteredPosts = useMemo((): Post[] => {
    // Public support-group posts always show, regardless of membership — only
    // therapist-group posts (private, invite/roster-gated) are restricted to
    // groups the user has actually joined.
    const memberPosts = filterGroupName
      ? posts.filter((p) => p.group === filterGroupName)
      : posts.filter((p) => p.group !== null && (p.source === "support" || joinedGroupNames.has(p.group)));

    if (feedFilter === "trending") {
      return [...memberPosts].sort((a, b) => b.likes - a.likes);
    }
    return [...memberPosts.filter((p) => p.pinned), ...memberPosts.filter((p) => !p.pinned)];
  }, [posts, feedFilter, filterGroupName, joinedGroupNames]);

  const joinedGroups = useMemo(() => groups.filter((g) => g.joined), [groups]);
  const invitedGroups = useMemo(() => groups.filter((g) => !g.joined && g.invited), [groups]);
  const discoverGroups = useMemo(
    () => groups.filter((g) =>
      !g.joined && !g.invited
      && (!identityFilter || g.identityTags.includes(identityFilter))
      && (!ageFilter || g.ageGroup === ageFilter)
    ),
    [groups, identityFilter, ageFilter]
  );

  const activeChallenge = useMemo(() => challenges.filter((c) => c.joined), [challenges]);
  const availableChallenges = useMemo(() => challenges.filter((c) => !c.joined), [challenges]);

  const selectedGroup = useMemo(
    () => (filterGroupName ? groups.find((g) => g.name === filterGroupName) ?? null : null),
    [groups, filterGroupName]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  function toggleLike(id: string) {
    const post = posts.find((p) => p.id === id);
    if (!post) return;
    const action = post.liked ? "unlike" : "like";
    setPosts((p) =>
      p.map((x) =>
        x.id === id ? { ...x, liked: !x.liked, likes: x.liked ? x.likes - 1 : x.likes + 1 } : x
      )
    );
    fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: id, action, postSource: post.source ?? "support" }),
    });
  }

  function toggleReplyLike(postId: string, replyId: string) {
    setRepliesByPost((prev) => ({
      ...prev,
      [postId]: (prev[postId] ?? []).map((r) =>
        r.id === replyId
          ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 }
          : r
      ),
    }));
  }

  function toggleJoin(id: string) {
    const group = groups.find((g) => g.id === id);
    const isJoining = group && !group.joined;
    setGroups((g) =>
      g.map((x) =>
        x.id === id
          ? { ...x, joined: !x.joined, members: x.joined ? x.members - 1 : x.members + 1 }
          : x
      )
    );
    fetch("/api/community/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: id, action: isJoining ? "join" : "leave", source: group?.source ?? "support" }),
    }).then(() => { if (isJoining) checkAchievements(); });
    if (isJoining && group) {
      setFilterGroupName(group.name);
      setFeedFilter("mygroups");
      setSection("feed");
    } else if (!isJoining && filterGroupName === group?.name) {
      clearGroupFilter();
    }
  }

  function declineInvite(id: string) {
    const group = groups.find((g) => g.id === id);
    // Invite-only groups only appear in the list because of the invite — remove them
    // entirely. Open groups stay listed under Discover, just no longer flagged as invited.
    setGroups((g) =>
      group?.privacy === "open"
        ? g.map((x) => (x.id === id ? { ...x, invited: false } : x))
        : g.filter((x) => x.id !== id)
    );
    fetch("/api/community/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: id, action: "decline", source: group?.source ?? "therapist" }),
    });
  }

  function viewGroupPosts(groupName: string) {
    setFilterGroupName(groupName);
    setFeedFilter("mygroups");
    setSection("feed");
  }

  function clearGroupFilter() {
    setFilterGroupName(null);
  }

  async function submitPost() {
    if (!newPost.trim() || !selectedGroup) return;
    setPosting(true);
    const content = newPost.trim();
    const group = selectedGroup;
    const filesToUpload = pendingAttachments;
    try {
      const r = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, groupId: group.id, anonymous: true, groupSource: group.source ?? "support" }),
      });
      const d = await r.json();
      const postId: string | undefined = d.post?.id;

      let uploaded: Attachment[] = [];
      if (postId && filesToUpload.length > 0) {
        const results = await Promise.all(
          filesToUpload.map(async (file) => {
            const form = new FormData();
            form.append("postId", postId);
            form.append("postSource", group.source ?? "support");
            form.append("file", file);
            const ar = await fetch("/api/community/posts/attachments", { method: "POST", body: form });
            if (!ar.ok) return null;
            const ad = await ar.json();
            return (ad.attachment as Attachment) ?? null;
          })
        );
        uploaded = results.filter((a): a is Attachment => a != null);
      }

      const optimistic: Post = {
        id: postId ?? `p${Date.now()}`,
        author: "Anonymous",
        avatar: "○",
        group: group.name,
        content,
        time: "Just now",
        likes: 0,
        replies: 0,
        liked: false,
        attachments: uploaded,
      };
      setPosts((p) => [optimistic, ...p]);
      setNewPost("");
      setPendingAttachments([]);
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

  async function submitReply(postId: string) {
    const text = replyInputs[postId]?.trim();
    if (!text || replyingId) return;
    setReplyingId(postId);
    const post = posts.find((p) => p.id === postId);
    try {
      const r = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "reply", postId, content: text, postSource: post?.source ?? "support" }),
      });
      if (!r.ok) return;
      const d = await r.json();
      const reply: Reply = {
        id: d.reply?.id ?? `r-${Date.now()}`,
        author: "Anonymous",
        avatar: "○",
        content: text,
        time: "Just now",
        liked: false,
        likes: 0,
      };
      setRepliesByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), reply] }));
      setPosts((p) => p.map((x) => (x.id === postId ? { ...x, replies: x.replies + 1 } : x)));
      setReplyInputs((prev) => ({ ...prev, [postId]: "" }));
    } finally {
      setReplyingId(null);
    }
  }

  function openReport(id: string, type: "post" | "reply") {
    setReportTarget({ id, type });
    setReportSubmitted(false);
  }

  async function submitReport(reason: string) {
    if (!reportTarget) return;
    await fetch("/api/community/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: reportTarget.id, targetType: reportTarget.type, reason }),
    });
    setReportedIds((prev) => new Set(prev).add(reportTarget.id));
    setReportSubmitted(true);
  }

  function closeReport() {
    setReportTarget(null);
    setReportSubmitted(false);
  }

  async function joinChallenge(id: string) {
    setChallenges((prev) => prev.map((c) => (c.id === id ? { ...c, joined: true, canLogToday: true } : c)));
    await fetch("/api/community/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: id }),
    });
  }

  function logChallengeProgress(id: string) {
    const challenge = challenges.find((c) => c.id === id);
    if (challenge) setOpenChallengeTask(challenge);
  }

  async function completeChallengeLog(challengeId: string, responseData?: Record<string, unknown>) {
    const r = await fetch(`/api/community/challenges/${challengeId}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responseData }),
    });
    const d = await r.json();
    if (r.ok) {
      setChallenges((prev) =>
        prev.map((c) => (c.id === challengeId ? { ...c, progress: d.progress ?? c.progress, completed: !!d.completed, canLogToday: false } : c))
      );
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Community</h1>
        <p className="text-sm text-stone-500 mt-1">Anonymous, safe, and peer-supported</p>
      </div>

      {/* Safety banner */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-xs text-stone-500 flex items-start gap-2">
        <ShieldAlert size={13} className="flex-shrink-0 mt-0.5 text-stone-400" strokeWidth={1.5} />
        <span>
          All posts are fully anonymous. Community guidelines apply. For immediate help,{" "}
          <a href="tel:988" className="underline font-medium text-stone-700">call 988</a>.
        </span>
      </div>

      {/* Mobile section nav — the persistent rail below collapses into this on small screens */}
      <div className="md:hidden flex overflow-x-auto scrollbar-none gap-1.5 -mx-1 px-1">
        {(["feed", "discover", "challenges", "peers"] as Section[]).map((s) => (
          <button
            key={s}
            onClick={() => { setSection(s); if (s !== "feed") clearGroupFilter(); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors flex-shrink-0 whitespace-nowrap ${
              section === s ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500"
            }`}
          >
            {SECTION_ICONS[s]}
            {SECTION_LABELS[s]}
            {s === "discover" && invitedGroups.length > 0 && (
              <span className="text-[9px] font-bold bg-violet-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">{invitedGroups.length}</span>
            )}
            {s === "challenges" && activeChallenge.length > 0 && (
              <span className={`text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center ${section === s ? "bg-white text-stone-900" : "bg-stone-900 text-white"}`}>{activeChallenge.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══ Workspace layout: persistent nav rail + main pane ══════════════════ */}
      <div className="md:flex md:items-start md:gap-6">
        {/* Nav rail — desktop only */}
        <aside className="hidden md:flex md:flex-col w-60 flex-shrink-0 bg-white border border-stone-100 rounded-2xl p-3 gap-0.5 sticky top-6">
          {(["feed", "discover", "challenges", "peers"] as Section[]).map((s) => {
            const active = section === s && (s !== "feed" || !filterGroupName);
            return (
              <button
                key={s}
                onClick={() => { setSection(s); if (s !== "feed") clearGroupFilter(); }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-stone-100 text-stone-900" : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                }`}
              >
                {SECTION_ICONS[s]}
                <span className="flex-1 text-left">{SECTION_LABELS[s]}</span>
                {s === "discover" && invitedGroups.length > 0 && (
                  <span className="text-[10px] font-bold bg-violet-600 text-white rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">{invitedGroups.length}</span>
                )}
                {s === "challenges" && activeChallenge.length > 0 && (
                  <span className="text-[10px] font-bold bg-stone-900 text-white rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">{activeChallenge.length}</span>
                )}
              </button>
            );
          })}

          {joinedGroups.length > 0 && (
            <>
              <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider px-3 pt-4 pb-1.5">
                Your groups
              </div>
              {joinedGroups.map((g) => {
                const meta = getGroupMeta(g.id);
                const active = section === "feed" && filterGroupName === g.name;
                return (
                  <button
                    key={g.id}
                    onClick={() => viewGroupPosts(g.name)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      active ? "bg-sage-50 text-sage-800" : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                    }`}
                  >
                    <span className="text-base leading-none flex-shrink-0">{g.icon}</span>
                    <span className="flex-1 text-left truncate">{g.name}</span>
                    {meta.activity === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </>
          )}

          <button
            onClick={() => setSection("discover")}
            className="flex items-center gap-2.5 px-3 py-2 mt-2 rounded-lg text-xs font-medium text-sage-700 hover:bg-sage-50 transition-colors"
          >
            <Plus size={14} strokeWidth={2} />
            Browse groups
          </button>
        </aside>

        {/* Main pane */}
        <div className="flex-1 min-w-0 space-y-4 mt-4 md:mt-0">
          {/* ══ Feed ════════════════════════════════════════════════════════════ */}
          {section === "feed" && (
            <div className="space-y-4">
              {/* Mobile: joined-group quick chips (the rail's "Your groups" equivalent) */}
              {joinedGroups.length > 0 && (
                <div className="md:hidden flex gap-2 overflow-x-auto scrollbar-none pb-1">
                  {joinedGroups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => viewGroupPosts(g.name)}
                      className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                        filterGroupName === g.name ? "bg-stone-900 border-stone-900 text-white" : "border-stone-200 text-stone-600"
                      }`}
                    >
                      <span>{g.icon}</span>{g.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Group detail header — shown when a specific group is selected from the rail */}
              {selectedGroup && (() => {
                const meta = getGroupMeta(selectedGroup.id);
                return (
                  <div className={`bg-white border border-stone-200 rounded-2xl overflow-hidden ${meta.accentBorder}`}>
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl leading-none flex-shrink-0">{selectedGroup.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-semibold text-stone-900">{selectedGroup.name}</h2>
                            <ActivityDot activity={meta.activity} />
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.tagColor}`}>
                              {selectedGroup.category}
                            </span>
                            <span className="text-[11px] text-stone-400">{selectedGroup.members.toLocaleString()} members</span>
                            <span className="text-[11px] text-stone-400">{meta.weeklyPosts} posts/week</span>
                            <span className="text-[11px] text-stone-400">{meta.onlineNow} online</span>
                            {selectedGroup.source === "therapist" && selectedGroup.createdByName && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                                🩺 {selectedGroup.createdByName}
                              </span>
                            )}
                            {selectedGroup.nextSession && (
                              <span className="text-[11px] text-stone-400">
                                Next session: <span className="font-semibold text-stone-600">{selectedGroup.nextSession}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 mt-2 leading-relaxed">{selectedGroup.description}</p>
                        </div>
                        <button
                          onClick={() => toggleJoin(selectedGroup.id)}
                          className="text-xs text-stone-400 hover:text-red-500 font-medium flex-shrink-0"
                        >
                          Leave
                        </button>
                      </div>

                      {/* Live sessions (therapist-hosted groups only) */}
                      {selectedGroup.source === "therapist" && (sessionsByGroup[selectedGroup.id]?.length ?? 0) > 0 && (
                        <div className="border-t border-stone-100 mt-4 pt-3 space-y-2">
                          <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Upcoming live sessions</div>
                          {sessionsByGroup[selectedGroup.id].map((s) => {
                            const start = new Date(s.scheduledStart);
                            const jw = getJoinWindow(start, s.durationMin);
                            return (
                              <div key={s.id} className="flex items-center gap-3 text-xs">
                                <span className="text-stone-600 font-medium whitespace-nowrap">
                                  {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                                  {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                </span>
                                <span className="text-stone-400 whitespace-nowrap">{s.rsvpCount} going</span>
                                {!hasLiveSessionAccess ? (
                                  <button
                                    onClick={() => setShowUpgradeModal(true)}
                                    className="ml-auto text-amber-700 border border-amber-200 bg-amber-50 px-3 py-1 rounded-lg font-medium hover:border-amber-400 transition-colors flex-shrink-0 whitespace-nowrap"
                                  >
                                    Upgrade to join
                                  </button>
                                ) : jw.isOpen ? (
                                  <button
                                    onClick={() => setActiveGroupCall({ sessionId: s.id, groupName: selectedGroup.name })}
                                    className="ml-auto bg-stone-900 text-white px-3 py-1 rounded-lg font-semibold hover:bg-stone-800 transition-colors flex-shrink-0"
                                  >
                                    Join
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => toggleRsvp(selectedGroup.id, s.id, s.hasRsvped)}
                                    className={`ml-auto px-3 py-1 rounded-lg font-medium border transition-colors flex-shrink-0 ${
                                      s.hasRsvped ? "bg-stone-900 border-stone-900 text-white" : "border-stone-200 text-stone-600 hover:border-stone-400"
                                    }`}
                                  >
                                    {s.hasRsvped ? "Going ✓" : "RSVP"}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="border-t border-stone-100 px-5 py-2.5">
                      <button
                        onClick={clearGroupFilter}
                        className="text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1"
                      >
                        <X size={12} /> Clear filter — show all groups
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Compose box — only shown once a specific community is selected */}
              {selectedGroup && (
                <div className="bg-white border border-stone-100 rounded-xl p-4">
                  <label className="text-xs font-medium text-stone-500 mb-2 block">
                    Share with {selectedGroup.name}
                  </label>
                  <div className="flex gap-3 mb-3">
                    <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs text-stone-400 flex-shrink-0 mt-0.5">
                      A
                    </div>
                    <div className="flex-1 relative">
                      <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value.slice(0, 280))}
                        placeholder="What's on your mind? You're anonymous here…"
                        rows={4}
                        className="w-full text-sm text-stone-700 placeholder-stone-400 resize-none focus:outline-none leading-relaxed"
                      />
                      <div className="text-[10px] text-stone-400 text-right mt-1">
                        {newPost.length}/280
                      </div>
                    </div>
                  </div>

                  {pendingAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {pendingAttachments.map((file, i) => (
                        <span key={`${file.name}-${i}`} className="flex items-center gap-1.5 text-[11px] bg-stone-50 border border-stone-200 text-stone-600 rounded-full pl-2.5 pr-1.5 py-1">
                          <span className="max-w-[140px] truncate">{file.name}</span>
                          <span className="text-stone-400">{formatBytes(file.size)}</span>
                          <button onClick={() => removePendingAttachment(i)} className="text-stone-400 hover:text-red-500 transition-colors">
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {attachmentError && <p className="text-[11px] text-red-500 mb-3">{attachmentError}</p>}

                  <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                    <label className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 cursor-pointer transition-colors">
                      <Paperclip size={14} strokeWidth={1.5} />
                      <span className="hidden sm:inline">Attach</span>
                      <input type="file" multiple accept={ATTACHMENT_ACCEPT} onChange={handleAttachmentSelect} className="hidden" />
                    </label>
                    <button
                      onClick={submitPost}
                      disabled={!newPost.trim() || posting}
                      className="bg-stone-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Send size={11} strokeWidth={2} />
                      {posting ? "Posting…" : "Post"}
                    </button>
                  </div>
                </div>
              )}

              {/* Filter chips */}
              <div className="flex gap-2">
                {(["all", "trending"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFeedFilter(f as FeedFilter); setFilterGroupName(null); }}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                      feedFilter === f && !filterGroupName
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                    }`}
                  >
                    {f === "all" ? "All" : "Trending"}
                  </button>
                ))}
              </div>

              {/* Posts */}
              {filteredPosts.length === 0 && (
                joinedGroups.length === 0 ? (
                  <div className="bg-white border border-stone-100 rounded-xl p-8 text-center">
                    <p className="text-sm font-medium text-stone-700 mb-1">You haven&apos;t joined any groups yet</p>
                    <p className="text-xs text-stone-400 mb-4">Join a group to see posts and connect with others.</p>
                    <button
                      onClick={() => setSection("discover")}
                      className="text-xs font-semibold bg-sage-700 hover:bg-sage-800 text-white px-4 py-2 rounded-xl transition-colors"
                    >
                      Browse groups →
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-stone-400 text-center py-8">No posts in this group yet.</p>
                )
              )}

              {filteredPosts.map((post) => {
                const isExpanded = expandedPost === post.id;
                const postReplies = repliesByPost[post.id] ?? [];
                const isReported = reportedIds.has(post.id);

                // Derive group accent
                const matchedGroup = groups.find((g) => g.name === post.group);
                const groupMeta = matchedGroup ? getGroupMeta(matchedGroup.id) : null;
                const accentBorder = groupMeta?.accentBorder ?? "border-l-4 border-stone-200";
                const tagColor = groupMeta?.tagColor ?? "bg-stone-50 text-stone-600";

                return (
                  <div
                    key={post.id}
                    className={`bg-white border rounded-2xl overflow-hidden ${accentBorder} ${
                      post.pinned ? "border-stone-200" : "border-stone-100"
                    }`}
                  >
                    <div className="p-5">
                      {post.pinned && (
                        <div className="text-[10px] text-stone-400 font-medium uppercase tracking-wider mb-2">
                          Pinned
                        </div>
                      )}

                      {/* Author row */}
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs text-stone-500 flex-shrink-0">
                          {post.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-stone-700">{post.author}</div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tagColor}`}>
                              {post.group}
                            </span>
                            <span className="text-[10px] text-stone-400">{post.time}</span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      {isReported ? (
                        <p className="text-sm text-stone-400 italic">
                          You reported this post. It&apos;s under review.
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-stone-700 leading-relaxed">{post.content}</p>
                          {post.attachments && post.attachments.length > 0 && (
                            <div className="mt-3">
                              <AttachmentGallery attachments={post.attachments} />
                            </div>
                          )}
                        </>
                      )}

                      {/* Action row */}
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-stone-50">
                        <button
                          onClick={() => toggleLike(post.id)}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${
                            post.liked ? "text-rose-500" : "text-stone-400 hover:text-stone-600"
                          }`}
                        >
                          <Heart
                            size={13}
                            strokeWidth={1.5}
                            fill={post.liked ? "currentColor" : "none"}
                          />
                          <span>{post.likes}</span>
                        </button>
                        <button
                          onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${
                            isExpanded ? "text-stone-800 font-medium" : "text-stone-400 hover:text-stone-600"
                          }`}
                        >
                          <MessageCircle size={13} strokeWidth={1.5} />
                          <span>
                            {post.replies} {post.replies === 1 ? "reply" : "replies"}
                          </span>
                        </button>
                        {!isReported && (
                          <button
                            onClick={() => openReport(post.id, "post")}
                            className="ml-auto text-xs text-stone-300 hover:text-red-400 transition-colors"
                          >
                            Report
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Replies panel */}
                    {isExpanded && (
                      <div className="border-t border-stone-100 bg-stone-50/60">
                        {postReplies.length > 0 ? (
                          <div className="divide-y divide-stone-100">
                            {postReplies.map((reply) => {
                              const replyReported = reportedIds.has(reply.id);
                              return (
                                <div key={reply.id} className="px-5 py-4 flex gap-2.5">
                                  <div className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5">
                                    {reply.avatar}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[11px] font-medium text-stone-600">
                                        {reply.author}
                                      </span>
                                      <span className="text-[10px] text-stone-400">{reply.time}</span>
                                    </div>
                                    {replyReported ? (
                                      <p className="text-xs text-stone-400 italic">
                                        You reported this reply.
                                      </p>
                                    ) : (
                                      <p className="text-xs text-stone-700 leading-relaxed">
                                        {reply.content}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2">
                                      <button
                                        onClick={() => toggleReplyLike(post.id, reply.id)}
                                        className={`flex items-center gap-1 text-[11px] transition-colors ${
                                          reply.liked
                                            ? "text-rose-500"
                                            : "text-stone-400 hover:text-stone-600"
                                        }`}
                                      >
                                        <Heart
                                          size={11}
                                          strokeWidth={1.5}
                                          fill={reply.liked ? "currentColor" : "none"}
                                        />
                                        {reply.likes}
                                      </button>
                                      {!replyReported && (
                                        <button
                                          onClick={() => openReport(reply.id, "reply")}
                                          className="text-[11px] text-stone-300 hover:text-red-400 transition-colors"
                                        >
                                          Report
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="px-5 py-4 text-xs text-stone-400">
                            No replies yet. Be the first to respond.
                          </p>
                        )}

                        {/* Reply compose */}
                        <div className="px-4 py-3 border-t border-stone-100 flex gap-2.5 items-center">
                          <div className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[11px] text-stone-400 flex-shrink-0">
                            A
                          </div>
                          <input
                            value={replyInputs[post.id] ?? ""}
                            onChange={(e) =>
                              setReplyInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && !e.shiftKey && submitReply(post.id)
                            }
                            placeholder="Write a reply…"
                            className="flex-1 text-xs text-stone-700 placeholder-stone-400 bg-white border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-300"
                          />
                          <button
                            onClick={() => submitReply(post.id)}
                            disabled={!replyInputs[post.id]?.trim() || replyingId === post.id}
                            className="text-xs bg-stone-900 text-white px-2.5 py-1.5 rounded-lg disabled:opacity-30 hover:bg-stone-800 transition-colors flex-shrink-0"
                          >
                            <Send size={10} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ══ Discover ═══════════════════════════════════════════════════════ */}
          {section === "discover" && (
            <div className="space-y-6">
              {/* Invited */}
              {invitedGroups.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xs font-semibold text-violet-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail size={12} strokeWidth={2} /> Invited to join
                  </h2>
                  {invitedGroups.map((group) => (
                    <div
                      key={group.id}
                      className="bg-violet-50/50 border border-violet-200 rounded-2xl overflow-hidden"
                    >
                      <div className="pl-5 pr-5 pt-5 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl leading-none">{group.icon}</span>
                          <span className="text-sm font-semibold text-stone-900 flex-1">
                            {group.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 ml-8 mb-2 flex-wrap">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                            {group.category}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {group.members.toLocaleString()} members
                          </span>
                          {group.createdByName && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                              🩺 Invited by {group.createdByName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-stone-500 leading-relaxed mt-2">
                          {group.description}
                        </p>
                      </div>
                      <div className="border-t border-violet-200 px-5 py-3 flex items-center gap-2">
                        <button
                          onClick={() => declineInvite(group.id)}
                          className="text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors px-3 py-1.5"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => toggleJoin(group.id)}
                          className="ml-auto text-xs font-medium px-4 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors flex-shrink-0"
                        >
                          Accept invite
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Filter chips */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setAgeFilter(null)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${!ageFilter ? "bg-stone-900 border-stone-900 text-white" : "border-stone-200 text-stone-500 hover:border-stone-400"}`}
                  >
                    Any age
                  </button>
                  {AGE_GROUPS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAgeFilter((f) => (f === a.id ? null : a.id))}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${ageFilter === a.id ? "bg-stone-900 border-stone-900 text-white" : "border-stone-200 text-stone-500 hover:border-stone-400"}`}
                    >
                      {a.label}
                    </button>
                  ))}
                  <span className="w-px bg-stone-200 mx-1" />
                  {IDENTITY_TAGS.map((t) => (
                    <button
                      key={t.id}
                      title={t.description}
                      onClick={() => setIdentityFilter((f) => (f === t.id ? null : t.id))}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${identityFilter === t.id ? "bg-stone-900 border-stone-900 text-white" : "border-stone-200 text-stone-500 hover:border-stone-400"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {discoverGroups.length === 0 ? (
                  <p className="text-xs text-stone-400 py-4 text-center">No groups match those filters.</p>
                ) : discoverGroups.map((group) => {
                    const meta = getGroupMeta(group.id);
                    return (
                      <div
                        key={group.id}
                        className={`bg-white border border-stone-100 rounded-2xl overflow-hidden ${meta?.accentBorder ?? ""}`}
                      >
                        <div className="pl-5 pr-5 pt-5 pb-4">
                          {/* Row 1 */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl leading-none">{group.icon}</span>
                            <span className="text-sm font-semibold text-stone-900 flex-1">
                              {group.name}
                            </span>
                            {meta && <ActivityDot activity={meta.activity} />}
                          </div>

                          {/* Row 2 */}
                          <div className="flex items-center gap-2 ml-8 mb-2 flex-wrap">
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${meta?.tagColor ?? "bg-stone-50 text-stone-600"}`}
                            >
                              {group.category}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {group.members.toLocaleString()} members
                            </span>
                            {group.source === "therapist" && group.createdByName && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                                🩺 {group.createdByName}
                              </span>
                            )}
                            {group.ageGroup && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-50 text-stone-500 border border-stone-100">
                                {AGE_GROUPS.find((a) => a.id === group.ageGroup)?.label ?? group.ageGroup}
                              </span>
                            )}
                            {group.identityTags.map((tagId) => (
                              <span key={tagId} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-50 text-stone-500 border border-stone-100">
                                {IDENTITY_TAGS.find((t) => t.id === tagId)?.label ?? tagId}
                              </span>
                            ))}
                          </div>

                          {/* Row 3 */}
                          <p className="text-sm text-stone-500 leading-relaxed mt-2">
                            {group.description}
                          </p>
                        </div>

                        {/* Divider + join */}
                        <div className="border-t border-stone-100 px-5 py-3 flex items-center gap-3">
                          {group.nextSession && (
                            <span className="text-[11px] text-stone-500 flex-1">
                              Next session:{" "}
                              <span className="font-semibold text-stone-700">{group.nextSession}</span>
                            </span>
                          )}
                          <button
                            onClick={() => toggleJoin(group.id)}
                            className="ml-auto text-xs font-medium px-4 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors flex-shrink-0"
                          >
                            Join group
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ══ Challenges ══════════════════════════════════════════════════════ */}
          {section === "challenges" && (
            <div className="space-y-6">
              {/* Active challenges */}
              {activeChallenge.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    In Progress
                  </h2>
                  {activeChallenge.map((c) => {
                    const pct = Math.round((c.progress / c.totalDays) * 100);
                    const daysLeft = Math.max(c.totalDays - c.progress, 0);
                    return (
                      <div
                        key={c.id}
                        className="bg-white border-2 border-stone-200 rounded-2xl p-5"
                      >
                        {/* Top row */}
                        <div className="flex items-start gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-semibold text-stone-900 flex-1">{c.title}</h3>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                            {c.category}
                          </span>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              c.difficulty === "Moderate"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {c.difficulty}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-stone-500 mt-1 mb-4">{c.description}</p>

                        {/* Progress section */}
                        <div className="flex justify-between items-baseline mb-1.5 text-xs">
                          <span className="text-stone-700 font-medium">
                            Day {c.progress} of {c.totalDays}
                          </span>
                          <span className="text-stone-400">
                            {c.participantCount.toLocaleString()} joined
                          </span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-2 mb-1.5">
                          <div
                            className="bg-stone-800 h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {!c.completed && (
                          <p className="text-[11px] text-stone-400 mb-4">
                            {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
                          </p>
                        )}

                        {/* CTA */}
                        <button
                          onClick={() => logChallengeProgress(c.id)}
                          disabled={c.completed || !c.canLogToday}
                          className="w-full bg-stone-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {c.completed ? "Completed! 🎉" : !c.canLogToday ? "Logged today ✓" : "Log today's activity"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Available challenges */}
              {availableChallenges.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Available Challenges
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {availableChallenges.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white border border-stone-100 rounded-xl p-4 flex flex-col"
                      >
                        {/* Pills */}
                        <div className="flex gap-1.5 flex-wrap mb-2">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                            {c.category}
                          </span>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              c.difficulty === "Moderate"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {c.difficulty}
                          </span>
                        </div>

                        {/* Title + desc */}
                        <h3 className="text-sm font-semibold text-stone-900 mt-1">{c.title}</h3>
                        <p className="text-xs text-stone-400 mt-1 leading-relaxed flex-1">{c.description}</p>

                        {/* Meta */}
                        <p className="text-[11px] text-stone-400 mt-2">
                          {c.totalDays} days · {c.participantCount.toLocaleString()} joined
                        </p>

                        {/* Join */}
                        <button
                          onClick={() => joinChallenge(c.id)}
                          className="mt-3 w-full bg-stone-900 text-white text-xs font-medium py-2 rounded-lg hover:bg-stone-800 transition-colors"
                        >
                          Join challenge
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {challenges.length > 0 && challenges.every((c) => c.joined) && (
                <p className="text-sm text-stone-400 text-center py-4">
                  You&apos;ve joined all available challenges. Keep going!
                </p>
              )}
            </div>
          )}

          {/* ══ Peers ═══════════════════════════════════════════════════════════ */}
          {section === "peers" && (
            <div className="space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-xs text-stone-500">
                Matched by the community groups you share — never by diagnosis or clinical data. Turn this on or off anytime in Settings → Privacy.
              </div>
              {peerLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white border border-stone-100 rounded-xl" />)}
                </div>
              ) : peerError ? (
                <div className="bg-white border border-stone-100 rounded-xl py-12 text-center">
                  <p className="text-sm text-stone-500">{peerError}</p>
                </div>
              ) : peerMatches.length === 0 ? (
                <div className="bg-white border border-stone-100 rounded-xl py-12 text-center">
                  <p className="text-sm text-stone-400">No matches yet — join a support group to find people like you.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {peerMatches.map((p) => (
                    <div key={p.id} className="bg-white border border-stone-100 rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center text-sm font-semibold text-stone-600 flex-shrink-0 overflow-hidden">
                        {p.avatar ? <img src={p.avatar} alt="" className="w-full h-full object-cover" /> : p.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-stone-800">{p.name}</div>
                        <div className="text-xs text-stone-400 truncate">
                          Shares {p.sharedGroups.length} {p.sharedGroups.length === 1 ? "group" : "groups"}: {p.sharedGroups.map((g) => g.name).join(", ")}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (p.sharedGroups[0]) viewGroupPosts(p.sharedGroups[0].name);
                          else setSection("feed");
                        }}
                        className="text-xs border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors flex-shrink-0"
                      >
                        View group posts
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ Report modal ══════════════════════════════════════════════════════ */}
      {reportTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={closeReport}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {reportSubmitted ? (
              <div className="px-6 py-8 text-center">
                <div className="text-3xl mb-3">🛡️</div>
                <h3 className="text-sm font-semibold text-stone-900 mb-1">Report submitted</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Thank you for helping keep the community safe. Our moderators will review this{" "}
                  {reportTarget.type}.
                </p>
                <button
                  onClick={closeReport}
                  className="mt-5 w-full bg-stone-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-stone-800 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="px-5 py-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-stone-900">
                    Report {reportTarget.type}
                  </h3>
                  <button
                    onClick={closeReport}
                    className="text-stone-400 hover:text-stone-700 transition-colors p-1"
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>
                <p className="text-xs text-stone-500 mb-4">
                  Why are you reporting this? Your report is anonymous.
                </p>
                <div className="space-y-2">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => submitReport(reason)}
                      className="w-full text-left text-sm text-stone-700 px-4 py-3 rounded-xl border border-stone-100 hover:border-stone-300 hover:bg-stone-50 transition-all"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {openChallengeTask && (
        <TaskActivityModal
          mission={{
            id: openChallengeTask.id,
            title: openChallengeTask.title,
            description: openChallengeTask.description,
            category: openChallengeTask.category,
            duration: 10,
            activityType: openChallengeTask.activityType,
          }}
          onComplete={(id, data) => { completeChallengeLog(id, data); setOpenChallengeTask(null); }}
          onClose={() => setOpenChallengeTask(null)}
        />
      )}

      {activeGroupCall && (
        <GroupCallRoom
          sessionId={activeGroupCall.sessionId}
          groupName={activeGroupCall.groupName}
          onEnd={() => setActiveGroupCall(null)}
        />
      )}

      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          title="Live sessions are a Growth & Premium feature"
          description="Upgrade your plan to join live group sessions hosted by therapists."
        />
      )}
    </div>
  );
}
