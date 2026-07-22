"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, UserCheck, Flag, BookOpen, ChevronLeft, LogOut } from "lucide-react";
import type { AdminStats } from "@/lib/types";

const EMPTY_STATS: AdminStats = {
  users: { total: 0, clients: 0, therapists: 0, admins: 0, newLast7d: 0 },
  therapists: { total: 0, pending: 0, approved: 0, rejected: 0 },
  community: { openReports: 0, flaggedPosts: 0, totalPosts: 0 },
  safety: { openRiskFlags: 0 },
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then((d) => {
      if (d.users) setStats(d);
    });
  }, []);

  const NAV = [
    { href: "/admin",            label: "Overview",   Icon: LayoutDashboard, exact: true },
    { href: "/admin/users",      label: "Users",      Icon: Users },
    { href: "/admin/therapists", label: "Therapists", Icon: UserCheck, badge: stats.therapists.pending },
    { href: "/admin/community",  label: "Community",  Icon: Flag, badge: stats.community.openReports + stats.community.flaggedPosts },
    { href: "/admin/courses",    label: "Courses",    Icon: BookOpen },
  ];

  return (
    <aside className={`hidden md:flex flex-col bg-white border-r border-stone-100 sticky top-0 h-screen flex-shrink-0 transition-all duration-200 overflow-hidden ${collapsed ? "w-14" : "w-56"}`}>
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-stone-100 px-4 flex-shrink-0 ${collapsed ? "justify-center" : "gap-2.5"}`}>
        {collapsed ? (
          // Collapsed: the logo doubles as the expand button — a separate overlapping
          // toggle used to sit invisibly on top of the logo link here (clicking the edge
          // of the icon navigated to /admin instead of expanding, looking like a stuck sidebar).
          <button
            onClick={() => setCollapsed(false)}
            className="w-7 h-7 bg-stone-900 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 hover:bg-stone-800 transition-colors"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            M
          </button>
        ) : (
          <>
            <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 bg-stone-900 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">M</span>
              <span className="text-sm font-semibold text-stone-900 truncate">YouMindo Admin</span>
            </Link>
            <button onClick={() => setCollapsed(true)} className="ml-auto text-stone-300 hover:text-stone-600 transition-colors flex-shrink-0" aria-label="Collapse">
              <ChevronLeft size={15} />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 min-h-0 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium px-2 mb-1">Console</p>
        )}
        {NAV.map(({ href, label, Icon, badge, exact }) => {
          const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                active ? "bg-stone-100 text-stone-900 font-medium" : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.5} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{label}</span>
                  {badge ? (
                    <span className="text-[10px] font-semibold bg-stone-900 text-white w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
                      {badge}
                    </span>
                  ) : null}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="px-2 pb-5 pt-2 flex-shrink-0 border-t border-stone-100 space-y-0.5">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Sign out" : undefined}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-stone-400 hover:bg-stone-50 hover:text-red-500 transition-all ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut size={16} strokeWidth={1.5} className="flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
