"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import NotificationPanel from "@/components/NotificationPanel";
import { UserCircle, LogOut, ChevronDown } from "lucide-react";
import { CLIENT_NAV, BUSINESS_GROUP, BUSINESS_SUBNAV } from "@/lib/therapistNav";
import { onMessagesRead } from "@/lib/badgeEvents";

type ClinicInfo = { name: string; subtitle: string };

export default function TherapistHeader() {
  const [open, setOpen] = useState(false);
  const [businessExpanded, setBusinessExpanded] = useState(false);
  const [name, setName] = useState("Therapist");
  const [pendingAppts, setPendingAppts] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);
  const [prevPathname, setPrevPathname] = useState<string | null>(null);
  const pathname = usePathname();

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const fetchStats = useCallback(() => {
    fetch("/api/therapist/stats")
      .then((r) => r.json())
      .then((sData) => {
        if (sData.stats) {
          setPendingAppts(sData.stats.pendingAppointments);
          setUnreadMsgs(sData.stats.unreadMessages);
        }
      });
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
    return onMessagesRead(fetchStats);
  }, [fetchStats]);

  const isBusinessMode = pathname.startsWith("/therapist/business");
  const businessOpen = businessExpanded || isBusinessMode;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : (pathname === href || pathname.startsWith(href + "/"));
  }

  return (
    <>
      <header className="flex-shrink-0 bg-white border-b border-stone-100 h-14 flex items-center justify-between px-5 gap-3">
        {/* Mobile logo */}
        <div className="flex items-center md:hidden">
          <Logo height={22} />
        </div>

        {/* Desktop status */}
        <div className="hidden md:flex items-center gap-2 text-xs text-stone-400">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
          Clinician Portal
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <NotificationPanel role="therapist" />
          <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600 cursor-pointer hover:bg-stone-200 transition-colors">
            {name?.[0] ?? "T"}
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
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center text-sm font-semibold text-stone-600">
              {name?.[0] ?? "T"}
            </div>
            <div>
              <div className="text-sm font-medium text-stone-800 leading-tight">{name}</div>
              <div className="text-[11px] text-stone-400">{clinic ? clinic.name : "Clinician Portal"}</div>
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
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest px-2 mb-2">Portal</p>
          <div className="space-y-0.5">
            {CLIENT_NAV.map(({ href, label, Icon, exact }) => {
              const badge = href === "/therapist/appointments" ? pendingAppts : href === "/therapist/messages" ? unreadMsgs : undefined;
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm border-l-[3px] transition-colors ${
                    active ? "bg-sage-50 border-sage-600 text-sage-800 font-medium" : "border-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                  }`}
                >
                  <Icon size={17} strokeWidth={active ? 2 : 1.5} className="flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge ? (
                    <span className="text-[10px] font-semibold bg-stone-900 text-white w-4 h-4 rounded-full flex items-center justify-center">{badge}</span>
                  ) : null}
                </Link>
              );
            })}

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setBusinessExpanded((v) => !v)}
                aria-expanded={businessOpen}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm border-l-[3px] w-full cursor-pointer transition-colors ${
                  isBusinessMode ? "bg-sage-50 border-sage-600 text-sage-800 font-medium" : "border-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                }`}
              >
                <BUSINESS_GROUP.Icon size={17} strokeWidth={isBusinessMode ? 2 : 1.5} className="flex-shrink-0" />
                <span className="flex-1 text-left">Business</span>
                <ChevronDown size={15} className={`text-stone-300 flex-shrink-0 transition-transform ${businessOpen ? "rotate-180" : ""}`} />
              </button>
              {businessOpen && (
                <div className="flex flex-col gap-0.5 mt-0.5 ml-[26px] pl-3 border-l border-stone-100">
                  {BUSINESS_SUBNAV.map(({ href, label, Icon, exact }) => {
                    const active = isActive(href, exact);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                          active ? "bg-sage-50 text-sage-800 font-medium" : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                        }`}
                      >
                        <Icon size={15} strokeWidth={active ? 2 : 1.5} className="flex-shrink-0" />
                        <span className="flex-1">{label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-stone-100 space-y-0.5 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition-colors">
            <UserCircle size={17} strokeWidth={1.5} />
            Switch to client
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
