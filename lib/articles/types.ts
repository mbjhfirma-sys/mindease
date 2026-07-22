import type { ExerciseType } from "@/components/dashboard/ExerciseLesson";

export type QuizQuestion = { q: string; options: string[]; correct: number; explanation: string };

export type ArticleBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "callout"; style: "tip" | "fact" | "quote" | "warning"; text: string; label?: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "stats"; items: { value: string; label: string }[] }
  | { type: "checklist"; prompt: string; items: string[] }
  | { type: "reflection"; prompt: string }
  | { type: "quiz"; questions: QuizQuestion[] }
  | { type: "exercise"; exerciseType: ExerciseType; title?: string };

export type ArticleSeed = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  readTime: string;
  icon: string;
  color: string;
  tags: string[];
  order: number;
  blocks: ArticleBlock[];
};
