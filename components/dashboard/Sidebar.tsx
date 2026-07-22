"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, BookOpen, CheckSquare, PenLine,
  MessageCircle, Calendar, Search, Bot,
  BarChart2, Users, ClipboardList, Settings, LogOut,
  ChevronLeft, Flame, Stethoscope, LifeBuoy, Newspaper,
  type LucideIcon,
} from "lucide-react";
import Logo from "@/components/Logo";

type NavItem = { href: string; Icon: LucideIcon; label: string; exact?: boolean; accent?: boolean };

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", Icon: LayoutDashboard, label: "Dashboard", exact: true },
      { href: "/dashboard/courses", Icon: BookOpen, label: "My Courses" },
      { href: "/dashboard/articles", Icon: Newspaper, label: "Articles" },
      { href: "/dashboard/missions", Icon: CheckSquare, label: "Daily Tasks" },
      { href: "/dashboard/journal", Icon: PenLine, label: "Journal" },
    ],
  },
  {
    label: "Care",
    items: [
      { href: "/dashboard/safety-plan",  Icon: LifeBuoy,      label: "Safety Plan", accent: true },
      { href: "/dashboard/messages",     Icon: MessageCircle, label: "Messages" },
      { href: "/dashboard/schedule",     Icon: Calendar,      label: "Schedule" },
      { href: "/dashboard/my-therapist", Icon: Stethoscope,   label: "My Therapist" },
      { href: "/dashboard/find",         Icon: Search,        label: "Find a Therapist" },
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
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [streak,   setStreak]     = useState(0);
  const [avatar,   setAvatar]     = useState<string | null>(null);
  const [badges,   setBadges]     = useState<Record<string, number>>({});

  const fullName = session?.user?.name ?? "";
  const userName = fullName ? fullName.split(" ")[0] : "";
  const userInit = fullName ? fullName.charAt(0).toUpperCase() : "?";

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setStreak(d.stats?.streak ?? 0))
      .catch(() => {});
    fetch("/api/user")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => { if (d.user?.avatar) setAvatar(d.user.avatar); })
      .catch(() => {});
    fetch("/api/missions")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => {
        const remaining = (d.missions ?? []).filter((m: { completed: boolean }) => !m.completed).length;
        setBadges((prev) => ({ ...prev, "/dashboard/missions": remaining }));
      })
      .catch(() => {});
    fetch("/api/messages")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => {
        const unread = (d.conversations ?? []).reduce((sum: number, c: { unread: number }) => sum + c.unread, 0);
        setBadges((prev) => ({ ...prev, "/dashboard/messages": unread }));
      })
      .catch(() => {});
  }, []);

  return (
    <aside className={`hidden md:flex flex-col bg-white border-r border-stone-100 sticky top-0 h-screen flex-shrink-0 transition-all duration-200 ${collapsed ? "w-[58px]" : "w-56"}`}>
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-stone-100 flex-shrink-0 px-4 ${collapsed ? "justify-center" : ""}`}>
        {collapsed ? (
          // Collapsed: the logo doubles as the expand button — there isn't room in this
          // 58px rail for a separate toggle next to it, and a second overlapping button
          // here used to sit invisibly on top of the logo link (clicking the edge of the
          // icon navigated home instead of expanding, which looked like the sidebar was stuck).
          <button
            onClick={() => setCollapsed(false)}
            className="w-7 h-7 bg-sage-700 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0 font-bold hover:bg-sage-800 transition-colors"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            🌿
          </button>
        ) : (
          <>
            <Link href="/dashboard" className="flex items-center min-w-0">
              <Logo height={20} />
            </Link>
            <button onClick={() => setCollapsed(true)} className="ml-auto text-stone-300 hover:text-stone-600 transition-colors flex-shrink-0" aria-label="Collapse">
              <ChevronLeft size={16} />
            </button>
          </>
        )}
      </div>

      {/* User chip */}
      <div className={`px-3 py-4 border-b border-stone-100 flex-shrink-0 ${collapsed ? "flex justify-center" : ""}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-sage-100 overflow-hidden flex items-center justify-center text-sage-700 text-sm font-semibold flex-shrink-0">
            {avatar
              ? <img src={avatar} alt="" className="w-full h-full object-cover" />
              : userInit}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-medium text-stone-800 truncate leading-tight">
                {userName || "…"}
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Flame size={10} className="text-amber-500" />
                  <div className="text-xs text-amber-600 font-medium leading-tight">{streak}-day streak</div>
                </div>
              )}
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
              {section.items.map(({ href, Icon, label, exact, accent }) => {
                const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + "/"));
                const badge = badges[href];
                return (
                  <Link
                    key={href}
                    href={href}
                    data-tour={href}
                    title={collapsed ? label : undefined}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                      active
                        ? "bg-sage-50 text-sage-800 font-medium"
                        : accent
                        ? "text-red-500 hover:text-red-600 hover:bg-red-50"
                        : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <Icon
                      size={16}
                      className={`flex-shrink-0 ${active ? "text-sage-700" : accent ? "text-red-500" : ""}`}
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
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Sign out" : undefined}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-stone-500 hover:text-red-500 hover:bg-red-50 transition-all ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut size={16} strokeWidth={1.5} className="flex-shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
