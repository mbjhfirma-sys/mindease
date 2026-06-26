"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { messages as allMessages } from "@/lib/mockData";
import { Phone, Video, Paperclip, ArrowUp, ArrowLeft, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Attachment = { name: string; mime: string; size: string };
type Message = { from: string; text: string; time: string; attachment?: Attachment };
type Conversation = Omit<(typeof allMessages)[number], "messages"> & { messages: Message[] };

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mime: string) {
  if (mime === "application/pdf") return "📄";
  if (mime.startsWith("image/")) return "🖼️";
  if (mime.includes("word") || mime.includes("document")) return "📝";
  if (mime.includes("spreadsheet") || mime.includes("excel")) return "📊";
  return "📎";
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-sage-100 text-sage-700",
  "bg-amber-100 text-amber-700",
  "bg-blue-100 text-blue-700",
  "bg-rose-100 text-rose-700",
];

function avatarColor(id: string) {
  const idx = id.charCodeAt(id.length - 1) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ name, id, size = "md" }: { name: string; id: string; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-7 h-7 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${cls} ${avatarColor(id)} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>(allMessages);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<Message[]>([]);
  const [pendingFile, setPendingFile] = useState<Attachment | null>(null);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const open = searchParams.get("open");
    if (open && allMessages.some((m) => m.id === open)) {
      setActiveId(open);
    } else if (window.innerWidth >= 768) {
      setActiveId(allMessages[0]?.id ?? null);
    }
  }, [searchParams]);

  const activeConvo = conversations.find((c) => c.id === activeId);

  useEffect(() => {
    if (!activeId) return;
    const convo = conversations.find((c) => c.id === activeId);
    setChatMsgs(convo?.messages ?? []);
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, unread: 0 } : c))
    );
    setTimeout(() => inputRef.current?.focus(), 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile({ name: file.name, mime: file.type, size: formatBytes(file.size) });
    e.target.value = "";
  }

  async function handleSend() {
    if ((!input.trim() && !pendingFile) || !activeId || sending) return;
    const text = input.trim();
    const attachment = pendingFile ?? undefined;
    setInput("");
    setPendingFile(null);
    setSending(true);

    const optimistic: Message = {
      from: "me",
      text,
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      ...(attachment ? { attachment } : {}),
    };
    setChatMsgs((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/messages/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.ok) {
        setChatMsgs((prev) => [
          ...prev.slice(0, -1),
          { from: "me", text: data.message.text, time: data.message.time, ...(attachment ? { attachment } : {}) },
        ]);
      }
    } catch {
      // keep optimistic message
    } finally {
      setSending(false);
    }
  }

  const filtered = conversations.filter((c) =>
    c.sender.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((n, c) => n + (c.unread ?? 0), 0);

  return (
    // Fill the layout's content area edge-to-edge by countering the main padding
    <div className="flex flex-col -m-4 md:-m-6 h-[calc(100%+2rem)] md:h-[calc(100%+3rem)]">
      <div className="flex flex-1 min-h-0 overflow-hidden bg-white md:rounded-2xl md:border md:border-stone-100 md:shadow-sm">

        {/* ── Conversation list ──────────────────────────────────────────────── */}
        <div className={`flex flex-col w-full md:w-72 lg:w-80 flex-shrink-0 border-r border-stone-100 ${activeId ? "hidden md:flex" : "flex"}`}>

          {/* List header */}
          <div className="px-4 pt-5 pb-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-base font-bold text-stone-900">
                Messages
                {totalUnread > 0 && (
                  <span className="ml-2 text-xs font-semibold bg-sage-700 text-white px-1.5 py-0.5 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </h1>
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-stone-100 text-sm pl-8 pr-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-sage-300 transition-all"
              />
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-sm text-stone-400 text-center py-8">No conversations found</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-4 py-3.5 border-b border-stone-50 transition-colors ${
                  activeId === c.id
                    ? "bg-stone-50 border-l-2 border-l-sage-600"
                    : "hover:bg-stone-50 border-l-2 border-l-transparent"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar name={c.sender} id={c.id} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm truncate ${c.unread ? "font-semibold text-stone-900" : "font-medium text-stone-700"}`}>
                        {c.sender}
                      </span>
                      <span className="text-[10px] text-stone-400 flex-shrink-0 ml-2">{c.time}</span>
                    </div>
                    <p className={`text-xs truncate ${c.unread ? "text-stone-700" : "text-stone-400"}`}>
                      {c.preview}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <div className="w-4 h-4 bg-sage-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      {c.unread}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat panel ────────────────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col min-w-0 ${activeId ? "flex" : "hidden md:flex"}`}>
          {activeConvo ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 flex-shrink-0 bg-white">
                <button
                  className="md:hidden text-stone-400 hover:text-stone-700 p-1 -ml-1 transition-colors"
                  onClick={() => setActiveId(null)}
                >
                  <ArrowLeft size={18} strokeWidth={1.5} />
                </button>
                <Avatar name={activeConvo.sender} id={activeConvo.id} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-stone-900 text-sm leading-tight">{activeConvo.sender}</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">{activeConvo.role}</div>
                </div>
                <div className="flex items-center gap-0.5">
                  <button className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all">
                    <Phone size={15} strokeWidth={1.5} />
                  </button>
                  <button className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all">
                    <Video size={15} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
                {chatMsgs.map((msg, i) => {
                  const isMe = msg.from === "me";
                  return (
                    <div key={i} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && (
                        <Avatar name={activeConvo.sender} id={activeConvo.id} size="sm" />
                      )}
                      <div className={`max-w-[72%] md:max-w-xs lg:max-w-sm space-y-1 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? "bg-stone-900 text-white rounded-br-md"
                            : "bg-stone-100 text-stone-800 rounded-bl-md"
                        }`}>
                          {msg.attachment && (
                            <div className={`flex items-center gap-2.5 mb-2 px-3 py-2 rounded-xl ${
                              isMe ? "bg-white/10" : "bg-white border border-stone-200"
                            }`}>
                              <span className="text-xl flex-shrink-0">{fileIcon(msg.attachment.mime)}</span>
                              <div className="min-w-0">
                                <p className={`text-xs font-semibold truncate ${isMe ? "text-white" : "text-stone-800"}`}>
                                  {msg.attachment.name}
                                </p>
                                <p className={`text-[10px] mt-0.5 ${isMe ? "text-white/60" : "text-stone-400"}`}>
                                  {msg.attachment.size}
                                </p>
                              </div>
                            </div>
                          )}
                          {msg.text && <span>{msg.text}</span>}
                        </div>
                        <span className="text-[10px] text-stone-400 px-1">{msg.time}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Pending file chip */}
              {pendingFile && (
                <div className="flex items-center gap-2.5 mx-4 mb-2 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl">
                  <span className="text-lg flex-shrink-0">{fileIcon(pendingFile.mime)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-800 truncate">{pendingFile.name}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{pendingFile.size}</p>
                  </div>
                  <button
                    onClick={() => setPendingFile(null)}
                    className="text-stone-400 hover:text-stone-700 transition-colors p-1"
                  >
                    <X size={13} strokeWidth={2} />
                  </button>
                </div>
              )}

              {/* Input bar */}
              <div className="px-4 py-3 border-t border-stone-100 flex-shrink-0 bg-white">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex items-center gap-2 bg-stone-100 rounded-xl px-3 py-1.5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach file"
                    className="text-stone-400 hover:text-stone-700 transition-colors p-1 flex-shrink-0"
                  >
                    <Paperclip size={15} strokeWidth={1.5} />
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={pendingFile ? "Add a message (optional)…" : "Message…"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    className="flex-1 bg-transparent text-sm py-1 focus:outline-none text-stone-800 placeholder-stone-400"
                  />
                  <button
                    onClick={handleSend}
                    disabled={(!input.trim() && !pendingFile) || sending}
                    className="w-7 h-7 bg-stone-900 text-white rounded-lg flex items-center justify-center hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <ArrowUp size={13} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center p-8">
              <div>
                <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-stone-400">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-700 mb-1 text-sm">No conversation selected</h3>
                <p className="text-stone-400 text-xs">Choose a conversation from the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
