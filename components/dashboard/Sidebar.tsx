"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, BookOpen, CheckSquare, PenLine,
  MessageCircle, Calendar, Search, Bot,
  BarChart2, Users, ClipboardList, Settings, LogOut,
  ChevronLeft, ChevronRight, LifeBuoy, Newspaper, Sparkles,
  type LucideIcon,
} from "lucide-react";
import Logo from "@/components/Logo";
import { onBadgesChanged } from "@/lib/badgeEvents";
import UpgradeModal from "@/components/dashboard/UpgradeModal";

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
      { href: "/dashboard/ai-chat",      Icon: Bot,           label: "Ask Mindo" },
      { href: "/dashboard/messages",     Icon: MessageCircle, label: "Messages" },
      { href: "/dashboard/schedule",     Icon: Calendar,      label: "Sessions" },
      { href: "/dashboard/find",         Icon: Search,        label: "Find Professionals" },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/dashboard/achievements", Icon: BarChart2, label: "Progress" },
      { href: "/dashboard/community", Icon: Users, label: "Community" },
      { href: "/dashboard/assessment", Icon: ClipboardList, label: "Assessments" },
      { href: "/dashboard/safety-plan", Icon: LifeBuoy, label: "Safety Plan", accent: true },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [streak,   setStreak]     = useState(0);
  const [avatar,   setAvatar]     = useState<string | null>(null);
  const [plan,     setPlan]       = useState<string>("free");
  const [badges,   setBadges]     = useState<Record<string, number>>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const fullName = session?.user?.name ?? "";
  const userName = fullName ? fullName.split(" ")[0] : "";
  const userInit = fullName ? fullName.charAt(0).toUpperCase() : "?";

  const fetchUnread = useCallback(() => {
    fetch("/api/messages")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => {
        const unread = (d.conversations ?? []).reduce((sum: number, c: { unread: number }) => sum + c.unread, 0);
        setBadges((prev) => ({ ...prev, "/dashboard/messages": unread }));
      })
      .catch(() => {});
  }, []);

  const fetchMissionsRemaining = useCallback(() => {
    fetch("/api/missions")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => {
        const remaining = (d.missions ?? []).filter((m: { completed: boolean }) => !m.completed).length;
        setBadges((prev) => ({ ...prev, "/dashboard/missions": remaining }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setStreak(d.stats?.streak ?? 0))
      .catch(() => {});
    fetch("/api/user")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => {
        if (d.user?.avatar) setAvatar(d.user.avatar);
        if (d.user?.plan) setPlan(d.user.plan);
      })
      .catch(() => {});
    fetchMissionsRemaining();
    fetchUnread();
    return onBadgesChanged(() => { fetchMissionsRemaining(); fetchUnread(); });
  }, [fetchUnread, fetchMissionsRemaining]);

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
            className="flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <Logo iconOnly height={20} />
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

      {/* Profile switcher */}
      <Link
        href="/dashboard/settings"
        title={collapsed ? (userName || "Settings") : undefined}
        className={`flex items-center gap-2.5 mt-3 mb-1 px-2.5 py-2 rounded-lg hover:bg-stone-50 transition-colors flex-shrink-0 ${collapsed ? "justify-center mx-1" : "mx-2"}`}
      >
        <div className="w-8 h-8 bg-sage-50 rounded-lg overflow-hidden flex items-center justify-center text-sm font-semibold text-sage-700 flex-shrink-0">
          {avatar
            ? <img src={avatar} alt="" className="w-full h-full object-cover" />
            : userInit}
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-stone-800 truncate">{userName || "…"}</div>
              <div className="text-[10px] text-stone-400 truncate">{streak > 0 ? `${streak}-day streak` : "Client"}</div>
            </div>
            <ChevronRight size={13} className="text-stone-300 flex-shrink-0" />
          </>
        )}
      </Link>

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
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm border-l-[3px] transition-all ${
                      active
                        ? "bg-sage-50 border-sage-600 text-sage-800 font-medium"
                        : accent
                        ? "border-transparent text-red-500 hover:text-red-600 hover:bg-red-50"
                        : "border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <Icon
                      size={16}
                      className={`flex-shrink-0 ${active ? "text-sage-700" : accent ? "text-red-500" : ""}`}
                      strokeWidth={active ? 2 : 1.5}
                    />
                    {!collapsed && <span className="flex-1 truncate">{label}</span>}
                    {!collapsed && badge ? (
                      <span className="text-[10px] font-semibold bg-stone-900 text-white w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
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
        {plan !== "premium" ? (
          <button
            onClick={() => setShowUpgradeModal(true)}
            title={collapsed ? "Upgrade" : undefined}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-gradient-to-r from-sage-600 to-sage-800 hover:from-sage-700 hover:to-sage-900 shadow-sm hover:shadow-md transition-all animate-pulse-glow ${collapsed ? "justify-center" : ""}`}
          >
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles size={13} className="text-white" strokeWidth={2} />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 text-left">
                <div className="text-xs font-semibold text-white truncate">Upgrade</div>
                <div className="text-[10px] text-sage-100 truncate">Unlock Mindo, courses & more</div>
              </div>
            )}
          </button>
        ) : (
          <Link
            href="/dashboard/settings"
            title={collapsed ? "Settings" : undefined}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition-all ${collapsed ? "justify-center" : ""}`}
          >
            <div className="w-6 h-6 bg-stone-100 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-semibold text-stone-600 flex-shrink-0">
              {avatar
                ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                : userInit}
            </div>
            {!collapsed && <span className="flex-1 truncate">{userName || "Settings"}</span>}
            {!collapsed && <Settings size={15} strokeWidth={1.5} className="text-stone-300 flex-shrink-0" />}
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Sign out" : undefined}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-stone-400 hover:bg-stone-50 hover:text-red-500 transition-all ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut size={16} strokeWidth={1.5} className="flex-shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Sign out</span>}
        </button>
      </div>

      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          title="Upgrade your plan"
          description="Unlock Mindo, the full course library, and live group sessions."
        />
      )}
    </aside>
  );
}
