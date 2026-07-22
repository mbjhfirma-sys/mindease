"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import NotificationPanel from "@/components/NotificationPanel";
import {
  LayoutDashboard, BookOpen, CheckSquare, PenLine,
  MessageCircle, Calendar, Search, Bot,
  BarChart2, Users, ClipboardList, Settings, LogOut, Stethoscope, Newspaper,
} from "lucide-react";
import Logo from "@/components/Logo";

const navSections = [
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

export default function DashboardHeader() {
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [badges, setBadges] = useState<Record<string, number>>({});
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => {
        if (d.user?.avatar) setAvatar(d.user.avatar);
        if (d.user?.name)   setUserName(d.user.name.split(" ")[0]);
      })
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

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <header suppressHydrationWarning className="flex-shrink-0 bg-white border-b border-stone-200 h-14 flex items-center justify-between px-4 md:px-6 gap-3">
        {/* Mobile: logo + burger */}
        <Link href="/dashboard" className="flex items-center md:hidden">
          <Logo height={22} />
        </Link>

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
          <Link href="/dashboard/settings" className="w-8 h-8 bg-sage-100 rounded-full overflow-hidden flex items-center justify-center text-sage-700 text-sm font-semibold hover:ring-2 hover:ring-sage-400 transition-all flex-shrink-0">
            {avatar
              ? <img src={avatar} alt="" className="w-full h-full object-cover" />
              : (userName ? userName[0].toUpperCase() : "👤")}
          </Link>
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
            <div className="w-8 h-8 rounded-full bg-sage-100 overflow-hidden flex items-center justify-center text-sage-700 text-sm font-semibold">
              {avatar
                ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                : (userName ? userName[0].toUpperCase() : "?")}
            </div>
            <div>
              <div className="text-sm font-medium text-stone-800 leading-tight">{userName || "…"}</div>
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
                {section.items.map(({ href, Icon, label, exact }) => {
                  const active = exact ? pathname === href : pathname.startsWith(href);
                  const badge = badges[href];
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
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={17} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
