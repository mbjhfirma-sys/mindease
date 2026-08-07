"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Phone, Sparkles } from "lucide-react";
import { planById } from "@/lib/clientPlans";
import UpgradeModal from "@/components/dashboard/UpgradeModal";
import { MindoAvatar } from "@/components/dashboard/MindoAvatar";
import { MindoGreeting } from "@/components/dashboard/MindoGreeting";

type Message = { id: string; from: "ai" | "user"; text: string; time: string };

const QUICK_ACTIONS = [
  { label: "Breathing exercise", prompt: "Guide me through a breathing exercise", emoji: "🌬️" },
  { label: "Mood check-in", prompt: "I'd like to do a mood check-in", emoji: "🙂" },
  { label: "Thought challenge", prompt: "Help me challenge a negative thought", emoji: "💭" },
  { label: "Grounding technique", prompt: "I need a grounding exercise right now", emoji: "🪨" },
  { label: "Set a goal", prompt: "Help me set a mental wellness goal", emoji: "🎯" },
  { label: "Find resources", prompt: "Recommend resources for anxiety", emoji: "📚" },
];

const CHIP_STYLES = [
  "bg-sage-50 text-sage-700",
  "bg-amber-50 text-amber-700",
  "bg-violet-50 text-violet-700",
  "bg-blue-50 text-blue-700",
  "bg-sage-50 text-sage-700",
  "bg-amber-50 text-amber-700",
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

// Same content as GREETING, without the "Hi, I'm Mindo" lead-in — the
// animated MindoGreeting headline already says that, so the hero card
// doesn't greet the user twice.
const HERO_INTRO_DETAIL = "Your AI wellness companion. I know your recent mood, journal, and mission activity, and I'm here 24/7 to support you and guide you through exercises.\n\nI'm not a replacement for therapy. If you're in crisis, please reach out to your therapist or call 988.\n\nWhat's on your mind today?";

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [hasMindoAccess, setHasMindoAccess] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => { if (d.user) setHasMindoAccess(planById(d.user.plan).features.mindo); })
      .catch(() => {});
  }, []);

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

  const isFreshChat = !loadingHistory && messages.length === 1 && messages[0].id === "ai-greeting";

  if (!hasMindoAccess) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center bg-white border border-stone-100 rounded-2xl p-8">
        <div className="w-12 h-12 bg-sage-700 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
          <Sparkles size={20} strokeWidth={1.5} />
        </div>
        <h2 className="font-bold text-stone-900 mb-1">Mindo is a Growth &amp; Premium feature</h2>
        <p className="text-sm text-stone-500 mb-5">
          Upgrade your plan to chat with Mindo, get daily briefings, and receive personalized course recommendations.
        </p>
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="inline-block bg-sage-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-sage-800 transition-colors"
        >
          View plans
        </button>
        {showUpgradeModal && (
          <UpgradeModal
            onClose={() => setShowUpgradeModal(false)}
            title="Mindo is a Growth & Premium feature"
            description="Upgrade your plan to chat with Mindo, get daily briefings, and receive personalized course recommendations."
          />
        )}
      </div>
    );
  }

  return (
    <div className="-m-4 md:-m-6 h-[calc(100%+2rem)] md:h-[calc(100%+3rem)] flex flex-col items-center">
    <div className="w-full max-w-2xl px-4 md:px-6 py-4 md:py-6 flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <MindoAvatar size="sm" />
          <div>
            <div className="font-semibold text-stone-900 text-sm">Mindo</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="text-xs text-stone-400">Always in your corner</span>
            </div>
          </div>
        </div>
        <a href="tel:988" className="flex items-center gap-1.5 text-xs text-stone-500 border border-stone-200 px-3 py-1.5 rounded-full hover:border-red-300 hover:text-red-600 transition-colors flex-shrink-0">
          <Phone size={11} strokeWidth={1.5} />
          Crisis line: 988
        </a>
      </div>

      {/* Quick actions — hidden on the fresh-chat hero, where they live inside it instead */}
      {!isFreshChat && (
        <div className="flex gap-2 overflow-x-auto pb-3 flex-shrink-0 scrollbar-hide">
          {QUICK_ACTIONS.map((a, i) => (
            <button
              key={a.label}
              onClick={() => send(a.prompt)}
              disabled={loadingHistory || typing}
              className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition-all whitespace-nowrap disabled:opacity-50 hover:brightness-95 ${CHIP_STYLES[i % CHIP_STYLES.length]}`}
            >
              <span>{a.emoji}</span>{a.label}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 py-2 min-h-0">
        {loadingHistory ? (
          <div className="flex gap-2.5 items-start animate-pulse">
            <div className="w-7 h-7 bg-stone-100 rounded-full flex-shrink-0" />
            <div className="h-16 w-2/3 bg-stone-100 rounded-2xl" />
          </div>
        ) : isFreshChat ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-2 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-7 max-w-sm w-full">
              <MindoGreeting textClassName="text-xl font-extrabold text-stone-900 mb-2" />
              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">{HERO_INTRO_DETAIL}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-5 max-w-sm">
              {QUICK_ACTIONS.map((a, i) => (
                <button
                  key={a.label}
                  onClick={() => send(a.prompt)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2.5 rounded-full transition-all hover:brightness-95 ${CHIP_STYLES[i % CHIP_STYLES.length]}`}
                >
                  <span>{a.emoji}</span>{a.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} gap-2.5`}>
              {msg.from === "ai" && <div className="mt-0.5"><MindoAvatar size="xs" /></div>}
              <div className={`max-w-[82%] flex flex-col gap-1 ${msg.from === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  msg.from === "user"
                    ? "bg-sage-700 text-white rounded-2xl rounded-br-md"
                    : "bg-amber-50 text-stone-800 rounded-2xl rounded-bl-md"
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
            <MindoAvatar size="xs" />
            <div className="bg-amber-50 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 mt-3 bg-white border-2 border-stone-100 focus-within:border-sage-300 rounded-full flex items-end gap-2 p-2 pl-5 transition-colors">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Share what's on your mind…"
          rows={1}
          disabled={loadingHistory}
          className="flex-1 resize-none text-sm text-stone-700 placeholder-stone-400 focus:outline-none leading-relaxed max-h-24 overflow-y-auto disabled:opacity-50 py-1.5"
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || typing || loadingHistory}
          className="w-9 h-9 bg-sage-700 hover:bg-sage-800 disabled:opacity-30 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0"
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
