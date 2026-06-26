"use client";

import { useState } from "react";
import { journalEntries, moodHistory, emotionOptions, type JournalEntry } from "@/lib/mockData";
import { BookOpen, PenLine, TrendingUp, Lock } from "lucide-react";

const MOOD_EMOJIS = ["", "😔", "😟", "😐", "🙂", "😊"];
const MOOD_LABELS = ["", "Low", "Low-ish", "Okay", "Good", "Great"];

type Tab = "entries" | "new" | "trends";

export default function JournalPage() {
  const [tab, setTab] = useState<Tab>("entries");
  const [entries, setEntries] = useState(journalEntries);
  const [selected, setSelected] = useState<JournalEntry | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newMood, setNewMood] = useState(0);
  const [newEmotions, setNewEmotions] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  function toggleEmotion(e: string) {
    setNewEmotions((p) => p.includes(e) ? p.filter((x) => x !== e) : [...p, e]);
  }

  function saveEntry() {
    if (!newContent.trim()) return;
    const entry: JournalEntry = {
      id: `j${Date.now()}`, date: "Just now",
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      title: newTitle || "Untitled", content: newContent, mood: newMood || 3,
      emotions: newEmotions, type: "text",
      wordCount: newContent.trim().split(/\s+/).length,
    };
    setEntries([entry, ...entries]);
    setSaved(true);
    setTimeout(() => { setSaved(false); setTab("entries"); setNewTitle(""); setNewContent(""); setNewMood(0); setNewEmotions([]); }, 1500);
  }

  const avgMood = (moodHistory.reduce((s, d) => s + d.score, 0) / moodHistory.length).toFixed(1);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Journal</h1>
          <p className="text-sm text-stone-500 mt-1 flex items-center gap-1.5">
            {entries.length} entries
            <span className="text-stone-300">·</span>
            <Lock size={11} strokeWidth={1.5} className="text-stone-400" />
            Private & encrypted
          </p>
        </div>
        <button
          onClick={() => { setTab("new"); setSelected(null); }}
          className="bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors"
        >
          New entry
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-100">
        {([
          { id: "entries", label: "Entries" },
          { id: "new", label: "Write" },
          { id: "trends", label: "Mood Trends" },
        ] as { id: Tab; label: string }[]).map((t) => {
          const icons: Record<Tab, React.ReactNode> = {
            entries: <BookOpen size={14} strokeWidth={tab === t.id ? 2 : 1.5} />,
            new: <PenLine size={14} strokeWidth={tab === t.id ? 2 : 1.5} />,
            trends: <TrendingUp size={14} strokeWidth={tab === t.id ? 2 : 1.5} />,
          };
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSelected(null); }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-700"
              }`}
            >
              {icons[t.id]}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Entries ── */}
      {tab === "entries" && !selected && (
        <div className="space-y-2">
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setSelected(entry)}
              className="w-full text-left bg-white border border-stone-100 rounded-xl p-5 hover:border-stone-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{MOOD_EMOJIS[entry.mood]}</span>
                    <span className="text-sm font-medium text-stone-800 group-hover:text-stone-900 truncate">{entry.title}</span>
                    {entry.type !== "text" && (
                      <span className="text-[10px] text-stone-400 border border-stone-200 px-1.5 py-0.5 rounded capitalize">{entry.type}</span>
                    )}
                  </div>
                  {entry.content && (
                    <p className="text-xs text-stone-400 leading-relaxed line-clamp-2">{entry.content}</p>
                  )}
                  {entry.emotions.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {entry.emotions.map((e) => (
                        <span key={e} className="text-[10px] text-stone-500 bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-md">{e}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-stone-500 font-medium">{entry.date}</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">{entry.time}</div>
                  {entry.wordCount && <div className="text-[10px] text-stone-400 mt-0.5">{entry.wordCount}w</div>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Entry detail ── */}
      {tab === "entries" && selected && (
        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
            <button onClick={() => setSelected(null)} className="text-sm text-stone-500 hover:text-stone-900 transition-colors">← Back</button>
            <div className="flex-1" />
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span>{selected.date}</span>
              <span>·</span>
              <span>{selected.time}</span>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{MOOD_EMOJIS[selected.mood]}</span>
              <div>
                <h2 className="font-semibold text-stone-900">{selected.title}</h2>
                <span className="text-xs text-stone-400">{MOOD_LABELS[selected.mood]}</span>
              </div>
            </div>
            {selected.emotions.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-5">
                {selected.emotions.map((e) => (
                  <span key={e} className="text-xs text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md">{e}</span>
                ))}
              </div>
            )}
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{selected.content}</p>
          </div>
        </div>
      )}

      {/* ── Write ── */}
      {tab === "new" && (
        <div className="bg-white border border-stone-100 rounded-xl p-6 space-y-5">
          {saved ? (
            <div className="py-12 text-center">
              <div className="text-3xl mb-3">✓</div>
              <p className="text-sm font-medium text-stone-800">Entry saved</p>
              <p className="text-xs text-stone-400 mt-1">Returning to your journal…</p>
            </div>
          ) : (
            <>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Entry title (optional)"
                className="w-full text-lg font-semibold text-stone-900 placeholder-stone-300 focus:outline-none border-b border-stone-100 pb-3"
              />

              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-wider block mb-2">How are you feeling?</label>
                <div className="flex gap-2">
                  {MOOD_EMOJIS.slice(1).map((emoji, i) => (
                    <button
                      key={i}
                      onClick={() => setNewMood(i + 1)}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border transition-all ${
                        newMood === i + 1 ? "border-stone-900 bg-stone-50" : "border-stone-100 hover:border-stone-300"
                      }`}
                    >
                      <span className="text-xl">{emoji}</span>
                      <span className="text-[10px] text-stone-400">{MOOD_LABELS[i + 1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-wider block mb-2">Emotions</label>
                <div className="flex flex-wrap gap-1.5">
                  {emotionOptions.map((e) => (
                    <button
                      key={e}
                      onClick={() => toggleEmotion(e)}
                      className={`text-xs px-3 py-1.5 rounded-md border transition-all ${
                        newEmotions.includes(e)
                          ? "bg-stone-900 text-white border-stone-900"
                          : "border-stone-200 text-stone-600 hover:border-stone-400"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-wider block mb-2">Write freely</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="This is your private space. Write without judgement…"
                  rows={8}
                  className="w-full text-sm text-stone-700 leading-relaxed placeholder-stone-300 focus:outline-none resize-none"
                />
                <div className="text-[10px] text-stone-300 text-right mt-1">{newContent.trim() ? newContent.trim().split(/\s+/).length : 0} words</div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-stone-100">
                <button onClick={() => setTab("entries")} className="flex-1 py-2.5 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={saveEntry}
                  disabled={!newContent.trim()}
                  className="flex-1 py-2.5 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Trends ── */}
      {tab === "trends" && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Avg Mood", value: `${avgMood} / 5` },
              { label: "This Week", value: `${moodHistory.filter((d) => d.score >= 4).length} good days` },
              { label: "Entries", value: `${entries.length} total` },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-stone-100 rounded-xl p-4 text-center">
                <div className="text-lg font-semibold text-stone-900">{s.value}</div>
                <div className="text-xs text-stone-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-stone-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-stone-900 mb-5">7-Day Mood History</h3>
            <div className="flex items-end gap-2 h-24">
              {moodHistory.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-sm">{MOOD_EMOJIS[day.score]}</span>
                  <div className="w-full bg-stone-900 rounded-t-sm transition-all" style={{ height: `${(day.score / 5) * 72}px` }} />
                  <span className="text-[9px] text-stone-400 truncate w-full text-center">{day.date}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { title: "Voice Journal", desc: "Record audio reflections. Available on mobile.", icon: "🎙️", soon: true },
              { title: "Video Journal", desc: "Capture video reflections.", icon: "🎥", soon: true },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-stone-100 rounded-xl p-4">
                <div className="text-xl mb-2">{item.icon}</div>
                <h3 className="text-sm font-medium text-stone-800">{item.title}</h3>
                <p className="text-xs text-stone-400 mt-1">{item.desc}</p>
                <span className="inline-block mt-3 text-xs text-stone-400 border border-stone-200 px-2.5 py-1 rounded-md">Coming soon</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
