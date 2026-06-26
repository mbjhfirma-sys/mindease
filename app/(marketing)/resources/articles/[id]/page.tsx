"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

// ─── Article data ─────────────────────────────────────────────────────────────

const articles = [
  {
    id: "1",
    title: "How to Start a Daily Mindfulness Practice",
    category: "Mindfulness",
    readTime: "5 min",
    emoji: "🧘",
    color: "from-sage-100 to-emerald-50",
    author: "Dr. Sarah Chen",
    authorInitials: "SC",
    date: "June 12, 2025",
    body: [
      { type: "p", text: "Mindfulness sounds simple — pay attention to the present moment. But if it were easy, everyone would already be doing it. The challenge is that our minds are wired to wander, plan, and worry. Mindfulness is the practice of noticing that wandering and gently returning." },
      { type: "h2", text: "Why just 5 minutes works" },
      { type: "p", text: "Research from Harvard shows that even brief daily practice physically changes the brain — specifically the prefrontal cortex (decision-making) and amygdala (fear response). You don't need an hour. You need consistency." },
      { type: "h2", text: "The simplest technique: Anchor breathing" },
      { type: "p", text: "Choose a breath sensation as your \"anchor\" — the feeling of air at your nostrils, the rise of your chest, or the expansion of your belly. When your mind wanders (it will), simply notice it without judgment and return to the anchor." },
      { type: "tip", text: "Set your phone to vibrate at the same time every morning. Even 3 conscious breaths before you get up counts." },
      { type: "h2", text: "Common mistakes to avoid" },
      { type: "p", text: "People often think the goal is an empty mind. It isn't. The goal is to notice when you've drifted and come back. Each return is a rep — like a bicep curl for your attention muscle. More wandering = more reps = more growth." },
    ],
    exercise: { type: "breathing" },
  },
  {
    id: "2",
    title: "Understanding the Anxiety-Sleep Connection",
    category: "Sleep",
    readTime: "7 min",
    emoji: "🌙",
    color: "from-indigo-100 to-purple-50",
    author: "Dr. Amara Johnson",
    authorInitials: "AJ",
    date: "June 14, 2025",
    body: [
      { type: "p", text: "You lie down, close your eyes, and your brain immediately fires up. You replay conversations, rehearse tomorrow's worries, and wonder why you can't just switch off. This is anxiety hijacking your sleep system — and it's more common than you think." },
      { type: "h2", text: "The vicious cycle" },
      { type: "p", text: "Poor sleep raises cortisol and reduces emotional regulation — which makes anxiety worse. More anxiety → more sleep disruption → more anxiety. Breaking the cycle requires targeting both ends." },
      { type: "h2", text: "What actually works" },
      { type: "p", text: "Stimulus control therapy (keeping the bed for sleep only), consistent wake times, and a 'worry window' — a set 15-minute period earlier in the day to write down concerns — are all evidence-backed interventions that outperform most sleep aids." },
      { type: "tip", text: "If you've been lying awake for 20 minutes, get up and do something calm in dim light. Return only when sleepy. This re-teaches your brain that bed = sleep." },
      { type: "h2", text: "The role of your nervous system" },
      { type: "p", text: "Anxiety activates the sympathetic nervous system (fight-or-flight). Sleep requires the parasympathetic nervous system (rest-and-digest). You can't force the switch — but you can invite it with slow exhales, which directly stimulate the vagus nerve." },
    ],
    exercise: { type: "sleepquiz" },
  },
  {
    id: "3",
    title: "CBT Techniques You Can Use at Home",
    category: "Therapy",
    readTime: "8 min",
    emoji: "🧠",
    color: "from-amber-100 to-yellow-50",
    author: "Dr. Michael Torres",
    authorInitials: "MT",
    date: "June 10, 2025",
    body: [
      { type: "p", text: "Cognitive Behavioral Therapy is one of the most well-researched psychological treatments that exist. The core idea: your thoughts, feelings, and behaviors are all connected — and changing one changes all three." },
      { type: "h2", text: "The cognitive triangle" },
      { type: "p", text: "Imagine a triangle. One corner is thoughts, one is emotions, one is behaviors. An anxious thought ('I'll fail this presentation') creates anxious feelings (dread, tension) which drive avoidance behaviors (procrastinating prep). CBT breaks that loop." },
      { type: "h2", text: "Technique 1: Thought records" },
      { type: "p", text: "When you notice a strong negative emotion, pause and write down the triggering situation, the automatic thought, and how strongly you believe it (0-100%). Then look for evidence for and against it. Re-rate your belief after. Most people find it drops significantly." },
      { type: "tip", text: "The goal isn't to think positive — it's to think accurately. 'Some things might go wrong but I can handle it' is more useful than forced optimism." },
      { type: "h2", text: "Technique 2: Behavioral activation" },
      { type: "p", text: "Depression shrinks your world. Behavioral activation expands it by scheduling small, achievable activities before you feel like doing them. Motivation follows action, not the other way around." },
    ],
    exercise: { type: "thoughtrecord" },
  },
  {
    id: "4",
    title: "The Science of Self-Compassion",
    category: "Self-Care",
    readTime: "6 min",
    emoji: "💛",
    color: "from-rose-100 to-pink-50",
    author: "Dr. Emma Walsh",
    authorInitials: "EW",
    date: "June 16, 2025",
    body: [
      { type: "p", text: "Most of us talk to ourselves in ways we would never talk to a friend. 'You're so stupid.' 'You always mess things up.' Researcher Kristin Neff calls this self-criticism — and decades of research show it makes everything worse." },
      { type: "h2", text: "Self-compassion ≠ self-pity" },
      { type: "p", text: "Self-compassion doesn't mean making excuses or avoiding accountability. Studies show self-compassionate people take more responsibility for their mistakes — not less — because they're not defensive. They can look clearly at what went wrong without shame spiraling." },
      { type: "h2", text: "The three components (Neff, 2003)" },
      { type: "p", text: "Self-kindness (treating yourself as you'd treat a good friend), Common humanity (recognizing struggle is part of the human experience, not a sign you're broken), and Mindfulness (seeing painful feelings clearly without over-identification)." },
      { type: "tip", text: "Ask: 'What would I say to a close friend in this exact situation?' Then say that to yourself." },
      { type: "h2", text: "Why it's not just 'soft'" },
      { type: "p", text: "Self-compassionate people show greater motivation, resilience after failure, and emotional wellbeing. They're also less likely to burn out. It's not self-indulgence — it's a performance multiplier." },
    ],
    exercise: { type: "selfcompassion" },
  },
  {
    id: "5",
    title: "10 Grounding Techniques for Acute Anxiety",
    category: "Anxiety",
    readTime: "4 min",
    emoji: "🌱",
    color: "from-teal-100 to-cyan-50",
    author: "Dr. Sarah Chen",
    authorInitials: "SC",
    date: "June 18, 2025",
    body: [
      { type: "p", text: "When anxiety spikes, your nervous system floods your body with adrenaline and cortisol. Your thinking brain partially goes offline. Grounding techniques work by forcing sensory attention back to the present — essentially rerouting your brain away from the threat response." },
      { type: "h2", text: "Why grounding works" },
      { type: "p", text: "Anxiety lives in anticipation — it's always about what might happen. Grounding is the opposite. By directing attention to what's happening right now (textures, sounds, smells), you activate different neural circuits and interrupt the anxiety loop." },
      { type: "h2", text: "The 5-4-3-2-1 technique" },
      { type: "p", text: "The most well-known grounding exercise uses all five senses in sequence. It's simple enough to do mid-panic and powerful enough to measurably reduce acute anxiety within minutes." },
      { type: "tip", text: "Keep a grounding object with you — a textured keychain, a smooth stone. Having something to touch immediately gives your anxious hands something to do." },
      { type: "h2", text: "Other powerful quick techniques" },
      { type: "p", text: "Cold water on wrists and face (activates the dive reflex), naming colors in the room, counting backwards from 100 by 7s, and box breathing all work through similar mechanisms — they occupy cognitive bandwidth that anxiety was using." },
    ],
    exercise: { type: "grounding" },
  },
  {
    id: "6",
    title: "How Stress Affects the Body",
    category: "Stress",
    readTime: "9 min",
    emoji: "⚡",
    color: "from-orange-100 to-amber-50",
    author: "Dr. Michael Torres",
    authorInitials: "MT",
    date: "June 8, 2025",
    body: [
      { type: "p", text: "Stress isn't a feeling — it's a full-body physiological response. When your brain perceives a threat, it triggers a cascade of hormones that prepares you to fight or flee. That system evolved for physical threats. It struggles with emails and deadlines." },
      { type: "h2", text: "The stress hormones" },
      { type: "p", text: "Cortisol (the main stress hormone) raises blood sugar for quick energy, suppresses the immune system, and slows digestion. Adrenaline spikes heart rate and sharpens focus. These are useful in short bursts — chronic activation causes damage." },
      { type: "h2", text: "What chronic stress does" },
      { type: "p", text: "Sustained elevated cortisol impairs memory formation, shrinks the hippocampus (involved in learning), promotes inflammation, disrupts gut microbiome, increases cardiovascular risk, and suppresses immune function. Stress literally makes you physically ill over time." },
      { type: "tip", text: "The body doesn't distinguish between real and imagined threats. Worrying about a difficult conversation creates nearly the same cortisol response as the conversation itself." },
      { type: "h2", text: "What actually lowers cortisol" },
      { type: "p", text: "Exercise is the fastest reset — it metabolizes the stress hormones the way nature intended (physical action). Social connection, laughter, time in nature, and controlled slow breathing all measurably reduce cortisol. Most stress management techniques work through these pathways." },
    ],
    exercise: { type: "stresscheck" },
  },
];

// ─── Interactive Exercises ─────────────────────────────────────────────────────

function BreathingExercise() {
  const [phase, setPhase] = useState<"idle" | "inhale" | "hold1" | "exhale" | "hold2">("idle");
  const [count, setCount] = useState(0);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phases: { key: typeof phase; label: string; duration: number; color: string }[] = [
    { key: "inhale", label: "Breathe in", duration: 4, color: "bg-sage-400" },
    { key: "hold1",  label: "Hold",       duration: 4, color: "bg-amber-400" },
    { key: "exhale", label: "Breathe out",duration: 4, color: "bg-blue-400"  },
    { key: "hold2",  label: "Hold",       duration: 4, color: "bg-purple-400"},
  ];

  useEffect(() => {
    if (phase === "idle") return;
    const current = phases.find((p) => p.key === phase)!;
    setCount(current.duration);
    intervalRef.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(intervalRef.current!);
          const idx = phases.findIndex((p) => p.key === phase);
          const next = phases[(idx + 1) % phases.length];
          if (idx === phases.length - 1) setCycles((cy) => cy + 1);
          setPhase(next.key);
          return next.duration;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [phase]);

  function stop() {
    clearInterval(intervalRef.current!);
    setPhase("idle");
    setCount(0);
  }

  const current = phases.find((p) => p.key === phase);
  const scale = phase === "inhale" ? "scale-125" : phase === "exhale" ? "scale-90" : "scale-110";

  return (
    <div className="text-center">
      <h3 className="font-bold text-stone-900 text-lg mb-1">Box Breathing Exercise</h3>
      <p className="text-stone-500 text-sm mb-6">4 seconds each phase. Used by Navy SEALs to control stress.</p>

      <div className="flex justify-center mb-6">
        <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-transform duration-1000 ${scale} ${current?.color ?? "bg-stone-100"}`}>
          <span className="text-white font-bold text-3xl">{phase === "idle" ? "●" : count}</span>
          <span className="text-white/80 text-xs mt-1">{current?.label ?? "Ready"}</span>
        </div>
      </div>

      {cycles > 0 && <p className="text-sage-700 text-sm font-medium mb-4">✓ {cycles} cycle{cycles > 1 ? "s" : ""} complete</p>}

      {phase === "idle" ? (
        <button onClick={() => setPhase("inhale")} className="bg-stone-900 text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-stone-800 transition-colors">
          Start breathing
        </button>
      ) : (
        <button onClick={stop} className="border border-stone-300 text-stone-600 px-8 py-3 rounded-full text-sm font-semibold hover:bg-stone-50 transition-colors">
          Stop
        </button>
      )}
    </div>
  );
}

function SleepQuiz() {
  const questions = [
    { q: "What time do you usually go to bed?", options: ["Before 10 pm", "10–11 pm", "11 pm–midnight", "After midnight"] },
    { q: "Do you use your phone in bed?", options: ["Never", "Rarely", "Sometimes", "Always"] },
    { q: "How long does it take you to fall asleep?", options: ["Under 10 min", "10–20 min", "20–45 min", "Over 45 min"] },
    { q: "Do you wake up feeling rested?", options: ["Always", "Usually", "Rarely", "Never"] },
  ];

  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const score = answers.reduce<number>((sum, a, i) => {
    if (a === null) return sum;
    const goodAnswers = [0, 0, 0, 0];
    return sum + (a === goodAnswers[i] ? 2 : a === 1 ? 1 : 0);
  }, 0);

  const max = questions.length * 2;
  const pct = Math.round((score / max) * 100);
  const label = pct >= 75 ? "Great sleeper 🌟" : pct >= 50 ? "Could use some work 😴" : "Sleep needs attention 🛌";

  const allAnswered = answers.every((a) => a !== null);

  return (
    <div>
      <h3 className="font-bold text-stone-900 text-lg mb-1">Sleep Health Quiz</h3>
      <p className="text-stone-500 text-sm mb-6">4 quick questions to assess your sleep habits.</p>

      {!submitted ? (
        <div className="space-y-5">
          {questions.map((q, qi) => (
            <div key={qi}>
              <p className="text-sm font-medium text-stone-700 mb-2">{qi + 1}. {q.q}</p>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => setAnswers((prev) => { const next = [...prev]; next[qi] = oi; return next; })}
                    className={`text-xs px-3 py-2 rounded-xl border text-left transition-all ${answers[qi] === oi ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-600 hover:border-stone-400"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={() => setSubmitted(true)}
            disabled={!allAnswered}
            className="w-full bg-stone-900 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-800 transition-colors"
          >
            See my results
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-24 h-24 rounded-full border-4 border-stone-900 flex flex-col items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-stone-900">{pct}%</span>
          </div>
          <p className="font-semibold text-stone-900 mb-1">{label}</p>
          <p className="text-stone-500 text-sm mb-4">
            {pct >= 75 ? "Your sleep habits are solid. Keep your routine consistent." : pct >= 50 ? "A few small tweaks — consistent wake time, less screen time — could make a big difference." : "Your sleep is suffering. Try setting a fixed wake time first — it's the single most powerful lever."}
          </p>
          <button onClick={() => { setAnswers(Array(questions.length).fill(null)); setSubmitted(false); }} className="text-sm text-sage-700 font-semibold hover:underline">
            Retake quiz
          </button>
        </div>
      )}
    </div>
  );
}

function ThoughtRecord() {
  const [situation, setSituation] = useState("");
  const [thought, setThought] = useState("");
  const [belief, setBelief] = useState(70);
  const [evidence, setEvidence] = useState({ for: "", against: "" });
  const [balanced, setBalanced] = useState("");
  const [newBelief, setNewBelief] = useState(70);
  const [step, setStep] = useState(0);

  const steps = ["Situation", "Thought", "Evidence", "Reframe"];

  return (
    <div>
      <h3 className="font-bold text-stone-900 text-lg mb-1">Thought Record</h3>
      <p className="text-stone-500 text-sm mb-5">Walk through a CBT thought record for something on your mind.</p>

      {/* Step indicators */}
      <div className="flex gap-2 mb-6">
        {steps.map((s, i) => (
          <button key={s} onClick={() => setStep(i)} className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${step === i ? "bg-stone-900 text-white" : i < step ? "bg-sage-100 text-sage-700" : "bg-stone-100 text-stone-400"}`}>
            {i < step ? "✓" : i + 1}. {s}
          </button>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-stone-700">What happened? Describe the situation briefly.</label>
          <textarea value={situation} onChange={(e) => setSituation(e.target.value)} rows={3} placeholder="e.g. My manager didn't reply to my email all day." className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400 resize-none" />
          <button onClick={() => setStep(1)} disabled={!situation.trim()} className="w-full bg-stone-900 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-stone-700">What thought went through your mind?</label>
          <textarea value={thought} onChange={(e) => setThought(e.target.value)} rows={2} placeholder="e.g. They're angry with me. I probably messed something up." className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400 resize-none" />
          <label className="block text-sm font-medium text-stone-700 mt-2">How much do you believe this? <span className="text-sage-700 font-bold">{belief}%</span></label>
          <input type="range" min={0} max={100} value={belief} onChange={(e) => setBelief(+e.target.value)} className="w-full accent-stone-900" />
          <button onClick={() => setStep(2)} disabled={!thought.trim()} className="w-full bg-stone-900 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-stone-700">Evidence that supports the thought:</label>
          <textarea value={evidence.for} onChange={(e) => setEvidence((p) => ({ ...p, for: e.target.value }))} rows={2} placeholder="e.g. They've seemed distant lately." className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400 resize-none" />
          <label className="block text-sm font-medium text-stone-700">Evidence that contradicts it:</label>
          <textarea value={evidence.against} onChange={(e) => setEvidence((p) => ({ ...p, against: e.target.value }))} rows={2} placeholder="e.g. They were in meetings all day. They praised my work last week." className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400 resize-none" />
          <button onClick={() => setStep(3)} disabled={!evidence.against.trim()} className="w-full bg-stone-900 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-stone-700">Write a more balanced thought:</label>
          <textarea value={balanced} onChange={(e) => setBalanced(e.target.value)} rows={2} placeholder="e.g. They probably haven't had a chance to reply yet. I'll check in tomorrow." className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400 resize-none" />
          <label className="block text-sm font-medium text-stone-700 mt-2">How much do you now believe the original thought? <span className="text-sage-700 font-bold">{newBelief}%</span></label>
          <input type="range" min={0} max={100} value={newBelief} onChange={(e) => setNewBelief(+e.target.value)} className="w-full accent-stone-900" />
          {balanced && (
            <div className="bg-sage-50 rounded-xl p-4 border border-sage-100 mt-2">
              <p className="text-xs text-sage-700 font-semibold mb-2">Your shift</p>
              <p className="text-sm text-stone-600">Belief dropped from <strong>{belief}%</strong> → <strong>{newBelief}%</strong> — that's real progress.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SelfCompassionLetter() {
  const prompts = [
    "What would you say to a close friend in this exact situation?",
    "Remind yourself this struggle is part of being human.",
    "What do you actually need right now?",
  ];
  const [text, setText] = useState("");
  const [promptIdx, setPromptIdx] = useState(0);
  const [done, setDone] = useState(false);

  return (
    <div>
      <h3 className="font-bold text-stone-900 text-lg mb-1">Self-Compassion Letter</h3>
      <p className="text-stone-500 text-sm mb-5">Write a short letter to yourself — the way you'd write to a friend who was struggling.</p>

      {!done ? (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-rose-700 mb-1">Writing prompt</p>
            <p className="text-sm text-stone-600 italic">"{prompts[promptIdx]}"</p>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Dear me…"
            className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setPromptIdx((i) => (i + 1) % prompts.length)}
              className="flex-1 border border-stone-200 text-stone-600 py-2 rounded-xl text-sm hover:bg-stone-50 transition-colors"
            >
              New prompt
            </button>
            <button
              onClick={() => setDone(true)}
              disabled={text.trim().length < 20}
              className="flex-1 bg-stone-900 text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              I'm done writing
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-4xl mb-3">💛</div>
          <p className="font-semibold text-stone-900 mb-2">Well done.</p>
          <p className="text-stone-500 text-sm mb-4">Research shows writing self-compassion letters reduces self-criticism for days after. You just did something genuinely good for yourself.</p>
          <button onClick={() => { setText(""); setDone(false); }} className="text-sm text-sage-700 font-semibold hover:underline">Write another</button>
        </div>
      )}
    </div>
  );
}

function GroundingExercise() {
  const senses = [
    { label: "5 things you can SEE", emoji: "👁️", placeholder: "e.g. my coffee mug, a plant, the ceiling light…", count: 5 },
    { label: "4 things you can TOUCH", emoji: "✋", placeholder: "e.g. my chair, my shirt, my phone…", count: 4 },
    { label: "3 things you can HEAR", emoji: "👂", placeholder: "e.g. traffic, my breathing, a fan…", count: 3 },
    { label: "2 things you can SMELL", emoji: "👃", placeholder: "e.g. coffee, fresh air…", count: 2 },
    { label: "1 thing you can TASTE", emoji: "👅", placeholder: "e.g. toothpaste, coffee…", count: 1 },
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [inputs, setInputs] = useState<string[]>(senses.map(() => ""));
  const [complete, setComplete] = useState(false);

  function next() {
    if (activeStep < senses.length - 1) setActiveStep(activeStep + 1);
    else setComplete(true);
  }

  if (complete) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">🌿</div>
        <p className="font-bold text-stone-900 mb-2">You're grounded.</p>
        <p className="text-stone-500 text-sm mb-4">Your nervous system has had a chance to settle. Notice how you feel now vs when you started.</p>
        <button onClick={() => { setActiveStep(0); setInputs(senses.map(() => "")); setComplete(false); }} className="text-sm text-sage-700 font-semibold hover:underline">Do it again</button>
      </div>
    );
  }

  const step = senses[activeStep];

  return (
    <div>
      <h3 className="font-bold text-stone-900 text-lg mb-1">5-4-3-2-1 Grounding</h3>
      <p className="text-stone-500 text-sm mb-5">Work through your senses one at a time. Take your time with each one.</p>

      {/* Progress */}
      <div className="flex gap-1.5 mb-6">
        {senses.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i < activeStep ? "bg-sage-500" : i === activeStep ? "bg-stone-900" : "bg-stone-100"}`} />
        ))}
      </div>

      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-4 text-center">
        <div className="text-3xl mb-1">{step.emoji}</div>
        <p className="font-semibold text-stone-800">{step.label}</p>
      </div>

      <textarea
        value={inputs[activeStep]}
        onChange={(e) => setInputs((prev) => { const next = [...prev]; next[activeStep] = e.target.value; return next; })}
        rows={3}
        placeholder={step.placeholder}
        className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400 resize-none mb-3"
      />

      <button
        onClick={next}
        disabled={!inputs[activeStep].trim()}
        className="w-full bg-stone-900 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {activeStep < senses.length - 1 ? `Next: ${senses[activeStep + 1].count} things you can ${senses[activeStep + 1].label.split("can ")[1].split(" ")[0]}` : "Finish"}
      </button>
    </div>
  );
}

function StressCheck() {
  const areas = [
    { label: "Work / school", icon: "💼" },
    { label: "Relationships", icon: "❤️" },
    { label: "Health", icon: "🏃" },
    { label: "Finances", icon: "💰" },
    { label: "Future", icon: "🔮" },
  ];

  const [scores, setScores] = useState<number[]>(Array(areas.length).fill(5));
  const [submitted, setSubmitted] = useState(false);

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const highest = areas[scores.indexOf(Math.max(...scores))];
  const levelLabel = avg >= 8 ? "High stress" : avg >= 5 ? "Moderate stress" : "Low stress";
  const levelColor = avg >= 8 ? "text-red-600" : avg >= 5 ? "text-amber-600" : "text-sage-600";

  return (
    <div>
      <h3 className="font-bold text-stone-900 text-lg mb-1">Stress Body Map</h3>
      <p className="text-stone-500 text-sm mb-5">Rate your stress in each area of life (1 = none, 10 = overwhelming).</p>

      {!submitted ? (
        <div className="space-y-4">
          {areas.map((area, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-stone-700">{area.icon} {area.label}</span>
                <span className="text-sm font-bold text-stone-900">{scores[i]}</span>
              </div>
              <input
                type="range" min={1} max={10} value={scores[i]}
                onChange={(e) => setScores((prev) => { const next = [...prev]; next[i] = +e.target.value; return next; })}
                className="w-full accent-stone-900"
              />
            </div>
          ))}
          <button onClick={() => setSubmitted(true)} className="w-full bg-stone-900 text-white py-2.5 rounded-xl text-sm font-semibold mt-2">
            See my stress map
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-4 bg-stone-50 rounded-xl p-4 mb-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${levelColor}`}>{avg}/10</div>
              <div className={`text-xs font-semibold ${levelColor}`}>{levelLabel}</div>
            </div>
            <div className="flex-1 text-sm text-stone-600">
              Your biggest stressor right now is <strong>{highest.label.toLowerCase()}</strong>. That's worth paying attention to.
            </div>
          </div>
          <div className="space-y-2 mb-4">
            {areas.map((area, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm w-28 text-stone-600">{area.icon} {area.label}</span>
                <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div className={`h-2 rounded-full transition-all ${scores[i] >= 8 ? "bg-red-400" : scores[i] >= 5 ? "bg-amber-400" : "bg-sage-400"}`} style={{ width: `${scores[i] * 10}%` }} />
                </div>
                <span className="text-xs font-bold text-stone-500 w-4">{scores[i]}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 mb-3">Awareness is the first step. Consider sharing this with a therapist or journaling about your top stressor today.</p>
          <button onClick={() => { setScores(Array(areas.length).fill(5)); setSubmitted(false); }} className="text-sm text-sage-700 font-semibold hover:underline">Reset</button>
        </div>
      )}
    </div>
  );
}

function Exercise({ type }: { type: string }) {
  switch (type) {
    case "breathing":     return <BreathingExercise />;
    case "sleepquiz":     return <SleepQuiz />;
    case "thoughtrecord": return <ThoughtRecord />;
    case "selfcompassion":return <SelfCompassionLetter />;
    case "grounding":     return <GroundingExercise />;
    case "stresscheck":   return <StressCheck />;
    default:              return null;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const article = articles.find((a) => a.id === id);

  if (!article) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-center px-6">
        <div>
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Article not found</h1>
          <Link href="/resources" className="text-sage-700 font-semibold hover:underline">← Back to Resources</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <div className={`bg-gradient-to-br ${article.color} py-16 px-6`}>
        <div className="max-w-2xl mx-auto">
          <Link href="/resources" className="inline-flex items-center gap-1.5 text-stone-600 text-sm font-medium hover:text-stone-900 transition-colors mb-8">
            ← Back to Resources
          </Link>
          <div className="text-6xl mb-5">{article.emoji}</div>
          <span className="bg-white/80 backdrop-blur-sm text-sage-700 text-xs font-semibold px-3 py-1 rounded-full">
            {article.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mt-4 mb-4 leading-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sage-300 rounded-full flex items-center justify-center text-xs font-bold text-sage-900">
              {article.authorInitials}
            </div>
            <div className="text-sm text-stone-600">
              <span className="font-medium">{article.author}</span>
              <span className="text-stone-400 mx-2">·</span>
              <span>{article.date}</span>
              <span className="text-stone-400 mx-2">·</span>
              <span>{article.readTime} read</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article body + exercise */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Body */}
        <div className="prose prose-stone max-w-none mb-12">
          {article.body.map((block, i) => {
            if (block.type === "h2") return <h2 key={i} className="text-xl font-bold text-stone-900 mt-8 mb-3">{block.text}</h2>;
            if (block.type === "tip") return (
              <div key={i} className="bg-sage-50 border-l-4 border-sage-400 rounded-r-xl px-5 py-4 my-5">
                <p className="text-sm font-semibold text-sage-700 mb-1">💡 Quick tip</p>
                <p className="text-stone-600 text-sm leading-relaxed">{block.text}</p>
              </div>
            );
            return <p key={i} className="text-stone-600 leading-relaxed mb-4">{block.text}</p>;
          })}
        </div>

        {/* Interactive exercise */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-5">Try it yourself</p>
          <Exercise type={article.exercise.type} />
        </div>

        {/* Footer nav */}
        <div className="mt-10 flex items-center justify-between pt-8 border-t border-stone-200">
          <Link href="/resources" className="text-sm text-stone-500 hover:text-stone-700 transition-colors">
            ← All articles
          </Link>
          <Link href="/register" className="bg-sage-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-sage-800 transition-colors">
            Track your progress →
          </Link>
        </div>
      </div>
    </div>
  );
}
