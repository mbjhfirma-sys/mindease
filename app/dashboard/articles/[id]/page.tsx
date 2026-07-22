"use client";

import Link from "next/link";
import { use, useEffect, useState, useCallback } from "react";
import ArticleBlocks from "@/components/dashboard/ArticleBlocks";
import { useAchievementCheck } from "@/components/dashboard/AchievementToast";
import type { ArticleBlock } from "@/lib/articles/types";

type Article = {
  id: string; title: string; category: string; summary: string;
  readTime: string; icon: string; color: string; tags: string[]; blocks: ArticleBlock[];
};

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const checkAchievements = useAchievementCheck();
  const { id } = use(params);

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/articles/${id}`).then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch(`/api/article-progress?articleId=${id}`).then((r) => (r.ok ? r.json() : { completedArticleIds: [] })),
    ])
      .then(([articleData, progressData]) => {
        setArticle(articleData.article);
        setCompleted((progressData.completedArticleIds ?? []).includes(id));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const markComplete = useCallback(async () => {
    if (completed || saving) return;
    setSaving(true);
    setCompleted(true);
    try {
      await fetch("/api/article-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: id, completed: true }),
      });
      checkAchievements();
    } finally {
      setSaving(false);
    }
  }, [id, completed, saving, checkAchievements]);

  if (loading) {
    return <div className="max-w-3xl mx-auto animate-pulse h-96 bg-white rounded-3xl border border-stone-100" />;
  }

  if (notFound || !article) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard/articles" className="inline-flex items-center gap-1.5 text-stone-500 text-sm mb-4 hover:text-sage-700 transition-colors">
          ← Back to Articles
        </Link>
        <div className="bg-white rounded-3xl border border-stone-100 p-12 text-center text-stone-400 text-sm">
          Article not found.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-16">
      <Link href="/dashboard/articles" className="inline-flex items-center gap-1.5 text-stone-500 text-sm hover:text-sage-700 transition-colors">
        ← Back to Articles
      </Link>

      {/* Header */}
      <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden">
        <div className={`${article.color} h-32 flex items-center justify-center text-6xl`}>{article.icon}</div>
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-sage-700 bg-sage-50 px-2.5 py-0.5 rounded-full">{article.category}</span>
            <span className="text-xs text-stone-400">⏱️ {article.readTime}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-900 leading-tight">{article.title}</h1>
          <p className="text-stone-500 text-sm mt-2 leading-relaxed">{article.summary}</p>
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {article.tags.map((t) => (
                <span key={t} className="text-[10px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">#{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="bg-white rounded-3xl border border-stone-100 p-5 md:p-8">
        <ArticleBlocks blocks={article.blocks} />
      </div>

      {/* Mark complete */}
      <div className="sticky bottom-4">
        {completed ? (
          <div className="w-full bg-sage-50 border border-sage-200 text-sage-700 font-semibold py-3.5 rounded-2xl text-center text-sm shadow-lg shadow-sage-900/5">
            ✓ Marked as read
          </div>
        ) : (
          <button
            onClick={markComplete}
            disabled={saving}
            className="w-full bg-sage-700 text-white font-semibold py-3.5 rounded-2xl hover:bg-sage-800 disabled:opacity-60 transition-colors text-sm shadow-lg shadow-sage-900/10"
          >
            Mark as Read
          </button>
        )}
      </div>
    </div>
  );
}
