"use client";

import { useState, useMemo } from "react";
import {
  Plus, X, Check, Users, Globe, Lock, Pencil, Trash2,
  MessageCircle, Pin, ChevronRight, Heart, Send, ShieldCheck,
  Link,
} from "lucide-react";
import { therapistClients } from "@/lib/mockData";

// ── Types ──────────────────────────────────────────────────────────────────────

type Privacy = "open" | "invite";
type CommunityStatus = "active" | "archived";

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  privacy: Privacy;
  status: CommunityStatus;
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
  avatar: string;
  content: string;
  time: string;
  likes: number;
  liked: boolean;
  replies: number;
  pinned: boolean;
  flagged: boolean;
}

interface Reply {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  liked: boolean;
  likes: number;
}

// ── Seed data ──────────────────────────────────────────────────────────────────

const SEED_COMMUNITIES: Community[] = [
  {
    id: "tc1",
    name: "Anxiety & Calm",
    description: "A safe space for clients managing anxiety to share techniques, progress, and encouragement.",
    category: "Anxiety",
    icon: "🌿",
    privacy: "open",
    status: "active",
    members: 14,
    postCount: 47,
    createdAt: "Mar 12, 2025",
    isOwner: true,
  },
  {
    id: "tc2",
    name: "Sleep Better Together",
    description: "Focus on sleep hygiene, rest routines, and overcoming insomnia with peer support.",
    category: "Sleep",
    icon: "🌙",
    privacy: "open",
    status: "active",
    members: 9,
    postCount: 22,
    createdAt: "Apr 3, 2025",
    isOwner: true,
  },
  {
    id: "tc3",
    name: "Grief & Healing",
    description: "Compassionate space for processing loss, grief, and life transitions.",
    category: "Grief",
    icon: "🕊️",
    privacy: "invite",
    status: "active",
    members: 6,
    postCount: 31,
    createdAt: "May 18, 2025",
    isOwner: true,
  },
  {
    id: "tc4",
    name: "Mindful Mornings",
    description: "Daily mindfulness check-ins and morning routine accountability for all clients.",
    category: "Mindfulness",
    icon: "☀️",
    privacy: "open",
    status: "active",
    members: 31,
    postCount: 112,
    createdAt: "Jan 8, 2025",
    isOwner: false,
    createdByName: "Dr. James Okafor",
  },
  {
    id: "tc5",
    name: "CBT Practice Lab",
    description: "Clients share real-world CBT exercises, thought records, and progress with peers.",
    category: "Other",
    icon: "🧘",
    privacy: "invite",
    status: "active",
    members: 18,
    postCount: 64,
    createdAt: "Feb 14, 2025",
    isOwner: false,
    createdByName: "Dr. Priya Nair",
  },
];

const SEED_POSTS: CommunityPost[] = [
  {
    id: "tp1", communityId: "tc1", author: "Anonymous", avatar: "🌱",
    content: "Used the 4-7-8 breathing technique before my presentation today and it actually worked. First time in years I felt somewhat calm going into a stressful situation.",
    time: "2h ago", likes: 8, liked: false, replies: 3, pinned: true, flagged: false,
  },
  {
    id: "tp2", communityId: "tc1", author: "Anonymous", avatar: "🍃",
    content: "Has anyone tried grounding exercises while commuting? I've been doing the 5-4-3-2-1 method on the bus and getting some weird looks but it genuinely helps.",
    time: "5h ago", likes: 12, liked: false, replies: 5, pinned: false, flagged: false,
  },
  {
    id: "tp3", communityId: "tc2", author: "Anonymous", avatar: "⭐",
    content: "Day 14 of no screens after 9pm. Sleep quality is noticeably better — falling asleep in under 20 minutes now vs the 1–2 hours it used to take.",
    time: "1d ago", likes: 19, liked: false, replies: 6, pinned: true, flagged: false,
  },
  {
    id: "tp4", communityId: "tc2", author: "Anonymous", avatar: "🌙",
    content: "Struggled last night even with the routine. Any tips for when anxiety spikes at bedtime?",
    time: "3h ago", likes: 4, liked: false, replies: 2, pinned: false, flagged: false,
  },
  {
    id: "tp5", communityId: "tc3", author: "Anonymous", avatar: "🕊️",
    content: "Six months since I lost my mom. Some days still feel impossible. But this group has helped me feel less alone in it.",
    time: "4h ago", likes: 21, liked: false, replies: 8, pinned: false, flagged: false,
  },
  {
    id: "tp6", communityId: "tc3", author: "Anonymous", avatar: "🌷",
    content: "Started a memory box this week — photos, notes, small things that remind me of him. My therapist suggested it. It hurts but also feels healing.",
    time: "1d ago", likes: 14, liked: false, replies: 4, pinned: true, flagged: false,
  },
];

const SEED_REPLIES: Record<string, Reply[]> = {
  tp1: [
    { id: "tr1-1", author: "Anonymous", avatar: "🌊", content: "That's amazing — I've been working up to trying 4-7-8 for weeks. What helped you remember to actually do it in the moment?", time: "1h ago", liked: false, likes: 5 },
    { id: "tr1-2", author: "Anonymous", avatar: "🍀", content: "First panic-free week is such a milestone. It genuinely does get easier from here.", time: "45m ago", liked: false, likes: 3 },
    { id: "tr1-3", author: "Dr. Sarah Mitchell", avatar: "👩‍⚕️", content: "So proud of this progress! The 4-7-8 technique is excellent for exactly these situations. Keep building that habit.", time: "30m ago", liked: false, likes: 7 },
  ],
  tp2: [
    { id: "tr2-1", author: "Anonymous", avatar: "🌱", content: "Yes! I do box breathing on my commute. People definitely notice but it genuinely works. You're not alone.", time: "4h ago", liked: false, likes: 8 },
    { id: "tr2-2", author: "Anonymous", avatar: "🌷", content: "I just close my eyes and pretend I'm asleep 😄 nobody questions it.", time: "3h ago", liked: false, likes: 11 },
  ],
  tp3: [
    { id: "tr3-1", author: "Anonymous", avatar: "⭐", content: "Day 9 here and already noticing a difference. How long until you saw the real shift?", time: "23h ago", liked: false, likes: 6 },
    { id: "tr3-2", author: "Anonymous", avatar: "🌙", content: "This is inspiring me to actually try. The screen thing felt impossible but 20 minutes to sleep sounds worth it.", time: "20h ago", liked: false, likes: 4 },
    { id: "tr3-3", author: "Dr. Sarah Mitchell", avatar: "👩‍⚕️", content: "14 days is a great benchmark — the research suggests it takes about 2 weeks for the brain to reset its sleep-wake signals. Keep it up!", time: "18h ago", liked: false, likes: 9 },
  ],
  tp5: [
    { id: "tr5-1", author: "Anonymous", avatar: "🕊️", content: "Six months is still so raw. Thank you for sharing this — it takes courage.", time: "3h ago", liked: false, likes: 12 },
    { id: "tr5-2", author: "Anonymous", avatar: "🌷", content: "You're not alone. This group has helped me too. One day at a time.", time: "2h ago", liked: false, likes: 9 },
    { id: "tr5-3", author: "Dr. Sarah Mitchell", avatar: "👩‍⚕️", content: "Thank you for trusting this community with something so personal. Grief doesn't follow a schedule — what you're feeling is completely valid.", time: "1h ago", liked: false, likes: 14 },
  ],
  tp6: [
    { id: "tr6-1", author: "Anonymous", avatar: "🌿", content: "A memory box is such a beautiful idea. I might try this too.", time: "22h ago", liked: false, likes: 7 },
    { id: "tr6-2", author: "Dr. Sarah Mitchell", avatar: "👩‍⚕️", content: "Memory boxes are a wonderful grief tool — they honour the person while giving your feelings a physical home. How are you feeling after starting it?", time: "20h ago", liked: false, likes: 10 },
  ],
};

// ── Constants ──────────────────────────────────────────────────────────────────

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
};

type Mode = "list" | "create" | "edit" | "view";

// ── Helper components ──────────────────────────────────────────────────────────

function PrivacyBadge({ privacy }: { privacy: Privacy }) {
  if (privacy === "open") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <Globe size={9} strokeWidth={2} /> Open
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
      <Lock size={9} strokeWidth={2} /> Invite only
    </span>
  );
}

// ── Community card ─────────────────────────────────────────────────────────────

function CommunityCard({
  community,
  onEdit,
  onDelete,
  onView,
}: {
  community: Community;
  onEdit?: () => void;
  onDelete?: () => void;
  onView: () => void;
}) {
  return (
    <div className="bg-white border border-stone-100 rounded-xl hover:border-stone-200 transition-colors overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <div className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
          {community.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-stone-900">{community.name}</h3>
            <PrivacyBadge privacy={community.privacy} />
          </div>
          <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
            {community.description || <span className="italic text-stone-300">No description</span>}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-400">
            <span className="bg-stone-100 text-stone-600 font-medium px-2 py-0.5 rounded-full">{community.category}</span>
            {community.isOwner
              ? <span>Created {community.createdAt}</span>
              : <span>By <span className="font-medium text-stone-500">{community.createdByName}</span></span>
            }
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {community.isOwner && onEdit && (
            <button
              onClick={onEdit}
              title="Edit community"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-all"
            >
              <Pencil size={14} strokeWidth={1.5} />
            </button>
          )}
          {community.isOwner && onDelete && (
            <button
              onClick={onDelete}
              title="Delete community"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 transition-all"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          )}
          <button
            onClick={onView}
            className="ml-1 text-stone-300 hover:text-stone-500 transition-colors"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 px-5 py-3 border-t border-stone-50 bg-stone-50/50 rounded-b-xl">
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <Users size={12} strokeWidth={1.5} />
          <span><span className="font-semibold text-stone-700">{community.members}</span> members</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <MessageCircle size={12} strokeWidth={1.5} />
          <span><span className="font-semibold text-stone-700">{community.postCount}</span> posts</span>
        </div>
        <button
          onClick={onView}
          className="ml-auto text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
        >
          {community.isOwner ? "Manage →" : "View →"}
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TherapistCommunityPage() {
  const [communities, setCommunities] = useState<Community[]>(SEED_COMMUNITIES);
  const [posts, setPosts] = useState<CommunityPost[]>(SEED_POSTS);
  const [mode, setMode] = useState<Mode>("list");
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saved, setSaved] = useState(false);

  // Post compose
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);

  // Invite (inline in create/edit form)
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);
  const [invitedClients, setInvitedClients] = useState<Record<string, Set<string>>>({});
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [linkCopied, setLinkCopied] = useState(false);
  const [invitesSent, setInvitesSent] = useState(false);

  // Replies
  const [repliesByPost, setRepliesByPost] = useState<Record<string, Reply[]>>(SEED_REPLIES);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replyTargets, setReplyTargets] = useState<Record<string, string | null>>({});

  const activeCommunity = useMemo(
    () => communities.find((c) => c.id === activeCommunityId) ?? null,
    [communities, activeCommunityId]
  );

  const activePosts = useMemo(
    () => posts
      .filter((p) => p.communityId === activeCommunityId)
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    [posts, activeCommunityId]
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  function openCreate() {
    setForm(BLANK_FORM);
    setSaved(false);
    setMode("create");
  }

  function openEdit(c: Community) {
    setEditingId(c.id);
    setForm({ name: c.name, description: c.description, category: c.category, icon: c.icon, privacy: c.privacy });
    setSaved(false);
    setMode("edit");
  }

  function openView(id: string) {
    setActiveCommunityId(id);
    setNewPost("");
    setMode("view");
  }

  function goList() {
    setMode("list");
    setEditingId(null);
    setActiveCommunityId(null);
    setSaved(false);
    setJustCreatedId(null);
    setSelectedClients(new Set());
    setInvitesSent(false);
    setLinkCopied(false);
  }

  function commitCreate() {
    if (!form.name.trim()) return;
    const id = `tc${Date.now()}`;
    const c: Community = {
      id,
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      icon: form.icon,
      privacy: form.privacy,
      status: "active",
      members: 0,
      postCount: 0,
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      isOwner: true,
    };
    setCommunities([c, ...communities]);
    setSaved(true);
    if (form.privacy === "invite") {
      setJustCreatedId(id);
    } else {
      setTimeout(goList, 1200);
    }
  }

  function commitEdit() {
    if (!form.name.trim() || !editingId) return;
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === editingId
          ? { ...c, name: form.name.trim(), description: form.description.trim(), category: form.category, icon: form.icon, privacy: form.privacy }
          : c
      )
    );
    setSaved(true);
    setTimeout(goList, 1200);
  }

  function toggleClientSelection(clientId: string) {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      next.has(clientId) ? next.delete(clientId) : next.add(clientId);
      return next;
    });
  }

  function copyInviteLink(communityId: string) {
    navigator.clipboard.writeText(`https://mindease.app/join/${communityId}`).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function sendInvites(communityId: string) {
    if (!communityId || selectedClients.size === 0) return;
    setInvitedClients((prev) => {
      const existing = new Set(prev[communityId] ?? []);
      selectedClients.forEach((id) => existing.add(id));
      return { ...prev, [communityId]: existing };
    });
    setSelectedClients(new Set());
    setInvitesSent(true);
  }

  function renderInviteSection(communityId: string) {
    const alreadyInvited = invitedClients[communityId] ?? new Set<string>();
    const uninvited = therapistClients.filter((c) => !alreadyInvited.has(c.id));
    const inviteLink = `https://mindease.app/join/${communityId}`;
    return (
      <div className="pt-5 mt-5 border-t border-stone-100 space-y-4">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-widest">Invite clients</p>

        {/* Link row */}
        <div>
          <p className="text-[11px] text-stone-400 mb-2">Share this link with anyone you want to invite:</p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 min-w-0">
              <Link size={11} strokeWidth={1.5} className="text-stone-400 flex-shrink-0" />
              <span className="text-xs text-stone-600 truncate">{inviteLink}</span>
            </div>
            <button
              type="button"
              onClick={() => copyInviteLink(communityId)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-all flex-shrink-0 ${
                linkCopied
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {linkCopied ? <Check size={12} strokeWidth={2.5} /> : <Link size={12} strokeWidth={1.5} />}
              {linkCopied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Client list */}
        <div>
          <p className="text-[11px] text-stone-400 mb-2">Or invite your clients directly:</p>
          {invitesSent ? (
            <div className="py-5 text-center bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Check size={14} className="text-emerald-600" strokeWidth={2.5} />
              </div>
              <p className="text-xs font-medium text-emerald-800">Invites sent!</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Clients will receive an invitation to join.</p>
            </div>
          ) : (
            <>
              {alreadyInvited.size > 0 && (
                <div className="mb-2 space-y-1">
                  {therapistClients.filter((c) => alreadyInvited.has(c.id)).map((client) => (
                    <div key={client.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-stone-50 border border-stone-100 opacity-60">
                      <div className="w-6 h-6 bg-stone-200 rounded-full flex items-center justify-center text-[11px] font-semibold text-stone-600 flex-shrink-0">
                        {client.name[0]}
                      </div>
                      <div className="flex-1 text-xs font-medium text-stone-700 truncate">{client.name}</div>
                      <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full">Invited</span>
                    </div>
                  ))}
                </div>
              )}
              {uninvited.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-3">All clients have already been invited.</p>
              ) : (
                <>
                  <div className="space-y-1 mb-3">
                    {uninvited.map((client) => {
                      const selected = selectedClients.has(client.id);
                      return (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => toggleClientSelection(client.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all ${
                            selected ? "bg-stone-900 border-stone-900" : "border-stone-200 hover:border-stone-400 bg-white"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${selected ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"}`}>
                            {client.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-medium truncate ${selected ? "text-white" : "text-stone-800"}`}>{client.name}</div>
                            <div className={`text-[10px] truncate ${selected ? "text-white/60" : "text-stone-400"}`}>{client.condition[0]}</div>
                          </div>
                          {selected && <Check size={12} className="text-white flex-shrink-0" strokeWidth={2.5} />}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => sendInvites(communityId)}
                    disabled={selectedClients.size === 0}
                    className="w-full bg-stone-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Send invites{selectedClients.size > 0 ? ` (${selectedClients.size})` : ""}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  function confirmDelete() {
    if (!deleteId) return;
    setCommunities((prev) => prev.filter((c) => c.id !== deleteId));
    setPosts((prev) => prev.filter((p) => p.communityId !== deleteId));
    setDeleteId(null);
  }

  function toggleLike(id: string) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      )
    );
  }

  function toggleReplyLike(postId: string, replyId: string) {
    setRepliesByPost((prev) => ({
      ...prev,
      [postId]: (prev[postId] ?? []).map((r) =>
        r.id === replyId ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 } : r
      ),
    }));
  }

  function replyToComment(postId: string, authorName: string) {
    setExpandedPost(postId);
    setReplyTargets((prev) => ({ ...prev, [postId]: authorName }));
    setReplyInputs((prev) => ({ ...prev, [postId]: `@${authorName} ` }));
  }

  function clearReplyTarget(postId: string) {
    setReplyTargets((prev) => ({ ...prev, [postId]: null }));
  }

  function submitReply(postId: string) {
    const text = replyInputs[postId]?.trim();
    if (!text) return;
    const reply: Reply = {
      id: `tr-${Date.now()}`,
      author: "Dr. Sarah Mitchell",
      avatar: "👩‍⚕️",
      content: text,
      time: "Just now",
      liked: false,
      likes: 0,
    };
    setRepliesByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), reply] }));
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, replies: p.replies + 1 } : p)));
    setReplyInputs((prev) => ({ ...prev, [postId]: "" }));
    setReplyTargets((prev) => ({ ...prev, [postId]: null }));
  }

  function togglePin(id: string) {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p)));
  }

  function deletePost(id: string) {
    const post = posts.find((p) => p.id === id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    if (post) {
      setCommunities((prev) =>
        prev.map((c) => (c.id === post.communityId ? { ...c, postCount: Math.max(0, c.postCount - 1) } : c))
      );
    }
  }

  function submitPost() {
    if (!newPost.trim() || !activeCommunityId) return;
    setPosting(true);
    setTimeout(() => {
      const post: CommunityPost = {
        id: `tp${Date.now()}`,
        communityId: activeCommunityId,
        author: "Dr. Sarah Mitchell",
        avatar: "👩‍⚕️",
        content: newPost.trim(),
        time: "Just now",
        likes: 0,
        liked: false,
        replies: 0,
        pinned: false,
        flagged: false,
      };
      setPosts((prev) => [post, ...prev]);
      setCommunities((prev) =>
        prev.map((c) => (c.id === activeCommunityId ? { ...c, postCount: c.postCount + 1 } : c))
      );
      setNewPost("");
      setPosting(false);
    }, 500);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mode !== "list" && (
            <button onClick={goList} className="text-stone-400 hover:text-stone-700 transition-colors">
              <X size={18} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">
              {mode === "create"
                ? "New Community"
                : mode === "edit"
                ? "Edit Community"
                : mode === "view" && activeCommunity
                ? activeCommunity.name
                : "Communities"}
            </h1>
            {mode === "list" && (
              <p className="text-sm text-stone-500 mt-1">Create and manage communities for your clients</p>
            )}
            {mode === "view" && activeCommunity && (
              <p className="text-sm text-stone-500 mt-0.5">{activeCommunity.category} · {activeCommunity.members} members</p>
            )}
          </div>
        </div>

        {mode === "list" && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors"
          >
            <Plus size={15} strokeWidth={2} /> Create community
          </button>
        )}

        {mode === "view" && activeCommunity && activeCommunity.isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEdit(activeCommunity)}
              className="flex items-center gap-1.5 border border-stone-200 text-stone-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
            >
              <Pencil size={13} strokeWidth={1.5} /> Edit
            </button>
          </div>
        )}
      </div>

      {/* ══ Create / Edit form ══════════════════════════════════════════════════ */}
      {(mode === "create" || mode === "edit") && (
        <div className="bg-white border border-stone-100 rounded-xl p-6">
          {saved ? (
            justCreatedId ? (
              <div className="space-y-0">
                <div className="flex items-center gap-3 py-6 border-b border-stone-100">
                  <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check size={14} className="text-emerald-600" strokeWidth={2.5} />
                  </div>
                  <p className="text-sm font-semibold text-stone-800">Community created! Invite your clients below.</p>
                </div>
                {renderInviteSection(justCreatedId)}
                <div className="pt-4 mt-2 border-t border-stone-100">
                  <button
                    onClick={goList}
                    className="w-full bg-stone-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-stone-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-14 text-center">
                <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check size={18} className="text-white" strokeWidth={2.5} />
                </div>
                <p className="text-sm font-medium text-stone-800">
                  {mode === "edit" ? "Changes saved" : "Community created"}
                </p>
              </div>
            )
          ) : (
            <div className="space-y-5">
              {/* Icon picker */}
              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        form.icon === icon
                          ? "bg-stone-900 ring-2 ring-stone-900 ring-offset-1"
                          : "bg-stone-50 hover:bg-stone-100 border border-stone-100"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">
                  Community name <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Anxiety & Calm"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What is this community about? Who should join?"
                  rows={3}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 resize-none focus:outline-none focus:border-stone-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {/* Privacy */}
                <div>
                  <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Privacy</label>
                  <div className="flex gap-2">
                    {(["open", "invite"] as Privacy[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm({ ...form, privacy: p })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          form.privacy === p
                            ? "bg-stone-900 border-stone-900 text-white"
                            : "border-stone-200 text-stone-600 hover:border-stone-400"
                        }`}
                      >
                        {p === "open" ? <Globe size={13} strokeWidth={1.5} /> : <Lock size={13} strokeWidth={1.5} />}
                        {p === "open" ? "Open" : "Invite only"}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1.5">
                    {form.privacy === "open"
                      ? "Any client can discover and join this community."
                      : "Only clients you invite can join this community."}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={goList}
                  className="flex-1 border border-stone-200 text-sm py-2.5 rounded-lg hover:bg-stone-50 transition-colors text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={mode === "create" ? commitCreate : commitEdit}
                  disabled={!form.name.trim()}
                  className="flex-1 bg-stone-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {mode === "create" ? "Create community" : "Save changes"}
                </button>
              </div>

              {/* Inline invite section — edit mode only, invite-only communities */}
              {mode === "edit" && form.privacy === "invite" && editingId && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  {renderInviteSection(editingId)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ Community feed view ══════════════════════════════════════════════════ */}
      {mode === "view" && activeCommunity && (
        <div className="space-y-4">
          {/* Community info card */}
          <div className="bg-white border border-stone-100 rounded-xl p-5 flex items-center gap-4">
            <div className="w-14 h-14 bg-stone-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
              {activeCommunity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                  {activeCommunity.category}
                </span>
                <PrivacyBadge privacy={activeCommunity.privacy} />
              </div>
              <p className="text-sm text-stone-500 mt-1 leading-relaxed">{activeCommunity.description || <span className="italic text-stone-300">No description</span>}</p>
            </div>
            <div className="flex flex-col items-end gap-1 text-right flex-shrink-0">
              <div className="text-sm font-semibold text-stone-900">{activeCommunity.members}</div>
              <div className="text-[10px] text-stone-400">members</div>
              <div className="text-sm font-semibold text-stone-900 mt-1">{activeCommunity.postCount}</div>
              <div className="text-[10px] text-stone-400">posts</div>
            </div>
          </div>

          {/* Moderation notice / read-only notice */}
          {activeCommunity.isOwner ? (
            <div className="flex items-start gap-2 bg-stone-50 border border-stone-100 rounded-lg px-4 py-3 text-xs text-stone-500">
              <ShieldCheck size={13} strokeWidth={1.5} className="flex-shrink-0 mt-0.5 text-stone-400" />
              <span>You are the moderator of this community. You can pin important posts or remove content that violates guidelines.</span>
            </div>
          ) : (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-xs text-amber-700">
              <Lock size={13} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" />
              <span>This community is managed by <span className="font-medium">{activeCommunity.createdByName}</span>. You can view posts but cannot moderate or post announcements.</span>
            </div>
          )}

          {/* Post compose — owners only */}
          {activeCommunity.isOwner && (
            <div className="bg-white border border-stone-100 rounded-xl p-4">
              <label className="text-xs font-medium text-stone-500 mb-2 block">Post an announcement or message</label>
              <div className="flex gap-3 mb-3">
                <div className="w-7 h-7 bg-stone-900 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0 mt-0.5">
                  D
                </div>
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value.slice(0, 500))}
                  placeholder="Write something for your community…"
                  rows={3}
                  className="flex-1 text-sm text-stone-700 placeholder-stone-400 resize-none focus:outline-none leading-relaxed"
                />
              </div>
              <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                <span className="text-[10px] text-stone-400">{newPost.length}/500</span>
                <button
                  onClick={submitPost}
                  disabled={!newPost.trim() || posting}
                  className="bg-stone-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  <Send size={11} strokeWidth={2} />
                  {posting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          )}

          {/* Posts */}
          {activePosts.length === 0 && (
            <div className="bg-white border border-stone-100 rounded-xl py-12 text-center">
              <p className="text-sm font-medium text-stone-700 mb-1">No posts yet</p>
              <p className="text-xs text-stone-400">Be the first to post — your clients will see it here.</p>
            </div>
          )}

          {activePosts.map((post) => {
            const isExpanded = expandedPost === post.id;
            const postReplies = repliesByPost[post.id] ?? [];
            return (
              <div
                key={post.id}
                className={`bg-white border rounded-2xl overflow-hidden ${
                  post.pinned ? "border-stone-300 border-l-4 border-l-stone-700" : "border-stone-100"
                }`}
              >
                <div className="p-5">
                  {post.pinned && (
                    <div className="flex items-center gap-1 text-[10px] text-stone-500 font-medium uppercase tracking-wider mb-2">
                      <Pin size={10} strokeWidth={2} /> Pinned
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                      {post.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-stone-700">{post.author}</div>
                      <div className="text-[10px] text-stone-400">{post.time}</div>
                    </div>
                  </div>

                  <p className="text-sm text-stone-700 leading-relaxed">{post.content}</p>

                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-stone-50">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        post.liked ? "text-rose-500" : "text-stone-400 hover:text-stone-600"
                      }`}
                    >
                      <Heart size={13} strokeWidth={1.5} fill={post.liked ? "currentColor" : "none"} />
                      {post.likes}
                    </button>
                    <button
                      onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        isExpanded ? "text-stone-800 font-medium" : "text-stone-400 hover:text-stone-600"
                      }`}
                    >
                      <MessageCircle size={13} strokeWidth={1.5} />
                      {post.replies} {post.replies === 1 ? "reply" : "replies"}
                    </button>

                    {/* Moderator controls — owners only */}
                    {activeCommunity.isOwner && (
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          onClick={() => togglePin(post.id)}
                          title={post.pinned ? "Unpin" : "Pin post"}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                            post.pinned
                              ? "bg-stone-900 text-white"
                              : "text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                          }`}
                        >
                          <Pin size={12} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          title="Remove post"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={12} strokeWidth={1.5} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Replies panel */}
                {isExpanded && (
                  <div className="border-t border-stone-100 bg-stone-50/60">
                    {postReplies.length > 0 ? (
                      <div className="divide-y divide-stone-100">
                        {postReplies.map((reply) => (
                          <div key={reply.id} className="px-5 py-4 flex gap-2.5">
                            <div className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5">
                              {reply.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[11px] font-medium ${reply.author === "Dr. Sarah Mitchell" ? "text-stone-900" : "text-stone-600"}`}>
                                  {reply.author}
                                </span>
                                <span className="text-[10px] text-stone-400">{reply.time}</span>
                              </div>
                              <p className="text-xs text-stone-700 leading-relaxed">{reply.content}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <button
                                  onClick={() => toggleReplyLike(post.id, reply.id)}
                                  className={`flex items-center gap-1 text-[11px] transition-colors ${
                                    reply.liked ? "text-rose-500" : "text-stone-400 hover:text-stone-600"
                                  }`}
                                >
                                  <Heart size={11} strokeWidth={1.5} fill={reply.liked ? "currentColor" : "none"} />
                                  {reply.likes}
                                </button>
                                <button
                                  onClick={() => replyToComment(post.id, reply.author)}
                                  className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors font-medium"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-5 py-4 text-xs text-stone-400">No replies yet. Be the first to respond.</p>
                    )}

                    {/* Reply compose */}
                    <div className="border-t border-stone-100">
                      {replyTargets[post.id] && (
                        <div className="px-4 pt-2.5 flex items-center gap-1.5">
                          <span className="text-[11px] text-stone-500">Replying to</span>
                          <span className="text-[11px] font-semibold text-stone-800">@{replyTargets[post.id]}</span>
                          <button
                            onClick={() => clearReplyTarget(post.id)}
                            className="text-stone-400 hover:text-stone-600 transition-colors ml-0.5"
                          >
                            <X size={11} strokeWidth={2} />
                          </button>
                        </div>
                      )}
                      <div className="px-4 py-3 flex gap-2.5 items-center">
                        <div className="w-6 h-6 bg-stone-900 rounded-full flex items-center justify-center text-[11px] text-white flex-shrink-0">
                          D
                        </div>
                        <input
                          value={replyInputs[post.id] ?? ""}
                          onChange={(e) => setReplyInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitReply(post.id)}
                          placeholder="Write a reply…"
                          className="flex-1 text-xs text-stone-700 placeholder-stone-400 bg-white border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-300"
                        />
                        <button
                          onClick={() => submitReply(post.id)}
                          disabled={!replyInputs[post.id]?.trim()}
                          className="text-xs bg-stone-900 text-white px-2.5 py-1.5 rounded-lg disabled:opacity-30 hover:bg-stone-800 transition-colors flex-shrink-0"
                        >
                          <Send size={10} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ List ══════════════════════════════════════════════════════════════════ */}
      {mode === "list" && (
        <>
          {communities.length === 0 && (
            <div className="bg-white border border-stone-100 rounded-xl py-16 text-center">
              <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={22} strokeWidth={1.5} className="text-stone-400" />
              </div>
              <p className="text-sm font-medium text-stone-700 mb-1">No communities yet</p>
              <p className="text-xs text-stone-400 mb-5">Create a community so clients can connect, share progress, and support each other.</p>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors"
              >
                <Plus size={14} strokeWidth={2} /> Create your first community
              </button>
            </div>
          )}

          {/* My Communities */}
          {communities.some((c) => c.isOwner) && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest">My Communities</h2>
              {communities.filter((c) => c.isOwner).map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  onEdit={() => openEdit(community)}
                  onDelete={() => setDeleteId(community.id)}
                  onView={() => openView(community.id)}
                />
              ))}
            </div>
          )}

          {/* Other Communities */}
          {communities.some((c) => !c.isOwner) && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Other Communities</h2>
              {communities.filter((c) => !c.isOwner).map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  onView={() => openView(community.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ══ Delete confirmation modal ══════════════════════════════════════════ */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Delete this community?</h3>
            <p className="text-xs text-stone-500 leading-relaxed mb-5">
              <span className="font-medium text-stone-700">
                &ldquo;{communities.find((c) => c.id === deleteId)?.name}&rdquo;
              </span>{" "}
              and all its posts will be permanently removed. Members will lose access. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-stone-200 text-sm py-2.5 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
