"use client";

import Link from "next/link";
import { useState } from "react";

type Article = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  featured?: boolean;
  cover: string;
};

const categories = ["All", "Research", "Guides", "Product", "Community", "Clinical"];

const articles: Article[] = [
  {
    slug: "consistency-beats-intensity",
    category: "Research",
    title: "Why Consistency Beats Intensity in Mental Health Care",
    excerpt: "A single two-hour session can't compete with five minutes every day. New research explains why habit-based care outperforms intensive bursts — and what it means for how we design support.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    date: "Jun 18, 2026",
    readTime: "6 min",
    featured: true,
    cover: "🧠",
  },
  {
    slug: "mood-tracking-science",
    category: "Product",
    title: "The Science Behind Our Mood Tracking Algorithm",
    excerpt: "We rebuilt our mood model from scratch. Here's what we learned from two years of outcome data, 14 clinical advisors, and a lot of heated debates.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    date: "Jun 12, 2026",
    readTime: "8 min",
    cover: "📊",
  },
  {
    slug: "signs-you-might-benefit-from-therapy",
    category: "Guides",
    title: "5 Signs You Might Benefit From Online Therapy",
    excerpt: "Therapy isn't just for crisis. These five patterns — which often go unnoticed — are reliable signals that professional support could make a real difference.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "Jun 6, 2026",
    readTime: "5 min",
    cover: "💬",
  },
  {
    slug: "cbt-pocket",
    category: "Clinical",
    title: "CBT in Your Pocket: Evidence-Based Therapy for Everyone",
    excerpt: "Cognitive-behavioural therapy has the strongest evidence base of any psychological intervention. But access has always been a barrier. That's what we're changing.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    date: "May 28, 2026",
    readTime: "7 min",
    cover: "🔬",
  },
  {
    slug: "safe-online-communities",
    category: "Community",
    title: "Building Safe Online Communities for Mental Health",
    excerpt: "The internet can be a harmful place for vulnerable people. We spent 18 months designing our community spaces with clinical input to change that. Here's what we built.",
    author: "Nina Okafor",
    authorRole: "Head of Community",
    date: "May 20, 2026",
    readTime: "9 min",
    cover: "🤝",
  },
  {
    slug: "sleep-anxiety-cycle",
    category: "Guides",
    title: "Sleep and Anxiety: Breaking the Cycle",
    excerpt: "Poor sleep worsens anxiety. Anxiety worsens sleep. This evidence-based guide explains the loop and gives you four techniques to interrupt it tonight.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "May 14, 2026",
    readTime: "6 min",
    cover: "🌙",
  },
  {
    slug: "therapist-burnout",
    category: "Clinical",
    title: "Therapist Burnout Is a Patient Safety Issue",
    excerpt: "When therapists burn out, patients suffer. Our new tools for therapists are designed around one insight: clinicians need support too.",
    author: "Marcus Webb",
    authorRole: "CTO & Co-Founder",
    date: "May 5, 2026",
    readTime: "5 min",
    cover: "🏥",
  },
  {
    slug: "peer-support-evidence",
    category: "Research",
    title: "What the Research Says About Peer Support",
    excerpt: "Peer support has been dismissed as soft or unscientific. A growing body of RCTs says otherwise. We review the evidence and explain how YouMindo's community is built on it.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    date: "Apr 29, 2026",
    readTime: "10 min",
    cover: "📖",
  },
  {
    slug: "ai-in-mental-health",
    category: "Product",
    title: "How We're Using AI Responsibly in Mental Health Care",
    excerpt: "AI in mental health is genuinely exciting and genuinely risky. Here's exactly what we do — and don't do — and why we've drawn those lines where we have.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "Apr 21, 2026",
    readTime: "7 min",
    cover: "🤖",
  },
  {
    slug: "attachment-styles-explained",
    category: "Research",
    title: "Attachment Styles: What Childhood Bonds Teach Us About Adult Relationships",
    excerpt: "The way you were held as an infant leaves a template for how you love as an adult — a well-documented, often misunderstood psychological pattern. Here's what decades of attachment research say about anxious, avoidant, and secure styles, and whether they can actually change.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    date: "Apr 14, 2026",
    readTime: "5 min",
    cover: "🔗",
  },
  {
    slug: "managing-panic-attacks",
    category: "Guides",
    title: "A Practical Guide to Managing Panic Attacks in the Moment",
    excerpt: "Panic attacks feel like a medical emergency, but they are not dangerous — they are a false alarm your body is convinced is real. Here is exactly what to do in the first few minutes, not just the calming advice that only works once you're already calm.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "Apr 7, 2026",
    readTime: "6 min",
    cover: "🫁",
  },
  {
    slug: "designing-for-crisis-safety",
    category: "Product",
    title: "How We Designed YouMindo's Crisis Safety Features",
    excerpt: "Crisis features are the one part of the product where a design mistake isn't a bad review — it's a person not getting help in time. Here's how we built YouMindo's safety plan and risk-detection system, and why we chose boring, explainable technology over anything clever.",
    author: "Marcus Webb",
    authorRole: "CTO & Co-Founder",
    date: "Mar 31, 2026",
    readTime: "6 min",
    cover: "🛟",
  },
  {
    slug: "power-of-shared-experience",
    category: "Community",
    title: "The Power of Being Matched With Someone Who Gets It",
    excerpt: "There's a particular relief in saying something out loud and having someone respond, 'yes, that, exactly that,' instead of having to explain yourself from scratch. Here's what we've learned about designing for that moment on purpose.",
    author: "Nina Okafor",
    authorRole: "Head of Community",
    date: "Mar 24, 2026",
    readTime: "7 min",
    cover: "🫂",
  },
  {
    slug: "understanding-generalized-anxiety",
    category: "Clinical",
    title: "Understanding Generalized Anxiety Disorder",
    excerpt: "Generalized anxiety disorder isn't just being a worrier — it's a diagnosable pattern of excessive, hard-to-control worry that shows up in the body as much as the mind. Here's how it's actually defined, why it's so often missed, and what treatment really involves.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    date: "Mar 17, 2026",
    readTime: "7 min",
    cover: "😟",
  },
  {
    slug: "exercise-as-antidepressant",
    category: "Research",
    title: "Exercise as an Antidepressant: What the Evidence Actually Shows",
    excerpt: "If exercise were a pill, it would be one of the most prescribed medications for depression in the world, with effect sizes that rival standard treatments in large trials. Here's what the evidence actually shows, and how little movement it actually takes to matter.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    date: "Mar 10, 2026",
    readTime: "8 min",
    cover: "🏃",
  },
  {
    slug: "setting-boundaries-guide",
    category: "Guides",
    title: "How to Set Boundaries Without the Guilt",
    excerpt: "Boundaries rarely fail because people don't know what they need — they fail because the guilt that follows saying no feels unbearable. This guide covers the specific mental shifts and scripts that make a boundary stick without the aftermath eating you alive.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "Mar 3, 2026",
    readTime: "8 min",
    cover: "🚧",
  },
  {
    slug: "building-the-journal-feature",
    category: "Product",
    title: "Behind the Scenes: Building a Journal That Notices Patterns",
    excerpt: "A journal is the most private thing in the app, and also the hardest to make useful without becoming invasive. Here's how we built mood, sleep, and trigger tagging into YouMindo's journal — and the sentiment-analysis version we built and then quietly deleted.",
    author: "Marcus Webb",
    authorRole: "CTO & Co-Founder",
    date: "Feb 24, 2026",
    readTime: "9 min",
    cover: "📓",
  },
  {
    slug: "moderation-behind-the-scenes",
    category: "Community",
    title: "A Day in the Life of Community Moderation",
    excerpt: "People imagine moderation as deleting bad comments. Mostly it's something quieter and harder: reading closely, noticing what isn't being said, and knowing exactly when a post needs more than a moderator can give.",
    author: "Nina Okafor",
    authorRole: "Head of Community",
    date: "Feb 17, 2026",
    readTime: "6 min",
    cover: "🛡️",
  },
  {
    slug: "depression-treatment-options",
    category: "Clinical",
    title: "Depression Treatment Options: An Evidence-Based Overview",
    excerpt: "Depression treatment is not one-size-fits-all, and the options are broader — and better studied — than most people realize. This is a clear-eyed look at what the evidence actually supports, from talk therapy to medication to the combinations that tend to work best.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    date: "Feb 10, 2026",
    readTime: "7 min",
    cover: "🩺",
  },
  {
    slug: "gut-brain-connection",
    category: "Research",
    title: "The Gut-Brain Connection: How Your Microbiome Shapes Your Mood",
    excerpt: "The gut and brain were long treated as separate systems that occasionally exchanged messages. New research on the gut-brain axis suggests they're closer to a single, constantly communicating system — with real, if still-developing, implications for how we understand mood.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    date: "Feb 3, 2026",
    readTime: "5 min",
    cover: "🦠",
  },
  {
    slug: "coping-with-grief",
    category: "Guides",
    title: "Coping With Grief: There Is No Right Way to Do This",
    excerpt: "Grief doesn't move in neat stages, and it rarely resolves on any kind of schedule. This guide isn't about getting over your loss — it's about finding ways to carry it that don't require you to pretend you're fine.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    date: "Jan 27, 2026",
    readTime: "6 min",
    cover: "🕯️",
  },
  {
    slug: "why-we-built-therapist-matching",
    category: "Product",
    title: "Why We Built Self-Service Therapist Matching",
    excerpt: "Browsing a directory of forty therapist bios and guessing is not how anyone should have to start therapy. We built a short intake quiz and a scoring system instead — and had to fight our own instinct to make it feel more like a dating app.",
    author: "Marcus Webb",
    authorRole: "CTO & Co-Founder",
    date: "Jan 20, 2026",
    readTime: "6 min",
    cover: "🧩",
  },
  {
    slug: "supporting-a-loved-one",
    category: "Community",
    title: "How to Support Someone You Love Through a Hard Time",
    excerpt: "Most of us freeze the first time someone we love says they're struggling, terrified of saying the wrong thing. Here's what actually helps, according to people who've been on both sides of that conversation.",
    author: "Nina Okafor",
    authorRole: "Head of Community",
    date: "Jan 13, 2026",
    readTime: "7 min",
    cover: "🤲",
  },
  {
    slug: "medication-and-therapy-together",
    category: "Clinical",
    title: "Medication and Therapy Together: How Combined Treatment Works",
    excerpt: "Medication and therapy are often framed as competing choices, but for many mental health conditions the evidence points the other way — together, they tend to outperform either alone. Here's the mechanism behind why, and how to think about whether combined care is right for you.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    date: "Jan 6, 2026",
    readTime: "7 min",
    cover: "⚕️",
  },
  {
    slug: "loneliness-epidemic-data",
    category: "Research",
    title: "The Loneliness Epidemic: Reading the Data on an Invisible Health Risk",
    excerpt: "Loneliness doesn't show up on a scan, but population data treats it as a genuine health risk — one linked to measurably higher rates of heart disease and stroke. Here's what the numbers actually show, including who's lonelier than ever and why.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    date: "Dec 30, 2025",
    readTime: "8 min",
    cover: "🏙️",
  },
  {
    slug: "imposter-syndrome-guide",
    category: "Guides",
    title: "Imposter Syndrome: Why Competent People Feel Like Frauds",
    excerpt: "The more competent people often feel like the biggest frauds — a paradox with a real psychological explanation behind it. Here's why imposter syndrome tends to hit high performers hardest, and what actually loosens its grip.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "Dec 23, 2025",
    readTime: "8 min",
    cover: "🎭",
  },
  {
    slug: "notification-design-philosophy",
    category: "Product",
    title: "Our Notification Design Philosophy: Invitations, Not Nags",
    excerpt: "Every growth playbook says to notify people more, and every one of our clinical advisors said the opposite. Here's how we built YouMindo's reminder system to increase real engagement without turning check-ins into one more source of guilt.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    date: "Dec 16, 2025",
    readTime: "9 min",
    cover: "🔔",
  },
  {
    slug: "men-and-mental-health-stigma",
    category: "Community",
    title: "Why Men Wait Too Long to Ask for Help",
    excerpt: "Ask most men why they didn't get help sooner and you rarely hear 'I didn't think it mattered.' You hear something closer to 'I didn't think I was allowed to.' Here's where that belief comes from, and what loosens it.",
    author: "Nina Okafor",
    authorRole: "Head of Community",
    date: "Dec 9, 2025",
    readTime: "6 min",
    cover: "🚹",
  },
  {
    slug: "dbt-explained",
    category: "Clinical",
    title: "DBT Explained: Skills for When Emotions Feel Too Big",
    excerpt: "Dialectical behavior therapy was built for people whose emotions arrive faster and more intensely than most treatments account for. It's grown far beyond its original use — here's what it actually teaches and who tends to benefit most.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "Dec 2, 2025",
    readTime: "7 min",
    cover: "⚖️",
  },
  {
    slug: "digital-detox-evidence",
    category: "Research",
    title: "Does a Digital Detox Actually Help? What the Research Says",
    excerpt: "Digital detox has become a wellness ritual, but does stepping away from your phone actually change how you feel? Randomized trials give a real, if more modest and more specific, answer than either detox evangelists or skeptics usually admit.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    date: "Nov 25, 2025",
    readTime: "5 min",
    cover: "📵",
  },
  {
    slug: "burnout-recovery-guide",
    category: "Guides",
    title: "Recovering From Burnout: A Realistic, Non-Toxic Guide",
    excerpt: "Burnout doesn't get fixed by a weekend off or a bubble bath — it's usually a slow slide that needs a slower climb back out. Here's a realistic recovery guide that doesn't pile more pressure onto a system that's already running on empty.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "Nov 18, 2025",
    readTime: "6 min",
    cover: "🔋",
  },
  {
    slug: "accessibility-in-mental-health-apps",
    category: "Product",
    title: "Accessibility Isn't Optional in a Mental Health App",
    excerpt: "WCAG compliance tells you almost nothing about whether someone in a panic attack can navigate to your crisis resources page. We rebuilt YouMindo's accessibility approach around cognitive load, not just contrast ratios — after a screen-reader testing session embarrassed us into fixing things an automated audit had passed.",
    author: "Marcus Webb",
    authorRole: "CTO & Co-Founder",
    date: "Nov 11, 2025",
    readTime: "6 min",
    cover: "♿",
  },
  {
    slug: "lgbtq-affirming-care",
    category: "Community",
    title: "What Affirming Mental Health Care Actually Looks Like",
    excerpt: "A lot of platforms say they're LGBTQ+ affirming. Fewer can say exactly what that means in an intake form, a session, or a clinician's training. Here's what we mean, in specifics rather than slogans.",
    author: "Nina Okafor",
    authorRole: "Head of Community",
    date: "Nov 4, 2025",
    readTime: "7 min",
    cover: "🏳️‍🌈",
  },
  {
    slug: "emdr-for-trauma",
    category: "Clinical",
    title: "EMDR for Trauma: How It Works and What the Evidence Shows",
    excerpt: "EMDR asks people to recall difficult memories while following a set of guided eye movements — a combination that sounds unlikely and has, nonetheless, accumulated a substantial evidence base for trauma treatment. Here's what's actually happening, and what the research does and doesn't support.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    date: "Oct 28, 2025",
    readTime: "7 min",
    cover: "👁️",
  },
  {
    slug: "placebo-effect-therapy",
    category: "Research",
    title: "What the Placebo Effect Teaches Us About Healing",
    excerpt: "The placebo effect is usually dismissed as noise researchers have to control for. It's actually a real, measurable, and genuinely useful phenomenon — and understanding how it works reveals something important about what makes any kind of care, including therapy, effective.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    date: "Oct 21, 2025",
    readTime: "8 min",
    cover: "💊",
  },
  {
    slug: "social-anxiety-strategies",
    category: "Guides",
    title: "Social Anxiety: Five Strategies That Actually Help",
    excerpt: "Most social anxiety advice boils down to 'just be more confident,' which is useless to anyone actually living with it. These five strategies are the ones with real evidence behind them, and none of them require becoming a different person.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "Oct 14, 2025",
    readTime: "8 min",
    cover: "🎤",
  },
  {
    slug: "privacy-by-design",
    category: "Product",
    title: "Privacy by Design: How We Think About Your Data",
    excerpt: "Mental health data is some of the most sensitive information a person can generate, and most products treat privacy as a policy document nobody reads. We built data export and deletion as real, working features from day one, and said no to a few integrations along the way because of what they'd require us to share.",
    author: "Marcus Webb",
    authorRole: "CTO & Co-Founder",
    date: "Oct 7, 2025",
    readTime: "9 min",
    cover: "🔒",
  },
  {
    slug: "workplace-mental-health-culture",
    category: "Community",
    title: "Building a Workplace Culture That Doesn't Burn People Out",
    excerpt: "Most workplace wellness programs treat the symptom and leave the cause completely untouched. We've talked to enough burned-out employees and thoughtful employers to know the difference between a real culture shift and a webinar.",
    author: "Nina Okafor",
    authorRole: "Head of Community",
    date: "Sep 30, 2025",
    readTime: "6 min",
    cover: "💼",
  },
  {
    slug: "understanding-ptsd",
    category: "Clinical",
    title: "Understanding PTSD: Beyond the Combat Veteran Stereotype",
    excerpt: "PTSD is still widely pictured as a condition that only affects combat veterans, but the clinical reality is far broader — and far more common — than that stereotype suggests. Here's what actually defines PTSD, who it affects, and why most trauma survivors never develop it.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    date: "Sep 23, 2025",
    readTime: "7 min",
    cover: "🎗️",
  },
  {
    slug: "trauma-informed-care-research",
    category: "Research",
    title: "The Evidence Base Behind Trauma-Informed Care",
    excerpt: "Trauma-informed care replaces the question what's wrong with you with what happened to you — a shift that sounds philosophical but is backed by a specific evidence base, starting with a landmark study linking childhood adversity to adult health decades later.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    date: "Sep 16, 2025",
    readTime: "5 min",
    cover: "🕊️",
  },
  {
    slug: "building-emotional-resilience",
    category: "Guides",
    title: "Building Emotional Resilience Without Bottling Things Up",
    excerpt: "Resilience is often confused with toughing it out, but the evidence points the other way — the most resilient people feel their emotions fully, they just don't get stuck in them. Here's what that actually looks like in daily practice.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "Sep 9, 2025",
    readTime: "6 min",
    cover: "🌱",
  },
  {
    slug: "gamification-done-right",
    category: "Product",
    title: "Gamification Done Right: Missions, Achievements, and Avoiding the Traps",
    excerpt: "Gamification has a bad reputation in mental health circles, and mostly for good reason — points and streaks can turn self-care into another performance to keep up. Here's how we built missions and achievements at YouMindo, and the leaderboard we built, tested, and killed.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    date: "Sep 2, 2025",
    readTime: "6 min",
    cover: "🏆",
  },
  {
    slug: "parenting-and-burnout",
    category: "Community",
    title: "Parental Burnout Is Real, and It Isn't a Failure of Love",
    excerpt: "You can love your children completely and still be burned out by the relentlessness of caring for them. Those two things aren't in conflict, and the sooner we stop treating them as if they are, the sooner parents get real help.",
    author: "Nina Okafor",
    authorRole: "Head of Community",
    date: "Aug 26, 2025",
    readTime: "7 min",
    cover: "👨‍👧",
  },
  {
    slug: "eating-disorders-early-signs",
    category: "Clinical",
    title: "Eating Disorders: Early Signs That Are Easy to Miss",
    excerpt: "Eating disorders rarely announce themselves clearly at the start — they tend to build quietly through small shifts in mood, routine, and how someone talks about food and their body. Knowing the early, easy-to-miss signs can make the difference in getting help sooner rather than later.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "Aug 19, 2025",
    readTime: "7 min",
    cover: "🍽️",
  },
  {
    slug: "gratitude-practice-science",
    category: "Research",
    title: "The Science of Gratitude: What Happens When You Write Three Things Down",
    excerpt: "Write down three things you're grateful for is one of the simplest interventions in psychology — simple enough to sound like a platitude. It's also one of the more consistently replicated findings in the positive psychology literature, with effects that show up in brain scans months later.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    date: "Aug 12, 2025",
    readTime: "8 min",
    cover: "🙏",
  },
  {
    slug: "navigating-a-breakup",
    category: "Guides",
    title: "Navigating a Breakup: A Guide to Getting Through It",
    excerpt: "Heartbreak activates some of the same neural pathways as physical pain, which is part of why it can feel wildly disproportionate to what 'just' ended. This guide covers what tends to help in the weeks and months after, without a fixed timeline for feeling better.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "Aug 5, 2025",
    readTime: "8 min",
    cover: "💔",
  },
  {
    slug: "building-video-therapy",
    category: "Product",
    title: "Building Real-Time Video Therapy Without a Real-Time Team",
    excerpt: "We needed real-time video calling for therapy sessions, and we didn't have a team of real-time systems engineers to build it. Here's how we shipped peer-to-peer WebRTC video with no TURN server, why some calls still can't connect directly, and why we chose to be honest about that.",
    author: "Marcus Webb",
    authorRole: "CTO & Co-Founder",
    date: "Jul 29, 2025",
    readTime: "9 min",
    cover: "🎥",
  },
  {
    slug: "student-mental-health-crisis",
    category: "Community",
    title: "The Student Mental Health Crisis, and What Actually Helps",
    excerpt: "Campus counseling waitlists have become a punchline, but for the student on the other end of one, it isn't funny at all. Here's what the data shows about why this got so bad, and what actually helps in the gap.",
    author: "Nina Okafor",
    authorRole: "Head of Community",
    date: "Jul 22, 2025",
    readTime: "6 min",
    cover: "🎓",
  },
  {
    slug: "adhd-in-adults",
    category: "Clinical",
    title: "ADHD in Adults: Why So Many Diagnoses Come Late",
    excerpt: "A growing number of adults are diagnosed with ADHD for the first time in their 30s and 40s, often after years of unexplained struggle with organization and follow-through. Here's why it's so frequently missed in childhood, and what adult evaluation actually looks like.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    date: "Jul 15, 2025",
    readTime: "7 min",
    cover: "⚡",
  },
  {
    slug: "nature-exposure-mental-health",
    category: "Research",
    title: "Green Space, Better Mind: The Research on Nature and Mental Health",
    excerpt: "A walk through a park changes your brain differently than a walk down a busy street, and researchers can now show exactly how. Here's what the evidence says about how much nature exposure actually helps, how fast it works, and why grand wilderness isn't required.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    date: "Jul 8, 2025",
    readTime: "5 min",
    cover: "🌳",
  },
  {
    slug: "perfectionism-and-mental-health",
    category: "Guides",
    title: "When Perfectionism Becomes a Mental Health Problem",
    excerpt: "Perfectionism is often worn as a badge of honour at work, but the clinical picture is less flattering — it's strongly linked to anxiety, depression, and burnout. Here's how to tell the difference between healthy striving and the kind that's quietly costing you.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    date: "Jul 1, 2025",
    readTime: "6 min",
    cover: "✔️",
  },
  {
    slug: "course-recommendations-engine",
    category: "Product",
    title: "How Our Course Recommendation Engine Actually Works",
    excerpt: "A recommendation engine optimized purely for engagement will happily keep recommending you the easiest, most-clicked course forever. We built YouMindo's course recommendations to start from assessment results instead of click behavior, and had to actively resist the urge to let popularity creep back in.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    date: "Jun 24, 2025",
    readTime: "6 min",
    cover: "🎯",
  },
  {
    slug: "celebrating-small-wins",
    category: "Community",
    title: "Why Our Community Celebrates the Small Wins on Purpose",
    excerpt: "We built our community to make as much noise about 'I showered today' as it does about 'I got the job.' It isn't lower standards — it's an understanding of how change actually happens, one small win at a time.",
    author: "Nina Okafor",
    authorRole: "Head of Community",
    date: "Jun 17, 2025",
    readTime: "7 min",
    cover: "🎉",
  },
  {
    slug: "postpartum-mental-health",
    category: "Clinical",
    title: "Postpartum Mental Health: More Than the Baby Blues",
    excerpt: "The baby blues are common, brief, and mostly harmless — but postpartum depression and anxiety are distinct, more serious conditions that get mistaken for that same passing phase far too often. Here's how to tell the difference and what real treatment looks like.",
    author: "Dr. Priya Patel",
    authorRole: "Chief Clinical Officer",
    date: "Jun 10, 2025",
    readTime: "7 min",
    cover: "🤱",
  },
  {
    slug: "long-term-therapy-outcomes",
    category: "Research",
    title: "Does Therapy Actually Last? What Longitudinal Studies Show",
    excerpt: "Most therapy research measures outcomes right after treatment ends, leaving an important question unanswered: does it actually last? Longitudinal studies that track people for years, not weeks, give a clearer and more encouraging answer than the short-term data alone can offer.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    date: "Jun 3, 2025",
    readTime: "8 min",
    cover: "📈",
  },
  {
    slug: "self-compassion-practice",
    category: "Guides",
    title: "Self-Compassion Is a Skill, Not a Personality Trait",
    excerpt: "Most people assume self-compassion is something you either have or don't — a soft, slightly indulgent personality trait. It's actually a trainable skill with a specific structure, and building it changes how resilient you are under stress.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "May 27, 2025",
    readTime: "8 min",
    cover: "💗",
  },
  {
    slug: "measuring-what-matters",
    category: "Product",
    title: "Measuring What Matters: Our Approach to Outcome Metrics",
    excerpt: "Daily active users and session length are the metrics most products chase, and neither one tells you if anyone got better. Here's how we built YouMindo's outcomes dashboard around validated clinical measures instead, and what happened the first time engagement and outcomes pointed in opposite directions.",
    author: "Tom Walsh",
    authorRole: "Head of Research",
    date: "May 20, 2025",
    readTime: "9 min",
    cover: "📐",
  },
  {
    slug: "peer-moderator-spotlight",
    category: "Community",
    title: "What It's Actually Like to Be a Peer Moderator",
    excerpt: "Being a peer moderator means showing up for strangers on their hardest days, using your own hardest days as part of why you're qualified to do it. We asked three of ours what the job actually involves — and what it gives back.",
    author: "Nina Okafor",
    authorRole: "Head of Community",
    date: "May 13, 2025",
    readTime: "6 min",
    cover: "🌟",
  },
  {
    slug: "when-to-seek-emergency-help",
    category: "Clinical",
    title: "When to Seek Emergency Help: A Clear, Calm Guide",
    excerpt: "Knowing the difference between a hard day and a genuine emergency can be hard to think clearly about in the moment — which is exactly why it helps to know the signs and the steps in advance. This is a calm, practical guide to both.",
    author: "Dr. Sarah Chen",
    authorRole: "CEO & Co-Founder",
    date: "May 6, 2025",
    readTime: "7 min",
    cover: "🚨",
  },

];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const featured = articles.find((a) => a.featured)!;
  const filtered = articles
    .filter((a) => !a.featured)
    .filter((a) => activeCategory === "All" || a.category === activeCategory);

  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-4">YouMindo Blog</div>
          <h1 className="text-4xl font-bold text-stone-900 mb-4">
            Insights on mental health, science, and care
          </h1>
          <p className="text-stone-500 text-[15px] max-w-xl mx-auto">
            Written by clinicians, researchers, and the team building YouMindo. No fluff — just things worth reading.
          </p>
        </div>
      </section>

      {/* Featured article */}
      <section className="bg-sage-800 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-xs text-sage-300 uppercase tracking-widest font-medium mb-6">Featured</div>
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-shrink-0 w-24 h-24 bg-sage-700 rounded-2xl flex items-center justify-center text-5xl">
              {featured.cover}
            </div>
            <div className="flex-1">
              <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">{featured.category}</span>
              <h2 className="text-2xl font-bold text-white mt-2 mb-3 leading-snug">{featured.title}</h2>
              <p className="text-sage-200 text-sm leading-relaxed mb-5">{featured.excerpt}</p>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-sage-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {featured.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">{featured.author}</div>
                    <div className="text-[10px] text-sage-400">{featured.date} · {featured.readTime} read</div>
                  </div>
                </div>
                <Link
                  href={`/blog/${featured.slug}`}
                  className="ml-auto text-sm font-semibold text-white border border-sage-500 hover:border-white px-5 py-2 rounded-full transition-colors"
                >
                  Read article →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category filter */}
      <section className="bg-white border-b border-stone-100 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-none py-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 text-xs font-medium px-4 py-1.5 rounded-full transition-all ${
                  activeCategory === cat
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Article grid */}
      <section className="bg-stone-50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-sm">No articles in this category yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((article) => (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="group bg-white border border-stone-100 rounded-2xl overflow-hidden hover:border-stone-300 hover:shadow-sm transition-all"
                >
                  <div className="h-28 bg-stone-50 flex items-center justify-center text-4xl border-b border-stone-100">
                    {article.cover}
                  </div>
                  <div className="p-5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-sage-700">{article.category}</span>
                    <h3 className="text-sm font-semibold text-stone-900 mt-1.5 mb-2 leading-snug group-hover:text-sage-700 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed line-clamp-3">{article.excerpt}</p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-stone-100 rounded-full flex items-center justify-center text-[9px] font-bold text-stone-600">
                          {article.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="text-[10px] text-stone-400">{article.author.replace("Dr. ", "")}</span>
                      </div>
                      <span className="text-[10px] text-stone-400">{article.readTime} read</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-white border-t border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-xl font-bold text-stone-900 mb-3">Get new articles in your inbox</h2>
          <p className="text-stone-500 text-sm mb-6">Weekly, no spam. Unsubscribe any time.</p>
          <form className="flex gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 border border-stone-200 text-sm px-4 py-2.5 rounded-full focus:outline-none focus:border-sage-400"
            />
            <button
              type="submit"
              className="bg-sage-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-sage-800 transition-colors flex-shrink-0"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
