"use client";

import { useCallback, useEffect, useState } from "react";
import { dailyMissions, type Mission } from "./mockData";

// Key rotates daily so tasks reset each morning
const storageKey = () => `mindease-tasks-${new Date().toISOString().split("T")[0]}`;

function loadTasks(): Mission[] {
  if (typeof window === "undefined") return dailyMissions.map((m) => ({ ...m, completed: false }));
  try {
    const stored = localStorage.getItem(storageKey());
    if (stored) return JSON.parse(stored) as Mission[];
  } catch {}
  // First load today — all tasks start as not done
  return dailyMissions.map((m) => ({ ...m, completed: false }));
}

export function useTasks() {
  const [tasks, setTasks] = useState<Mission[]>(() =>
    dailyMissions.map((m) => ({ ...m, completed: false }))
  );

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  // Persist whenever tasks change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  const complete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: true } : m))
    );
  }, []);

  const uncomplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: false } : m))
    );
  }, []);

  const completedCount = tasks.filter((m) => m.completed).length;

  return { tasks, complete, uncomplete, completedCount, total: tasks.length };
}
