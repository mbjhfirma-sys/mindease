"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Phone } from "lucide-react";

type Message = { id: string; from: "ai" | "user"; text: string; time: string };

const QUICK_ACTIONS = [
  { label: "Breathing exercise", prompt: "Guide me through a breathing exercise" },
  { label: "Mood check-in", prompt: "I'd like to do a mood check-in" },
  { label: "Thought challenge", prompt: "Help me challenge a negative thought" },
  { label: "Grounding technique", prompt: "I need a grounding exercise right now" },
  { label: "Set a goal", prompt: "Help me set a mental wellness goal" },
  { label: "Find resources", prompt: "Recommend resources for anxiety" },
];

function getTime(iso?: string) {
  return new Date(iso ?? Date.now()).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const GREETING: Message = {
  id: "ai-greeting",
  from: "ai",
  text: "Hi — I'm Mindo, your AI wellness companion. I know your recent mood, journal, and mission activity, and I'm here 24/7 to support you and guide you through exercises.\n\nI'm not a replacement for therapy. If you're in crisis, please reach out to your therapist or call 988.\n\nWhat's on your mind today?",
  time: getTime(),
};

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/mindo/chat")
      .then((r) => r.json())
      .then((d: { messages?: { id: string; role: "user" | "assistant"; content: string; createdAt: string }[] }) => {
        const history = d.messages ?? [];
        if (history.length === 0) {
          setMessages([GREETING]);
        } else {
          setMessages(history.map((m) => ({ id: m.id, from: m.role === "user" ? "user" : "ai", text: m.content, time: getTime(m.createdAt) })));
        }
      })
      .catch(() => setMessages([GREETING]))
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  async function send(text: string) {
    if (!text.trim()) return;
    setMessages((p) => [...p, { id: `u-${Date.now()}`, from: "user", text: text.trim(), time: getTime() }]);
    setInput("");
    setTyping(true);
    try {
      const res = await fetch("/api/mindo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });
      const data = await res.json();
      const reply = res.ok && data.reply ? data.reply : "I'm having a little trouble connecting right now. Please try again in a moment.";
      setMessages((p) => [...p, { id: `ai-${Date.now()}`, from: "ai", text: reply, time: getTime() }]);
    } catch {
      setMessages((p) => [...p, { id: `ai-${Date.now()}`, from: "ai", text: "I'm having a little trouble connecting right now. Please try again in a moment.", time: getTime() }]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <div className="-m-4 md:-m-6 h-[calc(100%+2rem)] md:h-[calc(100%+3rem)] flex flex-col items-center">
    <div className="w-full max-w-2xl px-4 md:px-6 py-4 md:py-6 flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sage-700 rounded-xl flex items-center justify-center text-white text-sm font-semibold">M</div>
          <div>
            <div className="font-semibold text-stone-900 text-sm">Mindo</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="text-xs text-stone-400">AI Wellness Companion · Always available</span>
            </div>
          </div>
        </div>
        <a href="tel:988" className="flex items-center gap-1.5 text-xs text-stone-500 border border-stone-200 px-3 py-1.5 rounded-lg hover:border-red-300 hover:text-red-600 transition-colors">
          <Phone size={11} strokeWidth={1.5} />
          Crisis line: 988
        </a>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 overflow-x-auto pb-3 flex-shrink-0 scrollbar-hide">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => send(a.prompt)}
            disabled={loadingHistory || typing}
            className="flex-shrink-0 text-xs text-stone-600 bg-white border border-stone-200 hover:border-stone-400 hover:text-stone-900 px-3 py-2 rounded-lg transition-all whitespace-nowrap disabled:opacity-50"
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 py-2 min-h-0">
        {loadingHistory ? (
          <div className="flex gap-2.5 items-start animate-pulse">
            <div className="w-7 h-7 bg-stone-100 rounded-lg flex-shrink-0" />
            <div className="h-16 w-2/3 bg-stone-100 rounded-xl" />
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} gap-2.5`}>
              {msg.from === "ai" && (
                <div className="w-7 h-7 bg-sage-700 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5">M</div>
              )}
              <div className={`max-w-[82%] flex flex-col gap-1 ${msg.from === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-line ${
                  msg.from === "user"
                    ? "bg-stone-900 text-white"
                    : "bg-white border border-stone-100 text-stone-700"
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-stone-400 px-1">{msg.time}</span>
              </div>
            </div>
          ))
        )}

        {typing && (
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 bg-sage-700 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">M</div>
            <div className="bg-white border border-stone-100 rounded-xl px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 mt-3 bg-white border border-stone-200 rounded-xl flex items-end gap-2 p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Share what's on your mind…"
          rows={1}
          disabled={loadingHistory}
          className="flex-1 resize-none text-sm text-stone-700 placeholder-stone-400 focus:outline-none leading-relaxed max-h-24 overflow-y-auto disabled:opacity-50"
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || typing || loadingHistory}
          className="w-8 h-8 bg-stone-900 hover:bg-stone-800 disabled:opacity-30 text-white rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Send size={14} strokeWidth={2} />
        </button>
      </div>
      <p className="text-[10px] text-stone-400 text-center mt-2 flex-shrink-0">
        Mindo is an AI. It does not replace professional therapy. In crisis, call 988.
      </p>
    </div>
    </div>
  );
}
