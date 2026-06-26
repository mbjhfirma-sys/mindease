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

const AI_RESPONSES: Record<string, string> = {
  "Guide me through a breathing exercise":
    "Of course. Let's use the 4-7-8 technique — it activates your parasympathetic nervous system and can calm anxiety quickly.\n\n**4-7-8 Breathing**\n\n1. Exhale completely through your mouth\n2. Inhale through your nose for 4 counts\n3. Hold your breath for 7 counts\n4. Exhale slowly through your mouth for 8 counts\n\nLet's try three rounds together. Start when ready:\n\nInhale… 1… 2… 3… 4…\nHold… 1… 2… 3… 4… 5… 6… 7…\nExhale slowly… 1… 2… 3… 4… 5… 6… 7… 8…\n\nHow are you feeling after that?",
  "I'd like to do a mood check-in":
    "I'm glad you're checking in. Let's take a moment together.\n\nOn a scale of 1–10, how would you rate your mood right now?\n\n1–3 — Struggling\n4–6 — Getting through it\n7–10 — Doing well\n\nAnd in a few words — what emotion is most present for you right now?\n\nThere's no right or wrong. I'm just here to listen.",
  "Help me challenge a negative thought":
    "Challenging negative thoughts is one of the most effective CBT skills. Let's work through it.\n\nFirst, tell me: what is the thought you're having? Write it out as specifically as you can.\n\nFor example: 'I always fail at important things' or 'No one genuinely cares about me.'\n\nOnce you share it, I'll guide you through examining the evidence and finding a more balanced perspective.",
  "I need a grounding exercise right now":
    "I've got you. Let's do the 5-4-3-2-1 grounding technique. It anchors you to the present moment through your senses.\n\n**5-4-3-2-1 Grounding**\n\nTake a slow breath, then notice:\n\n5 things you can SEE — look for small details\n4 things you can HEAR — including faint background sounds\n3 things you can TOUCH — notice different textures\n2 things you can SMELL — or imagine two favourite scents\n1 thing you can TASTE\n\nTake your time with each one. How's your breathing now?",
  "Help me set a mental wellness goal":
    "Setting a clear goal is a meaningful step. The most effective goals are specific and measurable.\n\nA few questions:\n\n1. Which area do you most want to improve? (sleep, anxiety, mood, stress, relationships)\n2. What's one small thing you could do daily in that area?\n3. How will you know when you've made progress?\n\nFor example, rather than 'I want to be less anxious', a strong goal might be: 'I will practise one 5-minute breathing exercise every morning for two weeks.'\n\nWhat area shall we focus on?",
  "Recommend resources for anxiety":
    "Here are some evidence-based resources for anxiety:\n\n**On MindEase:**\n- Understanding Anxiety course (Dr. Michael Torres)\n- Daily breathing exercises in your missions\n- CBT worksheets in Resources\n\n**Recommended reading:**\n- Dare by Barry McDonagh\n- The Anxiety & Worry Workbook by Clark & Beck\n\n**Audio on MindEase:**\n- Safe Place Visualisation (14 min)\n- Progressive Muscle Relaxation (18 min)\n\nWould you like me to open any of these, or would you like a personalised recommendation based on what you're experiencing?",
};

function getTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const INITIAL: Message[] = [
  {
    id: "ai-0", from: "ai",
    text: "Hi Alex — I'm Sage, your AI wellness companion. I'm here 24/7 to support you, guide you through exercises, and help you build healthier habits.\n\nI'm not a replacement for therapy. If you're in crisis, please reach out to your therapist or call 988.\n\nWhat's on your mind today?",
    time: getTime(),
  },
];

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  function send(text: string) {
    if (!text.trim()) return;
    setMessages((p) => [...p, { id: `u-${Date.now()}`, from: "user", text: text.trim(), time: getTime() }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = AI_RESPONSES[text.trim()] ?? "Thank you for sharing that. I hear you.\n\nWould you like to try a breathing exercise, work through a thought together, or just talk through what you're experiencing? I'm here either way.";
      setMessages((p) => [...p, { id: `ai-${Date.now()}`, from: "ai", text: reply, time: getTime() }]);
      setTyping(false);
    }, 1000 + Math.random() * 800);
  }

  return (
    <div className="-m-4 md:-m-6 h-[calc(100%+2rem)] md:h-[calc(100%+3rem)] flex flex-col items-center">
    <div className="w-full max-w-2xl px-4 md:px-6 py-4 md:py-6 flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center text-white text-sm font-semibold">S</div>
          <div>
            <div className="font-semibold text-stone-900 text-sm">Sage</div>
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
            className="flex-shrink-0 text-xs text-stone-600 bg-white border border-stone-200 hover:border-stone-400 hover:text-stone-900 px-3 py-2 rounded-lg transition-all whitespace-nowrap"
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 py-2 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} gap-2.5`}>
            {msg.from === "ai" && (
              <div className="w-7 h-7 bg-stone-900 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5">S</div>
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
        ))}

        {typing && (
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 bg-stone-900 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">S</div>
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
          className="flex-1 resize-none text-sm text-stone-700 placeholder-stone-400 focus:outline-none leading-relaxed max-h-24 overflow-y-auto"
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || typing}
          className="w-8 h-8 bg-stone-900 hover:bg-stone-800 disabled:opacity-30 text-white rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Send size={14} strokeWidth={2} />
        </button>
      </div>
      <p className="text-[10px] text-stone-400 text-center mt-2 flex-shrink-0">
        Sage is an AI. It does not replace professional therapy. In crisis, call 988.
      </p>
    </div>
    </div>
  );
}
