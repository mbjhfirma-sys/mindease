"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUp, Search } from "lucide-react";

type ConvSummary = {
  id: string; sender: string; avatar: string;
  preview: string; time: string; unread: number; role?: string;
};
type Message = { id: string; from: "me" | "them"; text: string; time: string };
type Attachment = { name: string; mime: string; size: string };

// ── Static YouMindo Pro welcome conversation ──────────────────────────────────

const WELCOME_ID = "youmindo_pro_welcome";

const WELCOME_CONV: ConvSummary = {
  id: WELCOME_ID,
  sender: "YouMindo Pro",
  avatar: "",
  preview: "Welcome to your therapist portal! We're glad you're here 💚",
  time: "Today",
  unread: 0,
  role: "Mental Wellness Platform",
};

const WELCOME_MESSAGES: Message[] = [
  {
    id: "wp1",
    from: "them",
    text: "Welcome to YouMindo Pro! 👋 We're glad to have you as part of our platform.\n\nThis is your professional portal — designed to help you deliver better care, stay organised, and track your clients' progress in one place.",
    time: "9:00 AM",
  },
  {
    id: "wp2",
    from: "them",
    text: "Here's what's available in your portal:\n\n👥 Client Management — view mood history, journals, and mission progress\n🗂️ Task Builder — assign CBT, DBT, and ACT exercises from our template library\n📅 Session Scheduling — manage appointments across all your clients\n📊 Analytics — track engagement trends and treatment outcomes\n💬 Secure Messaging — communicate directly with clients\n🌐 Community Groups — create and moderate peer support spaces",
    time: "9:01 AM",
  },
  {
    id: "wp3",
    from: "them",
    text: "Your clients will see you in their Messages section once they're assigned to you. Until then, feel free to explore the portal and complete your profile.\n\nThank you for the important work you do. We're honoured to support it. 💚\n\n— The YouMindo Pro Team",
    time: "9:01 AM",
  },
];

// ─────────────────────────────────────────────────────────────────────────────

const RESOURCES = [
  "Thought Record Worksheet",
  "4-7-8 Breathing Audio",
  "Safety Plan Template",
  "CBT Workbook Chapter 3",
  "Body Scan Meditation",
];

function getTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

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

export default function TherapistMessagesPage() {
  return (
    <Suspense fallback={null}>
      <TherapistMessagesPageInner />
    </Suspense>
  );
}

function TherapistMessagesPageInner() {
  const searchParams = useSearchParams();
  const openId = searchParams.get("open");
  const [convs,          setConvs]         = useState<ConvSummary[]>([]);
  const [convsLoading,   setConvsLoading]  = useState(true);
  const [selectedId,     setSelectedId]    = useState<string | null>(null);
  const [messages,       setMessages]      = useState<Message[]>([]);
  const [msgsLoading,    setMsgsLoading]   = useState(false);
  const [input,          setInput]         = useState("");
  const [showResources,  setShowResources] = useState(false);
  const [pendingFile,    setPendingFile]   = useState<Attachment | null>(null);
  const [search,         setSearch]        = useState("");
  const bottomRef   = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversation list
  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((d) => setConvs([WELCOME_CONV, ...(d.conversations ?? [])]))
      .finally(() => setConvsLoading(false));
  }, []);

  // Select the conversation requested via ?open=<id>, or default to the first on desktop
  useEffect(() => {
    if (convs.length === 0 || selectedId) return;
    if (openId && convs.some((c) => c.id === openId)) {
      selectConv(openId);
    } else if (window.innerWidth >= 768) {
      selectConv(convs[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convs, openId]);

  const loadMessages = useCallback(async (id: string) => {
    setMsgsLoading(true);
    try {
      const r = await fetch(`/api/messages/${id}`);
      const d = await r.json();
      setMessages(d.conversation?.messages ?? []);
      // Mark as read in summary
      setConvs((p) => p.map((c) => c.id === id ? { ...c, unread: 0 } : c));
    } finally {
      setMsgsLoading(false);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function selectConv(id: string) {
    setSelectedId(id);
    setInput("");
    setShowResources(false);
    setPendingFile(null);
    if (id === WELCOME_ID) {
      setMessages(WELCOME_MESSAGES);
      setConvs((p) => p.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
      return;
    }
    loadMessages(id);
  }

  async function send(text: string, attachment?: Attachment) {
    if (!selectedId || (!text.trim() && !attachment)) return;
    const displayText = attachment ? (text.trim() ? text.trim() : `📎 ${attachment.name}`) : text.trim();
    const optimistic: Message = { id: `opt-${Date.now()}`, from: "me", text: displayText, time: getTime() };
    setMessages((p) => [...p, optimistic]);
    setInput("");
    setShowResources(false);
    setPendingFile(null);
    // Update preview in conv list
    setConvs((p) => p.map((c) => c.id === selectedId ? { ...c, preview: displayText, time: getTime() } : c));

    try {
      await fetch(`/api/messages/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: displayText }),
      });
    } catch {
      // Message stays in local state even if API call fails
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile({ name: file.name, mime: file.type, size: formatBytes(file.size) });
    e.target.value = "";
  }

  const currentConv = convs.find((c) => c.id === selectedId) ?? null;
  const filtered = convs.filter((c) =>
    !search || c.sender.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="-m-5 md:-m-6 h-[calc(100%+2.5rem)] md:h-[calc(100%+3rem)]" suppressHydrationWarning>
      <div className="flex h-full bg-white md:rounded-3xl md:border md:border-stone-100 overflow-hidden">

        {/* ── Client list ─────────────────────────────────────────────── */}
        <div className={`flex flex-col w-full md:w-60 md:flex-shrink-0 border-r border-stone-100 ${selectedId ? "hidden md:flex" : "flex"}`}>
          <div className="px-4 pt-4 pb-3 border-b border-stone-100 flex-shrink-0">
            <h1 className="text-lg font-bold text-stone-900">Messages</h1>
            <div className="relative mt-2.5">
              <Search size={13} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full bg-stone-100 text-sm pl-8 pr-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-300"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
            {convsLoading && (
              <div className="animate-pulse space-y-px">
                {[1,2,3].map((i) => <div key={i} className="h-16 bg-stone-50" />)}
              </div>
            )}
            {!convsLoading && filtered.length === 0 && (
              <div className="py-12 text-center text-xs text-stone-400">No conversations yet</div>
            )}
            {filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConv(conv.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 transition-colors text-left ${selectedId === conv.id ? "bg-stone-50" : "hover:bg-stone-50"}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center text-sm font-semibold text-stone-600">
                    {conv.sender[0]}
                  </div>
                  {conv.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-stone-900 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-sm font-medium truncate ${selectedId === conv.id ? "text-stone-900" : "text-stone-700"}`}>
                      {conv.sender}
                    </span>
                    <span className="text-[10px] text-stone-400 ml-2 flex-shrink-0">{conv.time}</span>
                  </div>
                  <p className="text-xs text-stone-400 truncate">{conv.preview}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat panel ──────────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col min-w-0 ${selectedId ? "flex" : "hidden md:flex"}`}>

          {/* Empty state (desktop only) */}
          {!currentConv && (
            <div className="hidden md:flex flex-1 items-center justify-center text-center p-8">
              <div>
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm font-medium text-stone-700">Select a client to start messaging</p>
              </div>
            </div>
          )}

          {/* Active chat */}
          {currentConv && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Header */}
              <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-3 flex-shrink-0 bg-white">
                <button
                  className="md:hidden text-stone-400 hover:text-stone-600 mr-1 transition-colors"
                  onClick={() => setSelectedId(null)}
                >
                  <ArrowLeft size={18} strokeWidth={1.5} />
                </button>
                <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-sm font-semibold text-stone-600 flex-shrink-0">
                  {currentConv.sender[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-stone-900 truncate">{currentConv.sender}</div>
                  <div className="text-[10px] text-stone-400">{currentConv.role}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {msgsLoading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-5 h-5 border-2 border-stone-200 border-t-stone-500 rounded-full animate-spin" />
                  </div>
                )}
                {!msgsLoading && messages.map((msg, i) => (
                  <div key={msg.id ?? i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] md:max-w-sm rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.from === "me" ? "bg-stone-900 text-white rounded-br-sm" : "bg-stone-100 text-stone-700 rounded-bl-sm"
                    }`}>
                      {msg.text && <span className="whitespace-pre-line">{msg.text}</span>}
                      <div className={`text-[10px] mt-1 opacity-60 ${msg.from === "me" ? "text-right" : ""}`}>{msg.time}</div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Locked notice for YouMindo Pro welcome thread */}
              {currentConv.id === WELCOME_ID && (
                <div className="border-t border-stone-100 px-4 py-3.5 flex-shrink-0 bg-stone-50 text-center">
                  <p className="text-xs text-stone-400">
                    🌿 This is an automated message from YouMindo Pro — replies are not monitored
                  </p>
                </div>
              )}

              {/* Resources panel */}
              {currentConv.id !== WELCOME_ID && showResources && (
                <div className="border-t border-stone-100 px-4 py-3 bg-stone-50 flex-shrink-0">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-2">Send a resource</p>
                  <div className="flex flex-wrap gap-2">
                    {RESOURCES.map((r) => (
                      <button
                        key={r}
                        onClick={() => send(`I've sent you a resource: ${r}`)}
                        className="text-xs bg-white border border-stone-200 text-stone-700 px-3 py-1.5 rounded-lg hover:border-stone-900 hover:text-stone-900 transition-all"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending file chip */}
              {currentConv.id !== WELCOME_ID && pendingFile && (
                <div className="border-t border-stone-100 px-3 pt-2.5 pb-0 flex items-center gap-2 flex-shrink-0">
                  <span className="text-base">{fileIcon(pendingFile.mime)}</span>
                  <span className="text-xs text-stone-700 font-medium truncate max-w-[200px]">{pendingFile.name}</span>
                  <span className="text-[10px] text-stone-400">{pendingFile.size}</span>
                  <button
                    onClick={() => setPendingFile(null)}
                    className="ml-auto text-stone-400 hover:text-stone-700 text-sm leading-none transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Input bar — hidden for YouMindo Pro welcome thread */}
              {currentConv.id !== WELCOME_ID && <div
                className="border-t border-stone-100 p-3 flex gap-2 items-end flex-shrink-0 bg-white"
                style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => setShowResources((v) => !v)}
                  className={`text-xs px-2.5 py-2 rounded-lg border flex-shrink-0 transition-colors ${
                    showResources ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-500 hover:border-stone-400"
                  }`}
                >
                  Resources
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                  className="p-2 rounded-lg border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700 flex-shrink-0 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M12.5 6.5L6.5 12.5C5.1 13.9 2.9 13.9 1.5 12.5C0.1 11.1 0.1 8.9 1.5 7.5L7 2C8 1 9.6 1 10.6 2C11.6 3 11.6 4.6 10.6 5.6L5.1 11.1C4.5 11.7 3.5 11.7 2.9 11.1C2.3 10.5 2.3 9.5 2.9 8.9L8 3.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      pendingFile ? send(input, pendingFile) : send(input);
                    }
                  }}
                  placeholder="Write a message…"
                  rows={1}
                  className="flex-1 resize-none text-sm text-stone-700 placeholder-stone-400 focus:outline-none leading-relaxed max-h-20 overflow-y-auto"
                />
                <button
                  onClick={() => pendingFile ? send(input, pendingFile) : send(input)}
                  disabled={!input.trim() && !pendingFile}
                  className="w-8 h-8 bg-stone-900 hover:bg-stone-800 disabled:opacity-30 text-white rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <ArrowUp size={13} strokeWidth={2.5} />
                </button>
              </div>}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
