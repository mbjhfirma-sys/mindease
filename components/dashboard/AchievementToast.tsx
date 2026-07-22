"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Trophy, X } from "lucide-react";
import { BADGE_DEFINITIONS, type BadgeDef } from "@/lib/achievements";

type CheckFn = () => Promise<void>;
const AchievementCheckContext = createContext<CheckFn>(async () => {});

export function useAchievementCheck() {
  return useContext(AchievementCheckContext);
}

function ToastCard({ badge, index, onDismiss }: { badge: BadgeDef; index: number; onDismiss: () => void }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setShown(true), 20);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 bg-white border border-sage-200 shadow-xl rounded-2xl px-4 py-3.5 w-80 transition-all duration-300 ${
        shown ? "translate-x-0" : "translate-x-8 opacity-0"
      }`}
      style={shown ? { opacity: Math.max(1 - index * 0.15, 0.4) } : undefined}
    >
      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
        <Trophy size={17} className="text-amber-500" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-sage-700 uppercase tracking-wide">Milestone unlocked!</p>
        <p className="text-sm font-medium text-stone-900 mt-0.5">{badge.label}</p>
        <p className="text-xs text-stone-400 mt-0.5">{badge.desc}</p>
        <Link href="/dashboard/achievements" onClick={onDismiss} className="text-xs font-medium text-sage-700 hover:text-sage-900 mt-1.5 inline-block transition-colors">
          View milestones →
        </Link>
      </div>
      <button onClick={onDismiss} className="text-stone-300 hover:text-stone-600 transition-colors flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

export default function AchievementToastProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<BadgeDef[]>([]);
  const checkedOnce = useRef(false);

  const check = useCallback(async () => {
    try {
      const r = await fetch("/api/achievements");
      if (!r.ok) return;
      const d = await r.json();
      const newly: { badgeId: string }[] = d.newlyEarned ?? [];
      if (newly.length === 0) return;
      const defs = newly
        .map((n) => BADGE_DEFINITIONS.find((b) => b.badgeId === n.badgeId))
        .filter((b): b is BadgeDef => !!b);
      setQueue((prev) => [...prev, ...defs]);
    } catch {
      // silent — celebration is best-effort, never block the underlying action
    }
  }, []);

  useEffect(() => {
    if (checkedOnce.current) return;
    checkedOnce.current = true;
    check();
  }, [check]);

  function dismiss(badgeId: string) {
    setQueue((prev) => prev.filter((b) => b.badgeId !== badgeId));
  }

  useEffect(() => {
    if (queue.length === 0) return;
    const id = setTimeout(() => dismiss(queue[0].badgeId), 6000);
    return () => clearTimeout(id);
  }, [queue]);

  return (
    <AchievementCheckContext.Provider value={check}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {queue.slice(0, 3).map((badge, i) => (
          <ToastCard key={badge.badgeId} badge={badge} index={i} onDismiss={() => dismiss(badge.badgeId)} />
        ))}
      </div>
    </AchievementCheckContext.Provider>
  );
}
