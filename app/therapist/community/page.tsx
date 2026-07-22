"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Plus, X, Check, Users, Globe, Lock, Pencil, Trash2,
  MessageCircle, Pin, ChevronRight, Heart, Send, ShieldCheck,
} from "lucide-react";

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

function PrivacyBadge({ privacy }: { privacy: Privacy }) {
  if (privacy === "open") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <Globe size={9} strokeWidth={2} /> Open to all
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
      <Lock size={9} strokeWidth={2} /> Invite only
    </span>
  );
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}

function CommunityCard({
  community, onEdit, onDelete, onView,
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
            <span>Created {fmtDate(community.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {community.isOwner && onEdit && (
            <button onClick={onEdit} title="Edit" className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-all">
              <Pencil size={14} strokeWidth={1.5} />
            </button>
          )}
          {community.isOwner && onDelete && (
            <button onClick={onDelete} title="Delete" className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 transition-all">
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          )}
          <button onClick={onView} className="ml-1 text-stone-300 hover:text-stone-500 transition-colors">
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
        <button onClick={onView} className="ml-auto text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors">
          Manage →
        </button>
      </div>
    </div>
  );
}

export default function TherapistCommunityPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
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

  const [repliesByPost, setRepliesByPost] = useState<Record<string, Reply[]>>({});
  const [loadedReplyPosts, setLoadedReplyPosts] = useState<Set<string>>(new Set());
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Load communities from API
  const loadCommunities = useCallback(() => {
    setLoadingCommunities(true);
    setFetchError(null);
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
          privacy: Privacy; status: CommunityStatus; memberCount: number; postCount: number; createdAt: string;
        }) => ({
          id: g.id,
          name: g.name,
          description: g.description ?? "",
          category: g.category,
          icon: g.icon,
          privacy: g.privacy,
          status: g.status,
          members: g.memberCount,
          postCount: g.postCount,
          createdAt: g.createdAt,
          isOwner: true,
        }));
        setCommunities(groups);
      })
      .catch((e: Error) => setFetchError(e.message))
      .finally(() => setLoadingCommunities(false));
  }, []);

  useEffect(() => { loadCommunities(); }, [loadCommunities]);

  // Load posts when viewing a community
  const loadPosts = useCallback((communityId: string) => {
    setLoadingPosts(true);
    fetch(`/api/therapist/community/${communityId}/posts`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => {
        const formatted: CommunityPost[] = (d.posts ?? []).map((p: {
          id: string; groupId: string; author: string; authorId: string; content: string;
          pinned: boolean; flagged: boolean; likes: number; liked: boolean; replyCount: number; createdAt: string;
        }) => ({
          id: p.id,
          communityId: p.groupId,
          author: p.author,
          avatar: "👩‍⚕️",
          content: p.content,
          time: timeAgo(new Date(p.createdAt)),
          likes: p.likes,
          liked: p.liked,
          replies: p.replyCount,
          pinned: p.pinned,
          flagged: p.flagged,
        }));
        setPosts(formatted);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoadingPosts(false));
  }, []);

  const activeCommunity = useMemo(() => communities.find((c) => c.id === activeCommunityId) ?? null, [communities, activeCommunityId]);

  const activePosts = useMemo(
    () => posts
      .filter((p) => p.communityId === activeCommunityId)
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    [posts, activeCommunityId]
  );

  function openCreate() { setForm(BLANK_FORM); setSaved(false); setMode("create"); }

  function openEdit(c: Community) {
    setEditingId(c.id);
    setForm({ name: c.name, description: c.description, category: c.category, icon: c.icon, privacy: c.privacy });
    setSaved(false);
    setMode("edit");
  }

  function openView(id: string) {
    setActiveCommunityId(id);
    setNewPost("");
    setPosts([]);
    setMode("view");
    loadPosts(id);
  }

  function goList() {
    setMode("list");
    setEditingId(null);
    setActiveCommunityId(null);
    setSaved(false);
  }

  async function commitCreate() {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/therapist/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
        body: JSON.stringify(form),
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

  function loadReplies(postId: string) {
    if (!activeCommunityId || loadedReplyPosts.has(postId)) return;
    fetch(`/api/therapist/community/${activeCommunityId}/posts/${postId}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => {
        const formatted: Reply[] = (d.replies ?? []).map((r: {
          id: string; author: string; content: string; createdAt: string; likes: number; liked: boolean;
        }) => ({
          id: r.id, author: r.author, avatar: "👩‍⚕️", content: r.content,
          time: timeAgo(new Date(r.createdAt)), likes: r.likes, liked: r.liked,
        }));
        setRepliesByPost((prev) => ({ ...prev, [postId]: formatted }));
        setLoadedReplyPosts((prev) => new Set(prev).add(postId));
      })
      .catch(() => {});
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
      const reply: Reply = { id: d.reply.id, author: d.reply.author, avatar: "👩‍⚕️", content: d.reply.content, time: "Just now", liked: false, likes: 0 };
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
        setNewPost("");
        loadPosts(activeCommunityId);
        setCommunities((prev) => prev.map((c) => c.id === activeCommunityId ? { ...c, postCount: c.postCount + 1 } : c));
      }
    } finally {
      setPosting(false);
    }
  }

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
              {mode === "create" ? "New Community"
                : mode === "edit" ? "Edit Community"
                : mode === "view" && activeCommunity ? activeCommunity.name
                : "Communities"}
            </h1>
            {mode === "list" && <p className="text-sm text-stone-500 mt-1">Create and manage communities for your clients</p>}
            {mode === "view" && activeCommunity && (
              <p className="text-sm text-stone-500 mt-0.5">{activeCommunity.category} · {activeCommunity.members} members</p>
            )}
          </div>
        </div>

        {mode === "list" && (
          <button onClick={openCreate} className="flex items-center gap-1.5 bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors">
            <Plus size={15} strokeWidth={2} /> Create community
          </button>
        )}
        {mode === "view" && activeCommunity && (
          <button onClick={() => openEdit(activeCommunity)} className="flex items-center gap-1.5 border border-stone-200 text-stone-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors">
            <Pencil size={13} strokeWidth={1.5} /> Edit
          </button>
        )}
      </div>

      {/* ══ Create / Edit form ══════════════════════════════════════════════════ */}
      {(mode === "create" || mode === "edit") && (
        <div className="bg-white border border-stone-100 rounded-xl p-6">
          {saved ? (
            <div className="py-14 text-center">
              <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <p className="text-sm font-medium text-stone-800">
                {mode === "edit" ? "Changes saved" : "Community created"}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Icon picker */}
              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button key={icon} type="button" onClick={() => setForm({ ...form, icon })}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${form.icon === icon ? "bg-stone-900 ring-2 ring-stone-900 ring-offset-1" : "bg-stone-50 hover:bg-stone-100 border border-stone-100"}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Community name <span className="text-red-400">*</span></label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Anxiety & Calm"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors" />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What is this community about? Who should join?"
                  rows={3} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 resize-none focus:outline-none focus:border-stone-400 transition-colors" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Visibility</label>
                  <div className="flex gap-2">
                    {(["open", "invite"] as Privacy[]).map((p) => (
                      <button key={p} type="button" onClick={() => setForm({ ...form, privacy: p })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-sm font-medium transition-all ${form.privacy === p ? "bg-stone-900 border-stone-900 text-white" : "border-stone-200 text-stone-600 hover:border-stone-400"}`}>
                        {p === "open" ? <Globe size={13} strokeWidth={1.5} /> : <Lock size={13} strokeWidth={1.5} />}
                        {p === "open" ? "Open to all" : "Invite only"}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1.5">
                    {form.privacy === "open"
                      ? "Any user on the platform can discover and join."
                      : "Only clients you invite can join."}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-stone-100">
                <button type="button" onClick={goList} className="flex-1 border border-stone-200 text-sm py-2.5 rounded-lg hover:bg-stone-50 transition-colors text-stone-600">
                  Cancel
                </button>
                <button type="button" onClick={mode === "create" ? commitCreate : commitEdit}
                  disabled={!form.name.trim() || saving}
                  className="flex-1 bg-stone-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  {saving ? "Saving…" : mode === "create" ? "Create community" : "Save changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ Community feed view ══════════════════════════════════════════════════ */}
      {mode === "view" && activeCommunity && (
        <div className="space-y-4">
          {/* Info card */}
          <div className="bg-white border border-stone-100 rounded-xl p-5 flex items-center gap-4">
            <div className="w-14 h-14 bg-stone-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
              {activeCommunity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">{activeCommunity.category}</span>
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

          <div className="flex items-start gap-2 bg-stone-50 border border-stone-100 rounded-lg px-4 py-3 text-xs text-stone-500">
            <ShieldCheck size={13} strokeWidth={1.5} className="flex-shrink-0 mt-0.5 text-stone-400" />
            <span>You are the moderator. Members post anonymously — you post as yourself.</span>
          </div>

          {/* Post compose */}
          <div className="bg-white border border-stone-100 rounded-xl p-4">
            <label className="text-xs font-medium text-stone-500 mb-2 block">Post an announcement or message</label>
            <div className="flex gap-3 mb-3">
              <div className="w-7 h-7 bg-stone-900 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0 mt-0.5">👩‍⚕️</div>
              <textarea value={newPost} onChange={(e) => setNewPost(e.target.value.slice(0, 500))}
                placeholder="Write something for your community…" rows={3}
                className="flex-1 text-sm text-stone-700 placeholder-stone-400 resize-none focus:outline-none leading-relaxed" />
            </div>
            <div className="flex items-center justify-between border-t border-stone-100 pt-3">
              <span className="text-[10px] text-stone-400">{newPost.length}/500</span>
              <button onClick={submitPost} disabled={!newPost.trim() || posting}
                className="bg-stone-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5">
                <Send size={11} strokeWidth={2} />
                {posting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>

          {/* Posts */}
          {loadingPosts && (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white border border-stone-100 rounded-xl" />)}
            </div>
          )}

          {!loadingPosts && activePosts.length === 0 && (
            <div className="bg-white border border-stone-100 rounded-xl py-12 text-center">
              <p className="text-sm font-medium text-stone-700 mb-1">No posts yet</p>
              <p className="text-xs text-stone-400">Be the first to post — your community members will see it here.</p>
            </div>
          )}

          {activePosts.map((post) => {
            const isExpanded = expandedPost === post.id;
            const postReplies = repliesByPost[post.id] ?? [];
            return (
              <div key={post.id} className={`bg-white border rounded-2xl overflow-hidden ${post.pinned ? "border-stone-300 border-l-4 border-l-stone-700" : "border-stone-100"}`}>
                <div className="p-5">
                  {post.pinned && (
                    <div className="flex items-center gap-1 text-[10px] text-stone-500 font-medium uppercase tracking-wider mb-2">
                      <Pin size={10} strokeWidth={2} /> Pinned
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs flex-shrink-0">{post.avatar}</div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-stone-700">{post.author}</div>
                      <div className="text-[10px] text-stone-400">{post.time}</div>
                    </div>
                  </div>
                  <p className="text-sm text-stone-700 leading-relaxed">{post.content}</p>
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-stone-50">
                    <button onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${post.liked ? "text-rose-500" : "text-stone-400 hover:text-stone-600"}`}>
                      <Heart size={13} strokeWidth={1.5} fill={post.liked ? "currentColor" : "none"} /> {post.likes}
                    </button>
                    <button onClick={() => { setExpandedPost(isExpanded ? null : post.id); if (!isExpanded) loadReplies(post.id); }}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${isExpanded ? "text-stone-800 font-medium" : "text-stone-400 hover:text-stone-600"}`}>
                      <MessageCircle size={13} strokeWidth={1.5} />
                      {post.replies} {post.replies === 1 ? "reply" : "replies"}
                    </button>
                    <div className="ml-auto flex items-center gap-1">
                      <button onClick={() => togglePin(post.id)} title={post.pinned ? "Unpin" : "Pin"}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${post.pinned ? "bg-stone-900 text-white" : "text-stone-400 hover:bg-stone-100 hover:text-stone-700"}`}>
                        <Pin size={12} strokeWidth={1.5} />
                      </button>
                      <button onClick={() => deletePost(post.id)} title="Remove"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 transition-all">
                        <Trash2 size={12} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-stone-100 bg-stone-50/60">
                    {postReplies.length > 0 ? (
                      <div className="divide-y divide-stone-100">
                        {postReplies.map((reply) => (
                          <div key={reply.id} className="px-5 py-4 flex gap-2.5">
                            <div className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5">{reply.avatar}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-medium text-stone-600">{reply.author}</span>
                                <span className="text-[10px] text-stone-400">{reply.time}</span>
                              </div>
                              <p className="text-xs text-stone-700 leading-relaxed">{reply.content}</p>
                              <button onClick={() => toggleReplyLike(post.id, reply.id)}
                                className={`flex items-center gap-1 text-[11px] mt-2 transition-colors ${reply.liked ? "text-rose-500" : "text-stone-400 hover:text-stone-600"}`}>
                                <Heart size={11} strokeWidth={1.5} fill={reply.liked ? "currentColor" : "none"} /> {reply.likes}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-5 py-4 text-xs text-stone-400">No replies yet.</p>
                    )}
                    <div className="px-4 py-3 border-t border-stone-100 flex gap-2.5 items-center">
                      <div className="w-6 h-6 bg-stone-900 rounded-full flex items-center justify-center text-[11px] text-white flex-shrink-0">👩‍⚕️</div>
                      <input value={replyInputs[post.id] ?? ""}
                        onChange={(e) => setReplyInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitReply(post.id)}
                        placeholder="Write a reply…"
                        className="flex-1 text-xs text-stone-700 placeholder-stone-400 bg-white border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-300" />
                      <button onClick={() => submitReply(post.id)} disabled={!replyInputs[post.id]?.trim()}
                        className="text-xs bg-stone-900 text-white px-2.5 py-1.5 rounded-lg disabled:opacity-30 hover:bg-stone-800 transition-colors flex-shrink-0">
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

      {/* ══ List ══════════════════════════════════════════════════════════════════ */}
      {mode === "list" && (
        <>
          {loadingCommunities && (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map((i) => <div key={i} className="h-32 bg-white border border-stone-100 rounded-xl" />)}
            </div>
          )}

          {!loadingCommunities && fetchError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
              <p className="font-medium mb-1">Could not load communities</p>
              <p className="text-xs text-red-500 font-mono">{fetchError}</p>
              <button onClick={loadCommunities} className="mt-3 text-xs font-medium text-red-700 underline">Retry</button>
            </div>
          )}

          {!loadingCommunities && !fetchError && communities.length === 0 && (
            <div className="bg-white border border-stone-100 rounded-xl py-16 text-center">
              <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={22} strokeWidth={1.5} className="text-stone-400" />
              </div>
              <p className="text-sm font-medium text-stone-700 mb-1">No communities yet</p>
              <p className="text-xs text-stone-400 mb-5">Create a community so clients can connect and support each other.</p>
              <button onClick={openCreate} className="inline-flex items-center gap-1.5 bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors">
                <Plus size={14} strokeWidth={2} /> Create your first community
              </button>
            </div>
          )}

          {communities.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest">My Communities</h2>
              {communities.map((community) => (
                <CommunityCard key={community.id} community={community}
                  onEdit={() => openEdit(community)}
                  onDelete={() => setDeleteId(community.id)}
                  onView={() => openView(community.id)}
                />
              ))}
            </div>
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
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Delete this community?</h3>
            <p className="text-xs text-stone-500 leading-relaxed mb-5">
              <span className="font-medium text-stone-700">&ldquo;{communities.find((c) => c.id === deleteId)?.name}&rdquo;</span>{" "}
              and all its posts will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-stone-200 text-sm py-2.5 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
