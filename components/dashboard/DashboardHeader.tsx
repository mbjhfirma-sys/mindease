"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import NotificationPanel from "@/components/NotificationPanel";
import {
  LayoutDashboard, BookOpen, CheckSquare, PenLine,
  MessageCircle, Calendar, Search, Bot,
  BarChart2, Users, ClipboardList, Settings, LogOut, Flame,
} from "lucide-react";

const navSections = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", Icon: LayoutDashboard, label: "Dashboard", exact: true },
      { href: "/dashboard/courses", Icon: BookOpen, label: "My Courses" },
      { href: "/dashboard/missions", Icon: CheckSquare, label: "Daily Tasks", badge: 4 },
      { href: "/dashboard/journal", Icon: PenLine, label: "Journal" },
    ],
  },
  {
    label: "Care",
    items: [
      { href: "/dashboard/messages", Icon: MessageCircle, label: "Messages", badge: 2 },
      { href: "/dashboard/schedule", Icon: Calendar, label: "Schedule" },
      { href: "/dashboard/find", Icon: Search, label: "Find a Therapist" },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/dashboard/ai-chat", Icon: Bot, label: "AI Support" },
      { href: "/dashboard/achievements", Icon: BarChart2, label: "Progress" },
      { href: "/dashboard/community", Icon: Users, label: "Community" },
      { href: "/dashboard/assessment", Icon: ClipboardList, label: "Assessments" },
    ],
  },
];

export default function DashboardHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <header className="flex-shrink-0 bg-white border-b border-stone-200 h-14 flex items-center justify-between px-4 md:px-6 gap-3">
        {/* Mobile: logo + burger */}
        <div className="flex items-center gap-2 md:hidden">
          <span className="w-7 h-7 bg-sage-700 rounded-lg flex items-center justify-center text-white text-xs">🌿</span>
          <span className="font-semibold text-sage-800 text-sm">MindEase</span>
        </div>

        {/* Desktop: search */}
        <div className="relative flex-1 max-w-xs hidden sm:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            placeholder="Search courses..."
            className="w-full bg-stone-100 text-sm text-stone-600 placeholder-stone-400 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-sage-300"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <NotificationPanel role="client" />
          <div className="w-8 h-8 bg-sage-200 rounded-full flex items-center justify-center text-sm cursor-pointer hover:ring-2 hover:ring-sage-400 transition-all">
            👤
          </div>
          {/* Burger button — mobile only */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-stone-100 transition-colors ml-1"
          >
            <span className="w-5 h-0.5 bg-stone-700 rounded-full" />
            <span className="w-5 h-0.5 bg-stone-700 rounded-full" />
            <span className="w-3.5 h-0.5 bg-stone-700 rounded-full self-start ml-[5px]" />
          </button>
        </div>
      </header>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:hidden ${open ? "translate-x-0" : "translate-x-full"}`}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 text-sm font-semibold">A</div>
            <div>
              <div className="text-sm font-medium text-stone-800 leading-tight">Alex Johnson</div>
              <div className="flex items-center gap-1 mt-0.5">
                <Flame size={10} className="text-amber-500" />
                <span className="text-[11px] text-amber-600 font-medium">7-day streak</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest px-2 mb-1">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map(({ href, Icon, label, badge, exact }) => {
                  const active = exact ? pathname === href : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-sage-50 text-sage-800 font-medium" : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"}`}
                    >
                      <Icon size={17} strokeWidth={active ? 2 : 1.5} className={`flex-shrink-0 ${active ? "text-sage-700" : ""}`} />
                      <span className="flex-1">{label}</span>
                      {badge ? (
                        <span className={`text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center ${active ? "bg-sage-200 text-sage-800" : "bg-stone-900 text-white"}`}>{badge}</span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-stone-100 space-y-0.5 flex-shrink-0">
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition-colors">
            <Settings size={17} strokeWidth={1.5} />
            Settings
          </Link>
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-500 hover:bg-red-50 hover:text-red-500 transition-colors">
            <LogOut size={17} strokeWidth={1.5} />
            Sign out
          </Link>
        </div>
      </div>
    </>
  );
}
