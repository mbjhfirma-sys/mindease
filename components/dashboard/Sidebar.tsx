"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, BookOpen, CheckSquare, PenLine,
  MessageCircle, Calendar, Search, Bot,
  BarChart2, Users, ClipboardList, Settings, LogOut,
  ChevronLeft, ChevronRight, Flame,
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

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`hidden md:flex flex-col bg-white border-r border-stone-100 sticky top-0 h-screen flex-shrink-0 transition-all duration-200 ${collapsed ? "w-[58px]" : "w-56"}`}>
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-stone-100 flex-shrink-0 px-4 ${collapsed ? "justify-center" : ""}`}>
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-7 bg-sage-700 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0 font-bold">🌿</span>
          {!collapsed && <span className="text-sm font-semibold text-stone-900 truncate">MindEase</span>}
        </Link>
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="ml-auto text-stone-300 hover:text-stone-600 transition-colors" aria-label="Collapse">
            <ChevronLeft size={16} />
          </button>
        )}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} className="text-stone-300 hover:text-stone-600 transition-colors" aria-label="Expand">
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* User chip */}
      <div className={`px-3 py-4 border-b border-stone-100 flex-shrink-0 ${collapsed ? "flex justify-center" : ""}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 text-sm font-semibold flex-shrink-0">A</div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-medium text-stone-800 truncate leading-tight">Alex Johnson</div>
              <div className="flex items-center gap-1 mt-0.5">
                <Flame size={10} className="text-amber-500" />
                <div className="text-xs text-amber-600 font-medium leading-tight">7-day streak</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 flex flex-col gap-4 min-h-0 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest px-2 mb-1.5">{section.label}</div>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ href, Icon, label, badge, exact }) => {
                const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + "/"));
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                      active
                        ? "bg-sage-50 text-sage-800 font-medium"
                        : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <Icon
                      size={16}
                      className={`flex-shrink-0 ${active ? "text-sage-700" : ""}`}
                      strokeWidth={active ? 2 : 1.5}
                    />
                    {!collapsed && <span className="flex-1 truncate">{label}</span>}
                    {!collapsed && badge ? (
                      <span className={`text-[10px] font-semibold min-w-[18px] h-[18px] flex items-center justify-center rounded-full ${
                        active ? "bg-sage-200 text-sage-800" : "bg-stone-100 text-stone-500"
                      }`}>
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2.5 py-3 border-t border-stone-100 flex-shrink-0 space-y-0.5">
        <Link
          href="/dashboard/settings"
          title={collapsed ? "Settings" : undefined}
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition-all ${collapsed ? "justify-center" : ""}`}
        >
          <Settings size={16} strokeWidth={1.5} className="flex-shrink-0" />
          {!collapsed && <span className="flex-1">Settings</span>}
        </Link>
        <Link
          href="/"
          title={collapsed ? "Sign out" : undefined}
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-stone-500 hover:text-red-500 hover:bg-red-50 transition-all ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut size={16} strokeWidth={1.5} className="flex-shrink-0" />
          {!collapsed && <span className="flex-1">Sign Out</span>}
        </Link>
      </div>
    </aside>
  );
}
