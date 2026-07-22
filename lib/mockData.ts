export type LessonType = "video" | "quiz" | "reflection" | "exercise" | "audio";

export type QuizQuestion = {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
};

export type Lesson = {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  type: LessonType;
  module: string;
  questions?: QuizQuestion[];
  prompt?: string;
  exerciseType?: "breathing" | "bodyscan" | "gratitude" | "grounding"
    | "pmr" | "boxbreathing" | "reframe" | "values" | "feelingswheel"
    | "worryjar" | "lovingkindness" | "cbttriangle" | "urgesurf" | "selfcompassion";
};

export const courses = [
  {
    id: "1",
    title: "Foundations of Mindfulness",
    instructor: "Dr. Sarah Chen",
    category: "Mindfulness",
    level: "Beginner",
    duration: "4 weeks",
    lessons: 36,
    enrolled: 1248,
    rating: 4.9,
    progress: 20,
    thumbnail: "🧘",
    color: "bg-sage-100",
    description:
      "Learn the core principles of mindfulness meditation and how to integrate them into your daily life for reduced stress and improved well-being.",
    tags: ["Meditation", "Stress Relief", "Beginner Friendly"],
  },
  {
    id: "2",
    title: "Understanding Anxiety",
    instructor: "Dr. Michael Torres",
    category: "Mental Health",
    level: "Intermediate",
    duration: "5 weeks",
    lessons: 40,
    enrolled: 892,
    rating: 4.8,
    progress: 10,
    thumbnail: "💙",
    color: "bg-blue-100",
    description:
      "A comprehensive guide to understanding, managing, and overcoming anxiety using evidence-based cognitive behavioral techniques.",
    tags: ["Anxiety", "CBT", "Self-Help"],
  },
  {
    id: "3",
    title: "Sleep & Rest Mastery",
    instructor: "Dr. Amara Johnson",
    category: "Wellness",
    level: "Beginner",
    duration: "3 weeks",
    lessons: 30,
    enrolled: 2103,
    rating: 4.7,
    progress: 0,
    thumbnail: "🌙",
    color: "bg-purple-100",
    description:
      "Develop healthy sleep habits and restore your natural sleep rhythm with science-backed techniques for deep, restorative rest.",
    tags: ["Sleep", "Rest", "Wellness"],
  },
  {
    id: "4",
    title: "Emotional Resilience",
    instructor: "Dr. Emma Walsh",
    category: "Personal Growth",
    level: "Intermediate",
    duration: "6 weeks",
    lessons: 48,
    enrolled: 671,
    rating: 4.9,
    progress: 0,
    thumbnail: "🌱",
    color: "bg-amber-100",
    description:
      "Build lasting emotional strength and learn to bounce back from life's challenges with grace, confidence, and clarity.",
    tags: ["Resilience", "Growth", "Emotions"],
  },
  {
    id: "5",
    title: "Stress-Free Living",
    instructor: "Dr. James Park",
    category: "Stress Management",
    level: "Beginner",
    duration: "4 weeks",
    lessons: 32,
    enrolled: 1567,
    rating: 4.6,
    progress: 55,
    thumbnail: "☀️",
    color: "bg-yellow-100",
    description:
      "Practical tools and daily rituals for reducing chronic stress and creating a calmer, more balanced life.",
    tags: ["Stress", "Daily Habits", "Balance"],
  },
  {
    id: "6",
    title: "Building Self-Compassion",
    instructor: "Dr. Lily Nguyen",
    category: "Self-Care",
    level: "All Levels",
    duration: "4 weeks",
    lessons: 34,
    enrolled: 934,
    rating: 5.0,
    progress: 0,
    thumbnail: "💛",
    color: "bg-peach-100",
    description:
      "Cultivate a kind, nurturing relationship with yourself through the transformative practice of self-compassion.",
    tags: ["Self-Love", "Compassion", "Healing"],
  },
];

// ─── Course 1: Foundations of Mindfulness (36 lessons) ───────────────────────
const mindfulnessLessons: Lesson[] = [
  // MODULE 1: Introduction (8 lessons)
  { id: "1-1", module: "Module 1: What Is Mindfulness?", title: "Welcome & What to Expect", duration: "8 min", completed: true, type: "video" },
  { id: "1-2", module: "Module 1: What Is Mindfulness?", title: "The Science of Mindfulness", duration: "14 min", completed: true, type: "video" },
  { id: "1-3", module: "Module 1: What Is Mindfulness?", title: "Why We Get Stressed", duration: "12 min", completed: true, type: "video" },
  { id: "1-4", module: "Module 1: What Is Mindfulness?", title: "Your First Breath Awareness Practice", duration: "10 min", completed: true, type: "exercise", exerciseType: "breathing" },
  { id: "1-5", module: "Module 1: What Is Mindfulness?", title: "Quiz: Mindfulness Basics", duration: "5 min", completed: true, type: "quiz",
    questions: [
      { q: "Mindfulness is best described as:", options: ["Clearing your mind of all thoughts", "Paying attention to the present moment without judgment", "Relaxation and sleep", "Positive thinking"], correct: 1, explanation: "Mindfulness is the practice of paying deliberate attention to the present moment — thoughts, feelings, and sensations — without judging them as good or bad." },
      { q: "Which part of the brain is most associated with the stress response?", options: ["Prefrontal cortex", "Hippocampus", "Amygdala", "Cerebellum"], correct: 2, explanation: "The amygdala is the brain's alarm system, triggering the fight-or-flight response. Mindfulness practice is shown to reduce amygdala reactivity over time." },
      { q: "Regular mindfulness practice has been shown to:", options: ["Eliminate all negative emotions", "Physically change brain structure over time", "Require complete silence", "Work only for certain personality types"], correct: 1, explanation: "Neuroscience research, including landmark studies by Sara Lazar at Harvard, shows mindfulness practice literally thickens areas of the cortex related to attention and self-awareness." },
    ],
  },
  { id: "1-6", module: "Module 1: What Is Mindfulness?", title: "Reflection: Your Relationship With Stress", duration: "10 min", completed: true, type: "reflection", prompt: "Think about the last time you felt significantly stressed. Where did you feel it in your body? What thoughts accompanied it? What did you do in response? Write freely for 5-10 minutes without editing yourself." },
  { id: "1-7", module: "Module 1: What Is Mindfulness?", title: "Common Misconceptions About Meditation", duration: "11 min", completed: true, type: "video" },
  { id: "1-8", module: "Module 1: What Is Mindfulness?", title: "Guided Audio: 5-Minute Settling Practice", duration: "5 min", completed: true, type: "audio" },

  // MODULE 2: Core Practices (9 lessons)
  { id: "1-9", module: "Module 2: Core Practices", title: "The Breath as an Anchor", duration: "16 min", completed: false, type: "video" },
  { id: "1-10", module: "Module 2: Core Practices", title: "Guided Body Scan Meditation", duration: "25 min", completed: false, type: "exercise", exerciseType: "bodyscan" },
  { id: "1-11", module: "Module 2: Core Practices", title: "Working With a Wandering Mind", duration: "13 min", completed: false, type: "video" },
  { id: "1-12", module: "Module 2: Core Practices", title: "Quiz: Core Practice Concepts", duration: "5 min", completed: false, type: "quiz",
    questions: [
      { q: "When your mind wanders during meditation, you should:", options: ["Stop the session immediately", "Judge yourself for losing focus", "Gently return attention to the breath without self-criticism", "Try harder to concentrate"], correct: 2, explanation: "The moment of noticing your mind has wandered and gently returning is actually the core skill of mindfulness. It's a repetition — like a bicep curl for the mind." },
      { q: "A body scan practice involves:", options: ["Physical exercise", "Systematically bringing attention to different parts of the body", "Visualizing a peaceful scene", "Analyzing your emotions"], correct: 1, explanation: "Body scan is a foundational practice where you move attention slowly through the body, noticing sensations without trying to change them." },
      { q: "How long should a beginner practice daily for measurable benefit?", options: ["At least 2 hours", "5-10 minutes", "Exactly 20 minutes", "Only when stressed"], correct: 1, explanation: "Research by Britta Hölzel and colleagues shows even 5-10 minutes of daily practice produces measurable brain changes within 8 weeks." },
      { q: "The 'anchor' in breath meditation refers to:", options: ["A heavy, grounding object", "The breath sensation as a point to return attention to", "Sitting in the same spot each time", "Your meditation cushion"], correct: 1, explanation: "The breath serves as an anchor — always available, always in the present moment — giving the mind somewhere to return when it drifts." },
    ],
  },
  { id: "1-13", module: "Module 2: Core Practices", title: "Mindful Eating: A Practical Exercise", duration: "18 min", completed: false, type: "video" },
  { id: "1-14", module: "Module 2: Core Practices", title: "Guided Audio: 10-Minute Breath Practice", duration: "10 min", completed: false, type: "audio" },
  { id: "1-15", module: "Module 2: Core Practices", title: "Reflection: What Did You Notice This Week?", duration: "10 min", completed: false, type: "reflection", prompt: "After practicing this week, what have you noticed about your mind? Are there recurring thoughts? Times of day when your mind is calmer or busier? Any moments where you felt genuinely present? Write without judgment." },
  { id: "1-16", module: "Module 2: Core Practices", title: "Mindful Movement & Walking", duration: "20 min", completed: false, type: "video" },
  { id: "1-17", module: "Module 2: Core Practices", title: "4-7-8 Breathing Technique", duration: "8 min", completed: false, type: "exercise", exerciseType: "breathing" },

  // MODULE 3: Emotions & Thoughts (9 lessons)
  { id: "1-18", module: "Module 3: Working With Emotions & Thoughts", title: "Thoughts Are Not Facts", duration: "15 min", completed: false, type: "video" },
  { id: "1-19", module: "Module 3: Working With Emotions & Thoughts", title: "The RAIN Technique for Difficult Emotions", duration: "17 min", completed: false, type: "video" },
  { id: "1-20", module: "Module 3: Working With Emotions & Thoughts", title: "Quiz: Thoughts, Emotions & Mindfulness", duration: "5 min", completed: false, type: "quiz",
    questions: [
      { q: "The RAIN acronym stands for:", options: ["Rest, Awareness, Insight, Nurture", "Recognize, Allow, Investigate, Nurture", "Relax, Accept, Integrate, Notice", "Reflect, Attend, Inquire, Normalize"], correct: 1, explanation: "RAIN: Recognize what's happening, Allow it to exist without resistance, Investigate with curiosity, Nurture yourself with compassion. It's a way to process difficult emotions mindfully." },
      { q: "Cognitive defusion means:", options: ["Avoiding difficult thoughts", "Getting completely absorbed in your thoughts", "Seeing thoughts as mental events rather than absolute truths", "Arguing with negative thoughts"], correct: 2, explanation: "Cognitive defusion, from ACT therapy, is the practice of observing thoughts from a distance — noticing 'I'm having the thought that I'm worthless' rather than 'I am worthless.'" },
      { q: "When we label an emotion (e.g., 'this is anxiety'), research shows:", options: ["It makes the emotion stronger", "It activates the amygdala more", "It reduces emotional intensity by engaging the prefrontal cortex", "It has no measurable effect"], correct: 2, explanation: "Labeling emotions ('affect labeling') engages the prefrontal cortex and reduces amygdala activation — essentially turning on the rational brain to calm the emotional brain." },
    ],
  },
  { id: "1-21", module: "Module 3: Working With Emotions & Thoughts", title: "Loving-Kindness Meditation (Metta)", duration: "22 min", completed: false, type: "audio" },
  { id: "1-22", module: "Module 3: Working With Emotions & Thoughts", title: "Working With Anxiety & Fear", duration: "19 min", completed: false, type: "video" },
  { id: "1-23", module: "Module 3: Working With Emotions & Thoughts", title: "Grounding: The 5-4-3-2-1 Technique", duration: "12 min", completed: false, type: "exercise", exerciseType: "grounding" },
  { id: "1-24", module: "Module 3: Working With Emotions & Thoughts", title: "Reflection: A Letter to Your Emotions", duration: "15 min", completed: false, type: "reflection", prompt: "Choose one emotion you frequently struggle with — anxiety, anger, sadness, or another. Write a short letter to that emotion as if it were a person. What would you say? What does it seem to want from you? What might you appreciate about it?" },
  { id: "1-25", module: "Module 3: Working With Emotions & Thoughts", title: "Building Emotional Vocabulary", duration: "14 min", completed: false, type: "video" },
  { id: "1-26", module: "Module 3: Working With Emotions & Thoughts", title: "Guided Audio: RAIN Practice (15 min)", duration: "15 min", completed: false, type: "audio" },

  // MODULE 4: Daily Integration (10 lessons)
  { id: "1-27", module: "Module 4: Daily Life Integration", title: "Mindfulness at Work", duration: "16 min", completed: false, type: "video" },
  { id: "1-28", module: "Module 4: Daily Life Integration", title: "Mindful Communication & Listening", duration: "18 min", completed: false, type: "video" },
  { id: "1-29", module: "Module 4: Daily Life Integration", title: "Quiz: Integrating Mindfulness Into Life", duration: "5 min", completed: false, type: "quiz",
    questions: [
      { q: "A 'mindfulness bell' or reminder can help by:", options: ["Counting how many times you practice", "Triggering a brief moment of presence throughout the day", "Replacing formal meditation sessions", "Tracking your mood"], correct: 1, explanation: "Brief mindful pauses ('bells') throughout the day anchor us in the present and accumulate into a mindful lifestyle, even outside formal practice." },
      { q: "Which of the following is an example of informal mindfulness practice?", options: ["Sitting on a cushion for 30 minutes", "Paying full attention while washing dishes", "Using an app timer", "Attending a meditation retreat"], correct: 1, explanation: "Informal practice means bringing mindful attention to ordinary activities — eating, walking, showering — making any moment an opportunity to practice." },
      { q: "When a colleague says something that upsets you at work, a mindful response would be to:", options: ["Respond immediately to express your feelings", "Dismiss the feeling and move on", "Take a breath and notice your reaction before responding", "Avoid the situation entirely"], correct: 2, explanation: "The pause between stimulus and response is where mindfulness lives. Taking a breath creates space to choose a response rather than react automatically." },
    ],
  },
  { id: "1-30", module: "Module 4: Daily Life Integration", title: "Designing Your Personal Practice", duration: "14 min", completed: false, type: "video" },
  { id: "1-31", module: "Module 4: Daily Life Integration", title: "Morning Mindfulness Ritual", duration: "10 min", completed: false, type: "exercise", exerciseType: "breathing" },
  { id: "1-32", module: "Module 4: Daily Life Integration", title: "Mindfulness & Sleep", duration: "17 min", completed: false, type: "video" },
  { id: "1-33", module: "Module 4: Daily Life Integration", title: "Guided Sleep Meditation", duration: "20 min", completed: false, type: "audio" },
  { id: "1-34", module: "Module 4: Daily Life Integration", title: "Reflection: 4-Week Journey Review", duration: "20 min", completed: false, type: "reflection", prompt: "You've completed four weeks of mindfulness practice. Write freely: What has changed, even subtly? What has been hardest? What practice has resonated most? What do you want to carry forward? There are no right answers — this is your story." },
  { id: "1-35", module: "Module 4: Daily Life Integration", title: "Gratitude Practice: Wiring for Positivity", duration: "12 min", completed: false, type: "exercise", exerciseType: "gratitude" },
  { id: "1-36", module: "Module 4: Daily Life Integration", title: "Final Video: Your Mindfulness Journey Forward", duration: "14 min", completed: false, type: "video" },
];

// ─── Course 2: Understanding Anxiety (40 lessons) ────────────────────────────
const anxietyLessons: Lesson[] = [
  // Module 1: Understanding Anxiety (10)
  { id: "2-1", module: "Module 1: Understanding Anxiety", title: "Welcome: You Are Not Alone", duration: "9 min", completed: true, type: "video" },
  { id: "2-2", module: "Module 1: Understanding Anxiety", title: "What Is Anxiety — and What It Isn't", duration: "16 min", completed: true, type: "video" },
  { id: "2-3", module: "Module 1: Understanding Anxiety", title: "The Anxiety Spectrum: Normal to Clinical", duration: "14 min", completed: true, type: "video" },
  { id: "2-4", module: "Module 1: Understanding Anxiety", title: "Quiz: Anxiety Fundamentals", duration: "5 min", completed: true, type: "quiz",
    questions: [
      { q: "Anxiety becomes a disorder when:", options: ["You feel nervous before an interview", "It persistently interferes with daily functioning", "You worry about your health occasionally", "You feel nervous in social situations"], correct: 1, explanation: "Anxiety is a normal emotion. It becomes a clinical concern when it's persistent, excessive, and interferes with work, relationships, or quality of life." },
      { q: "The 'fight-or-flight' response is triggered by the:", options: ["Hippocampus", "Frontal lobe", "Amygdala", "Brain stem"], correct: 2, explanation: "The amygdala perceives threats (real or imagined) and triggers the stress cascade — adrenaline, cortisol, faster heartbeat, tense muscles." },
    ],
  },
  { id: "2-5", module: "Module 1: Understanding Anxiety", title: "How Anxiety Shows Up in the Body", duration: "15 min", completed: false, type: "video" },
  { id: "2-6", module: "Module 1: Understanding Anxiety", title: "Mapping Your Anxiety: A Self-Assessment", duration: "12 min", completed: false, type: "reflection", prompt: "List the top 3 situations that trigger your anxiety. For each one: what thoughts arise? What do you feel in your body? What do you typically do in response? Be as specific as possible — this map will guide your work throughout the course." },
  { id: "2-7", module: "Module 1: Understanding Anxiety", title: "Anxiety Triggers & Patterns", duration: "17 min", completed: false, type: "video" },
  { id: "2-8", module: "Module 1: Understanding Anxiety", title: "The Avoidance Trap", duration: "15 min", completed: false, type: "video" },
  { id: "2-9", module: "Module 1: Understanding Anxiety", title: "Calming Breath Exercise", duration: "8 min", completed: false, type: "exercise", exerciseType: "breathing" },
  { id: "2-10", module: "Module 1: Understanding Anxiety", title: "Guided Audio: Body Awareness Scan", duration: "12 min", completed: false, type: "audio" },

  // Module 2: CBT Tools (10)
  { id: "2-11", module: "Module 2: CBT Tools for Anxiety", title: "Introduction to CBT", duration: "16 min", completed: false, type: "video" },
  { id: "2-12", module: "Module 2: CBT Tools for Anxiety", title: "Identifying Cognitive Distortions", duration: "20 min", completed: false, type: "video" },
  { id: "2-13", module: "Module 2: CBT Tools for Anxiety", title: "Quiz: Cognitive Distortions", duration: "6 min", completed: false, type: "quiz",
    questions: [
      { q: "\"I failed this test, so I'm a complete failure\" is an example of:", options: ["Mind reading", "Overgeneralization", "Fortune telling", "Magnification"], correct: 1, explanation: "Overgeneralization means drawing a broad negative conclusion from a single event. One failure becomes proof of permanent, universal failure." },
      { q: "\"Everyone at the party was judging me\" without any evidence is:", options: ["Catastrophizing", "Emotional reasoning", "Mind reading", "All-or-nothing thinking"], correct: 2, explanation: "Mind reading is assuming you know what others are thinking — almost always negatively — without real evidence." },
      { q: "The CBT technique of 'thought challenging' involves:", options: ["Suppressing negative thoughts", "Replacing thoughts with positive ones", "Examining evidence for and against a thought", "Avoiding situations that trigger thoughts"], correct: 2, explanation: "Thought challenging (also called Socratic questioning) examines the actual evidence for a belief, often revealing that anxious thoughts are based on assumptions rather than facts." },
      { q: "\"Either I do this perfectly or it's a total disaster\" is:", options: ["Personalization", "All-or-nothing thinking", "Should statements", "Labeling"], correct: 1, explanation: "All-or-nothing (black-and-white) thinking sees things in extremes with no middle ground — perfect or failure, safe or dangerous." },
    ],
  },
  { id: "2-14", module: "Module 2: CBT Tools for Anxiety", title: "The Thought Record: Your Most Powerful Tool", duration: "18 min", completed: false, type: "video" },
  { id: "2-15", module: "Module 2: CBT Tools for Anxiety", title: "Practice: Complete a Thought Record", duration: "15 min", completed: false, type: "reflection", prompt: "Using the thought record format: (1) Situation: what happened? (2) Emotion: what did you feel, and how intense 0-100? (3) Automatic thought: what went through your mind? (4) Evidence FOR the thought (5) Evidence AGAINST it (6) Balanced thought: a more realistic view (7) Emotion now: how intense 0-100?" },
  { id: "2-16", module: "Module 2: CBT Tools for Anxiety", title: "Behavioral Experiments", duration: "16 min", completed: false, type: "video" },
  { id: "2-17", module: "Module 2: CBT Tools for Anxiety", title: "Exposure Therapy: Facing Fear Gradually", duration: "22 min", completed: false, type: "video" },
  { id: "2-18", module: "Module 2: CBT Tools for Anxiety", title: "Building Your Fear Ladder", duration: "15 min", completed: false, type: "reflection", prompt: "Choose one anxiety-provoking situation you've been avoiding. Create a 'fear ladder' of 8-10 steps, starting from the least anxiety-provoking (say, 20/100) to the most (100/100). Be specific. This ladder is your roadmap." },
  { id: "2-19", module: "Module 2: CBT Tools for Anxiety", title: "Box Breathing for Acute Anxiety", duration: "7 min", completed: false, type: "exercise", exerciseType: "breathing" },
  { id: "2-20", module: "Module 2: CBT Tools for Anxiety", title: "Guided Audio: Progressive Muscle Relaxation", duration: "18 min", completed: false, type: "audio" },

  // Module 3: Deep Dives (10)
  { id: "2-21", module: "Module 3: Anxiety Types & Deep Dives", title: "Social Anxiety", duration: "20 min", completed: false, type: "video" },
  { id: "2-22", module: "Module 3: Anxiety Types & Deep Dives", title: "Health Anxiety", duration: "18 min", completed: false, type: "video" },
  { id: "2-23", module: "Module 3: Anxiety Types & Deep Dives", title: "Generalized Anxiety & Worry", duration: "19 min", completed: false, type: "video" },
  { id: "2-24", module: "Module 3: Anxiety Types & Deep Dives", title: "Quiz: Anxiety Types", duration: "5 min", completed: false, type: "quiz",
    questions: [
      { q: "Social anxiety disorder is characterized by:", options: ["Fear of all social situations", "Intense fear of scrutiny or embarrassment in social situations", "Preferring to be alone", "Shyness"], correct: 1, explanation: "Social anxiety is specifically about fear of judgment, embarrassment, or humiliation in social or performance situations — not simply being introverted." },
      { q: "Worry in Generalized Anxiety Disorder (GAD) is best described as:", options: ["Focused on one specific topic", "Realistic concern about actual problems", "Excessive, uncontrollable worry across multiple areas of life", "Brief and easily dismissed"], correct: 2, explanation: "GAD is characterized by persistent, hard-to-control worry across multiple domains (health, work, relationships, finances) — out of proportion to the actual likelihood of harm." },
    ],
  },
  { id: "2-25", module: "Module 3: Anxiety Types & Deep Dives", title: "Panic Attacks: What They Are & What They Aren't", duration: "17 min", completed: false, type: "video" },
  { id: "2-26", module: "Module 3: Anxiety Types & Deep Dives", title: "The 5-4-3-2-1 Grounding Technique", duration: "10 min", completed: false, type: "exercise", exerciseType: "grounding" },
  { id: "2-27", module: "Module 3: Anxiety Types & Deep Dives", title: "Anxiety & Sleep", duration: "16 min", completed: false, type: "video" },
  { id: "2-28", module: "Module 3: Anxiety Types & Deep Dives", title: "Reflection: Your Anxiety Story", duration: "15 min", completed: false, type: "reflection", prompt: "When did anxiety first become a significant presence in your life? What was happening then? How has it shaped your choices, relationships, or sense of self? Write your anxiety story — not to dwell in it, but to understand it. Knowledge is the beginning of change." },
  { id: "2-29", module: "Module 3: Anxiety Types & Deep Dives", title: "Anxiety & Relationships", duration: "19 min", completed: false, type: "video" },
  { id: "2-30", module: "Module 3: Anxiety Types & Deep Dives", title: "Guided Audio: Safe Place Visualization", duration: "14 min", completed: false, type: "audio" },

  // Module 4: Long-Term Wellbeing (10)
  { id: "2-31", module: "Module 4: Long-Term Wellbeing", title: "Lifestyle Factors: Sleep, Exercise & Diet", duration: "20 min", completed: false, type: "video" },
  { id: "2-32", module: "Module 4: Long-Term Wellbeing", title: "Building Your Anxiety Toolkit", duration: "15 min", completed: false, type: "video" },
  { id: "2-33", module: "Module 4: Long-Term Wellbeing", title: "Quiz: Recovery & Resilience", duration: "5 min", completed: false, type: "quiz",
    questions: [
      { q: "The goal of anxiety management is to:", options: ["Eliminate anxiety permanently", "Never feel uncomfortable", "Reduce anxiety to a manageable level so it doesn't control your life", "Avoid all anxiety triggers"], correct: 2, explanation: "Anxiety cannot — and should not — be eliminated completely. Some anxiety is adaptive and helpful. The goal is to reduce excessive anxiety and regain choice in how you respond to it." },
      { q: "Exercise helps anxiety because:", options: ["It distracts from worrying", "It metabolizes stress hormones and releases endorphins", "It tires you out so you sleep better", "All of the above"], correct: 3, explanation: "Exercise has multiple anxiety-reducing mechanisms: it metabolizes cortisol and adrenaline, releases endorphins, improves sleep quality, and provides a healthy focus point." },
    ],
  },
  { id: "2-34", module: "Module 4: Long-Term Wellbeing", title: "When to Seek Professional Help", duration: "14 min", completed: false, type: "video" },
  { id: "2-35", module: "Module 4: Long-Term Wellbeing", title: "ACT: Acceptance & Commitment Therapy Overview", duration: "18 min", completed: false, type: "video" },
  { id: "2-36", module: "Module 4: Long-Term Wellbeing", title: "Values Clarification Exercise", duration: "15 min", completed: false, type: "reflection", prompt: "What matters most to you in life? List 5 core values (e.g., family, creativity, honesty, adventure). For each one, rate how much anxiety currently gets in the way of living that value (0-10). Which value do you most want to reclaim from anxiety's grip?" },
  { id: "2-37", module: "Module 4: Long-Term Wellbeing", title: "Compassionate Self-Talk for Anxiety", duration: "13 min", completed: false, type: "video" },
  { id: "2-38", module: "Module 4: Long-Term Wellbeing", title: "Body Scan for Anxiety Relief", duration: "20 min", completed: false, type: "exercise", exerciseType: "bodyscan" },
  { id: "2-39", module: "Module 4: Long-Term Wellbeing", title: "Gratitude & Positive Neuroplasticity", duration: "12 min", completed: false, type: "exercise", exerciseType: "gratitude" },
  { id: "2-40", module: "Module 4: Long-Term Wellbeing", title: "Final: Your Anti-Anxiety Life Plan", duration: "16 min", completed: false, type: "reflection", prompt: "You've completed the course. Write your personal anti-anxiety plan: (1) My top 3 coping tools (2) Warning signs that anxiety is escalating (3) My support network (4) One thing I'll practice daily (5) A message of encouragement to myself for hard days." },
];

// ─── Course 3: Sleep & Rest Mastery (30 lessons) ────────────────────────────
const sleepLessons: Lesson[] = [
  { id: "3-1", module: "Module 1: The Science of Sleep", title: "Why Sleep Is Your Superpower", duration: "12 min", completed: false, type: "video" },
  { id: "3-2", module: "Module 1: The Science of Sleep", title: "Sleep Architecture: Cycles & Stages", duration: "16 min", completed: false, type: "video" },
  { id: "3-3", module: "Module 1: The Science of Sleep", title: "Your Circadian Rhythm", duration: "14 min", completed: false, type: "video" },
  { id: "3-4", module: "Module 1: The Science of Sleep", title: "Quiz: Sleep Science", duration: "5 min", completed: false, type: "quiz",
    questions: [
      { q: "A complete sleep cycle lasts approximately:", options: ["30 minutes", "60 minutes", "90 minutes", "2 hours"], correct: 2, explanation: "One complete sleep cycle — from light to deep to REM sleep — lasts about 90 minutes. A full night's sleep typically includes 4-6 cycles." },
      { q: "Melatonin is produced in response to:", options: ["Exercise", "Darkness", "Food", "Blue light"], correct: 1, explanation: "The pineal gland releases melatonin in response to darkness, signaling to the body that it's time to sleep. Light (especially blue light from screens) suppresses melatonin production." },
      { q: "Deep sleep (slow-wave sleep) is primarily important for:", options: ["Dreaming and memory consolidation", "Physical restoration and immune function", "Emotional processing", "Learning new skills"], correct: 1, explanation: "Deep sleep is when the body repairs tissue, synthesizes proteins, releases growth hormone, and strengthens immune function. It's the most physically restorative stage." },
    ],
  },
  { id: "3-5", module: "Module 1: The Science of Sleep", title: "Sleep Assessment: Your Current Patterns", duration: "10 min", completed: false, type: "reflection", prompt: "For one week, keep a simple sleep log: time to bed, estimated time to fall asleep, any waking in the night, wake time, and rate sleep quality 1-10. Today, write what you already notice about your sleep patterns. What consistently disrupts your sleep?" },
  { id: "3-6", module: "Module 1: The Science of Sleep", title: "Common Sleep Disorders Explained", duration: "18 min", completed: false, type: "video" },
  { id: "3-7", module: "Module 1: The Science of Sleep", title: "Sleep Hygiene: Your Environment", duration: "13 min", completed: false, type: "video" },
  { id: "3-8", module: "Module 1: The Science of Sleep", title: "Guided Relaxation: Body Release for Sleep", duration: "15 min", completed: false, type: "audio" },
  { id: "3-9", module: "Module 1: The Science of Sleep", title: "4-7-8 Breathing for Sleep Onset", duration: "8 min", completed: false, type: "exercise", exerciseType: "breathing" },
  { id: "3-10", module: "Module 1: The Science of Sleep", title: "Quiz: Sleep Hygiene", duration: "5 min", completed: false, type: "quiz",
    questions: [
      { q: "The ideal bedroom temperature for sleep is approximately:", options: ["65-68°F (18-20°C)", "72-75°F (22-24°C)", "55-60°F (13-16°C)", "80°F (27°C)"], correct: 0, explanation: "Core body temperature drops to initiate sleep. A cooler room (65-68°F) supports this natural temperature drop, improving sleep onset and quality." },
      { q: "How long before bed should you ideally avoid screens?", options: ["15 minutes", "30 minutes", "60-90 minutes", "Screens don't affect sleep"], correct: 2, explanation: "Blue light from screens suppresses melatonin production. Avoiding screens 60-90 minutes before bed allows melatonin to rise naturally." },
    ],
  },
  { id: "3-11", module: "Module 2: Cognitive Behavioral Therapy for Insomnia", title: "Introduction to CBT-I", duration: "17 min", completed: false, type: "video" },
  { id: "3-12", module: "Module 2: Cognitive Behavioral Therapy for Insomnia", title: "Sleep Restriction Therapy", duration: "14 min", completed: false, type: "video" },
  { id: "3-13", module: "Module 2: Cognitive Behavioral Therapy for Insomnia", title: "Stimulus Control for Better Sleep", duration: "12 min", completed: false, type: "video" },
  { id: "3-14", module: "Module 2: Cognitive Behavioral Therapy for Insomnia", title: "Challenging Sleep-Blocking Thoughts", duration: "16 min", completed: false, type: "video" },
  { id: "3-15", module: "Module 2: Cognitive Behavioral Therapy for Insomnia", title: "Reflection: Your Beliefs About Sleep", duration: "12 min", completed: false, type: "reflection", prompt: "List the thoughts that go through your mind when you can't sleep. Then, challenge each one: Is this thought helping or hurting? What would I tell a friend who said this to me? What's a more realistic, compassionate take?" },
  { id: "3-16", module: "Module 2: Cognitive Behavioral Therapy for Insomnia", title: "Quiz: CBT-I Principles", duration: "5 min", completed: false, type: "quiz",
    questions: [
      { q: "Stimulus control therapy works by:", options: ["Restricting your sleep to a set window", "Associating your bed only with sleep (and sex)", "Taking sleep medication at a regular time", "Sleeping in different locations"], correct: 1, explanation: "If you use your bed for reading, working, or worrying, your brain associates it with wakefulness. Stimulus control re-trains the brain to associate bed exclusively with sleep." },
      { q: "If you can't sleep after 20 minutes in bed, CBT-I recommends:", options: ["Try harder to sleep", "Check your phone briefly", "Get up and do something calm in dim light", "Take a sleep aid"], correct: 2, explanation: "Lying awake in bed builds the association between bed and wakefulness. Getting up to do something calm until sleepy helps break this pattern." },
    ],
  },
  { id: "3-17", module: "Module 2: Cognitive Behavioral Therapy for Insomnia", title: "Body Scan for Sleep", duration: "20 min", completed: false, type: "exercise", exerciseType: "bodyscan" },
  { id: "3-18", module: "Module 2: Cognitive Behavioral Therapy for Insomnia", title: "Guided Audio: Yoga Nidra for Deep Rest", duration: "25 min", completed: false, type: "audio" },
  { id: "3-19", module: "Module 2: Cognitive Behavioral Therapy for Insomnia", title: "The Wind-Down Routine", duration: "11 min", completed: false, type: "video" },
  { id: "3-20", module: "Module 2: Cognitive Behavioral Therapy for Insomnia", title: "Designing Your Bedtime Ritual", duration: "12 min", completed: false, type: "reflection", prompt: "Design your ideal 30-minute wind-down routine. What activities will you do? In what order? What will you stop doing and when? Write it out as a concrete plan you'll try for the next two weeks." },
  { id: "3-21", module: "Module 3: Lifestyle & Advanced Strategies", title: "Exercise & Sleep", duration: "13 min", completed: false, type: "video" },
  { id: "3-22", module: "Module 3: Lifestyle & Advanced Strategies", title: "Nutrition & Sleep", duration: "14 min", completed: false, type: "video" },
  { id: "3-23", module: "Module 3: Lifestyle & Advanced Strategies", title: "Napping: The Art & Science", duration: "11 min", completed: false, type: "video" },
  { id: "3-24", module: "Module 3: Lifestyle & Advanced Strategies", title: "Quiz: Lifestyle & Sleep", duration: "5 min", completed: false, type: "quiz",
    questions: [
      { q: "The ideal nap length for alertness without sleep inertia is:", options: ["5-10 minutes", "10-20 minutes", "30-45 minutes", "60 minutes"], correct: 1, explanation: "A 10-20 minute 'power nap' boosts alertness and mood without entering deep sleep, avoiding the grogginess (sleep inertia) that comes with longer naps." },
      { q: "Caffeine has a half-life of approximately:", options: ["1-2 hours", "3-4 hours", "5-6 hours", "8-10 hours"], correct: 2, explanation: "Caffeine's half-life is 5-6 hours, meaning half is still in your system 5-6 hours later. A 3pm coffee still has significant caffeine at 9pm." },
    ],
  },
  { id: "3-25", module: "Module 3: Lifestyle & Advanced Strategies", title: "Managing Shift Work & Jet Lag", duration: "15 min", completed: false, type: "video" },
  { id: "3-26", module: "Module 3: Lifestyle & Advanced Strategies", title: "Anxiety at Night: Breaking the Cycle", duration: "16 min", completed: false, type: "video" },
  { id: "3-27", module: "Module 3: Lifestyle & Advanced Strategies", title: "Guided Audio: Deep Sleep Meditation", duration: "22 min", completed: false, type: "audio" },
  { id: "3-28", module: "Module 3: Lifestyle & Advanced Strategies", title: "Box Breathing for Night Waking", duration: "8 min", completed: false, type: "exercise", exerciseType: "breathing" },
  { id: "3-29", module: "Module 3: Lifestyle & Advanced Strategies", title: "Reflection: 3-Week Sleep Transformation", duration: "15 min", completed: false, type: "reflection", prompt: "Compare your sleep now to when you started this course. What's changed? What still needs work? What single habit has made the biggest difference? Write yourself a 'sleep prescription' — your personalized rules for great sleep." },
  { id: "3-30", module: "Module 3: Lifestyle & Advanced Strategies", title: "Your Lifelong Sleep Plan", duration: "12 min", completed: false, type: "video" },
];

// ─── Helper: generate lessons for courses 4-6 ───────────────────────────────
function makeLessons(courseId: string, modules: { name: string; lessons: Omit<Lesson, "id" | "module">[] }[]): Lesson[] {
  const out: Lesson[] = [];
  let n = 1;
  for (const mod of modules) {
    for (const l of mod.lessons) {
      out.push({ ...l, id: `${courseId}-${n++}`, module: mod.name });
    }
  }
  return out;
}

const resilienceLessons = makeLessons("4", [
  { name: "Module 1: What Is Resilience?", lessons: [
    { title: "Resilience Is Not Toughness", duration: "12 min", completed: false, type: "video" },
    { title: "The Neuroscience of Bouncing Back", duration: "16 min", completed: false, type: "video" },
    { title: "Your Resilience Baseline", duration: "10 min", completed: false, type: "reflection", prompt: "Think of a time you overcame a genuinely difficult challenge. What helped you get through it? What strengths did you draw on? What did you learn? Write freely for 10 minutes." },
    { title: "Quiz: Resilience Foundations", duration: "5 min", completed: false, type: "quiz", questions: [
      { q: "Resilience is best understood as:", options: ["The absence of difficulty", "Never showing weakness", "The ability to adapt and grow through adversity", "Always feeling positive"], correct: 2, explanation: "Resilience doesn't mean avoiding pain — it means developing the capacity to navigate it and emerge with new strengths or perspectives." },
      { q: "Post-traumatic growth refers to:", options: ["Forgetting trauma", "Positive psychological change following adversity", "Avoiding reminders of trauma", "Emotional numbness"], correct: 1, explanation: "Research by Tedeschi & Calhoun found that many people experience positive psychological changes — stronger relationships, new possibilities, personal strength — following significant struggle." },
    ]},
    { title: "The 4 Pillars of Resilience", duration: "14 min", completed: false, type: "video" },
    { title: "Breathing for Emotional Regulation", duration: "9 min", completed: false, type: "exercise", exerciseType: "breathing" },
    { title: "Guided Audio: Finding Your Inner Resource", duration: "15 min", completed: false, type: "audio" },
    { title: "Self-Compassion as the Foundation", duration: "17 min", completed: false, type: "video" },
  ]},
  { name: "Module 2: Emotional Regulation", lessons: [
    { title: "The Window of Tolerance", duration: "16 min", completed: false, type: "video" },
    { title: "Quiz: Emotional Regulation", duration: "5 min", completed: false, type: "quiz", questions: [
      { q: "The 'window of tolerance' describes:", options: ["How long you can tolerate discomfort", "The zone between hyper- and hypo-arousal where we function optimally", "Your maximum stress level", "A therapy technique"], correct: 1, explanation: "Developed by Dan Siegel, the window of tolerance is the optimal zone of arousal — not too activated (hyperarousal/panic) or too shut down (hypoarousal/numbness) — where we can process experience effectively." },
    ]},
    { title: "Recognizing Your Emotional Triggers", duration: "14 min", completed: false, type: "video" },
    { title: "The STOP Technique", duration: "8 min", completed: false, type: "exercise", exerciseType: "grounding" },
    { title: "Reflection: Trigger Mapping", duration: "12 min", completed: false, type: "reflection", prompt: "Identify your top 3 emotional triggers. For each: what's the trigger? What emotion arises? What's the underlying need or fear? What's a more skillful response? Be specific and honest." },
    { title: "Emotion Surfing: Riding the Wave", duration: "15 min", completed: false, type: "video" },
    { title: "Body Scan for Emotional Awareness", duration: "18 min", completed: false, type: "exercise", exerciseType: "bodyscan" },
    { title: "Healthy Anger & Healthy Sadness", duration: "17 min", completed: false, type: "video" },
    { title: "Guided Audio: Compassionate Body Awareness", duration: "14 min", completed: false, type: "audio" },
    { title: "Quiz: Emotions & the Body", duration: "5 min", completed: false, type: "quiz", questions: [
      { q: "Research shows that suppressing emotions:", options: ["Reduces their intensity over time", "Has no physical effects", "Can increase psychological and physiological stress", "Is an effective coping strategy"], correct: 2, explanation: "Studies by James Gross show emotional suppression maintains the physiological stress response while reducing outward expression — creating internal strain without resolution." },
    ]},
  ]},
  { name: "Module 3: Cognitive Resilience", lessons: [
    { title: "Cognitive Flexibility: Seeing More Options", duration: "16 min", completed: false, type: "video" },
    { title: "Learned Optimism vs. Toxic Positivity", duration: "14 min", completed: false, type: "video" },
    { title: "Reframing Without Bypassing", duration: "15 min", completed: false, type: "video" },
    { title: "Quiz: Cognitive Resilience", duration: "5 min", completed: false, type: "quiz", questions: [
      { q: "Martin Seligman's 3 P's of pessimism are:", options: ["Personal, Permanent, Pervasive", "Pain, Powerless, Pessimistic", "Pattern, Process, Progress", "Problem, Plan, Practice"], correct: 0, explanation: "Seligman found pessimists tend to explain setbacks as Personal (my fault), Permanent (it will always be this way), and Pervasive (it affects everything). Optimists use more situational, temporary, specific explanations." },
    ]},
    { title: "Growth Mindset Applied", duration: "13 min", completed: false, type: "video" },
    { title: "Reflection: From Fixed to Growth", duration: "12 min", completed: false, type: "reflection", prompt: "Identify an area of your life where you hold a fixed mindset ('I'm just not good at this', 'I'll never change'). What's a growth-minded reframe? What small experiment could you try in the next week to test that reframe?" },
    { title: "Meaning-Making in Hard Times", duration: "18 min", completed: false, type: "video" },
    { title: "Gratitude Practice", duration: "10 min", completed: false, type: "exercise", exerciseType: "gratitude" },
  ]},
  { name: "Module 4: Social & Behavioral Resilience", lessons: [
    { title: "The Power of Connection", duration: "14 min", completed: false, type: "video" },
    { title: "Asking for Help Is Strength", duration: "12 min", completed: false, type: "video" },
    { title: "Setting Boundaries for Sustainability", duration: "16 min", completed: false, type: "video" },
    { title: "Quiz: Social Resilience", duration: "5 min", completed: false, type: "quiz", questions: [
      { q: "Research by Julianne Holt-Lunstad found that loneliness is associated with:", options: ["No significant health effects", "A 26% increased risk of early mortality", "Better sleep", "Increased productivity"], correct: 1, explanation: "Holt-Lunstad's landmark meta-analysis found loneliness and social isolation are as harmful as smoking 15 cigarettes a day — a major risk factor for early death." },
    ]},
    { title: "Building Your Resilience Network", duration: "13 min", completed: false, type: "reflection", prompt: "Map your support network: Who are the 3 people you can call when things are hard? Who challenges you to grow? Who brings you joy? Who are you a support for? Reflect on where your network is strong and where you'd like to grow it." },
    { title: "Rest, Recovery & Sustainable Energy", duration: "15 min", completed: false, type: "video" },
    { title: "Guided Audio: Loving-Kindness for Resilience", duration: "18 min", completed: false, type: "audio" },
    { title: "Your Resilience Action Plan", duration: "15 min", completed: false, type: "reflection", prompt: "Your resilience toolkit: List 2 practices from each module you'll continue. What's one relationship you'll invest in? What's one mindset shift you're committing to? What will you do differently when adversity next strikes?" },
    { title: "Final: Resilience as a Way of Life", duration: "14 min", completed: false, type: "video" },
  ]},
]);

const stressLessons = makeLessons("5", [
  { name: "Module 1: Understanding Stress", lessons: [
    { title: "What Is Stress?", duration: "11 min", completed: true, type: "video" },
    { title: "Acute vs. Chronic Stress", duration: "14 min", completed: true, type: "video" },
    { title: "How Stress Affects the Body", duration: "16 min", completed: true, type: "video" },
    { title: "Quiz: Stress Fundamentals", duration: "5 min", completed: true, type: "quiz", questions: [
      { q: "Which hormone is known as the primary 'stress hormone'?", options: ["Serotonin", "Dopamine", "Cortisol", "Melatonin"], correct: 2, explanation: "Cortisol, released by the adrenal glands, is the primary stress hormone. It mobilizes energy, suppresses immune function, and prepares the body for a threat — helpful short-term, harmful when chronically elevated." },
      { q: "Chronic stress can contribute to:", options: ["Improved cardiovascular health", "Heart disease, immune dysfunction, and mental health issues", "Better sleep", "Enhanced memory"], correct: 1, explanation: "Prolonged cortisol elevation damages the cardiovascular system, suppresses the immune system, impairs memory (hippocampal shrinkage), and increases risk of depression and anxiety." },
    ]},
    { title: "Stress Inventory: Your Life Load", duration: "12 min", completed: true, type: "reflection", prompt: "List every significant stressor in your life right now — work, relationships, finances, health, uncertainty. Rate each 1-10 for intensity. Then circle the ones you have some control over and those you don't. This clarity is the first step to relief." },
    { title: "The Stress-Performance Curve", duration: "12 min", completed: false, type: "video" },
    { title: "Breathing for the Nervous System", duration: "8 min", completed: false, type: "exercise", exerciseType: "breathing" },
    { title: "Guided Audio: Tension Release Scan", duration: "16 min", completed: false, type: "audio" },
  ]},
  { name: "Module 2: Stress Management Tools", lessons: [
    { title: "Time Management as Stress Prevention", duration: "17 min", completed: false, type: "video" },
    { title: "The Power of 'No': Boundaries & Energy", duration: "14 min", completed: false, type: "video" },
    { title: "Quiz: Stress Management", duration: "5 min", completed: false, type: "quiz", questions: [
      { q: "The Eisenhower Matrix helps by:", options: ["Tracking your mood", "Prioritizing tasks by urgency and importance", "Scheduling sleep", "Managing relationships"], correct: 1, explanation: "The Eisenhower Matrix divides tasks into 4 quadrants: urgent/important (do now), not urgent/important (schedule), urgent/not important (delegate), and neither (eliminate). It prevents the tyranny of the urgent." },
    ]},
    { title: "Mindful Problem-Solving", duration: "15 min", completed: false, type: "video" },
    { title: "Reflection: What Can I Control?", duration: "10 min", completed: false, type: "reflection", prompt: "Take your biggest current stressor. Draw two circles: inside the inner circle, write everything about this situation that is within your control. In the outer ring, write what is outside your control. Then write one concrete action for each item inside your circle." },
    { title: "The 5-Minute Stress Reset", duration: "5 min", completed: false, type: "exercise", exerciseType: "breathing" },
    { title: "Social Support as a Buffer", duration: "13 min", completed: false, type: "video" },
    { title: "Nature, Exercise & Stress", duration: "14 min", completed: false, type: "video" },
  ]},
  { name: "Module 3: Long-Term Stress Reduction", lessons: [
    { title: "Building a Low-Stress Lifestyle", duration: "16 min", completed: false, type: "video" },
    { title: "Stress & Nutrition", duration: "12 min", completed: false, type: "video" },
    { title: "Reframing Stress as Challenge", duration: "14 min", completed: false, type: "video" },
    { title: "Quiz: Advanced Stress Strategies", duration: "5 min", completed: false, type: "quiz", questions: [
      { q: "Kelly McGonigal's research suggests that stress is harmful mainly when:", options: ["You exercise during it", "You believe it is harmful", "You have social support", "You sleep well"], correct: 1, explanation: "McGonigal's analysis of data from 30,000 adults found that high stress only increased mortality risk in people who believed stress was harmful. Those who saw stress as manageable had no increased risk — even with high stress." },
    ]},
    { title: "Gratitude as a Stress Antidote", duration: "10 min", completed: false, type: "exercise", exerciseType: "gratitude" },
    { title: "Grounding for High-Stress Moments", duration: "9 min", completed: false, type: "exercise", exerciseType: "grounding" },
    { title: "Body Scan for Stress Release", duration: "20 min", completed: false, type: "exercise", exerciseType: "bodyscan" },
    { title: "Guided Audio: Stress Dissolving Meditation", duration: "18 min", completed: false, type: "audio" },
    { title: "Reflection: Your Stress-Free Vision", duration: "15 min", completed: false, type: "reflection", prompt: "Imagine a version of your life 6 months from now where you've successfully reduced chronic stress. What does your daily routine look like? What have you said no to? What brings you joy each day? Describe this life in vivid detail." },
    { title: "Final: Your Calm Life Manifesto", duration: "13 min", completed: false, type: "video" },
  ]},
]);

const compassionLessons = makeLessons("6", [
  { name: "Module 1: What Is Self-Compassion?", lessons: [
    { title: "The Self-Compassion Revolution", duration: "14 min", completed: false, type: "video" },
    { title: "Why Self-Compassion Is Not Self-Pity", duration: "12 min", completed: false, type: "video" },
    { title: "Dr. Kristin Neff's 3 Components", duration: "16 min", completed: false, type: "video" },
    { title: "Quiz: Self-Compassion Basics", duration: "5 min", completed: false, type: "quiz", questions: [
      { q: "Kristin Neff's 3 components of self-compassion are:", options: ["Love, Acceptance, Growth", "Mindfulness, Common Humanity, Self-Kindness", "Awareness, Action, Accountability", "Patience, Presence, Practice"], correct: 1, explanation: "Neff's model: Mindfulness (acknowledging suffering without over-identification), Common Humanity (recognizing struggle is part of shared human experience), and Self-Kindness (treating yourself as you'd treat a good friend)." },
      { q: "Research shows self-compassion is correlated with:", options: ["Lower motivation", "Higher emotional resilience and wellbeing", "Self-indulgence", "Avoidance of responsibility"], correct: 1, explanation: "Over 20 years of research by Neff and colleagues shows self-compassion correlates strongly with emotional wellbeing, lower anxiety and depression, and — contrary to fears — higher motivation and accountability." },
    ]},
    { title: "Self-Criticism vs. Self-Compassion", duration: "15 min", completed: false, type: "video" },
    { title: "Reflection: How Do You Speak to Yourself?", duration: "12 min", completed: false, type: "reflection", prompt: "Notice the inner critic's voice this week. Write down 3 things your inner critic has said recently. Now rewrite each statement as if you were speaking to a dear friend going through the same thing. What's the difference in tone? In impact?" },
    { title: "The Compassion Break Practice", duration: "10 min", completed: false, type: "exercise", exerciseType: "breathing" },
    { title: "Guided Audio: Soften, Soothe, Allow", duration: "15 min", completed: false, type: "audio" },
  ]},
  { name: "Module 2: Practicing Self-Compassion", lessons: [
    { title: "Mindfulness as the Foundation", duration: "14 min", completed: false, type: "video" },
    { title: "Finding Common Humanity", duration: "12 min", completed: false, type: "video" },
    { title: "Quiz: Self-Compassion in Practice", duration: "5 min", completed: false, type: "quiz", questions: [
      { q: "The phrase 'common humanity' in self-compassion means:", options: ["Everyone deserves basic rights", "Suffering and imperfection are part of the shared human experience", "You should compare yourself to others", "Compassion is a common human trait"], correct: 1, explanation: "Common humanity is the recognition that struggle, failure, and pain are universal — you are not uniquely broken. This counters the isolation that often accompanies self-judgment." },
    ]},
    { title: "Compassionate Letter Writing", duration: "15 min", completed: false, type: "reflection", prompt: "Write a letter to yourself from the perspective of a wise, compassionate friend who knows you fully — all your struggles, fears, and imperfections — and loves you completely. What would this friend say to you about what you're going through right now?" },
    { title: "Self-Compassion for Mistakes & Failure", duration: "16 min", completed: false, type: "video" },
    { title: "Body-Based Compassion: Touch & Warmth", duration: "10 min", completed: false, type: "exercise", exerciseType: "bodyscan" },
    { title: "Guided Audio: Loving-Kindness for Yourself", duration: "18 min", completed: false, type: "audio" },
    { title: "Gratitude for Your Body & Mind", duration: "9 min", completed: false, type: "exercise", exerciseType: "gratitude" },
    { title: "Fierce Self-Compassion: Setting Limits", duration: "14 min", completed: false, type: "video" },
    { title: "Reflection: Where Do You Most Need Compassion?", duration: "12 min", completed: false, type: "reflection", prompt: "Which area of your life do you judge yourself most harshly? Career, body, relationships, past mistakes? Write about this area with the same warmth you'd offer a struggling friend. What would it mean to genuinely forgive yourself here?" },
  ]},
  { name: "Module 3: Self-Compassion in Daily Life", lessons: [
    { title: "Self-Compassion & Relationships", duration: "15 min", completed: false, type: "video" },
    { title: "Self-Compassion at Work", duration: "13 min", completed: false, type: "video" },
    { title: "Quiz: Applied Self-Compassion", duration: "5 min", completed: false, type: "quiz", questions: [
      { q: "When you make a mistake at work, self-compassion means:", options: ["Ignoring the mistake", "Harshly criticizing yourself to do better next time", "Acknowledging the pain, remembering imperfection is human, and responding with kindness", "Blaming external circumstances"], correct: 2, explanation: "Self-compassion after failure involves all three components: mindfully acknowledging the pain (not suppressing it), recognizing you're not alone in making mistakes, and responding with kindness rather than punishment." },
    ]},
    { title: "Compassion Fatigue & Filling Your Cup", duration: "14 min", completed: false, type: "video" },
    { title: "Grounding in Self-Worth", duration: "8 min", completed: false, type: "exercise", exerciseType: "grounding" },
    { title: "Guided Audio: Compassionate Rest", duration: "16 min", completed: false, type: "audio" },
    { title: "Building a Daily Compassion Practice", duration: "12 min", completed: false, type: "video" },
    { title: "Final Reflection: A Letter of Commitment", duration: "15 min", completed: false, type: "reflection", prompt: "Write yourself a compassion commitment letter. What have you learned about how you've been treating yourself? What do you commit to doing differently? What does a self-compassionate version of your life look and feel like? Seal it with one line you'll remember." },
    { title: "Closing: You Are Enough", duration: "11 min", completed: false, type: "video" },
  ]},
]);

export const courseLessons: Record<string, Lesson[]> = {
  "1": mindfulnessLessons,
  "2": anxietyLessons,
  "3": sleepLessons,
  "4": resilienceLessons,
  "5": stressLessons,
  "6": compassionLessons,
};

export const scheduleItems = [
  { id: "s1", title: "Morning Meditation", time: "8:00 AM", duration: "20 min", type: "session", day: "Mon", description: "A guided breath-awareness meditation to anchor your attention and set a calm, intentional tone for the day. Focuses on body scanning and mindful breathing techniques proven to reduce cortisol levels." },
  { id: "s2", title: "Therapy Session — Dr. Chen", time: "10:00 AM", duration: "50 min", type: "therapy", day: "Mon", description: "Your regular one-on-one session with Dr. Sarah Chen. This week's focus is on cognitive restructuring techniques and reviewing your progress with the thought diary homework from last session." },
  { id: "s3", title: "Anxiety Management Course", time: "2:00 PM", duration: "45 min", type: "course", day: "Tue", description: "Module 4 of the Anxiety Management course — covering the cognitive triangle and how thoughts, feelings, and behaviours interact. Includes two interactive exercises and a short quiz at the end." },
  { id: "s4", title: "Group Support Circle", time: "5:30 PM", duration: "60 min", type: "group", day: "Wed", description: "A facilitated peer support session with your Anxiety & Stress group. This week's theme is building a personal coping toolkit. Sharing is always optional — you can listen and reflect at your own pace." },
  { id: "s5", title: "Sleep Hygiene Workshop", time: "7:00 PM", duration: "30 min", type: "course", day: "Thu", description: "Module 2 of the Sleep Hygiene Workshop series, covering stimulus control therapy and the science of sleep pressure. You'll build a personalised wind-down routine by the end of the session." },
  { id: "s6", title: "Breathwork Practice", time: "8:00 AM", duration: "20 min", type: "session", day: "Fri", description: "A structured breathwork session combining box breathing and 4-7-8 techniques. Designed to activate the parasympathetic nervous system and prepare you mentally for the day ahead." },
  { id: "s7", title: "Weekly Check-in", time: "11:00 AM", duration: "30 min", type: "therapy", day: "Fri", description: "A shorter mid-week check-in with Dr. Chen to review mood logs, celebrate wins, and adjust your plan for the following week. Bring any journal entries or reflections you'd like to discuss." },
];

export type ClientAppointment = {
  id: string;
  therapistName: string;
  therapistTitle: string;
  date: string;
  day: string;
  time: string;
  duration: string;
  type: "individual" | "assessment";
  status: "confirmed" | "pending" | "completed" | "cancelled";
  notes?: string;
};

export const clientAppointments: ClientAppointment[] = [
  { id: "ca1", therapistName: "Dr. Sarah Chen", therapistTitle: "Licensed Clinical Psychologist", date: "Mon Jun 23", day: "Mon", time: "10:00 AM", duration: "50 min", type: "individual", status: "confirmed" },
  { id: "ca2", therapistName: "Dr. Sarah Chen", therapistTitle: "Licensed Clinical Psychologist", date: "Fri Jun 27", day: "Fri", time: "11:00 AM", duration: "50 min", type: "individual", status: "confirmed", notes: "Weekly check-in" },
  { id: "ca3", therapistName: "Dr. Sarah Chen", therapistTitle: "Licensed Clinical Psychologist", date: "Mon Jun 30", day: "Mon", time: "10:00 AM", duration: "50 min", type: "individual", status: "pending" },
];

export const messages = [
  {
    id: "m1",
    sender: "Dr. Sarah Chen",
    avatar: "👩‍⚕️",
    role: "Mindfulness Instructor",
    preview: "Great progress this week! Your consistency with the morning practice is really showing.",
    time: "10:32 AM",
    unread: 2,
    messages: [
      { from: "them", text: "Good morning! How are you feeling after yesterday's session?", time: "9:15 AM" },
      { from: "me", text: "Much better, thank you! The body scan really helped.", time: "9:18 AM" },
      { from: "them", text: "Wonderful! Have you tried the breathing exercise I sent you?", time: "9:20 AM" },
      { from: "me", text: "Yes, I did it this morning. It was calming.", time: "10:28 AM" },
      { from: "them", text: "Great progress this week! Your consistency with the morning practice is really showing.", time: "10:32 AM" },
    ],
  },
  {
    id: "m2",
    sender: "Dr. Michael Torres",
    avatar: "👨‍⚕️",
    role: "Anxiety Specialist",
    preview: "Your next session is on Thursday at 10am. Looking forward to it.",
    time: "Yesterday",
    unread: 0,
    messages: [
      { from: "them", text: "Hi! Just confirming our session on Thursday at 10am.", time: "Yesterday" },
      { from: "me", text: "Confirmed, see you then!", time: "Yesterday" },
      { from: "them", text: "Your next session is on Thursday at 10am. Looking forward to it.", time: "Yesterday" },
    ],
  },
  {
    id: "m3",
    sender: "YouMindo Support",
    avatar: "💚",
    role: "Support Team",
    preview: "Welcome to YouMindo! We're here if you need anything.",
    time: "Mon",
    unread: 0,
    messages: [{ from: "them", text: "Welcome to YouMindo! We're here if you need anything.", time: "Mon" }],
  },
];

export const testimonials = [
  { id: "t1", name: "Emma R.", age: 28, location: "New York", quote: "YouMindo changed how I approach my mental health. The courses helped me understand my anxiety in a way no book ever could. I feel calmer and more in control than I have in years.", rating: 5, course: "Understanding Anxiety", avatar: "👩", featured: true },
  { id: "t2", name: "James K.", age: 34, location: "London", quote: "The mindfulness course transformed my mornings. I used to wake up dreading the day, and now I actually look forward to my practice. It's been six months and I haven't looked back.", rating: 5, course: "Foundations of Mindfulness", avatar: "👨", featured: true },
  { id: "t3", name: "Sofia M.", age: 22, location: "Barcelona", quote: "As a university student dealing with burnout, YouMindo was a lifeline. The sleep course alone gave me back hours of quality rest. My grades and mood both improved.", rating: 5, course: "Sleep & Rest Mastery", avatar: "👩‍🎓", featured: false },
  { id: "t4", name: "David T.", age: 41, location: "Chicago", quote: "I was skeptical about online mental health resources, but the quality here is remarkable. The instructors are compassionate and the content is evidence-based.", rating: 5, course: "Emotional Resilience", avatar: "👨‍💼", featured: false },
  { id: "t5", name: "Aisha N.", age: 31, location: "Toronto", quote: "Self-compassion used to feel like a foreign concept to me. After this course, I genuinely feel kinder to myself. It's simple but profound work.", rating: 5, course: "Building Self-Compassion", avatar: "👩🏾", featured: true },
  { id: "t6", name: "Leo P.", age: 26, location: "Sydney", quote: "The group support circles combined with the courses create a beautiful community feeling. I don't feel alone in my struggles anymore.", rating: 5, course: "Stress-Free Living", avatar: "👨", featured: false },
];

export const faqs = [
  { q: "Who is YouMindo for?", a: "YouMindo is for anyone who wants to prioritize their mental health — whether you're dealing with stress, anxiety, poor sleep, or simply want to build healthier emotional habits. Our content is designed for all levels." },
  { q: "Are the courses taught by licensed professionals?", a: "Yes. All of our instructors are licensed therapists, clinical psychologists, or certified wellness practitioners with years of experience in their fields." },
  { q: "Can I access content on my phone?", a: "Absolutely. YouMindo is fully responsive and works on any device — desktop, tablet, or smartphone. Your progress syncs across all your devices." },
  { q: "Is there a free trial?", a: "Yes! Our Basic plan is free forever with access to introductory lessons from every course. You can upgrade anytime to unlock the full library." },
  { q: "How is YouMindo different from therapy?", a: "YouMindo is an educational platform and wellness resource — it's not a replacement for professional therapy. Many of our users combine YouMindo with therapy for the best results. Our one-on-one sessions are with certified coaches, not licensed therapists." },
  { q: "Can I cancel my subscription anytime?", a: "Yes, you can cancel at any time. If you cancel, you keep access until the end of your billing period with no questions asked." },
];

export const resources = [
  { id: "r1", title: "Articles & Guides", description: "Evidence-based articles on anxiety, depression, relationships, and more.", icon: "📖", count: "120+ articles", color: "bg-sage-100" },
  { id: "r2", title: "Guided Meditations", description: "Audio sessions ranging from 5 to 45 minutes for any moment of your day.", icon: "🎧", count: "80+ sessions", color: "bg-peach-100" },
  { id: "r3", title: "Mindfulness & Worksheets", description: "Printable exercises, journaling prompts, and CBT worksheets.", icon: "📝", count: "50+ worksheets", color: "bg-amber-100" },
  { id: "r4", title: "Crisis Resources", description: "Immediate support options and hotlines for when you need help now.", icon: "🆘", count: "Always available", color: "bg-red-50" },
  { id: "r5", title: "Therapist Directory", description: "Find a licensed therapist in your area or online.", icon: "🗂️", count: "2,000+ therapists", color: "bg-blue-50" },
  { id: "r6", title: "Podcast Episodes", description: "Expert conversations on mental health, wellness, and personal growth.", icon: "🎙️", count: "60+ episodes", color: "bg-purple-50" },
];

// ─── Daily Missions ──────────────────────────────────────────────────────────
export type Mission = {
  id: string;
  title: string;
  description: string;
  category: "mindfulness" | "movement" | "journaling" | "breathing" | "social" | "habit";
  duration: string;
  xp: number;
  completed: boolean;
  assignedBy: string;
  dueTime?: string;
  streak?: number;
};

export const dailyMissions: Mission[] = [
  { id: "dm1", title: "Morning Meditation", description: "Complete a 10-minute guided breath-awareness meditation to start your day with clarity.", category: "mindfulness", duration: "10 min", xp: 25, completed: true, assignedBy: "Dr. Sarah Chen", dueTime: "9:00 AM", streak: 7 },
  { id: "dm2", title: "Gratitude Journal", description: "Write down 3 things you're grateful for today, no matter how small.", category: "journaling", duration: "5 min", xp: 15, completed: true, assignedBy: "Dr. Sarah Chen", dueTime: "10:00 AM" },
  { id: "dm3", title: "4-7-8 Breathing", description: "Complete two rounds of the 4-7-8 breathing technique to activate your parasympathetic nervous system.", category: "breathing", duration: "5 min", xp: 10, completed: false, assignedBy: "Dr. Michael Torres", dueTime: "2:00 PM" },
  { id: "dm4", title: "15-Minute Walk", description: "Take a mindful 15-minute walk outside. Notice 5 things you see, 4 you hear, 3 you can touch.", category: "movement", duration: "15 min", xp: 20, completed: false, assignedBy: "Dr. Sarah Chen", dueTime: "4:00 PM" },
  { id: "dm5", title: "Evening Reflection", description: "Answer today's reflection question: What challenged me today, and how did I respond?", category: "journaling", duration: "10 min", xp: 20, completed: false, assignedBy: "Dr. Michael Torres", dueTime: "8:00 PM" },
  { id: "dm6", title: "Connection Check-in", description: "Send a genuine message to one person in your support network. Ask how they're doing.", category: "social", duration: "5 min", xp: 15, completed: false, assignedBy: "Dr. Sarah Chen" },
];

export const upcomingMissions = [
  { id: "um1", title: "Box Breathing Challenge", description: "Practice box breathing 3 times throughout the day.", date: "Tomorrow", category: "breathing", xp: 30 },
  { id: "um2", title: "Sleep Hygiene Audit", description: "Write down your current bedtime routine and identify one thing to improve.", date: "Tomorrow", category: "journaling", xp: 25 },
  { id: "um3", title: "Body Scan Meditation", description: "Complete a 20-minute guided body scan before bed.", date: "In 2 days", category: "mindfulness", xp: 35 },
];

// ─── Journal ─────────────────────────────────────────────────────────────────
export type JournalEntry = {
  id: string;
  date: string;
  time: string;
  title: string;
  content: string;
  mood: number;
  emotions: string[];
  type: "text" | "voice" | "video";
  wordCount?: number;
};

export const journalEntries: JournalEntry[] = [
  {
    id: "j1", date: "Today", time: "8:14 AM", title: "Morning Pages",
    content: "Woke up feeling anxious but the morning meditation really helped ground me. I noticed my thoughts spiraling about the presentation tomorrow, but I used the RAIN technique and it passed. Grateful for this practice.\n\nI've been noticing how much my mood shifts after I exercise. Yesterday's walk completely changed the trajectory of my afternoon.",
    mood: 4, emotions: ["Anxious", "Calm", "Grateful"], type: "text", wordCount: 68,
  },
  {
    id: "j2", date: "Yesterday", time: "9:30 PM", title: "Evening Reflection",
    content: "Today had its challenges. The meeting ran long and I felt overwhelmed by 3pm. But I used the 5-4-3-2-1 grounding technique and managed to get through the rest of the day. Small wins matter.\n\nDr. Chen's advice to notice when I'm in 'doing mode' vs 'being mode' is really clicking. I spent the evening just being.",
    mood: 3, emotions: ["Overwhelmed", "Grounded", "Hopeful"], type: "text", wordCount: 72,
  },
  {
    id: "j3", date: "Jun 17", time: "7:45 AM", title: "Letter to My Anxiety",
    content: "Dear Anxiety, I've been thinking about you. You show up when I care about something. You've protected me, but you've also kept me small. I'm learning to thank you for the warning and then make my own choice about how to respond. We're figuring this out together.",
    mood: 4, emotions: ["Reflective", "Compassionate", "Determined"], type: "text", wordCount: 58,
  },
  {
    id: "j4", date: "Jun 16", time: "10:15 PM", title: "Voice Note — Hard Day",
    content: "", mood: 2, emotions: ["Sad", "Tired", "Lonely"], type: "voice",
  },
  {
    id: "j5", date: "Jun 14", time: "8:00 AM", title: "Gratitude Practice",
    content: "Three things I'm grateful for:\n1. The way sunlight hit the kitchen window this morning\n2. That text from my sister last night checking in\n3. My therapist — this process is genuinely helping",
    mood: 5, emotions: ["Grateful", "Content", "Peaceful"], type: "text", wordCount: 40,
  },
];

export const moodHistory = [
  { date: "Jun 13", score: 3 }, { date: "Jun 14", score: 5 }, { date: "Jun 15", score: 3 },
  { date: "Jun 16", score: 2 }, { date: "Jun 17", score: 4 }, { date: "Jun 18", score: 3 },
  { date: "Today", score: 4 },
];

export const emotionOptions = [
  "Anxious", "Calm", "Grateful", "Overwhelmed", "Happy", "Sad", "Angry", "Hopeful",
  "Tired", "Energised", "Lonely", "Connected", "Proud", "Ashamed", "Content",
  "Frustrated", "Peaceful", "Excited", "Fearful", "Determined", "Reflective", "Numb",
];

// ─── Achievements / Gamification ─────────────────────────────────────────────
export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "streak" | "course" | "journal" | "community" | "mission" | "special";
  earned: boolean;
  earnedDate?: string;
  xpReward: number;
  rarity: "common" | "rare" | "epic" | "legendary";
};

export const userStats = {
  level: 8,
  xp: 3420,
  xpToNextLevel: 4000,
  totalXp: 3420,
  currentStreak: 7,
  longestStreak: 14,
  missionsCompleted: 42,
  journalEntries: 18,
  coursesCompleted: 1,
  minutesMeditated: 284,
  wellnessScore: 72,
};

export const badges: Badge[] = [
  { id: "b1", title: "First Step", description: "Complete your first mission", icon: "👣", category: "mission", earned: true, earnedDate: "Jun 1", xpReward: 50, rarity: "common" },
  { id: "b2", title: "Week Warrior", description: "Maintain a 7-day streak", icon: "🔥", category: "streak", earned: true, earnedDate: "Jun 12", xpReward: 150, rarity: "rare" },
  { id: "b3", title: "Inner Voice", description: "Write 10 journal entries", icon: "📓", category: "journal", earned: true, earnedDate: "Jun 10", xpReward: 100, rarity: "common" },
  { id: "b4", title: "Mindful Master", description: "Complete the Foundations of Mindfulness course", icon: "🧘", category: "course", earned: true, earnedDate: "Jun 8", xpReward: 300, rarity: "epic" },
  { id: "b5", title: "Breath of Fresh Air", description: "Complete 20 breathing exercises", icon: "🌬️", category: "mission", earned: true, earnedDate: "Jun 15", xpReward: 75, rarity: "common" },
  { id: "b6", title: "Community Pillar", description: "Post in 5 community discussions", icon: "🤝", category: "community", earned: false, xpReward: 100, rarity: "common" },
  { id: "b7", title: "Fortnight Fire", description: "Reach a 14-day streak", icon: "⚡", category: "streak", earned: false, xpReward: 250, rarity: "epic" },
  { id: "b8", title: "Night Owl Journaler", description: "Write 5 evening journal entries", icon: "🦉", category: "journal", earned: false, xpReward: 80, rarity: "common" },
  { id: "b9", title: "Course Collector", description: "Enroll in 5 courses", icon: "📚", category: "course", earned: false, xpReward: 200, rarity: "rare" },
  { id: "b10", title: "100-Day Legend", description: "Complete a 100-day streak", icon: "🏆", category: "streak", earned: false, xpReward: 1000, rarity: "legendary" },
  { id: "b11", title: "Gratitude Guru", description: "Write 30 gratitude entries", icon: "💛", category: "journal", earned: false, xpReward: 150, rarity: "rare" },
  { id: "b12", title: "Early Bird", description: "Log 10 morning check-ins before 8am", icon: "🌅", category: "special", earned: false, xpReward: 120, rarity: "rare" },
];

export const activeChallenge = {
  title: "30-Day Mindfulness Challenge",
  description: "Complete at least one mindfulness activity every day for 30 days.",
  progress: 7,
  total: 30,
  xpReward: 500,
  endsIn: "23 days",
  participants: 1842,
};

// ─── Community ────────────────────────────────────────────────────────────────
export type SupportGroup = {
  id: string;
  name: string;
  description: string;
  members: number;
  category: string;
  icon: string;
  color: string;
  nextSession?: string;
  joined: boolean;
};

export const supportGroups: SupportGroup[] = [
  { id: "sg1", name: "Anxiety Support Circle", description: "A safe, anonymous space for those navigating anxiety in daily life. Share strategies, celebrate wins, and support each other.", members: 284, category: "Anxiety", icon: "💙", color: "bg-blue-50", nextSession: "Today 5:30 PM", joined: true },
  { id: "sg2", name: "Mindfulness & Meditation", description: "Share your practice, ask questions, and connect with others on the mindfulness path.", members: 512, category: "Mindfulness", icon: "🧘", color: "bg-sage-50", nextSession: "Wed 7:00 PM", joined: true },
  { id: "sg3", name: "Sleep Warriors", description: "For those working to improve their sleep. Tips, check-ins, and accountability.", members: 198, category: "Sleep", icon: "🌙", color: "bg-purple-50", nextSession: "Thu 8:00 PM", joined: false },
  { id: "sg4", name: "Stress-Free Living", description: "Practical tools and peer support for managing chronic stress and building balance.", members: 341, category: "Stress", icon: "☀️", color: "bg-yellow-50", nextSession: "Fri 6:00 PM", joined: false },
  { id: "sg5", name: "Depression Recovery", description: "A compassionate community for those navigating depression and building hope.", members: 267, category: "Depression", icon: "🌱", color: "bg-amber-50", nextSession: "Tue 7:30 PM", joined: false },
];

export type Post = {
  id: string;
  author: string;
  avatar: string;
  group: string;
  content: string;
  time: string;
  likes: number;
  replies: number;
  liked: boolean;
  pinned?: boolean;
};

export const communityPosts: Post[] = [
  { id: "p1", author: "Anonymous", avatar: "🌿", group: "Anxiety Support Circle", content: "Had my first panic-attack-free week in months. I know it sounds small but I'm genuinely proud of myself. The breathing techniques have been life-changing.", time: "2h ago", likes: 47, replies: 12, liked: false, pinned: true },
  { id: "p2", author: "Anonymous", avatar: "🌸", group: "Mindfulness & Meditation", content: "Does anyone else struggle to meditate when their mind won't stop? I've been at this for 3 weeks and some days it feels impossible.", time: "4h ago", likes: 23, replies: 18, liked: true },
  { id: "p3", author: "Anonymous", avatar: "🌙", group: "Sleep Warriors", content: "Sleep restriction therapy sounded terrifying when my therapist suggested it but after 2 weeks I'm falling asleep in under 10 minutes. Worth it!", time: "6h ago", likes: 61, replies: 9, liked: false },
  { id: "p4", author: "Anonymous", avatar: "☀️", group: "Stress-Free Living", content: "Sharing my morning routine in case it helps anyone: 10 min walk, no phone for first hour, and one glass of water before coffee. Small things, big difference.", time: "Yesterday", likes: 89, replies: 24, liked: true },
  { id: "p5", author: "Anonymous", avatar: "💚", group: "Anxiety Support Circle", content: "Starting exposure therapy next week. Nervous but hopeful. Anyone else been through it? Would love to hear your experiences.", time: "Yesterday", likes: 34, replies: 31, liked: false },
];

// ─── Assessments ─────────────────────────────────────────────────────────────
export type Assessment = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  questions: number;
  duration: string;
  lastTaken?: string;
  lastScore?: { level: string; color: string };
  category: string;
};

export const assessments: Assessment[] = [
  {
    id: "a1", title: "Anxiety Screening (GAD-7)", description: "The Generalized Anxiety Disorder 7-item scale is a clinically validated tool used to assess anxiety severity.",
    icon: "💙", color: "bg-blue-50 border-blue-200", questions: 7, duration: "2-3 min",
    lastTaken: "Jun 10", lastScore: { level: "Mild Anxiety", color: "text-amber-600" }, category: "Anxiety",
  },
  {
    id: "a2", title: "Depression Screening (PHQ-9)", description: "The Patient Health Questionnaire-9 is a gold-standard tool for detecting and measuring the severity of depression.",
    icon: "🌱", color: "bg-amber-50 border-amber-200", questions: 9, duration: "3-4 min",
    lastTaken: "Jun 10", lastScore: { level: "Mild Depression", color: "text-amber-600" }, category: "Depression",
  },
  {
    id: "a3", title: "Burnout Assessment (CBI)", description: "The Copenhagen Burnout Inventory assesses personal and work-related burnout across emotional exhaustion, physical fatigue, and occupational strain.",
    icon: "🔥", color: "bg-red-50 border-red-200", questions: 10, duration: "4 min",
    category: "Burnout",
  },
  {
    id: "a4", title: "Stress Level Assessment", description: "The Perceived Stress Scale measures how often you feel your life has been unpredictable, uncontrollable, or overloaded.",
    icon: "⚡", color: "bg-purple-50 border-purple-200", questions: 10, duration: "4 min",
    lastTaken: "May 28", lastScore: { level: "Moderate Stress", color: "text-orange-600" }, category: "Stress",
  },
  {
    id: "a5", title: "Sleep Quality (ISI)", description: "The Insomnia Severity Index is a brief, validated clinical scale for evaluating the nature, severity, and daytime impact of sleep difficulties.",
    icon: "🌙", color: "bg-indigo-50 border-indigo-200", questions: 7, duration: "3 min",
    category: "Sleep",
  },
  {
    id: "a6", title: "Wellbeing Check-In (WEMWBS)", description: "The Warwick-Edinburgh Mental Well-being Scale assesses positive mental wellbeing across 14 validated statements about feelings and thoughts.",
    icon: "🌟", color: "bg-stone-50 border-stone-200", questions: 14, duration: "5 min",
    lastTaken: "Jun 1", lastScore: { level: "Moderate Wellbeing", color: "text-stone-600" }, category: "Wellbeing",
  },
];

export const gad7Questions = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen",
];

// ─── Settings ────────────────────────────────────────────────────────────────
export const userProfile = {
  name: "Alex Johnson",
  email: "alex.johnson@email.com",
  phone: "+1 (555) 012-3456",
  dob: "1995-04-12",
  timezone: "America/New_York",
  language: "English",
  avatar: "👤",
  plan: "Growth Plan",
  memberSince: "May 2024",
  therapist: "Dr. Sarah Chen",
};

// ─── Therapist Portal ─────────────────────────────────────────────────────────
export type Client = {
  id: string;
  name: string;
  avatar: string;
  age: number;
  condition: string[];
  plan: string;
  startDate: string;
  lastSession?: string;
  nextSession?: string;
  streak: number;
  moodAvg: number;
  moodHistory: number[];
  missionCompletion: number;
  riskLevel: "low" | "medium" | "high";
  status: "active" | "inactive" | "on-hold";
  unreadMessages: number;
  notes: string;
  coursesEnrolled: string[];
  pendingJournalReview: boolean;
};

export const therapistClients: Client[] = [
  {
    id: "c1", name: "Alex Johnson", avatar: "👤", age: 29,
    condition: ["Anxiety", "Stress"], plan: "Growth Plan",
    startDate: "May 2024", lastSession: "Jun 16", nextSession: "Jun 23",
    streak: 7, moodAvg: 3.8, moodHistory: [3, 4, 3, 2, 4, 3, 4],
    missionCompletion: 78, riskLevel: "low", status: "active",
    unreadMessages: 2, notes: "Making steady progress. CBT techniques are working well. Monitor sleep patterns.",
    coursesEnrolled: ["Foundations of Mindfulness", "Understanding Anxiety"],
    pendingJournalReview: true,
  },
  {
    id: "c2", name: "Maria Santos", avatar: "👩", age: 34,
    condition: ["Depression", "Low Mood"], plan: "Therapy Plan",
    startDate: "Mar 2024", lastSession: "Jun 17", nextSession: "Jun 24",
    streak: 2, moodAvg: 2.4, moodHistory: [2, 3, 2, 1, 3, 2, 3],
    missionCompletion: 45, riskLevel: "medium", status: "active",
    unreadMessages: 0, notes: "Struggling with motivation. Consider adjusting mission difficulty. Check-in on medication.",
    coursesEnrolled: ["Building Self-Compassion"],
    pendingJournalReview: true,
  },
  {
    id: "c3", name: "James Kim", avatar: "👨", age: 42,
    condition: ["Burnout", "Anxiety"], plan: "Therapy Plan",
    startDate: "Jan 2024", lastSession: "Jun 14", nextSession: "Jun 28",
    streak: 14, moodAvg: 4.1, moodHistory: [4, 4, 5, 4, 3, 4, 5],
    missionCompletion: 91, riskLevel: "low", status: "active",
    unreadMessages: 1, notes: "Excellent progress. Ready to reduce session frequency. Discuss transition plan.",
    coursesEnrolled: ["Stress-Free Living", "Emotional Resilience"],
    pendingJournalReview: false,
  },
  {
    id: "c4", name: "Priya Patel", avatar: "👩🏽", age: 26,
    condition: ["Social Anxiety", "Low Self-Esteem"], plan: "Growth Plan",
    startDate: "Apr 2024", lastSession: "Jun 10", nextSession: "Jun 24",
    streak: 0, moodAvg: 2.9, moodHistory: [3, 2, 2, 3, 2, 3, 3],
    missionCompletion: 52, riskLevel: "medium", status: "active",
    unreadMessages: 3, notes: "Missing sessions. Engage via message. Exposure therapy tasks need adjustment.",
    coursesEnrolled: ["Building Self-Compassion", "Foundations of Mindfulness"],
    pendingJournalReview: false,
  },
  {
    id: "c5", name: "Tom Reeves", avatar: "👨🏻", age: 51,
    condition: ["PTSD", "Depression"], plan: "Therapy Plan",
    startDate: "Feb 2024", lastSession: "Jun 18", nextSession: "Jun 25",
    streak: 5, moodAvg: 3.2, moodHistory: [2, 3, 3, 4, 3, 3, 4],
    missionCompletion: 63, riskLevel: "high", status: "active",
    unreadMessages: 0, notes: "High risk — monitor closely. Safety plan reviewed last session. Coordinator notified.",
    coursesEnrolled: ["Emotional Resilience"],
    pendingJournalReview: true,
  },
  {
    id: "c6", name: "Sophie Laurent", avatar: "👩🏼", age: 31,
    condition: ["OCD", "Anxiety"], plan: "Therapy Plan",
    startDate: "Jun 2024", lastSession: "Jun 17", nextSession: "Jun 24",
    streak: 9, moodAvg: 3.5, moodHistory: [3, 4, 3, 4, 3, 4, 4],
    missionCompletion: 82, riskLevel: "low", status: "active",
    unreadMessages: 0, notes: "New client — ERP protocol started. Good engagement with homework.",
    coursesEnrolled: ["Understanding Anxiety"],
    pendingJournalReview: false,
  },
];

export type TherapistAppointment = {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  date: string;
  time: string;
  duration: string;
  type: "individual" | "group" | "assessment" | "crisis";
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no-show";
  initiatedBy: "therapist" | "client";
  notes?: string;
  isNew?: boolean;
};

export const therapistAppointments: TherapistAppointment[] = [
  { id: "ta1", clientId: "c2", clientName: "Maria Santos", clientAvatar: "👩", date: "Today", time: "10:00 AM", duration: "50 min", type: "individual", status: "confirmed", initiatedBy: "therapist", notes: "Focus on behavioural activation" },
  { id: "ta2", clientId: "c5", clientName: "Tom Reeves", clientAvatar: "👨🏻", date: "Today", time: "2:00 PM", duration: "50 min", type: "individual", status: "confirmed", initiatedBy: "therapist", notes: "Safety plan review + EMDR session 3" },
  { id: "ta3", clientId: "c6", clientName: "Sophie Laurent", clientAvatar: "👩🏼", date: "Today", time: "4:00 PM", duration: "50 min", type: "individual", status: "pending", initiatedBy: "client", isNew: true },
  { id: "ta4", clientId: "c1", clientName: "Alex Johnson", clientAvatar: "👤", date: "Mon Jun 23", time: "10:00 AM", duration: "50 min", type: "individual", status: "confirmed", initiatedBy: "therapist" },
  { id: "ta5", clientId: "c4", clientName: "Priya Patel", clientAvatar: "👩🏽", date: "Mon Jun 23", time: "12:00 PM", duration: "50 min", type: "individual", status: "pending", initiatedBy: "client", isNew: true },
  { id: "ta6", clientId: "c3", clientName: "James Kim", clientAvatar: "👨", date: "Fri Jun 28", time: "3:00 PM", duration: "50 min", type: "individual", status: "confirmed", initiatedBy: "therapist" },
  { id: "ta7", clientId: "c1", clientName: "Alex Johnson", clientAvatar: "👤", date: "Jun 16", time: "10:00 AM", duration: "50 min", type: "individual", status: "completed", initiatedBy: "therapist", notes: "CBT homework reviewed. Sleep improving." },
  { id: "ta8", clientId: "c3", clientName: "James Kim", clientAvatar: "👨", date: "Jun 14", time: "3:00 PM", duration: "50 min", type: "individual", status: "completed", initiatedBy: "therapist" },
];

export type BuiltMission = {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  xp: number;
  assignedTo: string[];
  dueDate?: string;
  recurring?: "daily" | "weekly" | "none";
  status: "active" | "draft" | "completed";
  completionRate: number;
};

export const therapistMissions: BuiltMission[] = [
  { id: "bm1", title: "Morning Meditation", description: "Complete a 10-minute guided breath-awareness meditation.", category: "mindfulness", duration: "10 min", xp: 25, assignedTo: ["c1", "c4", "c6"], recurring: "daily", status: "active", completionRate: 74 },
  { id: "bm2", title: "Gratitude Journal", description: "Write 3 things you're grateful for today.", category: "journaling", duration: "5 min", xp: 15, assignedTo: ["c1", "c2", "c3"], recurring: "daily", status: "active", completionRate: 68 },
  { id: "bm3", title: "Exposure Task: Coffee Shop", description: "Spend 15 minutes in a coffee shop without using your phone.", category: "exposure", duration: "20 min", xp: 40, assignedTo: ["c4"], dueDate: "Jun 25", recurring: "none", status: "active", completionRate: 0 },
  { id: "bm4", title: "Safety Plan Review", description: "Read through your personal safety plan and confirm it still feels right.", category: "safety", duration: "5 min", xp: 20, assignedTo: ["c5"], recurring: "weekly", status: "active", completionRate: 100 },
  { id: "bm5", title: "Behavioural Activation: One Enjoyable Activity", description: "Do one activity today that you used to enjoy, even if it doesn't feel rewarding yet.", category: "depression", duration: "30 min", xp: 35, assignedTo: ["c2"], recurring: "daily", status: "active", completionRate: 43 },
  { id: "bm6", title: "ERP Hierarchy Step 2", description: "Practise sitting with uncertainty for 10 minutes without performing a compulsion.", category: "OCD", duration: "10 min", xp: 45, assignedTo: ["c6"], dueDate: "Jun 24", recurring: "none", status: "draft", completionRate: 0 },
];

export const therapistProfile = {
  name: "Dr. Sarah Chen",
  title: "Licensed Clinical Psychologist",
  avatar: "👩‍⚕️",
  specialisations: ["Anxiety", "Trauma", "CBT", "ACT"],
  activeClients: 6,
  totalSessions: 248,
  rating: 4.9,
  pendingMessages: 5,
  pendingAppointments: 2,
};

export const analyticsData = {
  moodByClient: therapistClients.map((c) => ({ name: c.name.split(" ")[0], avg: c.moodAvg, history: c.moodHistory })),
  completionRates: therapistClients.map((c) => ({ name: c.name.split(" ")[0], rate: c.missionCompletion })),
  riskBreakdown: { low: 4, medium: 2, high: 1 },
  weeklyEngagement: [
    { day: "Mon", sessions: 3, missions: 14 },
    { day: "Tue", sessions: 2, missions: 11 },
    { day: "Wed", sessions: 4, missions: 18 },
    { day: "Thu", sessions: 2, missions: 9 },
    { day: "Fri", sessions: 3, missions: 16 },
    { day: "Sat", sessions: 0, missions: 6 },
    { day: "Sun", sessions: 0, missions: 5 },
  ],
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  icon: string;
  for: "client" | "therapist" | "both";
};

export const mockNotifications: NotificationItem[] = [
  {
    id: "n1",
    title: "Session confirmed",
    body: "Your session with Dr. Sarah Chen is confirmed for tomorrow at 10:00 AM.",
    time: "2 min ago",
    read: false,
    icon: "📅",
    for: "client",
  },
  {
    id: "n2",
    title: "New message",
    body: "Dr. Sarah Chen sent you a message.",
    time: "15 min ago",
    read: false,
    icon: "💬",
    for: "client",
  },
  {
    id: "n3",
    title: "Mission completed",
    body: "Great job! You completed the 'Morning Breathing' mission.",
    time: "1 hr ago",
    read: false,
    icon: "🎯",
    for: "client",
  },
  {
    id: "n4",
    title: "Mood check-in reminder",
    body: "You haven't logged your mood today. Take a moment to check in.",
    time: "3 hr ago",
    read: true,
    icon: "🌿",
    for: "client",
  },
  {
    id: "n5",
    title: "New client message",
    body: "Alex Johnson sent you a message regarding their upcoming session.",
    time: "5 min ago",
    read: false,
    icon: "💬",
    for: "therapist",
  },
  {
    id: "n6",
    title: "Session in 30 minutes",
    body: "Upcoming session with Maya Patel at 2:00 PM today.",
    time: "28 min ago",
    read: false,
    icon: "⏰",
    for: "therapist",
  },
  {
    id: "n7",
    title: "Client completed assessment",
    body: "Alex Johnson completed their weekly mood assessment.",
    time: "1 hr ago",
    read: false,
    icon: "📋",
    for: "therapist",
  },
  {
    id: "n8",
    title: "New appointment request",
    body: "James Lee requested a new appointment for Friday at 3:00 PM.",
    time: "2 hr ago",
    read: true,
    icon: "📅",
    for: "therapist",
  },
];
