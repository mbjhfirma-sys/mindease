"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Logo from "@/components/Logo";
import { ChevronLeft, ChevronDown, ChevronRight, LogOut, Settings } from "lucide-react";
import { CLIENT_NAV, BUSINESS_GROUP, BUSINESS_SUBNAV } from "@/lib/therapistNav";
import { onBadgesChanged } from "@/lib/badgeEvents";

type Stats = { pendingAppointments: number; unreadMessages: number; unreadCommunityNotifications: number };
type ClinicSwitcher = { name: string; subtitle: string };

const EMPTY_STATS: Stats = { pendingAppointments: 0, unreadMessages: 0, unreadCommunityNotifications: 0 };

export default function TherapistSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [businessExpanded, setBusinessExpanded] = useState(false);
  const [name, setName] = useState("");
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [clinic, setClinic] = useState<ClinicSwitcher | null>(null);

  const fetchStats = useCallback(() => {
    fetch("/api/therapist/stats")
      .then((r) => r.json())
      .then((sData) => { if (sData.stats) setStats(sData.stats); });
  }, []);

  useEffect(() => {
    fetch("/api/user").then((r) => r.json()).then((uData) => {
      if (uData.user?.name) setName(uData.user.name);
    });
    fetch("/api/therapist/clinic").then((r) => r.json()).then((cData) => {
      if (cData.role === "owner") setClinic({ name: cData.clinic.name, subtitle: "Clinic owner" });
      else if (cData.role === "active") setClinic({ name: cData.membership.clinicName, subtitle: "Clinic member" });
      else if (cData.role === "invited") setClinic({ name: cData.membership.clinicName, subtitle: "Invitation pending" });
    });
    fetchStats();
    return onBadgesChanged(fetchStats);
  }, [fetchStats]);

  const isBusinessMode = pathname.startsWith("/therapist/business");
  const businessOpen = businessExpanded || isBusinessMode;

  const practiceName = clinic?.name ?? (name || "Your practice");
  const practiceSubtitle = clinic?.subtitle ?? "Solo practitioner";

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-stone-100 sticky top-0 h-screen flex-shrink-0 transition-all duration-200 overflow-hidden ${collapsed ? "w-14" : "w-56"}`}>
        {/* Logo */}
        <div className={`flex items-center h-14 border-b border-stone-100 px-4 flex-shrink-0 ${collapsed ? "justify-center" : "gap-2.5"}`}>
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="flex items-center justify-center hover:opacity-80 transition-opacity"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <Logo iconOnly height={26} />
            </button>
          ) : (
            <>
              <Link href="/therapist" className="flex items-center min-w-0">
                <Logo height={24} />
              </Link>
              <button onClick={() => setCollapsed(true)} className="ml-auto text-stone-300 hover:text-stone-600 transition-colors flex-shrink-0" aria-label="Collapse">
                <ChevronLeft size={15} />
              </button>
            </>
          )}
        </div>

        {/* Practice switcher */}
        <Link
          href="/therapist/business/subscription"
          title={collapsed ? practiceName : undefined}
          className={`flex items-center gap-2.5 mt-3 mb-1 px-2.5 py-2 rounded-lg hover:bg-stone-50 transition-colors flex-shrink-0 ${collapsed ? "justify-center mx-1" : "mx-2"}`}
        >
          <div className="w-8 h-8 bg-sage-50 rounded-lg flex items-center justify-center text-sm font-semibold text-sage-700 flex-shrink-0">
            {name?.[0] ?? "T"}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-stone-800 truncate">{practiceName}</div>
                <div className="text-[10px] text-stone-400 truncate">{practiceSubtitle}</div>
              </div>
              <ChevronRight size={13} className="text-stone-300 flex-shrink-0" />
            </>
          )}
        </Link>

        {/* Nav — Client Panel items plus a collapsible Business Centre section */}
        <nav className="flex-1 px-2 py-2 flex flex-col gap-0.5 min-h-0 overflow-y-auto">
          {CLIENT_NAV.map(({ href, label, Icon, exact }) => {
            const badge =
              href === "/therapist/appointments" ? stats.pendingAppointments
              : href === "/therapist/messages" ? stats.unreadMessages
              : href === "/therapist/community" ? stats.unreadCommunityNotifications
              : undefined;
            const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                data-tour={href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm border-l-[3px] transition-all ${
                  active ? "bg-sage-50 border-sage-600 text-sage-800 font-medium" : "border-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-800"
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

          <div className="mt-2">
            <button
              type="button"
              onClick={() => setBusinessExpanded((v) => !v)}
              data-tour="/therapist/business"
              title={collapsed ? "Business Centre" : undefined}
              aria-expanded={businessOpen}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm border-l-[3px] w-full cursor-pointer transition-all ${
                isBusinessMode ? "bg-sage-50 border-sage-600 text-sage-800 font-medium" : "border-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-800"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <BUSINESS_GROUP.Icon size={16} strokeWidth={isBusinessMode ? 2 : 1.5} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate text-left">Business</span>
                  <ChevronDown size={13} className={`text-stone-300 flex-shrink-0 transition-transform ${businessOpen ? "rotate-180" : ""}`} />
                </>
              )}
            </button>
            {(businessOpen || collapsed) && (
              <div className={collapsed ? "flex flex-col gap-0.5 mt-0.5" : "flex flex-col gap-0.5 mt-0.5 ml-[22px] pl-2.5 border-l border-stone-100"}>
                {BUSINESS_SUBNAV.map(({ href, label, Icon, exact }) => {
                  const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + "/"));
                  return (
                    <Link
                      key={href}
                      href={href}
                      data-tour={href}
                      title={collapsed ? label : undefined}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-all ${
                        active ? "bg-sage-50 text-sage-800 font-medium" : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      <Icon size={15} strokeWidth={active ? 2 : 1.5} className="flex-shrink-0" />
                      {!collapsed && <span className="flex-1 truncate">{label}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom links */}
        <div className="px-2 pb-5 pt-2 flex-shrink-0 border-t border-stone-100 space-y-0.5">
          <Link
            href="/therapist/settings"
            title={collapsed ? "Profile & Settings" : undefined}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition-all ${collapsed ? "justify-center" : ""}`}
          >
            <div className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[10px] font-semibold text-stone-600 flex-shrink-0">
              {name?.[0] ?? "T"}
            </div>
            {!collapsed && <span className="flex-1 truncate">{name || "Therapist"}</span>}
            {!collapsed && <Settings size={15} strokeWidth={1.5} className="text-stone-300 flex-shrink-0" />}
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
