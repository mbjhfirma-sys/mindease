"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import NotificationPanel from "@/components/NotificationPanel";
import { LayoutDashboard, Users, UserCheck, Flag, BookOpen, LogOut } from "lucide-react";
import type { AdminStats } from "@/lib/types";

const EMPTY_STATS: AdminStats = {
  users: { total: 0, clients: 0, therapists: 0, admins: 0, newLast7d: 0 },
  therapists: { total: 0, pending: 0, approved: 0, rejected: 0 },
  community: { openReports: 0, flaggedPosts: 0, totalPosts: 0 },
  safety: { openRiskFlags: 0 },
};

export default function AdminHeader() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Admin");
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const pathname = usePathname();

  useEffect(() => {
    Promise.all([
      fetch("/api/user").then((r) => r.json()),
      fetch("/api/admin/stats").then((r) => r.json()),
    ]).then(([uData, sData]) => {
      if (uData.user?.name) setName(uData.user.name);
      if (sData.users) setStats(sData);
    });
  }, []);

  const NAV = [
    { href: "/admin",            label: "Overview",   Icon: LayoutDashboard, exact: true },
    { href: "/admin/users",      label: "Users",      Icon: Users },
    { href: "/admin/therapists", label: "Therapists", Icon: UserCheck, badge: stats.therapists.pending },
    { href: "/admin/community",  label: "Community",  Icon: Flag, badge: stats.community.openReports + stats.community.flaggedPosts },
    { href: "/admin/courses",    label: "Courses",    Icon: BookOpen },
  ];

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <header className="flex-shrink-0 bg-white border-b border-stone-100 h-14 flex items-center justify-between px-5 gap-3">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 md:hidden">
          <span className="w-7 h-7 bg-stone-900 rounded-lg flex items-center justify-center text-white text-xs font-semibold">M</span>
          <span className="font-semibold text-stone-800 text-sm">YouMindo Admin</span>
        </div>

        {/* Desktop status */}
        <div className="hidden md:flex items-center gap-2 text-xs text-stone-400">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
          Admin Console
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <NotificationPanel role="admin" />
          <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 cursor-pointer hover:bg-stone-200 transition-colors">
            {name?.[0] ?? "A"}
          </div>
          {/* Burger — mobile only */}
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
        <div className="flex items-center justify-between px-4 h-14 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center text-sm font-semibold text-stone-600">
              {name?.[0] ?? "A"}
            </div>
            <div>
              <div className="text-sm font-medium text-stone-800 leading-tight">{name}</div>
              <div className="text-[11px] text-stone-400">Admin Console</div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest px-2 mb-2">Console</p>
          <div className="space-y-0.5">
            {NAV.map(({ href, label, Icon, badge, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-stone-100 text-stone-900 font-medium" : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"}`}
                >
                  <Icon size={17} strokeWidth={active ? 2 : 1.5} className="flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge ? (
                    <span className="text-[10px] font-semibold bg-stone-900 text-white w-4 h-4 rounded-full flex items-center justify-center">{badge}</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="px-3 py-4 border-t border-stone-100 space-y-0.5 flex-shrink-0">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={17} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
