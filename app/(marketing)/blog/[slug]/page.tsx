import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Section = {
  heading?: string;
  body: string;
};

type Article = {
  slug: string;
  category: string;
  title: string;
  subtitle: string;
  author: string;
  authorRole: string;
  authorBio: string;
  date: string;
  readTime: string;
  cover: string;
  coverBg: string;
  keyPoints: string[];
  sections: Section[];
  relatedSlugs: string[];
};

const articles: Article[] = [
  {
    slug: "consistency-beats-intensity",
    category: "Research",
    title: "Why Consistency Beats Intensity in Mental Health Care",
    subtitle: "New research explains why five minutes every day outperforms a two-hour session once a month — and what it means for how we design support.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    authorBio: "Dr. Priya Patel is a psychiatrist and researcher specialising in digital mental health interventions. She leads clinical oversight and evidence-based content at MindEase.",
    date: "June 18, 2026",
    readTime: "6 min read",
    cover: "🧠",
    coverBg: "from-violet-600 to-indigo-700",
    keyPoints: [
      "Small, daily habits produce stronger long-term mental health outcomes than intensive but infrequent interventions",
      "The brain consolidates emotional learning during sleep — which means spacing practice across days is neurologically superior to cramming it into one session",
      "MindEase users who engage for five or more minutes daily show 2.3× better outcomes at 12 weeks than users who engage for longer but less frequently",
    ],
    sections: [
      {
        body: "When people think about getting better — at anything — they tend to imagine an intensive effort. A week-long detox. A two-hour gym session. A breakthrough therapy session that changes everything. Mental health is no different. We imagine a pivotal moment, a turning point, a single conversation that reorganises how we see ourselves.",
      },
      {
        body: "The research says otherwise. And if you understand why, it changes how you think about everything from therapy to journalling to meditation.",
      },
      {
        heading: "What the evidence actually shows",
        body: "A landmark meta-analysis published in Behaviour Research and Therapy in 2023 compared outcomes across 68 clinical trials of psychological interventions. The finding that surprised researchers most: frequency of practice mattered more than total duration. Participants who practised CBT techniques for 10 minutes daily showed significantly better six-month outcomes than those who practised for 90 minutes once a week — even when total time invested was equal.",
      },
      {
        body: "This pattern appears across modalities. In mindfulness research, the consistent finding is that daily practitioners — even those doing as little as five minutes — maintain benefits far better than irregular practitioners who sit for longer. The same holds for sleep hygiene, behavioural activation, and exposure therapy homework.",
      },
      {
        heading: "The neuroscience of why",
        body: "The explanation lies in how the brain consolidates learning. Emotional memories and behavioural patterns are processed primarily during sleep, particularly during REM cycles. When you practise a new coping technique and then sleep, the brain encodes that pattern more deeply. When you practise again the next day, you're building on a slightly more consolidated foundation.",
      },
      {
        body: "An intensive session doesn't give the brain time to consolidate before the next input arrives. It's the cognitive equivalent of trying to fill a funnel faster than it can drain — you lose most of what you pour in. Spacing practice across multiple sleep cycles is not just more convenient. It's neurologically superior.",
      },
      {
        body: "This is also why the common advice to 'do therapy homework' — practise techniques between sessions — is backed by such strong evidence. The homework isn't supplementary to the therapy. In many ways, it is the therapy. The session is the instruction; the daily practice is where the change actually happens.",
      },
      {
        heading: "What this looks like in practice",
        body: "At MindEase, we've had access to outcome data that lets us see this effect clearly. Users who open the app for five or more minutes daily — filling in a mood entry, completing a thought record, doing a breathing exercise — show outcomes at 12 weeks that are 2.3 times better than users who engage for longer periods but less frequently. The daily touchpoint is not a proxy for engagement. It is the mechanism of change.",
      },
      {
        body: "This shapes every product decision we make. We design for daily use, not for impressive single-session experiences. Our notifications aren't reminders — they're invitations to do three minutes of something that matters. Our exercises are short by design. We'd rather you do two minutes of a breathing exercise every morning than a full 20-minute guided session that you do twice and then abandon.",
      },
      {
        heading: "The implications for how you support yourself",
        body: "If you take one thing from this, it's that the size of the effort is less important than its regularity. A journalling habit that lasts two minutes before bed and actually happens every night is worth more than a 45-minute journalling session that happens when you remember to do it.",
      },
      {
        body: "Start smaller than feels meaningful. The goal in the first two weeks isn't depth — it's just showing up. Once the habit is stable, the depth comes naturally. Your brain will start to anticipate the daily practice, and the consolidation that happens each night will compound over weeks and months into genuine, lasting change.",
      },
      {
        body: "Consistency isn't the consolation prize for people who can't manage intensity. It's the mechanism. It's how change actually works.",
      },
    ],
    relatedSlugs: ["mood-tracking-science", "signs-you-might-benefit-from-therapy", "cbt-pocket"],
  },

  {
    slug: "mood-tracking-science",
    category: "Product",
    title: "The Science Behind Our Mood Tracking Algorithm",
    subtitle: "We rebuilt our mood model from scratch. Here's what we learned from two years of outcome data, 14 clinical advisors, and a lot of heated debates.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    authorBio: "Tom Walsh holds a PhD in cognitive-behavioural science from Oxford. He leads MindEase's research partnerships and outcome measurement programs.",
    date: "June 12, 2026",
    readTime: "8 min read",
    cover: "📊",
    coverBg: "from-emerald-600 to-teal-700",
    keyPoints: [
      "A single daily mood score is a weak predictor of clinical outcomes — variability and trend matter far more",
      "MindEase's model uses 11 data signals, not one, and weights them based on validated clinical research",
      "We deliberately chose transparency over precision: every mood insight is explained in plain language",
    ],
    sections: [
      {
        body: "When we launched the first version of MindEase's mood tracker in 2022, it worked like almost every other mood tracker on the market. You tapped a number from 1 to 10. We stored it. We showed you a line graph. That was it.",
      },
      {
        body: "Two years of outcome data later, we know that a single daily number is a remarkably poor predictor of anything clinically meaningful. Here's what we did about it — and why the answer was more complicated than we expected.",
      },
      {
        heading: "What a single score gets wrong",
        body: "The problem with a 1-to-10 mood score is not the number — it's what you do with it. In isolation, today's score tells you almost nothing. What matters clinically is pattern: the direction of change over time, the variability between days (which turns out to be a stronger predictor of anxiety than the average level), the relationship between mood and behaviours like sleep and exercise, and the gap between what someone reports and how they're functioning.",
      },
      {
        body: "A person who scores 4 today and has been at 4 for three weeks is in a very different situation from a person who scored 4 today but was at 7 last week. The same score, the same immediate experience, but completely different clinical pictures.",
      },
      {
        heading: "The 11 signals we use instead",
        body: "After reviewing the clinical literature and consulting our advisory board, we identified 11 data signals that, in combination, produce a significantly richer picture of someone's mental state than a single mood score. These include: the mood score itself, mood variability over the past seven days, sleep quality and duration, exercise and movement, social activity level, completion rate of therapeutic exercises, journal sentiment (analysed with explicit user consent), self-reported energy levels, appetite, concentration, and — critically — the trend direction over time.",
      },
      {
        body: "These signals are weighted differently depending on what we're trying to understand. For anxiety, variability and sleep quality are the strongest predictors. For depression, trend direction and activity level dominate. For overall wellbeing, a composite model performs best.",
      },
      {
        heading: "The debate about transparency vs. precision",
        body: "The most heated debate we had internally was about how much to explain to users. Our data science team initially built a model that produced a single 'wellbeing score' — a composite index that outperformed any individual signal in predicting clinical outcomes. It was more accurate. It was also a black box.",
      },
      {
        body: "Our clinical advisors pushed back hard. 'If someone sees a number go down and doesn't understand why, that's not useful — it's anxiety-inducing,' said Dr. Kwame Osei, who sits on our advisory board. 'The insight only has value if the person can act on it.'",
      },
      {
        body: "We landed on a deliberate trade-off: slightly less precise, but fully explained. Every mood insight in MindEase tells you not just what the model has noticed, but why — in plain language, sourced to specific inputs. 'Your mood variability has been higher than usual this week — often linked to disrupted sleep. Your sleep scores dropped on Tuesday and Wednesday.' That's more useful than a number going from 7.4 to 6.8.",
      },
      {
        heading: "What we're still getting wrong",
        body: "The honest version of this post has to acknowledge the limits. Our model is trained primarily on data from users who are already engaged enough to fill in daily check-ins — which is not the same population as people who most need support. People in acute distress often stop tracking. That's a fundamental sampling problem we haven't solved.",
      },
      {
        body: "We're also aware that mood tracking itself can become a source of anxiety for some users — a phenomenon well-documented in the research literature. We've added deliberate friction: a 'take a break from tracking' option that doesn't penalise engagement scores, and a clinical review trigger if tracking frequency suddenly drops.",
      },
      {
        body: "The goal was never to build a perfect model. It was to build one that's useful, honest about its limits, and genuinely grounded in the science. We think we're closer to that now than we were in 2022. We're also certain we'll be rebuilding it again.",
      },
    ],
    relatedSlugs: ["consistency-beats-intensity", "ai-in-mental-health", "peer-support-evidence"],
  },

  {
    slug: "signs-you-might-benefit-from-therapy",
    category: "Guides",
    title: "5 Signs You Might Benefit From Online Therapy",
    subtitle: "Therapy isn't just for crisis. These five patterns — which often go unnoticed — are reliable signals that professional support could make a real difference.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    authorBio: "Dr. Sarah Chen is a clinical psychologist with 14 years of practice. She co-founded MindEase to bring the benefits of therapy to the gaps between sessions.",
    date: "June 6, 2026",
    readTime: "5 min read",
    cover: "💬",
    coverBg: "from-rose-500 to-pink-700",
    keyPoints: [
      "Most people who benefit from therapy don't arrive in crisis — they arrive with patterns they can't seem to change",
      "The threshold for 'needing' therapy is lower than most people think",
      "Online therapy removes many of the practical barriers that stop people from starting",
    ],
    sections: [
      {
        body: "One of the most persistent myths about therapy is that it's for people who are really struggling — in crisis, unable to function, dealing with something severe. This myth does genuine harm. The people who benefit most from early therapeutic support are often the ones who dismiss the idea because they don't feel 'bad enough' to justify it.",
      },
      {
        body: "After 14 years as a clinician and three years building MindEase, here are the five patterns I see most often in people who come to therapy and are surprised by how much it helps.",
      },
      {
        heading: "1. You have the same argument with yourself on repeat",
        body: "If you find yourself cycling through the same internal debate — about a relationship, a career decision, a pattern of behaviour — without ever resolving it, that's a strong signal. It's not that you lack insight. Often these people have enormous insight into their patterns. What they're missing is the external relationship and structured process that allows insight to become action.",
      },
      {
        body: "Therapy doesn't give you answers. It gives you a structured space to think differently — to notice the cognitive distortions that keep you stuck, to hear your own thoughts reflected back in a way that makes the pattern visible. For people who are stuck in a loop, this is often transformative within just a few sessions.",
      },
      {
        heading: "2. Your emotional reactions feel disproportionate",
        body: "If you regularly find yourself more upset than the situation seems to warrant — more anxious, more angry, more withdrawn — that's worth paying attention to. Disproportionate emotional responses are usually symptoms of something: unprocessed grief, an old pattern being triggered, accumulated stress that hasn't been discharged, or beliefs about yourself that distort how you interpret events.",
      },
      {
        body: "These responses are not character flaws. They're information. A therapist can help you trace the response back to its source, which is usually the first step in changing it.",
      },
      {
        heading: "3. You're coping, but it's costing you",
        body: "Many people come to therapy not because they're not coping, but because they're paying too high a price to cope. They're drinking a bit more than they should. Working so hard there's nothing left for the people they love. Exercising compulsively. Numbing out with screens. Keeping themselves so busy there's no space to feel anything.",
      },
      {
        body: "These strategies work, in the short term. They keep the feeling at bay. But they also prevent the processing that would eventually let you put the feeling down. If you're working harder and harder to stay okay, therapy can help you find a less expensive way to do it.",
      },
      {
        heading: "4. A relationship in your life keeps going wrong in the same way",
        body: "Whether it's romantic relationships, friendships, or working relationships — if you notice the same pattern appearing across different people and contexts, you're almost certainly bringing something to the table. This is not a criticism. We all have relational patterns, most of them formed very early and largely invisible to us.",
      },
      {
        body: "Attachment-focused therapy, in particular, is remarkably effective at making these patterns visible and giving people the tools to respond differently. The insight alone — 'I do this because...' — rarely produces lasting change. But combined with the experience of a different kind of relationship in the therapeutic space itself, real change becomes possible.",
      },
      {
        heading: "5. You've been 'fine' for so long you've forgotten what good feels like",
        body: "This one is quiet and easy to miss. It's not distress, exactly. It's a flattening. Life is manageable, nothing is wrong per se, but there's a kind of grey quality to things. You can't remember the last time you felt genuinely alive to something.",
      },
      {
        body: "This is often what low-grade depression looks like. It doesn't look like the darkness people imagine. It looks like being fine. If this resonates, I would gently encourage you not to dismiss it on the grounds that things could be worse. You deserve more than fine.",
      },
      {
        heading: "On starting",
        body: "The practical barriers to therapy — cost, availability, the awkwardness of a first session — are real. Online therapy has made a meaningful dent in most of them. MindEase's therapist network offers sessions at a range of price points, with no waiting list, from wherever you are. If you've been thinking about it, the moment to start is rarely later.",
      },
    ],
    relatedSlugs: ["cbt-pocket", "consistency-beats-intensity", "therapist-burnout"],
  },

  {
    slug: "cbt-pocket",
    category: "Clinical",
    title: "CBT in Your Pocket: Evidence-Based Therapy for Everyone",
    subtitle: "Cognitive-behavioural therapy has the strongest evidence base of any psychological intervention. The problem has always been access. That's what we're changing.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    authorBio: "Dr. Priya Patel is a psychiatrist and researcher specialising in digital mental health interventions. She leads clinical oversight at MindEase.",
    date: "May 28, 2026",
    readTime: "7 min read",
    cover: "🔬",
    coverBg: "from-amber-500 to-orange-600",
    keyPoints: [
      "CBT is the most evidence-backed psychological treatment for anxiety and depression — with over 500 randomised controlled trials supporting its efficacy",
      "Guided self-help CBT has been shown to produce outcomes 60–80% as strong as face-to-face CBT for mild to moderate presentations",
      "MindEase's CBT tools are built directly from clinical protocols — not simplified approximations",
    ],
    sections: [
      {
        body: "If you've ever wondered which therapy has the most scientific evidence behind it, the answer is clear: cognitive-behavioural therapy, or CBT. With over 500 randomised controlled trials, a Cochrane review effect size of 0.73 for anxiety disorders and 0.82 for depression, and decades of replication across dozens of countries, CBT is the closest thing psychology has to a gold standard.",
      },
      {
        body: "It's also, traditionally, expensive, inaccessible, and limited to whoever can find a trained therapist and afford weekly sessions. That gap — between the strength of the evidence and the reach of the treatment — is the problem MindEase was built to address.",
      },
      {
        heading: "What CBT actually is",
        body: "CBT is based on a straightforward premise: the way we think influences the way we feel, which influences the way we behave. And the loop goes the other way too — behaviours affect thoughts, which affect feelings. By identifying and changing unhelpful thinking patterns and behaviours, you can shift the entire cycle.",
      },
      {
        body: "In practice, CBT involves learning to recognise automatic negative thoughts ('no one likes me', 'I always mess things up'), examining the evidence for and against them, and replacing them with more balanced, realistic alternatives. It also involves behavioural experiments — testing your assumptions in the real world rather than just reasoning your way out of them — and a range of specific techniques tailored to different presentations.",
      },
      {
        heading: "The evidence for digital CBT",
        body: "The question we had to answer before building CBT tools into MindEase was: does it work without a therapist in the room? The research is clear that for mild to moderate presentations — which account for the vast majority of people who seek help for anxiety and depression — guided self-help CBT produces outcomes 60–80% as strong as face-to-face CBT.",
      },
      {
        body: "'Guided' is the operative word. The evidence for completely unguided, self-directed CBT resources is weaker. The presence of some human support — even asynchronous, even minimal — significantly improves outcomes. This is one reason MindEase's tools are designed to sit within a broader relationship: with a therapist on the platform, or at minimum with the MindEase clinical team who review flagged content.",
      },
      {
        heading: "How we built the tools",
        body: "MindEase's CBT toolkit was developed directly from clinical protocols — not from popular science summaries of CBT, and not from our team's intuitions about what might help. We started with the published treatment manuals used in NICE-approved CBT programmes in the UK and worked with our clinical advisory board to translate each technique into a format that works on a small screen, in the gaps of a busy life, without a clinician present.",
      },
      {
        body: "The thought record is a good example. The standard CBT thought record has seven columns and takes 20–30 minutes to complete in a therapeutic context. Our version has four steps, takes 5–8 minutes, and prompts the user at each stage with examples and guidance. Independent validation showed it achieves comparable outcomes to the full seven-column version for most users, with significantly better completion rates.",
      },
      {
        heading: "What we're honest about",
        body: "Guided self-help CBT is not the same as face-to-face CBT with a skilled clinician. For people with complex presentations, severe symptoms, trauma histories, or co-occurring conditions, it's not a replacement. We make this explicit in the app, in our onboarding, and in every piece of content we publish.",
      },
      {
        body: "What it is, for the majority of people who experience anxiety or depression at some point in their lives, is a meaningful, evidence-based option that was previously unavailable unless you could find a therapist, wait for an appointment, and afford the sessions. Closing that gap — imperfectly, but meaningfully — is what MindEase is for.",
      },
    ],
    relatedSlugs: ["consistency-beats-intensity", "signs-you-might-benefit-from-therapy", "therapist-burnout"],
  },

  {
    slug: "safe-online-communities",
    category: "Community",
    title: "Building Safe Online Communities for Mental Health",
    subtitle: "The internet can be a harmful place for vulnerable people. We spent 18 months designing our community spaces with clinical input to change that.",
    author: "Nina Okafor",
    authorRole: "Head of Community",
    authorBio: "Nina Okafor is a lived experience advocate and former peer support specialist. She leads MindEase's community team and ensures our spaces remain safe and inclusive.",
    date: "May 20, 2026",
    readTime: "9 min read",
    cover: "🤝",
    coverBg: "from-blue-600 to-indigo-700",
    keyPoints: [
      "Online peer communities can provide genuine therapeutic benefit — but only if they're designed carefully",
      "Most mental health forums are net-negative for users in acute distress due to poor moderation and contagion effects",
      "MindEase's community was designed with 14 specific clinical safeguards before the first user joined",
    ],
    sections: [
      {
        body: "When we started planning MindEase's community features, we had a long conversation about whether to build them at all. The research on online mental health communities is genuinely mixed. Done well, peer support provides something clinical care can't: lived experience, availability at 3am, the particular comfort of being understood by someone who's been there. Done badly, it amplifies distress, enables harmful comparison, and creates contagion effects around self-harm and suicide that are well-documented in the literature.",
      },
      {
        body: "We decided to build — but only if we could do it properly. Here's how we tried.",
      },
      {
        heading: "What makes mental health communities go wrong",
        body: "The academic literature identifies three main failure modes for online mental health communities. The first is contagion: detailed discussion of methods, doses, or experiences of self-harm and suicide can trigger similar behaviour in vulnerable readers. This is not hypothetical — there are documented case clusters linked to specific forums and, notoriously, to certain social media trends.",
      },
      {
        body: "The second is negative social comparison. Community spaces that become primarily about sharing how bad things are can normalise distress and create implicit competition around suffering. Users begin to define their identity through their diagnosis or their worst experiences, which is both clinically counterproductive and, often, a poor representation of who they actually are.",
      },
      {
        body: "The third is echo chambers. Without active facilitation, communities tend to reinforce existing beliefs. For someone in a cognitive distortion — 'no one understands me', 'things will never get better' — a community that simply validates those beliefs does real harm, however kindly it intends to.",
      },
      {
        heading: "The 14 safeguards we built before launch",
        body: "Before a single user posted in MindEase's community spaces, we implemented 14 specific clinical safeguards developed with our advisory board. These include: a strict safe messaging policy based on WHO and Samaritans guidelines; automated detection of content that describes method, location, or timing of self-harm; a 24-hour moderation response SLA with on-call clinical oversight; anonymous posting as the default to reduce identity-based stigma; and a community structure organised around topics and goals rather than diagnoses.",
      },
      {
        body: "That last point is important. Diagnosis-based communities ('anxious people', 'depressed people') can reinforce diagnostic identity in ways that aren't clinically helpful. Our groups are organised around experiences and goals: 'better sleep', 'managing panic', 'going through a hard time', 'celebrating progress'. The same person might move between groups as their needs change.",
      },
      {
        heading: "The role of peer moderators",
        body: "Our moderation team is made up of a mixture of trained staff and peer moderators — community members with lived experience who have completed our facilitation training. Peer moderators aren't therapists and aren't positioned as such. Their role is to ensure the space stays safe and constructive, to welcome new members, and to notice when someone might need more support than the community can provide.",
      },
      {
        body: "We pay peer moderators. This is a deliberate choice. Peer support work is skilled, emotionally demanding, and — in most apps — entirely unpaid. We think that's exploitative, and that it produces worse outcomes. Compensating people for their expertise and labour is the right thing to do and it attracts people who take the role seriously.",
      },
      {
        heading: "What we've learned",
        body: "Two years in, the data is encouraging. Users who engage with the community show better 12-week outcomes than those who don't, even controlling for baseline engagement. The mechanism appears to be accountability: when people post about a goal or a struggle, they're more likely to take action and to return and update the community.",
      },
      {
        body: "We've also had hard moments. A post that got through moderation. A user in crisis who needed more than the community could give. A conversation that tipped into unhelpful territory before anyone caught it. These moments are humbling, and they've led to improvements each time.",
      },
      {
        body: "Building something safe in this space is not a problem you solve once. It's ongoing work, requiring ongoing attention and a willingness to be wrong, learn, and try again. We're committed to that. And we think the community we're building is worth it.",
      },
    ],
    relatedSlugs: ["peer-support-evidence", "signs-you-might-benefit-from-therapy", "ai-in-mental-health"],
  },

  {
    slug: "sleep-anxiety-cycle",
    category: "Guides",
    title: "Sleep and Anxiety: Breaking the Cycle",
    subtitle: "Poor sleep worsens anxiety. Anxiety worsens sleep. This evidence-based guide explains the loop and gives you four techniques to interrupt it tonight.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    authorBio: "Dr. Sarah Chen is a clinical psychologist with 14 years of practice. She co-founded MindEase to bring the benefits of therapy to the gaps between sessions.",
    date: "May 14, 2026",
    readTime: "6 min read",
    cover: "🌙",
    coverBg: "from-slate-700 to-blue-900",
    keyPoints: [
      "Sleep deprivation increases anxiety by up to 30% — and anxiety disrupts sleep architecture, creating a self-perpetuating cycle",
      "The most effective interventions target both sides of the cycle simultaneously",
      "Sleep restriction therapy — though counterintuitive — has the strongest evidence base for chronic insomnia",
    ],
    sections: [
      {
        body: "It goes like this. You're anxious, so you can't sleep. You don't sleep well, so you feel more anxious. The anxiety makes it even harder to sleep. The sleep deprivation makes the anxiety worse. By week three you're lying awake at 2am wondering if you'll ever sleep normally again — which, of course, makes it even harder to sleep.",
      },
      {
        body: "This is one of the most common and most miserable cycles in mental health. It's also, importantly, one of the most treatable — if you understand the mechanism and target both sides of it deliberately.",
      },
      {
        heading: "What's happening in the brain",
        body: "Sleep deprivation has a specific and well-documented effect on the amygdala — the brain's threat-detection centre. In a study using fMRI imaging, Matthew Walker's lab at UC Berkeley found that sleep-deprived participants showed 60% greater amygdala reactivity to negative stimuli than well-rested participants. The prefrontal cortex, which normally regulates amygdala responses, showed reduced connectivity — meaning the brain's threat alarm was louder and the volume control was broken.",
      },
      {
        body: "Anxiety, for its part, disrupts sleep in two main ways. First, the physiological activation of the stress response — elevated cortisol, increased heart rate, muscle tension — is incompatible with the relaxed state needed to fall asleep. Second, the cognitive component of anxiety (racing thoughts, worry, mental rehearsal of feared scenarios) keeps the brain in an alert, problem-solving mode that is the neurological opposite of sleep.",
      },
      {
        heading: "Technique 1: Scheduled worry time",
        body: "One of the most evidence-backed approaches to sleep-related anxiety is to contain worry rather than suppress it. Suppression — telling yourself to stop thinking anxious thoughts — typically backfires. The thought intrudes more forcefully. Instead, designate a 15-minute 'worry period' earlier in the evening (not within two hours of bed) where you actively engage with your worries: write them down, consider what you can and can't control, make a brief plan for anything actionable.",
      },
      {
        body: "When anxious thoughts arise at bedtime, you can acknowledge them and redirect: 'I've already given that time tonight. I'll think about it tomorrow.' This is not dismissal — the thought gets its time. But that time is not now.",
      },
      {
        heading: "Technique 2: Progressive muscle relaxation",
        body: "Progressive muscle relaxation (PMR) works by creating physical relaxation as a counter-signal to anxiety's arousal. You systematically tense and release muscle groups from feet to face, spending about 10 seconds on each. The release after tension activates the parasympathetic nervous system — the 'rest and digest' state that's the physiological prerequisite for sleep.",
      },
      {
        body: "PMR has been shown in multiple trials to reduce sleep onset latency (the time it takes to fall asleep) by an average of 18 minutes in people with anxiety-related insomnia. It's unglamorous, takes about 15 minutes, and it works.",
      },
      {
        heading: "Technique 3: Cognitive restructuring for sleep-specific worries",
        body: "Anxiety about sleep is itself a major driver of insomnia. Thoughts like 'if I don't sleep tonight I won't be able to function tomorrow' create performance pressure around sleep that makes sleep harder. These thoughts can be examined and restructured just like any other anxious thought.",
      },
      {
        body: "A reframe that clinical research supports: rest itself has value, even without sleep. Lying quietly with your body relaxed and your eyes closed is genuinely restorative — not as much as sleep, but significantly more than anxious wakefulness. Removing the pressure to sleep (while still resting) often paradoxically allows sleep to come.",
      },
      {
        heading: "Technique 4: Sleep restriction therapy",
        body: "This is the most counterintuitive and the most effective for chronic insomnia. Sleep restriction therapy (SRT) works by temporarily restricting time in bed to match actual sleep time, creating sleep pressure — the build-up of adenosine that drives sleep need — and reconsolidating sleep drive around the correct window.",
      },
      {
        body: "It feels terrible for the first week. You're more tired. The second week is usually transformative. In multiple RCTs, SRT outperforms sleep medication at 12 weeks and maintains its advantage at one year — without dependency or side effects. If you want to try it, I'd recommend doing it with support: the MindEase sleep module walks you through it, and ideally you'd work with a therapist who can adjust the protocol as you go.",
      },
      {
        heading: "The order of operations",
        body: "For most people, the quickest path out of the anxiety-sleep cycle is to address sleep first. Improving sleep quality directly reduces anxiety — and from a lower baseline of anxiety, the psychological work becomes more tractable. Start with scheduled worry time and PMR this week. Give them two weeks before judging them. If insomnia is severe and longstanding, consider SRT with support.",
      },
      {
        body: "The cycle took time to build. It will take more than one night to break. But the evidence that it can be broken is clear, and the techniques for doing it are well-established. You don't have to stay in the loop.",
      },
    ],
    relatedSlugs: ["consistency-beats-intensity", "cbt-pocket", "signs-you-might-benefit-from-therapy"],
  },

  {
    slug: "therapist-burnout",
    category: "Clinical",
    title: "Therapist Burnout Is a Patient Safety Issue",
    subtitle: "When therapists burn out, patients suffer. Our new tools for clinicians are designed around one insight: the people doing the caring need care too.",
    author: "Marcus Webb",
    authorRole: "CTO & Co-Founder",
    authorBio: "Marcus Webb is a former senior engineer at Headspace and Google. He co-founded MindEase with a focus on building tools that support both clients and clinicians.",
    date: "May 5, 2026",
    readTime: "5 min read",
    cover: "🏥",
    coverBg: "from-red-600 to-rose-700",
    keyPoints: [
      "45% of mental health professionals report symptoms of burnout — significantly higher than most other healthcare professions",
      "Burned-out therapists show reduced empathic accuracy and higher rates of premature termination",
      "Administrative burden is the single most cited driver of burnout — not the clinical work itself",
    ],
    sections: [
      {
        body: "We don't talk enough about therapist burnout. When we talk about the mental health crisis, we talk about patients — the people struggling, the waiting lists, the gap in services. We talk far less about the people on the other side of the room, absorbing that distress session after session, often with insufficient support, inadequate pay (in the UK's underfunded public sector), and administrative demands that have grown year on year.",
      },
      {
        body: "A 2024 survey of UK BACP members found that 45% reported burnout symptoms — significantly higher than for GPs, nurses, and other healthcare workers. This isn't a personal failing. It's a structural problem. And it has direct consequences for patients.",
      },
      {
        heading: "What burnout does to care",
        body: "The research on burned-out clinicians is uncomfortable reading. Studies consistently show that burnout correlates with reduced empathic accuracy — burned-out therapists are less able to accurately read their clients' emotional states. They show higher rates of premature termination (ending the therapeutic relationship before the client is ready). They're more likely to engage in self-protective distancing — maintaining clinical detachment at the cost of the therapeutic alliance, which is the single strongest predictor of outcomes.",
      },
      {
        body: "In other words, burnout doesn't just harm therapists. It directly harms the people they're trying to help. Framing therapist wellbeing as a patient safety issue isn't rhetoric — it's the honest clinical picture.",
      },
      {
        heading: "The administrative weight",
        body: "When we talked to therapists about what drives burnout, the answer was rarely 'the clinical work'. Most therapists went into the profession because of the clinical work. The answer was administration: session notes, insurance pre-authorisations, appointment scheduling, chasing unpaid invoices, managing waiting lists, duplicating information across multiple systems.",
      },
      {
        body: "A therapist seeing 25 clients a week might spend 8–10 hours on administration — a third of their working week on tasks that have nothing to do with helping anyone. Over time, that imbalance becomes corrosive. The work that sustains them (the clinical connection) gets squeezed by work that drains them (the administrative overhead).",
      },
      {
        heading: "What MindEase does differently",
        body: "When we built the therapist portal, we made a deliberate decision to treat clinicians as the product's primary users, not secondary ones. The client-facing features are only half the product. The other half is built specifically to remove the administrative burden that drives burnout.",
      },
      {
        body: "Session notes auto-populate from the client's week on MindEase — mood data, completed exercises, journal entries (with consent) — so the therapist begins each session with a rich picture of the week rather than spending the first 15 minutes establishing it. Scheduling, reminders, and cancellation handling are automated. Billing and invoicing are integrated. The therapist's job, when they open the portal, is to do clinical work.",
      },
      {
        body: "We also built supervision and peer support features specifically for therapists on the network — because isolation is another significant driver of burnout, and because the experience of being held and supported professionally is something many practitioners, particularly those in private practice, lack entirely.",
      },
      {
        heading: "The uncomfortable systemic point",
        body: "None of this solves the structural underfunding of mental health services. A product can reduce administrative friction, but it can't replace fair pay, appropriate caseloads, or adequate clinical supervision. Those require policy change, not product design.",
      },
      {
        body: "What we can do is make the portion of the problem that sits within our control as small as possible — and be honest about what that does and doesn't address. Therapists deserve that honesty. They're asking for support, and the least we can do is mean it.",
      },
    ],
    relatedSlugs: ["signs-you-might-benefit-from-therapy", "cbt-pocket", "peer-support-evidence"],
  },

  {
    slug: "peer-support-evidence",
    category: "Research",
    title: "What the Research Says About Peer Support",
    subtitle: "Peer support has been dismissed as soft or unscientific. A growing body of randomised controlled trials says otherwise.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    authorBio: "Tom Walsh holds a PhD in cognitive-behavioural science from Oxford. He leads MindEase's research partnerships and outcome measurement programs.",
    date: "April 29, 2026",
    readTime: "10 min read",
    cover: "📖",
    coverBg: "from-teal-600 to-cyan-700",
    keyPoints: [
      "A 2023 Cochrane review of 53 RCTs found peer support significantly reduces symptoms of depression and anxiety compared to usual care",
      "The mechanism is partly about information, but primarily about hope — seeing others recover makes recovery feel possible",
      "Online peer support shows similar effect sizes to in-person support, with higher accessibility and lower barriers to engagement",
    ],
    sections: [
      {
        body: "Peer support — receiving help from people with lived experience of the same condition — has been part of mental health recovery movements for decades. The twelve-step model, which originated in 1935, is its most famous expression. But for much of its history, peer support has been treated by the clinical establishment as a compassionate supplement to real treatment: helpful, perhaps, but not something you'd put in an RCT.",
      },
      {
        body: "That's changing. Here's what the evidence now shows.",
      },
      {
        heading: "The Cochrane review",
        body: "In 2023, the Cochrane Collaboration published a systematic review of peer support interventions for adults with mental health conditions, covering 53 randomised controlled trials with a combined sample of over 11,000 participants. The findings were substantially more positive than many clinicians expected.",
      },
      {
        body: "Compared to usual care alone, peer support significantly reduced symptoms of depression (standardised mean difference of 0.41) and anxiety (SMD 0.34), and significantly improved quality of life, hope, and recovery-oriented outcomes. These are clinically meaningful effect sizes — comparable to many pharmacological interventions and in the same range as guided self-help CBT.",
      },
      {
        heading: "Why it works: the hope mechanism",
        body: "The mechanism of peer support is not primarily informational — people don't get better primarily because they learn things from others who've been through similar experiences, though that matters. The primary mechanism appears to be hope.",
      },
      {
        body: "Social cognitive theory predicts this: we update our beliefs about what's possible for us based partly on what we see is possible for others similar to us. When someone with lived experience of severe anxiety tells you they're now working, in a relationship, and living a full life, something shifts that doesn't shift when a clinician says 'most people recover'. The source matters. The similarity matters. The visceral evidence that recovery is real — not just possible in theory, but actual, visible, in the room — is clinically powerful.",
      },
      {
        body: "This is sometimes called 'vicarious hope', and it appears in the qualitative literature across peer support interventions consistently enough to be considered a core mechanism.",
      },
      {
        heading: "Online vs. in-person",
        body: "One important finding for our purposes at MindEase: the evidence does not show meaningfully different outcomes for online peer support compared to in-person. A 2022 meta-analysis specifically comparing modalities found effect sizes within the margin of error for virtually all outcomes measured.",
      },
      {
        body: "This is clinically significant because online delivery substantially increases accessibility. People who would not attend a peer support group — due to geographical barriers, mobility issues, social anxiety, stigma, or simply the difficulty of committing to a fixed weekly time — can access online peer communities far more easily. If the outcomes are equivalent and the reach is greater, online peer support is likely to have a larger population-level impact.",
      },
      {
        heading: "The caveats",
        body: "The evidence base, while now substantial, is not without limitations. Peer support is not a homogeneous intervention — the 53 trials in the Cochrane review covered programmes that varied enormously in structure, training, intensity, and setting. Effect sizes varied accordingly, and it remains unclear exactly which design features produce which outcomes.",
      },
      {
        body: "The evidence is also weaker for people with more severe presentations, particularly psychosis and bipolar disorder in acute phases. The strongest evidence is for depression, anxiety, and recovery support following more intensive treatment.",
      },
      {
        heading: "What this means for MindEase",
        body: "The evidence informs every design decision in our community spaces. We've built our groups around the features that appear most robustly in the positive literature: trained peer facilitators, structured focus on goals and recovery rather than symptom comparison, moderation that prevents harmful content while preserving authentic sharing, and active connection between community participation and clinical care for users on the platform.",
      },
      {
        body: "Peer support is not a replacement for clinical care. But it is, on the current evidence, a meaningful intervention in its own right — not a soft add-on. Treating it that way — designing it rigorously, measuring it honestly, and taking the research seriously — is both the clinically responsible and the practically useful thing to do.",
      },
    ],
    relatedSlugs: ["safe-online-communities", "consistency-beats-intensity", "mood-tracking-science"],
  },

  {
    slug: "ai-in-mental-health",
    category: "Product",
    title: "How We're Using AI Responsibly in Mental Health Care",
    subtitle: "AI in mental health is genuinely exciting and genuinely risky. Here's exactly what we do — and don't do — and why we've drawn those lines where we have.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    authorBio: "Dr. Sarah Chen is a clinical psychologist with 14 years of practice. She co-founded MindEase and leads the company's approach to ethical AI in care.",
    date: "April 21, 2026",
    readTime: "7 min read",
    cover: "🤖",
    coverBg: "from-stone-700 to-stone-900",
    keyPoints: [
      "AI in mental health has the potential to extend access and personalise care — and the potential to cause serious harm if deployed carelessly",
      "MindEase uses AI for pattern detection and personalisation, not for clinical decision-making",
      "Every AI feature has a clinician in the loop — AI surfaces information; humans interpret and act on it",
    ],
    sections: [
      {
        body: "A few months ago, a journalist asked me whether MindEase would eventually replace therapists with AI. I said no — and not because of some vague discomfort about technology, but because of a specific, evidence-based belief about what AI can and cannot do in a clinical context. This post is an attempt to be precise about where we've drawn those lines and why.",
      },
      {
        heading: "What AI is genuinely good at in mental health",
        body: "AI is good at pattern recognition across large datasets in ways that exceed human capacity. In mental health, this creates real opportunities. An algorithm can notice that a user's mood scores have been declining gradually over six weeks in a pattern associated with depressive episodes — more reliably than a clinician reviewing a weekly session, and weeks before the person might self-identify the shift.",
      },
      {
        body: "AI is also good at personalisation at scale. A clinical team can't individually tailor exercise recommendations for 280,000 users. An algorithm that learns which types of exercises a specific person tends to complete, at what times, under what conditions, and with what results — and uses that to surface the right recommendation at the right moment — can provide a level of personalisation that wasn't previously possible.",
      },
      {
        body: "These are genuine contributions to care, and we use AI for both of them. Our mood trend detection, risk flagging, and exercise recommendation engine are all AI-driven.",
      },
      {
        heading: "What AI is not good at",
        body: "AI is not good at the things that are most central to clinical care. It cannot form a therapeutic relationship. It cannot exercise the clinical judgment that comes from years of supervised practice, an intuitive read of what someone isn't saying, or the capacity to make a risk judgement in a moment of uncertainty and live with that responsibility.",
      },
      {
        body: "The failure modes of AI in mental health also tend to be serious ones. A poorly calibrated risk detection model can both miss people in crisis (false negatives with potentially fatal consequences) and flag people who aren't in crisis (false positives that undermine trust and create unnecessary alarm). These are not the kinds of errors you can simply iterate your way through when real people's safety is at stake.",
      },
      {
        heading: "Our actual framework",
        body: "The framework we use internally is: AI surfaces, humans decide. AI can flag a pattern, alert a therapist, or surface a recommendation. A human — the user themselves, a peer facilitator, or a clinician — is always in the loop before anything consequential happens.",
      },
      {
        body: "Concretely: our risk detection model can identify language and mood patterns associated with suicidal ideation. When it does, it doesn't automatically send an alert or restrict access. It surfaces the information to the user first ('We noticed something in what you shared — are you having thoughts of hurting yourself?') and to their therapist if they have one, and it offers a range of human support options. The AI has detected something. A human is making every decision that follows.",
      },
      {
        heading: "What we've chosen not to build",
        body: "We've made deliberate choices not to build things that are technically feasible but clinically irresponsible. We don't use AI to generate therapeutic content — exercises, psychoeducation, or in-app messages — without clinical review. We don't use AI to make or suggest diagnoses. We don't position any AI feature as a substitute for clinical judgment.",
      },
      {
        body: "We've also chosen not to use user data to train AI models without explicit informed consent — and we give users a meaningful choice, including the option to use MindEase without any AI personalisation features.",
      },
      {
        heading: "The honest uncertainty",
        body: "I want to be clear that our framework isn't perfect, and that reasonable clinicians disagree about where the right lines are. Some of our advisors think we're too conservative and are leaving real clinical value on the table. Others think we should be more cautious still. We take both views seriously.",
      },
      {
        body: "What we're committed to is being explicit about what we're doing and why, publishing our outcome data including negative findings, and updating our approach as the evidence develops. The worst thing we could do is treat AI in mental health as either a panacea or a threat — it's a tool, with specific strengths and specific risks, that requires ongoing, honest, evidence-based calibration.",
      },
      {
        body: "We don't claim to have that calibration perfect. We claim to be taking it seriously. In this space, that distinction matters.",
      },
    ],
    relatedSlugs: ["mood-tracking-science", "peer-support-evidence", "therapist-burnout"],
  },
];

const allArticles = articles.map((a) => ({
  slug: a.slug,
  title: a.title,
  category: a.category,
  cover: a.cover,
  readTime: a.readTime,
  author: a.author,
}));

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return { title: "Article not found — MindEase Blog" };
  return {
    title: `${article.title} — MindEase Blog`,
    description: article.subtitle,
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const related = article.relatedSlugs
    .map((s) => allArticles.find((a) => a.slug === s))
    .filter(Boolean) as typeof allArticles;

  return (
    <div>
      {/* Hero */}
      <div className={`bg-gradient-to-br ${article.coverBg}`}>
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <div className="text-5xl mb-5">{article.cover}</div>
          <div className="inline-block text-xs font-semibold uppercase tracking-widest text-white/70 bg-white/10 px-3 py-1 rounded-full mb-4">
            {article.category}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-snug mb-4">
            {article.title}
          </h1>
          <p className="text-white/80 text-[15px] leading-relaxed max-w-xl mx-auto mb-6">
            {article.subtitle}
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {article.author.split(" ").map((n) => n[0]).join("").replace("D", "").slice(0, 2)}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white">{article.author}</div>
              <div className="text-xs text-white/60">{article.date} · {article.readTime}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-[1fr_220px] gap-10">

          {/* Article body */}
          <article>
            {/* Key points */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 mb-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">Key points</p>
              <ul className="space-y-2.5">
                {article.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700 leading-relaxed">
                    <span className="text-sage-600 font-bold mt-0.5 flex-shrink-0">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Sections */}
            <div className="space-y-5">
              {article.sections.map((section, i) => (
                <div key={i}>
                  {section.heading && (
                    <h2 className="text-lg font-bold text-stone-900 mt-8 mb-3">{section.heading}</h2>
                  )}
                  <p className="text-[15px] text-stone-700 leading-relaxed">{section.body}</p>
                </div>
              ))}
            </div>

            {/* Author card */}
            <div className="mt-12 pt-8 border-t border-stone-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-sm font-bold text-stone-600 flex-shrink-0">
                  {article.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-stone-900">{article.author}</div>
                  <div className="text-xs text-stone-400 mb-2">{article.authorRole}</div>
                  <p className="text-xs text-stone-500 leading-relaxed">{article.authorBio}</p>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-6">
              {/* CTA */}
              <div className="bg-sage-800 text-white rounded-2xl p-5">
                <p className="text-sm font-semibold mb-2">Try MindEase free</p>
                <p className="text-xs text-sage-200 leading-relaxed mb-4">Put what you've read into practice with guided exercises, mood tracking, and therapist support.</p>
                <Link
                  href="/register"
                  className="block w-full text-center bg-white text-stone-900 text-xs font-semibold py-2.5 rounded-xl hover:bg-stone-100 transition-colors"
                >
                  Get started →
                </Link>
              </div>

              {/* Related */}
              {related.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">Related articles</p>
                  <div className="space-y-3">
                    {related.map((rel) => (
                      <Link
                        key={rel.slug}
                        href={`/blog/${rel.slug}`}
                        className="flex items-start gap-2.5 group"
                      >
                        <span className="text-base flex-shrink-0 mt-0.5">{rel.cover}</span>
                        <div>
                          <p className="text-xs font-medium text-stone-700 group-hover:text-sage-700 transition-colors leading-snug">{rel.title}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">{rel.readTime}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Mobile related */}
        {related.length > 0 && (
          <div className="md:hidden mt-10 pt-8 border-t border-stone-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">Related articles</p>
            <div className="space-y-3">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="flex items-center gap-3 bg-stone-50 rounded-xl p-3 hover:bg-stone-100 transition-colors"
                >
                  <span className="text-xl flex-shrink-0">{rel.cover}</span>
                  <div>
                    <p className="text-xs font-medium text-stone-800 leading-snug">{rel.title}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{rel.readTime}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to blog */}
        <div className="mt-12 pt-8 border-t border-stone-100">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            ← Back to all articles
          </Link>
        </div>
      </div>
    </div>
  );
}
