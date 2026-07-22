"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Calendar, Wrench,
  MessageCircle, BarChart2, ChevronLeft,
  LogOut, Globe, Settings,
} from "lucide-react";

type Stats = { activeClients: number; totalSessions: number; pendingAppointments: number; unreadMessages: number };
type Profile = { title: string; rating: number };

const EMPTY_STATS: Stats = { activeClients: 0, totalSessions: 0, pendingAppointments: 0, unreadMessages: 0 };

export default function TherapistSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [name, setName] = useState("");
  const [profile, setProfile] = useState<Profile>({ title: "Therapist", rating: 0 });
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);

  useEffect(() => {
    Promise.all([
      fetch("/api/user").then((r) => r.json()),
      fetch("/api/therapist/stats").then((r) => r.json()),
    ]).then(([uData, sData]) => {
      if (uData.user?.name) setName(uData.user.name);
      if (sData.profile) setProfile(sData.profile);
      if (sData.stats) setStats(sData.stats);
    });
  }, []);

  const NAV = [
    { href: "/therapist",              label: "Overview",     Icon: LayoutDashboard, exact: true },
    { href: "/therapist/clients",      label: "Clients",      Icon: Users },
    { href: "/therapist/appointments", label: "Appointments", Icon: Calendar, badge: stats.pendingAppointments },
    { href: "/therapist/missions",     label: "Task Builder", Icon: Wrench },
    { href: "/therapist/community",    label: "Community",    Icon: Globe },
    { href: "/therapist/messages",     label: "Messages",     Icon: MessageCircle, badge: stats.unreadMessages },
    { href: "/therapist/analytics",    label: "Analytics",    Icon: BarChart2 },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-stone-100 sticky top-0 h-screen flex-shrink-0 transition-all duration-200 overflow-hidden ${collapsed ? "w-14" : "w-56"}`}>
        {/* Logo */}
        <div className={`flex items-center h-14 border-b border-stone-100 px-4 flex-shrink-0 ${collapsed ? "justify-center" : "gap-2.5"}`}>
          {collapsed ? (
            // Collapsed: the logo doubles as the expand button — a separate overlapping
            // toggle used to sit invisibly on top of the logo link here (clicking the edge
            // of the icon navigated home instead of expanding, looking like a stuck sidebar).
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
              <Link href="/therapist" className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 bg-stone-900 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">M</span>
                <span className="text-sm font-semibold text-stone-900 truncate">YouMindo Pro</span>
              </Link>
              <button onClick={() => setCollapsed(true)} className="ml-auto text-stone-300 hover:text-stone-600 transition-colors flex-shrink-0" aria-label="Collapse">
                <ChevronLeft size={15} />
              </button>
            </>
          )}
        </div>

        {/* Clinician chip */}
        <div className={`px-3 pt-4 pb-2 flex-shrink-0 ${collapsed ? "flex justify-center px-1" : ""}`}>
          <div className={`flex items-center gap-2.5`}>
            <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center text-sm font-semibold text-stone-600 flex-shrink-0">
              {name?.[0] ?? "T"}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-xs font-semibold text-stone-800 truncate">{name || "Therapist"}</div>
                <div className="text-[10px] text-stone-400 truncate">{profile.title?.replace("Licensed ", "")}</div>
              </div>
            )}
          </div>
        </div>

        {/* Compact stats */}
        {!collapsed && (
          <div className="mx-3 mb-3 flex-shrink-0">
            <div className="flex items-center gap-3 px-3 py-2 bg-stone-50 rounded-lg">
              {[
                { label: "Clients",  value: stats.activeClients },
                { label: "Sessions", value: stats.totalSessions },
                { label: "Rating",   value: profile.rating > 0 ? profile.rating.toFixed(1) : "—" },
              ].map((s, i) => (
                <div key={s.label} className={`text-center flex-1 ${i > 0 ? "border-l border-stone-200" : ""}`}>
                  <div className="text-xs font-semibold text-stone-900">{s.value}</div>
                  <div className="text-[9px] text-stone-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-1 flex flex-col gap-0.5 min-h-0 overflow-y-auto">
          {!collapsed && (
            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium px-2 mb-1">Portal</p>
          )}
          {NAV.map(({ href, label, Icon, badge, exact }) => {
            const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                data-tour={href}
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
          <Link
            href="/therapist/settings"
            title={collapsed ? "Profile & Settings" : undefined}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition-all ${collapsed ? "justify-center" : ""}`}
          >
            <Settings size={16} strokeWidth={1.5} className="flex-shrink-0" />
            {!collapsed && <span>Profile &amp; Settings</span>}
          </Link>
          <Link
            href="/"
            title={collapsed ? "Sign out" : undefined}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-stone-400 hover:bg-stone-50 hover:text-red-500 transition-all ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut size={16} strokeWidth={1.5} className="flex-shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
