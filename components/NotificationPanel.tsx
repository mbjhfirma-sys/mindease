"use client";

import { useEffect, useRef, useState } from "react";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  icon?: string | null;
  read: boolean;
  createdAt: string;
};

type Props = {
  role: "client" | "therapist" | "admin";
};

export default function NotificationPanel({ role: _role }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setItems(d.notifications ?? []));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
  }

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  }

  const isTherapist = _role === "therapist" || _role === "admin";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-xl transition-colors ${
          isTherapist
            ? "text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
            : "text-stone-400 hover:text-stone-600 hover:bg-stone-100"
        }`}
        aria-label="Notifications"
      >
        {isTherapist ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5-2 4.5-2 4.5h13s-2-1-2-4.5c0-2.5-2-4.5-4.5-4.5zM6.5 13a1.5 1.5 0 003 0"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <span className="text-xl leading-none">🔔</span>
        )}
        {unread > 0 && (
          <span
            className={`absolute top-1.5 right-1.5 flex items-center justify-center rounded-full text-white font-bold ${
              isTherapist
                ? "w-1.5 h-1.5 bg-stone-900"
                : unread > 9
                ? "min-w-[14px] h-[14px] px-0.5 text-[9px] bg-red-500 -top-0.5 -right-0.5"
                : "w-4 h-4 text-[9px] bg-red-500 -top-0.5 -right-0.5"
            }`}
          >
            {isTherapist ? null : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <span className="font-semibold text-stone-800 text-sm">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-sage-700 hover:text-sage-900 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto divide-y divide-stone-50">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-stone-400 text-sm">No notifications</li>
            ) : (
              items.map((n) => (
                <li
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-stone-50 ${
                    !n.read ? "bg-sage-50" : ""
                  }`}
                >
                  <span className="text-lg mt-0.5 shrink-0">{n.icon ?? "🔔"}</span>
                  <div className="min-w-0">
                    <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-stone-800" : "font-medium text-stone-600"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5 leading-snug">{n.body}</p>
                    <p className="text-[11px] text-stone-300 mt-1">
                      {new Date(n.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-sage-500" />
                  )}
                </li>
              ))
            )}
          </ul>

          <div className="border-t border-stone-100 px-4 py-2.5 text-center">
            <button className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
