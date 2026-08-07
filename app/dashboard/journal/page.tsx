"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, Trash2, Plus, X } from "lucide-react";
import { useAchievementCheck } from "@/components/dashboard/AchievementToast";

const emotionOptions = [
  "Anxious", "Calm", "Grateful", "Overwhelmed", "Happy", "Sad", "Angry", "Hopeful",
  "Tired", "Energised", "Lonely", "Connected", "Proud", "Ashamed", "Content",
  "Frustrated", "Peaceful", "Excited", "Fearful", "Determined", "Reflective", "Numb",
];

const TRIGGER_OPTIONS = [
  "Work stress", "Relationship", "Sleep", "Health", "Financial", "Family", "Social situation", "Other",
];

const MOOD_EMOJIS   = ["", "😔", "😟", "😐", "🙂", "😊"];
const MOOD_LABELS   = ["", "Low", "Low-ish", "Okay", "Good", "Great"];
const MOOD_COLORS   = ["", "bg-red-300", "bg-orange-300", "bg-amber-300", "bg-lime-400", "bg-sage-400"];
const MOOD_BADGE_BG = ["", "bg-red-100", "bg-orange-100", "bg-amber-100", "bg-lime-100", "bg-sage-100"];

const SLEEP_LABELS = ["", "Poor", "Rough", "Okay", "Good", "Great"];

const LOCAL_KEY = "me_journal_entries";

function localLoad(): Entry[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]"); }
  catch { return []; }
}
function localSave(entry: Entry) {
  try {
    const list = localLoad();
    localStorage.setItem(LOCAL_KEY, JSON.stringify([entry, ...list]));
  } catch {}
}
function localDelete(id: string) {
  try {
    const list = localLoad().filter((e) => e.id !== id);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {}
}
function localId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type Entry = {
  id: string; title: string; content: string; mood: number;
  emotions: string[]; type: string; wordCount: number; createdAt: string;
  sleepQuality?: number | null; triggers?: string[];
};

type MoodPoint = { date: string; score: number };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function groupLabel(iso: string, now: Date): string {
  const dayDiff = Math.round((startOfDay(now).getTime() - startOfDay(new Date(iso)).getTime()) / 86400000);
  if (dayDiff <= 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff <= 7) return "This week";
  return "Earlier";
}

function sparklinePath(scores: number[]): string {
  if (scores.length < 2) return "";
  const w = 56, h = 20, pad = 2;
  const min = Math.min(...scores), max = Math.max(...scores);
  const range = max - min || 1;
  return scores
    .map((v, i) => {
      const x = pad + (i * (w - pad * 2)) / (scores.length - 1);
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function EntrySheet({ entry, onClose, onDelete }: { entry: Entry; onClose: () => void; onDelete: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-stone-100 sticky top-0 bg-white">
          <span className="text-xs text-stone-400">{fmtDate(entry.createdAt)} · {fmtTime(entry.createdAt)}</span>
          <div className="flex-1" />
          <button onClick={onDelete} className="text-stone-300 hover:text-red-500 transition-colors p-1" title="Delete entry">
            <Trash2 size={14} strokeWidth={1.5} />
          </button>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{MOOD_EMOJIS[entry.mood]}</span>
            <div>
              <h2 className="font-semibold text-stone-900">{entry.title}</h2>
              <span className="text-xs text-stone-400">{MOOD_LABELS[entry.mood]}</span>
            </div>
          </div>
          {entry.emotions?.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-3">
              {entry.emotions.map((e) => (
                <span key={e} className="text-xs text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md">{e}</span>
              ))}
            </div>
          )}
          {(entry.sleepQuality || (entry.triggers?.length ?? 0) > 0) && (
            <div className="flex gap-1.5 flex-wrap mb-5">
              {entry.sleepQuality ? (
                <span className="text-xs text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md">Sleep: {SLEEP_LABELS[entry.sleepQuality]}</span>
              ) : null}
              {entry.triggers?.map((t) => (
                <span key={t} className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">{t}</span>
              ))}
            </div>
          )}
          <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{entry.content}</p>
        </div>
      </div>
    </div>
  );
}

export default function JournalPage() {
  const checkAchievements = useAchievementCheck();
  const [entries, setEntries]     = useState<Entry[]>([]);
  const [moodData, setMoodData]   = useState<MoodPoint[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Entry | null>(null);

  const [newTitle,    setNewTitle]    = useState("");
  const [newContent,  setNewContent]  = useState("");
  const [newMood,     setNewMood]     = useState(0);
  const [newEmotions, setNewEmotions] = useState<string[]>([]);
  const [newSleepQuality, setNewSleepQuality] = useState(0);
  const [newTriggers, setNewTriggers] = useState<string[]>([]);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const detailsRef   = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    // Fetch journal and mood independently so one failing doesn't block the other
    fetch("/api/journal")
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((jData) => {
        const dbEntries: Entry[] = jData.entries ?? [];
        if (dbEntries.length > 0) {
          // DB entries take precedence; prepend any local-only entries (id starts with "local_")
          const localOnly = localLoad().filter((e) => e.id.startsWith("local_"));
          const merged = [...localOnly, ...dbEntries].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setEntries(merged);
        } else {
          setEntries(localLoad());
        }
      })
      .catch(() => {
        // Auth not available (dev) or network error — fall back to localStorage
        setEntries(localLoad());
      })
      .finally(() => setLoading(false));

    fetch("/api/mood")
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((mData) => {
        const points: MoodPoint[] = (mData.entries ?? []).slice(0, 7).reverse().map((e: { createdAt: string; score: number }) => ({
          date:  new Date(e.createdAt).toLocaleDateString("en-US", { weekday: "short" }),
          score: e.score,
        }));
        setMoodData(points);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [newContent]);

  function toggleEmotion(e: string) {
    setNewEmotions((p) => p.includes(e) ? p.filter((x) => x !== e) : [...p, e]);
  }

  function toggleTrigger(t: string) {
    setNewTriggers((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);
  }

  function resetForm() {
    setNewTitle(""); setNewContent(""); setNewMood(0); setNewEmotions([]);
    setNewSleepQuality(0); setNewTriggers([]);
  }

  async function saveEntry() {
    if (!newContent.trim()) return;
    setSaving(true);
    const wordCount = newContent.trim().split(/\s+/).filter(Boolean).length;
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:        newTitle || "Untitled",
          content:      newContent,
          mood:         newMood || 3,
          emotions:     newEmotions,
          sleepQuality: newSleepQuality || undefined,
          triggers:     newTriggers,
          type:         "text",
        }),
      });
      if (!res.ok) throw new Error("api_error");
      const data = await res.json();
      if (data.entry) setEntries((p) => [data.entry, ...p]);
      checkAchievements();
    } catch {
      // API unavailable (no auth in dev) — persist locally so the entry is never lost
      const entry: Entry = {
        id:        localId(),
        title:     newTitle || "Untitled",
        content:   newContent,
        mood:      newMood || 3,
        emotions:  newEmotions,
        sleepQuality: newSleepQuality || null,
        triggers:  newTriggers,
        type:      "text",
        wordCount,
        createdAt: new Date().toISOString(),
      };
      localSave(entry);
      setEntries((p) => [entry, ...p]);
    } finally {
      setSaving(false);
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      resetForm();
      if (detailsRef.current) detailsRef.current.open = false;
    }, 1400);
  }

  async function deleteEntry(id: string) {
    // Fire-and-forget for DB; always clean up localStorage (harmless if not there)
    fetch(`/api/journal/${id}`, { method: "DELETE" }).catch(() => {});
    localDelete(id);
    setEntries((p) => p.filter((e) => e.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const avgMood = moodData.length
    ? (moodData.reduce((s, d) => s + d.score, 0) / moodData.length).toFixed(1)
    : "—";
  const goodDays = moodData.filter((d) => d.score >= 4).length;
  const wordCount = newContent.trim() ? newContent.trim().split(/\s+/).filter(Boolean).length : 0;

  const now = new Date();
  const GROUP_ORDER = ["Today", "Yesterday", "This week", "Earlier"];
  const grouped = GROUP_ORDER
    .map((label) => ({ label, items: entries.filter((e) => groupLabel(e.createdAt, now) === label) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Journal</h1>
        <p className="text-sm text-stone-500 mt-1 flex items-center gap-1.5">
          {entries.length} entries
          <span className="text-stone-300">·</span>
          <Lock size={11} strokeWidth={1.5} className="text-stone-400" />
          Private & encrypted
        </p>
      </div>

      {/* ── Composer ── */}
      <div className="bg-white border border-stone-100 rounded-2xl p-4">
        <div className="flex gap-2 mb-3">
          {MOOD_EMOJIS.slice(1).map((emoji, i) => {
            const val = i + 1;
            return (
              <button
                key={val}
                onClick={() => setNewMood(val)}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border text-lg transition-all ${
                  newMood === val ? "border-sage-600 bg-sage-50" : "border-stone-100 hover:border-stone-300"
                }`}
              >
                {emoji}
              </button>
            );
          })}
        </div>

        <textarea
          ref={textareaRef}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="What's on your mind right now?"
          rows={1}
          className="w-full text-sm text-stone-800 placeholder-stone-300 focus:outline-none resize-none leading-relaxed"
        />

        <details ref={detailsRef} className="mt-1">
          <summary className="cursor-pointer text-xs font-semibold text-sage-700 inline-flex items-center gap-1 list-none [&::-webkit-details-marker]:hidden mt-2">
            <Plus size={12} strokeWidth={2.5} />
            Add title, sleep, emotions or triggers
          </summary>
          <div className="mt-4 space-y-4">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Entry title (optional)"
              className="w-full text-sm font-semibold text-stone-900 placeholder-stone-300 focus:outline-none border-b border-stone-100 pb-2"
            />
            <div>
              <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">Emotions</label>
              <div className="flex flex-wrap gap-1.5">
                {emotionOptions.map((e) => (
                  <button
                    key={e}
                    onClick={() => toggleEmotion(e)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      newEmotions.includes(e) ? "bg-sage-700 text-white border-sage-700" : "border-stone-200 text-stone-600 hover:border-stone-400"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">Sleep last night</label>
              <div className="flex gap-1.5">
                {SLEEP_LABELS.slice(1).map((label, i) => (
                  <button
                    key={label}
                    onClick={() => setNewSleepQuality(newSleepQuality === i + 1 ? 0 : i + 1)}
                    className={`flex-1 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                      newSleepQuality === i + 1 ? "border-sage-600 bg-sage-50 text-sage-800" : "border-stone-100 text-stone-500 hover:border-stone-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">Triggers today</label>
              <div className="flex flex-wrap gap-1.5">
                {TRIGGER_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTrigger(t)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      newTriggers.includes(t) ? "bg-amber-100 text-amber-800 border-amber-300" : "border-stone-200 text-stone-600 hover:border-stone-400"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </details>

        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-stone-100">
          <span className="text-[10px] text-stone-300 mr-auto">{wordCount} words</span>
          {saved ? (
            <span className="text-xs font-medium text-sage-600">Saved ✓</span>
          ) : (
            <button
              onClick={saveEntry}
              disabled={!newContent.trim() || saving}
              className="text-xs font-semibold bg-sage-700 hover:bg-sage-800 disabled:opacity-30 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition-colors"
            >
              {saving ? "Saving…" : "Save entry"}
            </button>
          )}
        </div>
      </div>

      {/* ── Mood trends ── */}
      <div>
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-semibold text-stone-600">Mood trends</span>
          <span className="flex items-center gap-2 text-[11px] font-medium text-stone-400">
            avg {avgMood} this week
            {moodData.length >= 2 && (
              <svg viewBox="0 0 56 20" className="w-14 h-5 text-sage-500">
                <path d={sparklinePath(moodData.map((d) => d.score))} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </div>
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white border border-stone-100 rounded-xl p-3 text-center">
              <div className="text-base font-bold text-stone-900">{avgMood} / 5</div>
              <div className="text-[10px] text-stone-400 mt-0.5">Avg mood</div>
            </div>
            <div className="bg-white border border-stone-100 rounded-xl p-3 text-center">
              <div className="text-base font-bold text-stone-900">{goodDays}</div>
              <div className="text-[10px] text-stone-400 mt-0.5">Good days</div>
            </div>
            <div className="bg-white border border-stone-100 rounded-xl p-3 text-center">
              <div className="text-base font-bold text-stone-900">{entries.length}</div>
              <div className="text-[10px] text-stone-400 mt-0.5">Entries</div>
            </div>
          </div>
          <div className="bg-white border border-stone-100 rounded-xl p-4">
            {moodData.length > 0 ? (
              <div className="flex items-end gap-2 h-24">
                {moodData.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center h-full group/bar">
                    <div className="flex-1 w-full flex items-end">
                      <div
                        className={`w-full rounded-t-md rounded-b-sm relative ${MOOD_COLORS[day.score]}`}
                        style={{ height: `${(day.score / 5) * 100}%` }}
                      >
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-stone-900 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none">
                          {MOOD_LABELS[day.score]} · {day.score}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] text-stone-300 mt-1.5">{day.date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 text-center py-4">Log your mood on the dashboard to see trends here.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Entries feed ── */}
      {loading && (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white border border-stone-100 rounded-2xl" />)}
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="text-center py-16">
          <p className="text-stone-400 text-sm">No entries yet. Start writing above.</p>
        </div>
      )}

      {!loading && grouped.map((g) => (
        <div key={g.label}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-300 mt-5 mb-2.5 first:mt-0">{g.label}</p>
          <div className="space-y-2.5">
            {g.items.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelected(entry)}
                className="w-full text-left bg-white border border-stone-100 rounded-2xl p-4 hover:border-sage-300 hover:shadow-sm transition-all"
              >
                <div className="flex gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${MOOD_BADGE_BG[entry.mood]}`}>
                    {MOOD_EMOJIS[entry.mood]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-bold truncate ${entry.title === "Untitled" ? "text-stone-400" : "text-stone-900"}`}>
                        {entry.title}
                      </span>
                      <span className="text-[11px] text-stone-400 flex-shrink-0">{fmtTime(entry.createdAt)}</span>
                    </div>
                    {entry.content && (
                      <p className="text-xs text-stone-400 leading-relaxed line-clamp-2 mt-1">{entry.content}</p>
                    )}
                    {(entry.emotions?.length > 0 || (entry.triggers?.length ?? 0) > 0) && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {entry.emotions?.map((e) => (
                          <span key={e} className="text-[10px] text-stone-500 bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-md">{e}</span>
                        ))}
                        {entry.triggers?.map((t) => (
                          <span key={t} className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <EntrySheet entry={selected} onClose={() => setSelected(null)} onDelete={() => deleteEntry(selected.id)} />
      )}
    </div>
  );
}
