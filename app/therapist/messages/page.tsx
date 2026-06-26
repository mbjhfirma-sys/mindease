"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowUp, Search } from "lucide-react";
import VideoCallModal from "@/components/therapist/VideoCallModal";
import { therapistClients } from "@/lib/mockData";

type Attachment = { name: string; mime: string; size: string };
type Message = { from: "me" | "them"; text: string; time: string; attachment?: Attachment };
type Conversation = { clientId: string; messages: Message[]; unread: number };

function getTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const INITIAL: Record<string, Conversation> = {
  c1: {
    clientId: "c1", unread: 2,
    messages: [
      { from: "them", text: "Hi Dr. Chen, I had a rough morning but the breathing exercise you gave me really helped.", time: "9:15 AM" },
      { from: "me",   text: "I'm really glad to hear that, Alex. How are you feeling now?", time: "9:18 AM" },
      { from: "them", text: "Much better, thank you! I've been using it every morning this week.", time: "10:28 AM" },
      { from: "them", text: "Is it okay to use it more than once a day?", time: "10:30 AM" },
    ],
  },
  c2: {
    clientId: "c2", unread: 0,
    messages: [
      { from: "me",   text: "Hi Maria, just checking in. How did the behavioural activation task go this week?", time: "Yesterday" },
      { from: "them", text: "It was hard to start but I managed to do a short walk. It helped a bit.", time: "Yesterday" },
      { from: "me",   text: "That's a great effort — starting is always the hardest part. See you Thursday.", time: "Yesterday" },
    ],
  },
  c4: {
    clientId: "c4", unread: 3,
    messages: [
      { from: "them", text: "Dr. Chen I'm really struggling today.", time: "2:10 PM" },
      { from: "them", text: "The exposure task felt impossible. I left before even getting inside.", time: "2:11 PM" },
      { from: "them", text: "Are you available to talk?", time: "2:15 PM" },
    ],
  },
  c3: { clientId: "c3", unread: 1, messages: [{ from: "them", text: "Quick update — I completed all my tasks this week! First time ever.", time: "Mon" }] },
  c5: { clientId: "c5", unread: 0, messages: [{ from: "me", text: "Tom, here's a link to the updated safety plan. Please review it.", time: "Jun 18" }] },
  c6: { clientId: "c6", unread: 0, messages: [{ from: "them", text: "Looking forward to our session tomorrow. I have a lot to discuss.", time: "Jun 17" }] },
};

const RESOURCES = [
  "Thought Record Worksheet",
  "4-7-8 Breathing Audio",
  "Safety Plan Template",
  "CBT Workbook Chapter 3",
  "Body Scan Meditation",
];

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
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "📑";
  return "📎";
}

export default function TherapistMessagesPage() {
  const [conversations, setConversations] = useState(INITIAL);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [showResources, setShowResources] = useState(false);
  const [pendingFile, setPendingFile] = useState<Attachment | null>(null);
  const [callOpen, setCallOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // On desktop, pre-select a conversation
  useEffect(() => {
    if (window.innerWidth >= 768) setSelectedId("c4");
  }, []);

  const current = selectedId ? conversations[selectedId] : null;
  const currentClient = selectedId ? therapistClients.find((c) => c.id === selectedId) ?? null : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current?.messages]);

  function send(text: string, attachment?: Attachment) {
    if (!selectedId || (!text.trim() && !attachment)) return;
    const id = selectedId;
    const msg: Message = { from: "me", text: text.trim(), time: getTime(), ...(attachment ? { attachment } : {}) };
    setConversations((p) => ({
      ...p,
      [id]: { ...p[id], messages: [...p[id].messages, msg], unread: 0 },
    }));
    setInput("");
    setShowResources(false);
    setPendingFile(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile({ name: file.name, mime: file.type, size: formatBytes(file.size) });
    e.target.value = "";
  }

  function selectConv(id: string) {
    setSelectedId(id);
    setConversations((p) => ({ ...p, [id]: { ...p[id], unread: 0 } }));
    setInput("");
    setShowResources(false);
    setPendingFile(null);
  }

  return (
    <div className="-m-5 md:-m-6 h-[calc(100%+2.5rem)] md:h-[calc(100%+3rem)]">
      <div className="flex h-full bg-white md:rounded-3xl md:border md:border-stone-100 overflow-hidden">

        {/* ── Client list ───────────────────────────────────────────────── */}
        <div className={`flex flex-col w-full md:w-60 md:flex-shrink-0 border-r border-stone-100 ${selectedId ? "hidden md:flex" : "flex"}`}>
          <div className="px-4 pt-4 pb-3 border-b border-stone-100 flex-shrink-0">
            <h1 className="text-lg font-bold text-stone-900">Messages</h1>
            <div className="relative mt-2.5">
              <Search size={13} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input
                placeholder="Search…"
                className="w-full bg-stone-100 text-sm pl-8 pr-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-sage-300"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
            {therapistClients.map((client) => {
              const conv = conversations[client.id];
              const lastMsg = conv?.messages[conv.messages.length - 1];
              return (
                <button
                  key={client.id}
                  onClick={() => selectConv(client.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 transition-colors text-left ${selectedId === client.id ? "bg-stone-50" : "hover:bg-stone-50"}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center text-sm font-semibold text-stone-600">
                      {client.name[0]}
                    </div>
                    {conv?.unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-stone-900 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm font-medium truncate ${selectedId === client.id ? "text-stone-900" : "text-stone-700"}`}>
                        {client.name}
                      </span>
                      <span className="text-[10px] text-stone-400 ml-2 flex-shrink-0">{lastMsg?.time}</span>
                    </div>
                    <p className="text-xs text-stone-400 truncate">{lastMsg?.text ?? "No messages"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Chat panel ────────────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col min-w-0 ${selectedId ? "flex" : "hidden md:flex"}`}>

          {/* Empty state (desktop only) */}
          {!currentClient && (
            <div className="hidden md:flex flex-1 items-center justify-center text-center p-8">
              <div>
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm font-medium text-stone-700">Select a client to start messaging</p>
              </div>
            </div>
          )}

          {/* Active chat */}
          {currentClient && (
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
                  {currentClient.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-stone-900 truncate">{currentClient.name}</div>
                  <div className="text-[10px] text-stone-400 truncate">{currentClient.condition.join(", ")}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setCallOpen(true)}
                    className="text-xs bg-stone-900 text-white px-2.5 py-1.5 rounded-lg font-medium hover:bg-stone-800 transition-colors"
                  >
                    Video call
                  </button>
                  <a
                    href={`/therapist/clients/${selectedId}`}
                    className="text-xs border border-stone-200 text-stone-600 px-2.5 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    Profile
                  </a>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {current?.messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] md:max-w-sm rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.from === "me" ? "bg-stone-900 text-white rounded-br-sm" : "bg-stone-100 text-stone-700 rounded-bl-sm"
                    }`}>
                      {msg.attachment && (
                        <div className={`flex items-center gap-2 mb-1.5 px-2.5 py-2 rounded-xl ${
                          msg.from === "me" ? "bg-stone-800" : "bg-white border border-stone-200"
                        }`}>
                          <span className="text-base shrink-0">{fileIcon(msg.attachment.mime)}</span>
                          <div className="min-w-0">
                            <p className={`text-xs font-medium truncate ${msg.from === "me" ? "text-white" : "text-stone-800"}`}>
                              {msg.attachment.name}
                            </p>
                            <p className="text-[10px] text-stone-400">{msg.attachment.size}</p>
                          </div>
                        </div>
                      )}
                      {msg.text && <span>{msg.text}</span>}
                      <div className={`text-[10px] mt-1 opacity-60 ${msg.from === "me" ? "text-right" : ""}`}>{msg.time}</div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Resources panel */}
              {showResources && (
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
              {pendingFile && (
                <div className="border-t border-stone-100 px-3 pt-2.5 pb-0 flex items-center gap-2 flex-shrink-0">
                  <span className="text-base">{fileIcon(pendingFile.mime)}</span>
                  <span className="text-xs text-stone-700 font-medium truncate max-w-[200px]">{pendingFile.name}</span>
                  <span className="text-[10px] text-stone-400">{pendingFile.size}</span>
                  <button
                    onClick={() => setPendingFile(null)}
                    className="ml-auto text-stone-400 hover:text-stone-700 text-sm leading-none transition-colors"
                    aria-label="Remove file"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Input bar */}
              <div
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
                    <path d="M12.5 6.5L6.5 12.5C5.1 13.9 2.9 13.9 1.5 12.5C0.1 11.1 0.1 8.9 1.5 7.5L7 2C8 1 9.6 1 10.6 2C11.6 3 11.6 4.6 10.6 5.6L5.1 11.1C4.5 11.7 3.5 11.7 2.9 11.1C2.3 10.5 2.3 9.5 2.9 8.9L8 3.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
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
              </div>

            </div>
          )}
        </div>

      </div>

      {callOpen && currentClient && (
        <VideoCallModal
          clientName={currentClient.name}
          sessionType="individual"
          duration="50 min"
          onEnd={() => setCallOpen(false)}
        />
      )}
    </div>
  );
}
