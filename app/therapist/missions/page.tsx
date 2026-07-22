"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Eye, X, Check, ChevronRight, Clock, Repeat2, Paperclip, FileText, ImageIcon, File, Upload, Info, LayoutGrid, UserCheck, Users } from "lucide-react";

type AttachedFile = { id: string; name: string; size: number; mimeType: string; url: string };
type Mission = {
  id: string; title: string; description: string; category: string;
  duration: number; xp: number; recurring: boolean; completionCount: number; createdAt: string;
  attachments: AttachedFile[]; activityType: string;
};
type Mode = "list" | "create" | "edit" | "view" | "templates";
type Client = { id: string; name: string; email: string };

function AssignModal({ mission, onClose }: { mission: Mission; onClose: () => void }) {
  const [clients,     setClients]     = useState<Client[]>([]);
  const [assigned,    setAssigned]    = useState<Set<string>>(new Set());
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/therapist/clients").then((r) => r.json()),
      fetch(`/api/therapist/missions/assign?missionId=${mission.id}`).then((r) => r.json()),
    ]).then(([clientsData, assignData]) => {
      setClients(clientsData.clients ?? []);
      setAssigned(new Set(assignData.assignedClientIds ?? []));
    }).finally(() => setLoading(false));
  }, [mission.id]);

  function toggle(id: string) {
    setAssigned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/therapist/missions/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId: mission.id, clientIds: [...assigned] }),
      });
      setSaved(true);
      setTimeout(onClose, 1000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md z-10 overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Assign to clients</h2>
            <p className="text-xs text-stone-400 mt-0.5 truncate max-w-xs">{mission.title}</p>
          </div>
          <button onClick={onClose} className="text-stone-300 hover:text-stone-600 transition-colors ml-3 flex-shrink-0">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-6 py-4 max-h-72 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-stone-100 rounded-xl" />)}
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-sm text-stone-400">
              <Users size={28} className="mx-auto mb-2 text-stone-200" strokeWidth={1.5} />
              No clients yet. Add clients from the Clients page.
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => {
                const on = assigned.has(client.id);
                return (
                  <button key={client.id} onClick={() => toggle(client.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${on ? "border-stone-900 bg-stone-900" : "border-stone-200 bg-stone-50 hover:bg-stone-100"}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${on ? "bg-white border-white" : "border-stone-300"}`}>
                      {on && <Check size={10} strokeWidth={3} className="text-stone-900" />}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-medium leading-tight ${on ? "text-white" : "text-stone-800"}`}>{client.name}</div>
                      <div className={`text-xs truncate ${on ? "text-stone-300" : "text-stone-400"}`}>{client.email}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-3 border-t border-stone-100 flex gap-2">
          <button onClick={onClose} className="flex-1 border border-stone-200 text-sm py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || saved || clients.length === 0}
            className="flex-1 bg-stone-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-stone-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5">
            {saved ? <><Check size={14} /> Saved!</> : saving ? "Saving…" : <><UserCheck size={14} /> Save assignments</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = ["mindfulness", "journaling", "breathing", "movement", "exposure", "social", "habit", "safety"];
const DURATION_OPTS = [5, 10, 15, 20, 30, 45, 60, 90, 120];
const XP_OPTS = [5, 10, 15, 20, 25, 30, 50];

function fileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <ImageIcon size={14} strokeWidth={1.5} className="text-stone-500" />;
  if (mimeType === "application/pdf") return <FileText size={14} strokeWidth={1.5} className="text-stone-500" />;
  return <File size={14} strokeWidth={1.5} className="text-stone-500" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDur(min: number) {
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ""}`;
}

const ACTIVITY_TYPES: { value: string; label: string; hint: string }[] = [
  { value: "gratitude",       label: "Gratitude list",       hint: "Fill in 3 things they're grateful for" },
  { value: "reflection",      label: "Reflective writing",   hint: "Mood check + guided free-writing prompt" },
  { value: "checkin",         label: "Mood check-in",        hint: "Mood, energy, body-tension wizard" },
  { value: "worry",           label: "Worry record",         hint: "Write worry → assess control → action plan" },
  { value: "self_compassion", label: "Self-compassion break",hint: "Name the pain, then write kind words" },
  { value: "strength",        label: "Strength spotting",    hint: "Pick from 16 character strengths" },
  { value: "values",          label: "Values clarification",  hint: "Pick top 3 values + reflect" },
  { value: "breathing",       label: "4-7-8 breathing",      hint: "Animated paced-breathing exercise" },
  { value: "timer",           label: "Guided timer",         hint: "Countdown timer with on-screen instructions" },
  { value: "walk",            label: "Sensory grounding walk",hint: "Timer + 5-4-3-2-1 grounding checklist" },
  { value: "bodyscan",        label: "Body scan",            hint: "10-region guided body scan" },
  { value: "social",          label: "Reach out",            hint: "Pick a recipient + send a message" },
  { value: "stretch",         label: "Stretch routine",      hint: "Animated 6-step stretch sequence" },
  { value: "generic",         label: "Simple checklist",     hint: "Description + mark-as-done (for real-world tasks)" },
];

const BLANK_FORM = { title: "", description: "", category: "mindfulness", duration: 15, xp: 10, recurring: false, activityType: "generic" };
type Form = typeof BLANK_FORM;

const CATEGORY_BADGE: Record<string, { bg: string; text: string }> = {
  mindfulness: { bg: "bg-violet-50",  text: "text-violet-700" },
  journaling:  { bg: "bg-amber-50",   text: "text-amber-700" },
  breathing:   { bg: "bg-sky-50",     text: "text-sky-700" },
  movement:    { bg: "bg-teal-50",    text: "text-teal-700" },
  social:      { bg: "bg-pink-50",    text: "text-pink-700" },
  habit:       { bg: "bg-stone-100",  text: "text-stone-700" },
  exposure:    { bg: "bg-orange-50",  text: "text-orange-700" },
  safety:      { bg: "bg-red-50",     text: "text-red-700" },
};

type Template = { title: string; description: string; category: string; duration: number; xp: number; recurring: boolean; approach: string; activityType: string };

const PREMADE_TASKS: Template[] = [
  {
    title: "Thought Record (CBT)",
    description: "Identify a distressing thought, rate your belief (0–100%), challenge it with evidence for and against, then write a balanced alternative thought.",
    category: "journaling", duration: 15, xp: 20, recurring: true,
    approach: "CBT", activityType: "reflection",
  },
  {
    title: "Behavioral Activation Schedule",
    description: "Plan three enjoyable or meaningful activities for the coming week. Rate predicted vs actual pleasure after each to rebuild motivation.",
    category: "habit", duration: 15, xp: 20, recurring: false,
    approach: "CBT", activityType: "generic",
  },
  {
    title: "Exposure Ladder Step",
    description: "Complete the next agreed step on your personal exposure hierarchy. Rate anxiety before, peak, and after using the SUDS scale (0–100).",
    category: "exposure", duration: 20, xp: 30, recurring: false,
    approach: "Exposure", activityType: "generic",
  },
  {
    title: "SUDS Anxiety Rating Log",
    description: "Three times today, pause and rate your anxiety on the SUDS scale (0 = calm, 100 = worst ever). Note the situation and any physical sensations.",
    category: "mindfulness", duration: 5, xp: 10, recurring: true,
    approach: "CBT", activityType: "checkin",
  },
  {
    title: "Safety Plan Review",
    description: "Read through your personal safety plan. Verify that all contact numbers are still correct and that coping strategies still feel accessible.",
    category: "safety", duration: 5, xp: 15, recurring: true,
    approach: "Crisis", activityType: "generic",
  },
  {
    title: "Opposite Action Practice",
    description: "Notice an emotion urging you toward an unhelpful behavior, then deliberately do the opposite. Log the emotion, the urge, and what you did instead.",
    category: "habit", duration: 15, xp: 20, recurring: true,
    approach: "DBT", activityType: "reflection",
  },
  {
    title: "Emotion Surfing",
    description: "When a difficult emotion arises, observe it like a wave: notice where you feel it in your body, watch it peak, and stay with it until it subsides without acting on it.",
    category: "mindfulness", duration: 10, xp: 20, recurring: true,
    approach: "DBT", activityType: "bodyscan",
  },
  {
    title: "TIPP Skill",
    description: "Use all four TIPP steps: Temperature (cold water on face), Intense exercise (60 sec jumping jacks), Paced breathing (4 in / 6 out), Paired muscle relaxation.",
    category: "breathing", duration: 15, xp: 25, recurring: true,
    approach: "DBT", activityType: "breathing",
  },
  {
    title: "Check the Facts",
    description: "Write down an upsetting interpretation of an event, then list only the objective facts. Ask: does my emotion fit the actual facts, or an assumed story?",
    category: "journaling", duration: 10, xp: 15, recurring: true,
    approach: "DBT", activityType: "worry",
  },
  {
    title: "Wise Mind Meditation",
    description: "Sit quietly and breathe. On each inhale think 'wise', on each exhale think 'mind'. Let thoughts settle until you sense a balanced, centred awareness.",
    category: "mindfulness", duration: 10, xp: 20, recurring: true,
    approach: "DBT", activityType: "breathing",
  },
  {
    title: "Cognitive Defusion",
    description: "Write a recurring unhelpful thought, then prefix it with 'I notice I am having the thought that…'. Repeat three times. Notice how this creates distance.",
    category: "mindfulness", duration: 10, xp: 15, recurring: true,
    approach: "ACT", activityType: "reflection",
  },
  {
    title: "Values Card Sort",
    description: "Review a list of 30 life values and sort them into 'very important', 'somewhat important', and 'not important'. Identify your top five and write why each matters.",
    category: "journaling", duration: 20, xp: 25, recurring: false,
    approach: "ACT", activityType: "values",
  },
  {
    title: "Committed Action Step",
    description: "Choose one small action that moves you toward a core value today — no matter how tiny. Do it, then write one sentence about how it connected to what matters to you.",
    category: "habit", duration: 10, xp: 15, recurring: true,
    approach: "ACT", activityType: "generic",
  },
  {
    title: "Activity Monitoring Log",
    description: "Log each activity you do today (in 30-min blocks), rating mood (1–10) and mastery/pleasure. This data helps identify patterns linking behavior to mood.",
    category: "journaling", duration: 10, xp: 15, recurring: true,
    approach: "CBT", activityType: "generic",
  },
  {
    title: "Pleasant Events List",
    description: "List 10 activities — large or small — that you used to enjoy or have been curious about. Circle any you could realistically do this week.",
    category: "journaling", duration: 10, xp: 15, recurring: false,
    approach: "Behavioral", activityType: "generic",
  },
  {
    title: "Coping Card Creation",
    description: "On an index card or notes app, write one helpful coping statement for your hardest trigger. Keep it with you and read it when you notice the trigger.",
    category: "habit", duration: 10, xp: 15, recurring: false,
    approach: "CBT", activityType: "self_compassion",
  },
  {
    title: "Interpersonal Effectiveness Script",
    description: "Use the DEAR MAN framework to script a difficult conversation: Describe, Express, Assert, Reinforce, stay Mindful, Appear confident, Negotiate.",
    category: "social", duration: 15, xp: 20, recurring: false,
    approach: "DBT", activityType: "social",
  },
  {
    title: "Sleep Diary Entry",
    description: "Record last night's sleep: bedtime, wake time, number of awakenings, sleep quality (1–5), and morning mood. Helps identify patterns over time.",
    category: "journaling", duration: 5, xp: 10, recurring: true,
    approach: "Sleep", activityType: "checkin",
  },
  {
    title: "Distress Tolerance Box",
    description: "Gather 5 items that engage your senses and bring comfort (scented lotion, a photo, a smooth stone, gum, a playlist). Assemble your personal soothe kit.",
    category: "habit", duration: 20, xp: 15, recurring: false,
    approach: "DBT", activityType: "walk",
  },
  {
    title: "Strengths Inventory",
    description: "List 5 personal character strengths you demonstrated this week — even in small ways. For each, write one sentence about how you showed it.",
    category: "journaling", duration: 15, xp: 20, recurring: false,
    approach: "Positive", activityType: "strength",
  },

{
    title: "Daily Three Good Things Gratitude List",
    description: "List three good things from today, no matter how small, and note briefly why each one mattered to you.",
    category: "journaling",
    duration: 5,
    xp: 8,
    recurring: true,
    approach: "Positive",
    activityType: "gratitude",
  },
{
    title: "Evening Free-Write: Naming the Day's Emotional Weather",
    description: "Choose the mood that best captures your day, then freely write about what shaped that emotional weather and what you noticed in yourself.",
    category: "journaling",
    duration: 12,
    xp: 15,
    recurring: true,
    approach: "Mindfulness",
    activityType: "reflection",
  },
{
    title: "Letter to My Future Self",
    description: "Reflect on where you are right now and write an open letter to yourself one year from now, describing what you hope will be different and what you want to remember.",
    category: "journaling",
    duration: 18,
    xp: 20,
    recurring: false,
    approach: "ACT",
    activityType: "reflection",
  },
{
    title: "Processing a Difficult Interaction",
    description: "Pick your mood, then write freely about a recent interaction that stayed with you - what happened, what you felt, and what you'd want the other person to understand.",
    category: "journaling",
    duration: 15,
    xp: 18,
    recurring: false,
    approach: "Interpersonal",
    activityType: "reflection",
  },
{
    title: "Post-Therapy Session Reflection",
    description: "After your session, note your mood and free-write about what came up, what felt important, and what you want to carry forward before next time.",
    category: "journaling",
    duration: 15,
    xp: 18,
    recurring: true,
    approach: "Psychoeducation",
    activityType: "reflection",
  },
{
    title: "End-of-Week Life Review",
    description: "Reflect on the past week as a whole - what drained you, what energized you, and what you'd like to do differently next week - and write it out in your own words.",
    category: "journaling",
    duration: 18,
    xp: 20,
    recurring: true,
    approach: "Behavioral",
    activityType: "reflection",
  },
{
    title: "Wise Mind Reflection on a Hard Decision",
    description: "Pick your mood, then write about a decision you're facing, exploring what your emotions want, what logic says, and where your 'wise mind' lands.",
    category: "journaling",
    duration: 15,
    xp: 18,
    recurring: false,
    approach: "DBT",
    activityType: "reflection",
  },
{
    title: "Worry Record: Separating Fact from Fear",
    description: "Write down a worry that's been circling in your mind, decide whether it's something in your control, partially in your control, or not in your control, then note one concrete next step.",
    category: "journaling",
    duration: 12,
    xp: 15,
    recurring: true,
    approach: "CBT",
    activityType: "worry",
  },
{
    title: "Catastrophic Thought Worry Log",
    description: "Capture a worst-case thought you've been dwelling on, assess how much of it you can actually influence, and write one grounded action or release plan.",
    category: "journaling",
    duration: 12,
    xp: 15,
    recurring: true,
    approach: "CBT",
    activityType: "worry",
  },
{
    title: "Self-Compassion Break After a Setback",
    description: "Name what's hurting right now, acknowledge that struggling is part of being human, then write yourself a few kind, supportive words as you would to a close friend.",
    category: "journaling",
    duration: 10,
    xp: 15,
    recurring: true,
    approach: "Mindfulness",
    activityType: "self_compassion",
  },
{
    title: "Quieting the Inner Critic",
    description: "Describe the harsh self-talk you've noticed lately, recognize that self-criticism is a common human struggle, and write a kinder, more supportive response to yourself.",
    category: "journaling",
    duration: 10,
    xp: 15,
    recurring: true,
    approach: "Trauma-informed",
    activityType: "self_compassion",
  },
{
    title: "Character Strengths Spotting: Today's Wins",
    description: "Look back on today and select every character strength you drew on, from courage to kindness to perseverance, to get through the moments that mattered.",
    category: "journaling",
    duration: 8,
    xp: 12,
    recurring: true,
    approach: "Positive",
    activityType: "strength",
  },
{
    title: "Values Clarification: What Matters Most Right Now",
    description: "Choose the three values that feel most important to you at this point in your life, then reflect briefly on why they rose to the top.",
    category: "journaling",
    duration: 12,
    xp: 15,
    recurring: false,
    approach: "ACT",
    activityType: "values",
  },
{
    title: "Progressive Body Scan for Tension Awareness",
    description: "Follow the guided body scan from head to feet, pausing at each region to notice tension or ease without trying to change anything.",
    category: "mindfulness",
    duration: 5,
    xp: 10,
    recurring: true,
    approach: "Mindfulness",
    activityType: "bodyscan",
  },
{
    title: "Pre-Sleep Body Scan Relaxation",
    description: "Lie down and follow the guided scan from head to feet to release physical tension and settle your body before sleep.",
    category: "mindfulness",
    duration: 5,
    xp: 10,
    recurring: true,
    approach: "Sleep",
    activityType: "bodyscan",
  },
{
    title: "Mindful Walking Meditation",
    description: "Take a slow, deliberate walk while using the timer to pace yourself, then check off what you notice with each sense as you move.",
    category: "mindfulness",
    duration: 15,
    xp: 18,
    recurring: true,
    approach: "ACT",
    activityType: "walk",
  },
{
    title: "5-4-3-2-1 Sensory Grounding Practice",
    description: "Use the timer to slow down, then work through the checklist of five things you see, four you hear, three you can touch, two you smell, and one you taste.",
    category: "mindfulness",
    duration: 10,
    xp: 15,
    recurring: true,
    approach: "Trauma-informed",
    activityType: "walk",
  },
{
    title: "Mindful Nature Walk with Sensory Awareness",
    description: "Spend time outdoors during the countdown, deliberately noticing sights, sounds, textures, smells, and tastes around you and checking them off as you go.",
    category: "mindfulness",
    duration: 20,
    xp: 22,
    recurring: false,
    approach: "Behavioral",
    activityType: "walk",
  },
{
    title: "Loving-Kindness Meditation",
    description: "Sit quietly for the full timer and follow the on-screen prompts to silently offer goodwill first to yourself, then to others, without needing to write anything.",
    category: "mindfulness",
    duration: 10,
    xp: 15,
    recurring: true,
    approach: "Positive",
    activityType: "timer",
  },
{
    title: "Sitting Meditation: Anchoring to the Breath",
    description: "Sit comfortably for the length of the timer, returning your attention to the sensation of breathing each time your mind wanders.",
    category: "mindfulness",
    duration: 10,
    xp: 15,
    recurring: true,
    approach: "DBT",
    activityType: "timer",
  },
{
    title: "Mindful Eating Meditation",
    description: "Eat a small snack slowly for the duration of the timer, paying full attention to its taste, texture, and smell with each bite.",
    category: "mindfulness",
    duration: 12,
    xp: 15,
    recurring: true,
    approach: "Psychoeducation",
    activityType: "timer",
  },
{
    title: "Guided Imagery: Safe-Place Visualization",
    description: "Sit or lie down for the timer and picture a place where you feel completely safe and calm, using as much sensory detail as you can.",
    category: "mindfulness",
    duration: 10,
    xp: 15,
    recurring: false,
    approach: "Trauma-informed",
    activityType: "timer",
  },
{
    title: "Mountain Meditation for Inner Stability",
    description: "For the length of the timer, sit tall and imagine yourself as a mountain - steady and unmoved while thoughts and feelings pass through like weather.",
    category: "mindfulness",
    duration: 10,
    xp: 15,
    recurring: true,
    approach: "Mindfulness",
    activityType: "timer",
  },
{
    title: "Present-Moment Mindfulness Check-In",
    description: "Pause to note your mood and energy, check in with any tension you're holding in your body, and add an optional note about what's present for you right now.",
    category: "mindfulness",
    duration: 5,
    xp: 8,
    recurring: true,
    approach: "Mindfulness",
    activityType: "checkin",
  },
{
    title: "4-7-8 Calming Breath Practice",
    description: "Follow the guided 4-7-8 breathing animation - inhale for 4 seconds, hold for 7, exhale for 8 - for two full rounds to calm your nervous system.",
    category: "breathing",
    duration: 3,
    xp: 8,
    recurring: true,
    approach: "Mindfulness",
    activityType: "breathing",
  },
{
    title: "4-7-8 Breathing for Falling Asleep",
    description: "Follow the guided 4-7-8 breathing pattern in bed for two rounds to slow your heart rate and ease into sleep.",
    category: "breathing",
    duration: 3,
    xp: 8,
    recurring: true,
    approach: "Sleep",
    activityType: "breathing",
  },
{
    title: "4-7-8 Breathing to Downshift Anxiety",
    description: "When anxiety starts to build, follow the guided 4-7-8 breathing animation for two rounds to bring your body's arousal back down.",
    category: "breathing",
    duration: 3,
    xp: 8,
    recurring: true,
    approach: "DBT",
    activityType: "breathing",
  },
{
    title: "Box Breathing for Nervous System Regulation",
    description: "For the length of the timer, breathe in a steady square pattern - inhale 4 counts, hold 4, exhale 4, hold 4 - to settle your nervous system.",
    category: "breathing",
    duration: 5,
    xp: 10,
    recurring: true,
    approach: "DBT",
    activityType: "timer",
  },
{
    title: "Diaphragmatic Breathing Practice",
    description: "For the length of the timer, place a hand on your belly and breathe slowly so your belly rises more than your chest, building a habit of deeper, calmer breaths.",
    category: "breathing",
    duration: 8,
    xp: 12,
    recurring: true,
    approach: "Psychoeducation",
    activityType: "timer",
  },
{
    title: "Pursed-Lip Breathing for Panic Symptoms",
    description: "For the duration of the timer, inhale slowly through your nose and exhale twice as long through pursed lips to slow your breathing rate during panic symptoms.",
    category: "breathing",
    duration: 5,
    xp: 10,
    recurring: true,
    approach: "CBT",
    activityType: "timer",
  },
{
    title: "Alternate Nostril Breathing for Balance",
    description: "For the length of the timer, gently alternate breathing through one nostril at a time to slow down and create a sense of balance.",
    category: "breathing",
    duration: 6,
    xp: 10,
    recurring: true,
    approach: "Mindfulness",
    activityType: "timer",
  },
{
    title: "Resonance Breathing at Six Breaths Per Minute",
    description: "For the duration of the timer, breathe in for about 5 seconds and out for about 5 seconds, aiming for a steady rhythm of roughly six breaths a minute.",
    category: "breathing",
    duration: 10,
    xp: 15,
    recurring: true,
    approach: "Psychoeducation",
    activityType: "timer",
  },
{
    title: "Counted Breath: Extending the Exhale",
    description: "For the length of the timer, breathe in for a count of four and out for a count of six, making each exhale longer than the inhale to trigger your body's relaxation response.",
    category: "breathing",
    duration: 5,
    xp: 10,
    recurring: true,
    approach: "DBT",
    activityType: "timer",
  },
{
    title: "Gentle Full-Body Stretch Sequence",
    description: "Follow the guided stretch sequence - neck rolls, shoulder shrugs, and a forward fold - to release physical tension held in your body.",
    category: "movement",
    duration: 5,
    xp: 10,
    recurring: true,
    approach: "Mindfulness",
    activityType: "stretch",
  },
{
    title: "Morning Mobility Stretch Routine",
    description: "Start your day with the guided stretch sequence to wake up your body and loosen stiffness from sleep.",
    category: "movement",
    duration: 5,
    xp: 10,
    recurring: true,
    approach: "Behavioral",
    activityType: "stretch",
  },
{
    title: "Desk-Break Tension-Release Stretch",
    description: "Step away from your desk and follow the guided stretch sequence to release tension that's built up from sitting.",
    category: "movement",
    duration: 5,
    xp: 8,
    recurring: true,
    approach: "Positive",
    activityType: "stretch",
  },
{
    title: "Mindful Walking for Behavioral Activation",
    description: "Get outside and walk for the length of the timer, using it as one concrete step toward re-engaging with activity when motivation is low.",
    category: "movement",
    duration: 15,
    xp: 18,
    recurring: true,
    approach: "Behavioral",
    activityType: "walk",
  },
{
    title: "Outdoor Grounding Walk with Five Senses",
    description: "Take a walk outdoors for the countdown and work through the sensory checklist, noticing what you see, hear, touch, smell, and taste along the way.",
    category: "movement",
    duration: 15,
    xp: 18,
    recurring: true,
    approach: "Mindfulness",
    activityType: "walk",
  },
{
    title: "Neighborhood Walk to Break a Rumination Spiral",
    description: "When you notice yourself stuck in repetitive thinking, go for a walk for the length of the countdown and use the sensory checklist to shift attention outward.",
    category: "movement",
    duration: 15,
    xp: 18,
    recurring: false,
    approach: "CBT",
    activityType: "walk",
  },
{
    title: "TIPP: Intense Exercise to Reset Your Nervous System",
    description: "For the length of the timer, do jumping jacks, run in place, or another vigorous exercise to rapidly discharge intense emotion and reset your body's arousal.",
    category: "movement",
    duration: 10,
    xp: 20,
    recurring: false,
    approach: "DBT",
    activityType: "timer",
  },
{
    title: "10-Minute Dance Break for Mood Activation",
    description: "Put on a song you like and move freely for the length of the timer, using dance as a quick way to lift mood and energy.",
    category: "movement",
    duration: 10,
    xp: 15,
    recurring: true,
    approach: "Positive",
    activityType: "timer",
  },
{
    title: "Sun Salutation Yoga Flow",
    description: "For the length of the timer, move through a slow sun salutation sequence, syncing movement with breath as an act of caring for your body.",
    category: "movement",
    duration: 12,
    xp: 15,
    recurring: true,
    approach: "ACT",
    activityType: "timer",
  },
{
    title: "Bilateral Cross-Body Movement for Grounding",
    description: "For the length of the timer, walk in place or march while alternately tapping opposite knees, using rhythmic bilateral movement to help your body feel more settled.",
    category: "movement",
    duration: 8,
    xp: 15,
    recurring: false,
    approach: "Trauma-informed",
    activityType: "timer",
  },
{
    title: "Behavioral Activation: Scheduled Physical Activity Burst",
    description: "Commit to one scheduled block of physical activity - a jog, a workout video, a bike ride - and use the timer to track the full session.",
    category: "movement",
    duration: 20,
    xp: 22,
    recurring: true,
    approach: "Behavioral",
    activityType: "timer",
  },
{
    title: "Attend a Scheduled Exercise Class",
    description: "Go to a fitness, yoga, or sports class you've signed up for and mark the task complete once you've attended.",
    category: "movement",
    duration: 45,
    xp: 30,
    recurring: true,
    approach: "Behavioral",
    activityType: "generic",
  },
{
    title: "Phone Call Exposure: Order Takeout Aloud",
    description: "Call a restaurant and place an order out loud instead of using an app, then mark the task complete once you've done it.",
    category: "exposure",
    duration: 10,
    xp: 20,
    recurring: false,
    approach: "Exposure",
    activityType: "generic",
  },
{
    title: "Social Exposure: Eat Alone in a Public Café",
    description: "Sit and eat a meal by yourself in a public café or restaurant for at least the planned time, then mark the task complete.",
    category: "exposure",
    duration: 30,
    xp: 30,
    recurring: false,
    approach: "Exposure",
    activityType: "generic",
  },
{
    title: "Contamination Exposure: Touch a Doorknob Without Washing",
    description: "Touch a public doorknob or surface and delay washing your hands for the agreed-upon time as a step on your exposure hierarchy, then mark it complete.",
    category: "exposure",
    duration: 15,
    xp: 25,
    recurring: false,
    approach: "CBT",
    activityType: "generic",
  },
{
    title: "In-Vivo Exposure: Ride an Elevator to the Top Floor",
    description: "Start the timer and ride an elevator to the top floor and back, staying with the anxiety for the full duration instead of leaving early.",
    category: "exposure",
    duration: 10,
    xp: 25,
    recurring: false,
    approach: "Exposure",
    activityType: "timer",
  },
{
    title: "Driving Exposure: Highway On-Ramp Practice",
    description: "Start the timer and drive onto a highway on-ramp for at least one exit, staying present with the anxiety instead of turning back.",
    category: "exposure",
    duration: 20,
    xp: 30,
    recurring: false,
    approach: "Exposure",
    activityType: "timer",
  },
{
    title: "Interoceptive Exposure: Breath-Holding Practice",
    description: "Start the timer and hold your breath for short repeated intervals to bring on physical sensations like breathlessness on purpose, then let them pass without escaping the exercise.",
    category: "exposure",
    duration: 5,
    xp: 15,
    recurring: false,
    approach: "Exposure",
    activityType: "timer",
  },
{
    title: "Imaginal Exposure: Feared Outcome Visualization",
    description: "Start the timer and vividly imagine your feared scenario playing out in detail, staying with the anxiety it brings up for the full duration.",
    category: "exposure",
    duration: 15,
    xp: 25,
    recurring: false,
    approach: "Trauma-informed",
    activityType: "timer",
  },
{
    title: "Interoceptive Exposure: Straw-Breathing Challenge",
    description: "Start the timer and breathe only through a narrow straw to bring on the sensation of breathlessness on purpose, staying with it until the timer ends.",
    category: "exposure",
    duration: 5,
    xp: 15,
    recurring: false,
    approach: "Exposure",
    activityType: "timer",
  },
{
    title: "Post-Exposure Distress Check-In",
    description: "Right after completing an exposure exercise, note your mood, energy, and body tension to track how your distress shifted, with an optional note on what you noticed.",
    category: "exposure",
    duration: 5,
    xp: 10,
    recurring: false,
    approach: "CBT",
    activityType: "checkin",
  },
{
    title: "Send a Gratitude Text to a Supportive Person",
    description: "Choose a friend, family member, partner, colleague, or therapist, pick or write a short thank-you message, and confirm once you've sent it.",
    category: "social",
    duration: 5,
    xp: 10,
    recurring: true,
    approach: "Positive",
    activityType: "social",
  },
{
    title: "DEAR MAN: Send an Assertive Boundary Message",
    description: "Using the DEAR MAN structure in mind, choose who you need to set a boundary with, write a clear and respectful message stating what you need, and confirm once you've sent it.",
    category: "social",
    duration: 10,
    xp: 18,
    recurring: false,
    approach: "DBT",
    activityType: "social",
  },
{
    title: "Reach Out to a Friend You've Been Avoiding",
    description: "Pick a friend you've been meaning to contact, write a short message to reconnect, and confirm once you've sent it.",
    category: "social",
    duration: 10,
    xp: 15,
    recurring: false,
    approach: "Behavioral",
    activityType: "social",
  },
{
    title: "Ask for Support Using a Direct Request",
    description: "Identify someone who could help with something you're struggling with, write a clear and direct request for support, and confirm once you've sent it.",
    category: "social",
    duration: 8,
    xp: 15,
    recurring: false,
    approach: "Interpersonal",
    activityType: "social",
  },
{
    title: "Send a Repair Message After a Conflict",
    description: "Choose the person you had a conflict with, write a short message acknowledging what happened and opening the door to repair, and confirm once you've sent it.",
    category: "social",
    duration: 10,
    xp: 18,
    recurring: false,
    approach: "Interpersonal",
    activityType: "social",
  },
{
    title: "Attend a Support Group Meeting",
    description: "Go to a scheduled support group meeting, in person or online, and mark the task complete once you've attended.",
    category: "social",
    duration: 45,
    xp: 30,
    recurring: true,
    approach: "Behavioral",
    activityType: "generic",
  },
{
    title: "Have a Face-to-Face Coffee Catch-Up",
    description: "Meet a friend or family member in person for coffee or a meal, and mark the task complete once you've done it.",
    category: "social",
    duration: 45,
    xp: 25,
    recurring: false,
    approach: "Behavioral",
    activityType: "generic",
  },
{
    title: "Daily Mood and Energy Check-In",
    description: "Note your mood, rate your energy level, check in with any body tension, and add an optional note about your day.",
    category: "habit",
    duration: 3,
    xp: 6,
    recurring: true,
    approach: "Psychoeducation",
    activityType: "checkin",
  },
{
    title: "Daily Gratitude Practice",
    description: "Write down three things you're grateful for today, however small, to build a steady daily gratitude habit.",
    category: "habit",
    duration: 5,
    xp: 8,
    recurring: true,
    approach: "Positive",
    activityType: "gratitude",
  },
{
    title: "Daily 4-7-8 Breathing Habit",
    description: "Follow the guided 4-7-8 breathing animation for two rounds every day to build a steady calming habit.",
    category: "habit",
    duration: 3,
    xp: 8,
    recurring: true,
    approach: "Mindfulness",
    activityType: "breathing",
  },
{
    title: "Daily 10-Minute Meditation Habit",
    description: "Sit for the length of the timer each day and rest your attention on your breath, building a consistent meditation habit over time.",
    category: "habit",
    duration: 10,
    xp: 12,
    recurring: true,
    approach: "Mindfulness",
    activityType: "timer",
  },
{
    title: "Nightly Progressive Muscle Relaxation Habit",
    description: "Each night, use the timer to slowly tense and release each major muscle group, building a consistent relaxation habit before sleep.",
    category: "habit",
    duration: 12,
    xp: 15,
    recurring: true,
    approach: "Sleep",
    activityType: "timer",
  },
{
    title: "Daily Stretch Habit",
    description: "Follow the guided stretch sequence each day to build a consistent habit of releasing physical tension.",
    category: "habit",
    duration: 5,
    xp: 8,
    recurring: true,
    approach: "Behavioral",
    activityType: "stretch",
  },
{
    title: "Take Prescribed Medication as Directed",
    description: "Take your prescribed medication at the scheduled time and mark the task complete once you've done it.",
    category: "habit",
    duration: 3,
    xp: 5,
    recurring: true,
    approach: "Psychoeducation",
    activityType: "generic",
  },
{
    title: "Avoid Alcohol Tonight",
    description: "Commit to avoiding alcohol for the evening and mark the task complete at the end of the day.",
    category: "habit",
    duration: 3,
    xp: 8,
    recurring: true,
    approach: "Behavioral",
    activityType: "generic",
  },
{
    title: "Limit Caffeine After 2 PM",
    description: "Avoid caffeinated drinks after 2 PM today to protect your sleep, and mark the task complete at the end of the day.",
    category: "habit",
    duration: 3,
    xp: 5,
    recurring: true,
    approach: "Sleep",
    activityType: "generic",
  },
{
    title: "Weekly Check-In Call With a Support Person",
    description: "Choose a support person, send a message to schedule or start a check-in call, and confirm once you've reached out.",
    category: "habit",
    duration: 10,
    xp: 15,
    recurring: true,
    approach: "Interpersonal",
    activityType: "social",
  },
{
    title: "Call the Crisis Line If Needed",
    description: "If your distress feels unmanageable, call your local crisis line and mark the task complete once you've made the call or decided it wasn't needed.",
    category: "safety",
    duration: 10,
    xp: 20,
    recurring: false,
    approach: "Crisis",
    activityType: "generic",
  },
{
    title: "Remove Access to Means of Harm",
    description: "Work with your safety plan to remove or secure any items you've identified as a risk, and mark the task complete once it's done.",
    category: "safety",
    duration: 15,
    xp: 30,
    recurring: false,
    approach: "Crisis",
    activityType: "generic",
  },
{
    title: "Contact Your Emergency Support Contact",
    description: "Reach out to the emergency contact named in your safety plan and mark the task complete once you've made contact.",
    category: "safety",
    duration: 5,
    xp: 15,
    recurring: false,
    approach: "Crisis",
    activityType: "generic",
  },
{
    title: "5-4-3-2-1 Grounding After a Panic Spike",
    description: "When panic spikes, start the timer and work through the checklist of five things you see, four you hear, three you touch, two you smell, and one you taste.",
    category: "safety",
    duration: 10,
    xp: 15,
    recurring: false,
    approach: "Trauma-informed",
    activityType: "walk",
  },
{
    title: "Grounding Walk to Interrupt a Crisis Urge",
    description: "When an urge feels overwhelming, go for a walk for the length of the timer and work through the sensory checklist to help the intensity pass.",
    category: "safety",
    duration: 15,
    xp: 18,
    recurring: false,
    approach: "DBT",
    activityType: "walk",
  },
{
    title: "Ice and Cold-Water Reset for Overwhelming Emotion",
    description: "For the length of the timer, hold an ice cube or splash cold water on your face to rapidly bring down overwhelming emotional intensity.",
    category: "safety",
    duration: 5,
    xp: 12,
    recurring: false,
    approach: "DBT",
    activityType: "timer",
  },
{
    title: "Post-Crisis Safety Check-In",
    description: "After a difficult moment has passed, note your mood, energy, and body tension, with an optional note on what helped or what you need next.",
    category: "safety",
    duration: 5,
    xp: 10,
    recurring: false,
    approach: "Crisis",
    activityType: "checkin",
  },
{
    title: "Daily Safety Confidence Check-In",
    description: "Each day, note your mood and energy and rate your body tension as a quick check on how confident you feel in your safety plan.",
    category: "safety",
    duration: 3,
    xp: 6,
    recurring: true,
    approach: "Crisis",
    activityType: "checkin",
  },
{
    title: "4-7-8 Breathing for Acute Panic",
    description: "When panic hits, follow the guided 4-7-8 breathing animation for two rounds to help bring your body's alarm response back down.",
    category: "safety",
    duration: 3,
    xp: 8,
    recurring: false,
    approach: "CBT",
    activityType: "breathing",
  },
];

const TEMPLATE_APPROACHES = [...new Set(PREMADE_TASKS.map((t) => t.approach))].sort();

function ClientPickerInline({
  clients, selected, onToggle, loading,
}: {
  clients: Client[]; selected: Set<string>; onToggle: (id: string) => void; loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-1.5 animate-pulse">
        {[1, 2].map((i) => <div key={i} className="h-9 bg-stone-100 rounded-xl" />)}
      </div>
    );
  }
  if (clients.length === 0) {
    return (
      <p className="text-xs text-stone-400 py-2">No clients yet — add clients from the Clients page.</p>
    );
  }
  return (
    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
      {clients.map((client) => {
        const on = selected.has(client.id);
        return (
          <button key={client.id} type="button" onClick={() => onToggle(client.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 text-left transition-all ${on ? "border-stone-900 bg-stone-900" : "border-stone-100 bg-stone-50 hover:bg-stone-100"}`}>
            <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${on ? "bg-white border-white" : "border-stone-300"}`}>
              {on && <Check size={8} strokeWidth={3} className="text-stone-900" />}
            </div>
            <div className="min-w-0">
              <div className={`text-xs font-medium leading-tight ${on ? "text-white" : "text-stone-800"}`}>{client.name}</div>
              <div className={`text-[10px] truncate ${on ? "text-stone-300" : "text-stone-400"}`}>{client.email}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

type PendingFile = { tempId: string; file: File };

function MissionForm({
  form, setForm,
  attachments, onRemoveAttachment, removingId,
  pendingFiles, setPendingFiles,
  onCancel, onSave, submitLabel, heading, saved,
  clients, clientsLoading, selectedClientIds, onToggleClient,
}: {
  form: Form; setForm: (f: Form) => void;
  attachments: AttachedFile[]; onRemoveAttachment?: (id: string) => void; removingId?: string | null;
  pendingFiles: PendingFile[]; setPendingFiles: (f: PendingFile[]) => void;
  onCancel: () => void; onSave: () => void;
  submitLabel: string; heading: string; saved: boolean;
  clients?: Client[]; clientsLoading?: boolean;
  selectedClientIds?: Set<string>; onToggleClient?: (id: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const next: PendingFile[] = [...pendingFiles];
    Array.from(fileList).forEach((f) => {
      if (!next.find((x) => x.file.name === f.name && x.file.size === f.size) && !attachments.find((x) => x.name === f.name && x.size === f.size)) {
        next.push({ tempId: `f${Date.now()}-${Math.random()}`, file: f });
      }
    });
    setPendingFiles(next);
  }

  if (saved) {
    return (
      <div className="py-14 text-center">
        <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <p className="text-sm font-medium text-stone-800">{heading === "Edit Task" ? "Changes saved" : "Task created"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Morning gratitude practice"
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe what the client should do and the therapeutic rationale…"
            rows={3}
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 resize-none focus:outline-none focus:border-stone-400 transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
          >
            {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Duration (minutes)</label>
          <select
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
          >
            {DURATION_OPTS.map((d) => <option key={d} value={d}>{fmtDur(d)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">XP reward</label>
          <select
            value={form.xp}
            onChange={(e) => setForm({ ...form, xp: Number(e.target.value) })}
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
          >
            {XP_OPTS.map((x) => <option key={x} value={x}>+{x} XP</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Recurrence</label>
          <div className="flex gap-2">
            {([false, true] as const).map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setForm({ ...form, recurring: v })}
                className={`flex-1 py-2.5 text-sm rounded-lg border font-medium transition-all ${
                  form.recurring === v ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-600 hover:border-stone-400"
                }`}
              >
                {v ? "Daily" : "One-time"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive format */}
      <div>
        <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
          Interactive format <span className="text-stone-400 font-normal normal-case">— what the client sees when they open this task</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {ACTIVITY_TYPES.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setForm({ ...form, activityType: a.value })}
              title={a.hint}
              className={`text-left px-2.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                form.activityType === a.value ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-600 hover:border-stone-400"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-stone-400 mt-1.5">{ACTIVITY_TYPES.find((a) => a.value === form.activityType)?.hint}</p>
      </div>

      {/* Attachments */}
      <div>
        <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">Attachments</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
            dragging ? "border-stone-400 bg-stone-50" : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
          }`}
        >
          <Upload size={18} strokeWidth={1.5} className="text-stone-400" />
          <p className="text-xs text-stone-500">Drop files or <span className="font-medium text-stone-700">browse</span></p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls,.pptx,.ppt"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>
        {(attachments.length > 0 || pendingFiles.length > 0) && (
          <ul className="mt-2 space-y-1.5">
            {attachments.map((f) => (
              <li key={f.id} className="flex items-center gap-2.5 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
                <div className="flex-shrink-0">{fileIcon(f.mimeType)}</div>
                <span className="flex-1 text-xs text-stone-700 font-medium truncate">{f.name}</span>
                <span className="text-[10px] text-stone-400">{formatBytes(f.size)}</span>
                <button
                  type="button"
                  disabled={removingId === f.id}
                  onClick={() => onRemoveAttachment?.(f.id)}
                  className="text-stone-300 hover:text-red-400 transition-colors disabled:opacity-40"
                >
                  <X size={13} strokeWidth={2} />
                </button>
              </li>
            ))}
            {pendingFiles.map((f) => (
              <li key={f.tempId} className="flex items-center gap-2.5 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
                <div className="flex-shrink-0">{fileIcon(f.file.type)}</div>
                <span className="flex-1 text-xs text-stone-700 font-medium truncate">{f.file.name}</span>
                <span className="text-[10px] text-amber-500 font-medium">pending upload</span>
                <span className="text-[10px] text-stone-400">{formatBytes(f.file.size)}</span>
                <button type="button" onClick={() => setPendingFiles(pendingFiles.filter((x) => x.tempId !== f.tempId))} className="text-stone-300 hover:text-red-400 transition-colors">
                  <X size={13} strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {clients !== undefined && (
        <div className="pt-1">
          <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">
            Assign to clients
            {(selectedClientIds?.size ?? 0) > 0 && (
              <span className="ml-2 text-stone-600 normal-case font-semibold">{selectedClientIds!.size} selected</span>
            )}
          </label>
          <ClientPickerInline
            clients={clients}
            selected={selectedClientIds ?? new Set()}
            onToggle={onToggleClient ?? (() => {})}
            loading={clientsLoading ?? false}
          />
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-stone-100">
        <button type="button" onClick={onCancel} className="flex-1 border border-stone-200 text-sm py-2.5 rounded-lg hover:bg-stone-50 transition-colors text-stone-600">Cancel</button>
        <button
          type="button"
          onClick={onSave}
          disabled={!form.title.trim()}
          className="flex-1 bg-stone-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

export default function MissionBuilderPage() {
  const [missions,    setMissions]    = useState<Mission[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [mode,        setMode]        = useState<Mode>("list");
  const [filter,      setFilter]      = useState("all");
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [viewingId,   setViewingId]   = useState<string | null>(null);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [form,        setForm]        = useState<Form>(BLANK_FORM);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [removingAttachmentId, setRemovingAttachmentId] = useState<string | null>(null);
  const [saved,            setSaved]           = useState(false);
  const [saving,           setSaving]          = useState(false);
  const [viewingTemplate,  setViewingTemplate] = useState<Template | null>(null);
  const [templateSearch,   setTemplateSearch]   = useState("");
  const [templateCategory, setTemplateCategory] = useState("all");
  const [templateApproach, setTemplateApproach] = useState("all");
  const [assigningMission, setAssigningMission] = useState<Mission | null>(null);
  const [clients,          setClients]         = useState<Client[]>([]);
  const [clientsLoading,   setClientsLoading]  = useState(false);
  const [pendingClientIds, setPendingClientIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/therapist/missions")
      .then((r) => r.json())
      .then((d) => setMissions(d.missions ?? []))
      .finally(() => setLoading(false));
    setClientsLoading(true);
    fetch("/api/therapist/clients")
      .then((r) => r.json())
      .then((d) => setClients(d.clients ?? []))
      .finally(() => setClientsLoading(false));
  }, []);

  function toggleClient(id: string) {
    setPendingClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function goList() { setMode("list"); setEditingId(null); setViewingId(null); setPendingFiles([]); setSaved(false); setPendingClientIds(new Set()); }

  function openCreate() { setForm(BLANK_FORM); setPendingFiles([]); setSaved(false); setPendingClientIds(new Set()); setMode("create"); }
  function openEdit(m: Mission) {
    setEditingId(m.id);
    setForm({ title: m.title, description: m.description, category: m.category, duration: m.duration, xp: m.xp, recurring: m.recurring, activityType: m.activityType });
    setPendingFiles([]);
    setSaved(false);
    setMode("edit");
  }
  function openView(m: Mission) { setViewingId(m.id); setMode("view"); }
  function openTemplate(t: Template) {
    setForm({ title: t.title, description: t.description, category: t.category, duration: t.duration, xp: t.xp, recurring: t.recurring, activityType: t.activityType });
    setPendingFiles([]);
    setSaved(false);
    setMode("create");
  }

  const editingMission = missions.find((m) => m.id === editingId) ?? null;
  const viewingMission = missions.find((m) => m.id === viewingId) ?? null;

  async function uploadPendingFiles(missionId: string): Promise<AttachedFile[]> {
    const uploaded: AttachedFile[] = [];
    for (const pf of pendingFiles) {
      const formData = new FormData();
      formData.append("missionId", missionId);
      formData.append("file", pf.file);
      const r = await fetch("/api/therapist/missions/attachments", { method: "POST", body: formData });
      const d = await r.json();
      if (r.ok && d.attachment) uploaded.push(d.attachment);
    }
    return uploaded;
  }

  async function removeAttachment(missionId: string, attachmentId: string) {
    setRemovingAttachmentId(attachmentId);
    try {
      await fetch("/api/therapist/missions/attachments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentId }),
      });
      setMissions((p) => p.map((m) => m.id === missionId ? { ...m, attachments: m.attachments.filter((a) => a.id !== attachmentId) } : m));
    } finally {
      setRemovingAttachmentId(null);
    }
  }

  async function commitCreate() {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    try {
      const r = await fetch("/api/therapist/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, description: form.description || "No description" }),
      });
      const d = await r.json();
      if (d.ok && d.mission) {
        const uploaded = pendingFiles.length > 0 ? await uploadPendingFiles(d.mission.id) : [];
        const newM: Mission = { ...d.mission, completionCount: 0, createdAt: d.mission.createdAt ?? new Date().toISOString(), attachments: uploaded };
        setMissions((p) => [newM, ...p]);
        if (pendingClientIds.size > 0) {
          await fetch("/api/therapist/missions/assign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ missionId: d.mission.id, clientIds: [...pendingClientIds] }),
          });
        }
      }
      setSaved(true);
      setTimeout(goList, 1200);
    } finally {
      setSaving(false);
    }
  }

  async function commitEdit() {
    if (!form.title.trim() || !editingId || saving) return;
    setSaving(true);
    try {
      const r = await fetch("/api/therapist/missions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId: editingId, ...form }),
      });
      const d = await r.json();
      const uploaded = pendingFiles.length > 0 ? await uploadPendingFiles(editingId) : [];
      if (d.ok && d.mission) {
        setMissions((p) => p.map((m) => m.id === editingId ? { ...d.mission, attachments: [...d.mission.attachments, ...uploaded] } : m));
      }
      setPendingFiles([]);
      setSaved(true);
      setTimeout(goList, 1200);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await fetch("/api/therapist/missions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId: deleteId }),
    });
    setMissions((p) => p.filter((m) => m.id !== deleteId));
    setDeleteId(null);
  }

  const recurringFilter = filter === "daily" ? true : filter === "onetime" ? false : null;
  const filtered = missions.filter((m) => {
    if (recurringFilter !== null) return m.recurring === recurringFilter;
    return true;
  });

  const templateSearchLower = templateSearch.trim().toLowerCase();
  const filteredTemplates = PREMADE_TASKS.filter((t) => {
    if (templateCategory !== "all" && t.category !== templateCategory) return false;
    if (templateApproach !== "all" && t.approach !== templateApproach) return false;
    if (templateSearchLower) {
      const haystack = `${t.title} ${t.description} ${t.approach}`.toLowerCase();
      if (!haystack.includes(templateSearchLower)) return false;
    }
    return true;
  });

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
              {mode === "create" ? "New Task" : mode === "edit" ? "Edit Task" : mode === "view" ? "Task Detail" : mode === "templates" ? "Task Templates" : "Task Builder"}
            </h1>
            {mode === "list" && <p className="text-sm text-stone-500 mt-1">Create and assign therapeutic tasks to clients</p>}
            {mode === "templates" && <p className="text-sm text-stone-500 mt-1">Select a pre-built task — you can customise it before assigning</p>}
          </div>
        </div>
        {mode === "list" && (
          <div className="flex items-center gap-2">
            <button onClick={() => setMode("templates")} className="flex items-center gap-1.5 border border-stone-200 text-stone-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-50 transition-colors">
              <LayoutGrid size={14} strokeWidth={1.5} /> Templates
            </button>
            <button onClick={openCreate} className="flex items-center gap-1.5 bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors">
              <Plus size={15} strokeWidth={2} /> Create task
            </button>
          </div>
        )}
        {mode === "view" && viewingMission && (
          <button onClick={() => openEdit(viewingMission)} className="flex items-center gap-1.5 border border-stone-200 text-stone-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors">
            <Pencil size={13} strokeWidth={1.5} /> Edit
          </button>
        )}
      </div>

      {/* Create form */}
      {mode === "create" && (
        <div className="bg-white border border-stone-100 rounded-xl p-6">
          <MissionForm
            form={form} setForm={setForm}
            attachments={[]} pendingFiles={pendingFiles} setPendingFiles={setPendingFiles}
            heading="New Task" saved={saved}
            onCancel={goList} onSave={commitCreate}
            submitLabel={saving ? "Saving…" : pendingClientIds.size > 0 ? `Assign to ${pendingClientIds.size} client${pendingClientIds.size > 1 ? "s" : ""}` : "Save task"}
            clients={clients} clientsLoading={clientsLoading}
            selectedClientIds={pendingClientIds} onToggleClient={toggleClient}
          />
        </div>
      )}

      {/* Edit form */}
      {mode === "edit" && editingMission && (
        <div className="bg-white border border-stone-100 rounded-xl p-6">
          <MissionForm
            form={form} setForm={setForm}
            attachments={editingMission.attachments}
            onRemoveAttachment={(id) => removeAttachment(editingMission.id, id)}
            removingId={removingAttachmentId}
            pendingFiles={pendingFiles} setPendingFiles={setPendingFiles}
            heading="Edit Task" saved={saved} onCancel={goList} onSave={commitEdit} submitLabel={saving ? "Saving…" : "Save changes"}
          />
        </div>
      )}

      {/* View detail */}
      {mode === "view" && viewingMission && (
        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-stone-100">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-semibold text-stone-900">{viewingMission.title}</h2>
              <span className="text-[10px] border border-stone-200 text-stone-600 px-1.5 py-0.5 rounded capitalize">{viewingMission.recurring ? "daily" : "one-time"}</span>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed mt-1">{viewingMission.description}</p>
          </div>
          <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-stone-100">
            {[
              { Icon: Clock,   label: "Duration",    value: fmtDur(viewingMission.duration) },
              { Icon: Repeat2, label: "Recurrence",  value: viewingMission.recurring ? "Daily" : "One-time" },
              { Icon: Clock,   label: "XP reward",   value: `+${viewingMission.xp} XP` },
              { Icon: Clock,   label: "Completions", value: String(viewingMission.completionCount) },
            ].map(({ Icon, label, value }) => (
              <div key={label}>
                <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-1"><Icon size={12} strokeWidth={1.5} />{label}</div>
                <div className="text-sm font-medium text-stone-800">{value}</div>
              </div>
            ))}
          </div>
          {viewingMission.attachments.length > 0 && (
            <div className="px-6 py-4">
              <div className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Paperclip size={11} strokeWidth={1.5} /> Attachments
              </div>
              <ul className="space-y-1.5">
                {viewingMission.attachments.map((f) => (
                  <li key={f.id} className="flex items-center gap-2.5 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
                    <div className="flex-shrink-0">{fileIcon(f.mimeType)}</div>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs text-stone-700 font-medium truncate hover:underline">{f.name}</a>
                    <span className="text-[10px] text-stone-400">{formatBytes(f.size)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Templates grid */}
      {mode === "templates" && (
        <div className="space-y-4">
          {/* Search + filters */}
          <div className="space-y-2.5">
            <input
              type="text"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder="Search templates by title, technique, or approach…"
              className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {["all", ...CATEGORIES].map((c) => (
                <button
                  key={c}
                  onClick={() => setTemplateCategory(c)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium capitalize transition-all ${
                    templateCategory === c ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-600 hover:border-stone-400"
                  }`}
                >
                  {c === "all" ? "All categories" : c}
                </button>
              ))}
              <select
                value={templateApproach}
                onChange={(e) => setTemplateApproach(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 focus:outline-none focus:border-stone-400 transition-colors ml-auto"
              >
                <option value="all">All approaches</option>
                {TEMPLATE_APPROACHES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <p className="text-xs text-stone-400">{filteredTemplates.length} of {PREMADE_TASKS.length} templates</p>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="bg-white border border-stone-100 rounded-xl py-14 text-center text-sm text-stone-400">
              No templates match your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTemplates.map((t) => {
                const badge = CATEGORY_BADGE[t.category] ?? { bg: "bg-stone-100", text: "text-stone-700" };
                return (
                  <div key={t.title} className="bg-white border border-stone-100 rounded-xl p-5 flex flex-col gap-3 hover:border-stone-200 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                          {t.category}
                        </span>
                        <span className="text-[10px] border border-stone-200 text-stone-500 px-1.5 py-0.5 rounded">
                          {t.approach}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400 flex-shrink-0">{t.recurring ? "Daily" : "One-time"}</span>
                    </div>
                    <button
                      onClick={() => { setPendingClientIds(new Set()); setViewingTemplate(t); }}
                      className="text-left group"
                    >
                      <h3 className="text-sm font-semibold text-stone-900 mb-1 group-hover:text-stone-700 transition-colors">{t.title}</h3>
                      <p className="text-xs text-stone-500 leading-relaxed line-clamp-3">{t.description}</p>
                    </button>
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <div className="flex items-center gap-3 text-xs text-stone-400">
                        <span className="flex items-center gap-1"><Clock size={11} strokeWidth={1.5} />{fmtDur(t.duration)}</span>
                        <span className="text-amber-500 font-medium">+{t.xp} XP</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setPendingClientIds(new Set()); setViewingTemplate(t); }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-all"
                          title="View full details"
                        >
                          <Eye size={14} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => { setPendingClientIds(new Set()); setViewingTemplate(t); }}
                          className="text-xs font-medium text-stone-700 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all"
                        >
                          Use template
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* List */}
      {mode === "list" && (
        <>
          {/* Info banner: explains how tasks flow to clients */}
          <div className="flex items-start gap-3 bg-sage-50 border border-sage-200 rounded-xl px-4 py-3.5">
            <Info size={15} strokeWidth={1.5} className="text-sage-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-sage-800">Tasks appear in your clients&apos; dashboards</p>
              <p className="text-xs text-sage-700 mt-0.5 leading-relaxed">
                Any task you create here will automatically show up in the <span className="font-medium">Today&apos;s Tasks</span> section of every client assigned to you — replacing the default wellness tasks they see when unassigned. Delete a task to revert them to the defaults.
              </p>
            </div>
          </div>

          <div className="flex border-b border-stone-100">
            {(["all", "daily", "onetime"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  filter === f ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-700"
                }`}
              >
                {f === "all" ? "All" : f === "daily" ? "Daily" : "One-time"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1,2,3].map((i) => <div key={i} className="h-24 bg-white border border-stone-100 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-stone-100 rounded-xl py-14 text-center text-sm text-stone-400">
              {missions.length === 0 ? "No tasks yet. Create your first task above." : "No tasks in this category."}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((mission) => (
                <div key={mission.id} className="bg-white border border-stone-100 rounded-xl hover:border-stone-200 transition-colors">
                  <div className="flex items-start gap-4 p-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-stone-900">{mission.title}</h3>
                        <span className="text-[10px] border border-stone-200 text-stone-500 px-1.5 py-0.5 rounded capitalize">{mission.recurring ? "daily" : "one-time"}</span>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2">{mission.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-stone-400">
                        <span className="flex items-center gap-1"><Clock size={11} strokeWidth={1.5} />{fmtDur(mission.duration)}</span>
                        <span className="flex items-center gap-1"><Repeat2 size={11} strokeWidth={1.5} />{mission.recurring ? "Daily" : "One-time"}</span>
                        <span className="text-amber-500 font-medium">+{mission.xp} XP</span>
                        <span className="capitalize">{mission.category}</span>
                        <span>{mission.completionCount} completion{mission.completionCount !== 1 ? "s" : ""}</span>
                        {mission.attachments.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Paperclip size={11} strokeWidth={1.5} />
                            {mission.attachments.length} file{mission.attachments.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setAssigningMission(mission)} title="Assign to clients"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-stone-200 text-stone-600 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all">
                        <UserCheck size={13} strokeWidth={1.5} /> Assign
                      </button>
                      <button onClick={() => openView(mission)} title="View" className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-all"><Eye size={15} strokeWidth={1.5} /></button>
                      <button onClick={() => openEdit(mission)} title="Edit" className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-all"><Pencil size={15} strokeWidth={1.5} /></button>
                      <button onClick={() => setDeleteId(mission.id)} title="Delete" className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 transition-all"><Trash2 size={15} strokeWidth={1.5} /></button>
                      <button onClick={() => openView(mission)} className="ml-1 text-stone-300 hover:text-stone-500 transition-colors"><ChevronRight size={16} strokeWidth={1.5} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Template detail modal */}
      {viewingTemplate && (() => {
        const t = viewingTemplate;
        const badge = CATEGORY_BADGE[t.category] ?? { bg: "bg-stone-100", text: "text-stone-700" };
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setViewingTemplate(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg z-10 overflow-hidden">
              {/* Modal header */}
              <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-stone-100">
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                    {t.category}
                  </span>
                  <span className="text-[10px] border border-stone-200 text-stone-500 px-1.5 py-0.5 rounded">
                    {t.approach}
                  </span>
                  <span className="text-[10px] border border-stone-200 text-stone-500 px-1.5 py-0.5 rounded">
                    {t.recurring ? "Daily" : "One-time"}
                  </span>
                  <span className="text-[10px] border border-sage-200 bg-sage-50 text-sage-700 px-1.5 py-0.5 rounded font-medium">
                    {ACTIVITY_TYPES.find((a) => a.value === t.activityType)?.label ?? "Interactive"}
                  </span>
                </div>
                <button onClick={() => setViewingTemplate(null)} className="text-stone-300 hover:text-stone-600 transition-colors ml-3 flex-shrink-0">
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <h2 className="text-lg font-semibold text-stone-900">{t.title}</h2>
                <p className="text-sm text-stone-600 leading-relaxed">{t.description}</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Duration",   value: fmtDur(t.duration) },
                    { label: "XP Reward",  value: `+${t.xp} XP` },
                    { label: "Recurrence", value: t.recurring ? "Daily" : "One-time" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-stone-50 rounded-xl px-4 py-3">
                      <div className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">{label}</div>
                      <div className="text-sm font-semibold text-stone-800">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Client picker */}
                <div>
                  <div className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-2">
                    Assign to clients
                    {pendingClientIds.size > 0 && (
                      <span className="ml-2 text-stone-600 normal-case font-semibold">{pendingClientIds.size} selected</span>
                    )}
                  </div>
                  <ClientPickerInline
                    clients={clients}
                    selected={pendingClientIds}
                    onToggle={toggleClient}
                    loading={clientsLoading}
                  />
                </div>
              </div>
              {/* Footer */}
              <div className="px-6 pb-6 flex flex-col gap-2">
                {pendingClientIds.size > 0 && (
                  <button
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const r = await fetch("/api/therapist/missions", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ title: t.title, description: t.description, category: t.category, duration: t.duration, xp: t.xp, recurring: t.recurring, activityType: t.activityType }),
                        });
                        const d = await r.json();
                        if (d.ok && d.mission) {
                          setMissions((p) => [{ ...d.mission, completionCount: 0, createdAt: d.mission.createdAt ?? new Date().toISOString() }, ...p]);
                          await fetch("/api/therapist/missions/assign", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ missionId: d.mission.id, clientIds: [...pendingClientIds] }),
                          });
                        }
                      } finally {
                        setSaving(false);
                      }
                      setPendingClientIds(new Set());
                      setViewingTemplate(null);
                    }}
                    disabled={saving}
                    className="w-full bg-stone-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-stone-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {saving ? "Saving…" : <><UserCheck size={14} /> Assign to {pendingClientIds.size} client{pendingClientIds.size > 1 ? "s" : ""} now</>}
                  </button>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingTemplate(null)}
                    className="flex-1 border border-stone-200 text-sm py-2.5 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => { setForm({ title: t.title, description: t.description, category: t.category, duration: t.duration, xp: t.xp, recurring: t.recurring, activityType: t.activityType }); setPendingFiles([]); setSaved(false); setMode("create"); setViewingTemplate(null); }}
                    className="flex-1 border border-stone-200 text-stone-700 text-sm font-medium py-2.5 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    Customize first
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Assign modal */}
      {assigningMission && (
        <AssignModal mission={assigningMission} onClose={() => setAssigningMission(null)} />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Delete this task?</h3>
            <p className="text-xs text-stone-500 leading-relaxed mb-5">
              <span className="font-medium text-stone-700">"{missions.find((m) => m.id === deleteId)?.title}"</span> will be removed from all clients. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-stone-200 text-sm py-2.5 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-red-600 transition-colors">Delete task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
