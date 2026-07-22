"use client";

import { useState, useEffect } from "react";
import { BookOpen, PenLine, TrendingUp, Lock, Trash2 } from "lucide-react";
import { useAchievementCheck } from "@/components/dashboard/AchievementToast";

const emotionOptions = [
  "Anxious", "Calm", "Grateful", "Overwhelmed", "Happy", "Sad", "Angry", "Hopeful",
  "Tired", "Energised", "Lonely", "Connected", "Proud", "Ashamed", "Content",
  "Frustrated", "Peaceful", "Excited", "Fearful", "Determined", "Reflective", "Numb",
];

const TRIGGER_OPTIONS = [
  "Work stress", "Relationship", "Sleep", "Health", "Financial", "Family", "Social situation", "Other",
];

const MOOD_EMOJIS  = ["", "😔", "😟", "😐", "🙂", "😊"];
const MOOD_LABELS  = ["", "Low", "Low-ish", "Okay", "Good", "Great"];
const MOOD_COLORS  = ["", "bg-red-300", "bg-orange-300", "bg-amber-300", "bg-lime-400", "bg-sage-400"];

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

type Tab = "entries" | "new" | "trends";

type Entry = {
  id: string; title: string; content: string; mood: number;
  emotions: string[]; type: string; wordCount: number; createdAt: string;
  sleepQuality?: number | null; triggers?: string[];
};

type MoodPoint = { date: string; score: number };

export default function JournalPage() {
  const checkAchievements = useAchievementCheck();
  const [tab, setTab]             = useState<Tab>("entries");
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
    setTimeout(() => { setSaved(false); setTab("entries"); resetForm(); }, 1400);
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

  function fmtDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

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
          { id: "entries", label: "Entries",     icon: <BookOpen size={14} /> },
          { id: "new",     label: "Write",        icon: <PenLine size={14} /> },
          { id: "trends",  label: "Mood Trends",  icon: <TrendingUp size={14} /> },
        ] as { id: Tab; label: string; icon: React.ReactNode }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSelected(null); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Entries list ── */}
      {tab === "entries" && !selected && (
        <div className="space-y-2">
          {loading && (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white border border-stone-100 rounded-xl" />)}
            </div>
          )}
          {!loading && entries.length === 0 && (
            <div className="text-center py-16">
              <p className="text-stone-400 text-sm">No entries yet. Start writing!</p>
            </div>
          )}
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
                  {entry.emotions?.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {entry.emotions.map((e) => (
                        <span key={e} className="text-[10px] text-stone-500 bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-md">{e}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-stone-500 font-medium">{fmtDate(entry.createdAt)}</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">{fmtTime(entry.createdAt)}</div>
                  {entry.wordCount > 0 && <div className="text-[10px] text-stone-400 mt-0.5">{entry.wordCount}w</div>}
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
            <div className="flex items-center gap-3 text-xs text-stone-400">
              <span>{fmtDate(selected.createdAt)}</span>
              <span>·</span>
              <span>{fmtTime(selected.createdAt)}</span>
            </div>
            <button
              onClick={() => deleteEntry(selected.id)}
              className="text-stone-300 hover:text-red-500 transition-colors p-1"
              title="Delete entry"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{MOOD_EMOJIS[selected.mood]}</span>
              <div>
                <h2 className="font-semibold text-stone-900">{selected.title}</h2>
                <span className="text-xs text-stone-400">{MOOD_LABELS[selected.mood]}</span>
              </div>
            </div>
            {selected.emotions?.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-3">
                {selected.emotions.map((e) => (
                  <span key={e} className="text-xs text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md">{e}</span>
                ))}
              </div>
            )}
            {(selected.sleepQuality || (selected.triggers?.length ?? 0) > 0) && (
              <div className="flex gap-1.5 flex-wrap mb-5">
                {selected.sleepQuality ? (
                  <span className="text-xs text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md">Sleep: {SLEEP_LABELS[selected.sleepQuality]}</span>
                ) : null}
                {selected.triggers?.map((t) => (
                  <span key={t} className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">{t}</span>
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
                <label className="text-xs font-medium text-stone-400 uppercase tracking-wider block mb-2">How did you sleep? (optional)</label>
                <div className="flex gap-2">
                  {SLEEP_LABELS.slice(1).map((label, i) => (
                    <button
                      key={label}
                      onClick={() => setNewSleepQuality(newSleepQuality === i + 1 ? 0 : i + 1)}
                      className={`flex-1 py-2 rounded-lg border text-[11px] font-medium transition-all ${
                        newSleepQuality === i + 1 ? "border-stone-900 bg-stone-50 text-stone-900" : "border-stone-100 text-stone-500 hover:border-stone-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-wider block mb-2">Any triggers today? (optional)</label>
                <div className="flex flex-wrap gap-1.5">
                  {TRIGGER_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleTrigger(t)}
                      className={`text-xs px-3 py-1.5 rounded-md border transition-all ${
                        newTriggers.includes(t)
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "border-stone-200 text-stone-600 hover:border-stone-400"
                      }`}
                    >
                      {t}
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
                <div className="text-[10px] text-stone-300 text-right mt-1">
                  {newContent.trim() ? newContent.trim().split(/\s+/).length : 0} words
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-stone-100">
                <button onClick={() => setTab("entries")} className="flex-1 py-2.5 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={saveEntry}
                  disabled={!newContent.trim() || saving}
                  className="flex-1 py-2.5 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? "Saving…" : "Save Entry"}
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
              { label: "Avg Mood",   value: `${avgMood} / 5` },
              { label: "Good days",  value: `${moodData.filter((d) => d.score >= 4).length}` },
              { label: "Entries",    value: `${entries.length} total` },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-stone-100 rounded-xl p-4 text-center">
                <div className="text-lg font-semibold text-stone-900">{s.value}</div>
                <div className="text-xs text-stone-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {moodData.length > 0 ? (
            <div className="bg-white border border-stone-100 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-stone-900 mb-5">Recent Mood History</h3>
              <div className="flex items-end gap-2 h-24">
                {moodData.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-sm">{MOOD_EMOJIS[day.score]}</span>
                    <div className={`w-full rounded-t-sm ${MOOD_COLORS[day.score]}`} style={{ height: `${(day.score / 5) * 72}px` }} />
                    <span className="text-[9px] text-stone-400 truncate w-full text-center">{day.date}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-stone-100 rounded-xl p-8 text-center">
              <p className="text-sm text-stone-400">Log your mood on the dashboard to see trends here.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { title: "Voice Journal", desc: "Record audio reflections.", icon: "🎙️" },
              { title: "Video Journal", desc: "Capture video reflections.",  icon: "🎥" },
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
