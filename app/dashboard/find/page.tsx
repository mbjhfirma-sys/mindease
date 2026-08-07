"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Star, MessageCircle, BadgeCheck, Sparkles, ChevronRight, Users,
  X, GraduationCap, Languages, Layers,
} from "lucide-react";
import BookingModal from "@/components/dashboard/BookingModal";
import { ProfileSection } from "@/components/dashboard/ProfileSection";
import { specColor } from "@/lib/specializationColors";

// ── Platform therapist type ───────────────────────────────────────────────────

type PlatformTherapist = {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  title: string;
  specializations: string[];
  bio: string | null;
  approach: string | null;
  yearsOfExperience: number | null;
  education: string[];
  languages: string[];
  modalities: string[];
  rating: number;
  totalSessions: number;
  activeClients: number;
  maxClients: number | null;
  isFull: boolean;
};

const AVATAR_PALETTES = [
  { bg: "bg-sage-100",   text: "text-sage-700" },
  { bg: "bg-blue-100",   text: "text-blue-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-amber-100",  text: "text-amber-700" },
  { bg: "bg-pink-100",   text: "text-pink-700" },
  { bg: "bg-teal-100",   text: "text-teal-700" },
];

function avatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .filter((w) => /^[A-Za-zÆØÅæøå]/.test(w))
    .map((w) => w[0].toUpperCase())
    .filter((_, i, arr) => i === 0 || i === arr.length - 1)
    .join("")
    .slice(0, 2) || "??";
}

// ── Shared bits ────────────────────────────────────────────────────────────────

type ActionProps = {
  t: PlatformTherapist;
  onMessage: () => void;
  onBook: () => void;
  onRequest: () => void;
  messageLoading: boolean;
  myTherapistId: string | null;
  requestState?: "loading" | "assigned" | "waitlisted" | "error";
  wasSwitch?: boolean;
};

function TherapistActionButtons({
  t, onMessage, onBook, onRequest, messageLoading, myTherapistId, requestState, wasSwitch,
}: ActionProps) {
  if (t.id === myTherapistId) {
    return (
      <>
        <button
          onClick={onMessage}
          disabled={messageLoading}
          className="flex items-center justify-center gap-1.5 flex-1 text-xs font-semibold py-2.5 px-2 bg-sage-700 hover:bg-sage-800 disabled:opacity-60 text-white rounded-xl transition-colors shadow-sm"
        >
          {messageLoading
            ? <Loader2 size={12} className="animate-spin" />
            : <MessageCircle size={12} strokeWidth={2} />}
          {messageLoading ? "Opening…" : "Message"}
        </button>
        <button
          onClick={onBook}
          className="flex items-center justify-center gap-1.5 flex-1 text-xs font-semibold py-2.5 px-2 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-xl transition-colors border border-stone-100"
        >
          Book session
        </button>
      </>
    );
  }

  if (requestState === "assigned") {
    return (
      <span className="flex-1 text-xs font-semibold py-2.5 px-2 text-center text-sage-700">
        {wasSwitch ? "Switched! Refresh to message." : "Matched! Refresh to message."}
      </span>
    );
  }

  if (requestState === "waitlisted") {
    return (
      <span className="flex-1 text-xs font-semibold py-2.5 px-2 text-center text-amber-600">
        You&apos;re on the waitlist.
      </span>
    );
  }

  return (
    <button
      onClick={() => {
        if (myTherapistId !== null) {
          const ok = window.confirm(
            `Switch to ${t.name}? Your current therapist will be notified, and you'll stop working with them.`
          );
          if (!ok) return;
        }
        onRequest();
      }}
      disabled={requestState === "loading"}
      className={`flex items-center justify-center gap-1.5 flex-1 text-xs font-semibold py-2.5 px-2 disabled:opacity-60 rounded-xl transition-colors ${
        t.isFull
          ? "bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
          : myTherapistId === null
          ? "bg-sage-700 hover:bg-sage-800 text-white shadow-sm"
          : "bg-white hover:bg-stone-50 text-stone-600 border border-stone-200"
      }`}
    >
      {requestState === "loading" ? <Loader2 size={12} className="animate-spin" /> : null}
      {requestState === "loading"
        ? "Requesting…"
        : t.isFull
        ? "Join waitlist"
        : myTherapistId === null
        ? "Request therapist"
        : "Switch to this therapist"}
    </button>
  );
}

function CapacityBar({ t }: { t: PlatformTherapist }) {
  if (t.maxClients == null) return null;
  const pct = Math.min(100, Math.round((t.activeClients / t.maxClients) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <span className={`font-semibold ${t.isFull ? "text-amber-600" : "text-stone-500"}`}>
          {t.isFull ? "Full — waitlist open" : "Accepting clients"}
        </span>
        <span className="text-stone-400">{t.activeClients}/{t.maxClients}</span>
      </div>
      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${t.isFull ? "bg-amber-500" : "bg-sage-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Platform therapist card ───────────────────────────────────────────────────

function PlatformTherapistCard({
  t, onOpen, onMessage, onBook, onRequest, messageLoading, myTherapistId, requestState, wasSwitch,
}: ActionProps & { onOpen: () => void }) {
  const pal = avatarPalette(t.name);
  const ini = initials(t.name);
  const topSpecs = t.specializations.slice(0, 2);

  return (
    <div
      onClick={onOpen}
      className="bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-lg hover:border-stone-200 transition-all duration-200 flex flex-col group cursor-pointer"
    >
      {/* YouMindo badge stripe */}
      <div className="h-1 bg-gradient-to-r from-sage-500 to-sage-700" />

      <div className="p-5 flex-1">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-12 h-12 ${pal.bg} rounded-xl flex items-center justify-center text-base font-bold ${pal.text} flex-shrink-0 transition-transform group-hover:scale-105`}>
            {ini}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-bold text-stone-900 leading-snug">{t.name}</h3>
              {t.id === myTherapistId && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sage-800 bg-sage-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  <BadgeCheck size={10} strokeWidth={2.5} /> You&apos;re matched
                </span>
              )}
            </div>
            <p className="text-xs text-sage-700 font-semibold mt-0.5">{t.title}</p>
          </div>
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {topSpecs.map((s) => (
            <span key={s} className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${specColor(s)}`}>
              {s}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-600 bg-white border border-stone-200 px-2 py-1 rounded-full">
            <BadgeCheck size={10} strokeWidth={2.5} className="text-sage-600" /> Verified
          </span>
        </div>

        {/* Bio */}
        {t.bio ? (
          <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 mb-3">{t.bio}</p>
        ) : (
          <p className="text-xs text-stone-300 italic mb-3">Licensed mental health professional on YouMindo</p>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-between text-[11px] text-stone-400 mb-3">
          {t.rating > 0 ? (
            <span className="flex items-center gap-1">
              <Star size={11} strokeWidth={2} className="text-amber-400 fill-amber-400" />
              <span className="font-semibold text-stone-600">{t.rating.toFixed(1)}</span>
            </span>
          ) : <span />}
          <span>
            {t.totalSessions > 0 && <><span className="font-semibold text-stone-600">{t.totalSessions}</span> sessions</>}
            {t.totalSessions > 0 && t.yearsOfExperience ? " · " : ""}
            {t.yearsOfExperience ? <><span className="font-semibold text-stone-600">{t.yearsOfExperience}y</span> exp</> : null}
          </span>
        </div>

        {/* Capacity */}
        <CapacityBar t={t} />
      </div>

      {/* Actions */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex gap-2 px-5 pb-5 pt-3 border-t border-stone-50"
      >
        <TherapistActionButtons
          t={t}
          onMessage={onMessage}
          onBook={onBook}
          onRequest={onRequest}
          messageLoading={messageLoading}
          myTherapistId={myTherapistId}
          requestState={requestState}
          wasSwitch={wasSwitch}
        />
      </div>
    </div>
  );
}

// ── Therapist profile modal ───────────────────────────────────────────────────

function TherapistProfileModal({
  t, onClose, onMessage, onBook, onRequest, messageLoading, myTherapistId, requestState, wasSwitch,
}: ActionProps & { onClose: () => void }) {
  const pal = avatarPalette(t.name);
  const ini = initials(t.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-br from-sage-700 via-sage-700 to-sage-800 px-6 pt-6 pb-6 text-white flex-shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors z-10"
          >
            <X size={15} strokeWidth={2} />
          </button>
          <div className="relative flex items-start gap-3">
            <div className={`w-14 h-14 ${pal.bg} rounded-2xl flex items-center justify-center text-lg font-bold ${pal.text} flex-shrink-0`}>
              {ini}
            </div>
            <div className="min-w-0 pr-10">
              <h2 className="text-lg font-bold leading-snug">{t.name}</h2>
              <p className="text-sage-200 text-xs font-medium mt-0.5">{t.title}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-white/15 px-2 py-0.5 rounded-full mt-2">
                <BadgeCheck size={10} strokeWidth={2.5} /> YouMindo Verified
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          {/* Stats + capacity */}
          <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500">
              {t.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star size={12} strokeWidth={2} className="text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-stone-700">{t.rating.toFixed(1)}</span>
                </span>
              )}
              <span>
                {t.totalSessions > 0 && <><span className="font-semibold text-stone-700">{t.totalSessions}</span> sessions</>}
                {t.totalSessions > 0 && t.yearsOfExperience ? " · " : ""}
                {t.yearsOfExperience ? <><span className="font-semibold text-stone-700">{t.yearsOfExperience}y</span> experience</> : null}
              </span>
            </div>
            <CapacityBar t={t} />
          </div>

          {t.specializations.length > 0 && (
            <ProfileSection title="Specializations">
              <div className="flex flex-wrap gap-2">
                {t.specializations.map((s) => (
                  <span key={s} className={`text-xs font-medium px-3 py-1.5 rounded-full border ${specColor(s)}`}>
                    {s}
                  </span>
                ))}
              </div>
            </ProfileSection>
          )}

          <ProfileSection title="About">
            <p className="text-sm text-stone-600 leading-relaxed">
              {t.bio ?? "Licensed mental health professional on YouMindo."}
            </p>
          </ProfileSection>

          {t.approach && (
            <ProfileSection title="Therapeutic Approach">
              <p className="text-sm text-stone-600 leading-relaxed">{t.approach}</p>
            </ProfileSection>
          )}

          {t.modalities.length > 0 && (
            <ProfileSection title="Modalities" Icon={Layers}>
              <div className="flex flex-wrap gap-2">
                {t.modalities.map((m) => (
                  <span key={m} className="text-xs font-medium px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-stone-700">
                    {m}
                  </span>
                ))}
              </div>
            </ProfileSection>
          )}

          {t.education.length > 0 && (
            <ProfileSection title="Education & Qualifications" Icon={GraduationCap}>
              <ul className="space-y-2">
                {t.education.map((e, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-stone-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-2 flex-shrink-0" />
                    {e}
                  </li>
                ))}
              </ul>
            </ProfileSection>
          )}

          {t.languages.length > 0 && (
            <ProfileSection title="Languages" Icon={Languages}>
              <div className="flex flex-wrap gap-2">
                {t.languages.map((l) => (
                  <span key={l} className="text-xs font-medium px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-stone-700">
                    {l}
                  </span>
                ))}
              </div>
            </ProfileSection>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 px-6 py-4 border-t border-stone-100 flex-shrink-0">
          <TherapistActionButtons
            t={t}
            onMessage={onMessage}
            onBook={onBook}
            onRequest={onRequest}
            messageLoading={messageLoading}
            myTherapistId={myTherapistId}
            requestState={requestState}
            wasSwitch={wasSwitch}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FindPage() {
  const router = useRouter();
  const [platformTherapists, setPlatformTherapists] = useState<PlatformTherapist[]>([]);
  const [loadingPlatform, setLoadingPlatform] = useState(true);
  const [messagingId, setMessagingId] = useState<string | null>(null);
  const [bookingTherapist, setBookingTherapist] = useState<{ id: string; name: string; title: string } | null>(null);
  const [myTherapistId, setMyTherapistId] = useState<string | null>(null);
  const [requestStates, setRequestStates] = useState<Record<string, "loading" | "assigned" | "waitlisted" | "error">>({});
  // Captured at click-time, before myTherapistId itself changes — otherwise a
  // "was this a first match or a switch" check reading myTherapistId after a
  // successful switch would always see the *new* therapist and never know a
  // prior one existed.
  const [wasSwitch, setWasSwitch] = useState<Record<string, boolean>>({});
  const [showAllPlatform, setShowAllPlatform] = useState(false);
  const [activeSpec, setActiveSpec] = useState("All");
  const [selectedTherapist, setSelectedTherapist] = useState<PlatformTherapist | null>(null);

  useEffect(() => {
    fetch("/api/therapists", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setPlatformTherapists(d.therapists ?? []))
      .catch(() => {})
      .finally(() => setLoadingPlatform(false));

    fetch("/api/user")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setMyTherapistId(d.user?.assignedTherapist?.id ?? null))
      .catch(() => {});
  }, []);

  async function handleRequest(t: PlatformTherapist) {
    setWasSwitch((prev) => ({ ...prev, [t.id]: myTherapistId !== null }));
    setRequestStates((prev) => ({ ...prev, [t.id]: "loading" }));
    try {
      const res = await fetch(`/api/therapists/${t.id}/request`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setRequestStates((prev) => ({ ...prev, [t.id]: "error" }));
        return;
      }
      setRequestStates((prev) => ({ ...prev, [t.id]: data.assigned ? "assigned" : "waitlisted" }));
      if (data.assigned) setMyTherapistId(t.id);
    } catch {
      setRequestStates((prev) => ({ ...prev, [t.id]: "error" }));
    }
  }

  async function handleMessage(t: PlatformTherapist) {
    setMessagingId(t.id);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ therapistId: t.id }),
      });
      const data = await res.json();
      if (data.conversationId) {
        router.push(`/dashboard/messages?open=${data.conversationId}`);
      }
    } catch {
      // ignore — user stays on page
    } finally {
      setMessagingId(null);
    }
  }

  const allSpecs = Array.from(
    new Set(platformTherapists.flatMap((t) => t.specializations))
  ).sort();

  const filteredPlatformTherapists = (activeSpec === "All"
    ? platformTherapists
    : platformTherapists.filter((t) => t.specializations.includes(activeSpec))
  ).slice().sort((a, b) => (a.id === myTherapistId ? -1 : b.id === myTherapistId ? 1 : 0));

  const visiblePlatformTherapists = showAllPlatform
    ? filteredPlatformTherapists
    : filteredPlatformTherapists.slice(0, 3);

  const matchedTherapist = platformTherapists.find((t) => t.id === myTherapistId) ?? null;

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-4">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-sage-700 via-sage-700 to-sage-800 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 right-32 w-24 h-24 bg-white/[0.03] rounded-full" />
        </div>
        <div className="relative">
          <p className="text-sage-300 text-xs font-semibold uppercase tracking-widest mb-1.5">Mental Health Directory</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Find a Professional</h1>
          <p className="mt-2 text-sage-200/80 text-sm max-w-sm leading-relaxed">
            Connect with YouMindo-verified professionals — message or book a session directly, no external referrals.
          </p>
        </div>
      </div>

      {/* ── Currently matched professional ──────────────────────────────────────── */}
      {matchedTherapist && (
        <div className="bg-white rounded-3xl border border-sage-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className={`w-14 h-14 ${avatarPalette(matchedTherapist.name).bg} rounded-2xl flex items-center justify-center text-lg font-bold ${avatarPalette(matchedTherapist.name).text} flex-shrink-0`}>
            {initials(matchedTherapist.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-stone-900 text-sm">{matchedTherapist.name}</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sage-800 bg-sage-100 px-2 py-0.5 rounded-full">
                <BadgeCheck size={10} strokeWidth={2.5} /> You&apos;re matched
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">{matchedTherapist.title}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => handleMessage(matchedTherapist)}
              disabled={messagingId === matchedTherapist.id}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-4 bg-sage-700 hover:bg-sage-800 disabled:opacity-60 text-white rounded-xl transition-colors shadow-sm"
            >
              {messagingId === matchedTherapist.id
                ? <Loader2 size={12} className="animate-spin" />
                : <MessageCircle size={12} strokeWidth={2} />}
              {messagingId === matchedTherapist.id ? "Opening…" : "Message"}
            </button>
            <button
              onClick={() => setBookingTherapist({ id: matchedTherapist.id, name: matchedTherapist.name, title: matchedTherapist.title })}
              className="text-xs font-semibold py-2.5 px-4 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-xl transition-colors border border-stone-100"
            >
              Book session
            </button>
          </div>
        </div>
      )}

      {/* ── YouMindo Professionals ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm">
        {/* Section header */}
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sage-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} strokeWidth={2} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                YouMindo Professionals
                <span className="text-[10px] font-semibold text-sage-700 bg-sage-50 border border-sage-200 px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Verified Professionals on our platform — message or book directly
              </p>
            </div>
          </div>
          {platformTherapists.length > 0 && (
            <span className="text-xs text-stone-400 flex-shrink-0">
              {platformTherapists.length} professional{platformTherapists.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Why recommended banner */}
        <div className="mx-6 mt-5 mb-1 flex items-start gap-3 bg-sage-50 border border-sage-100 rounded-2xl px-4 py-3.5">
          <BadgeCheck size={16} strokeWidth={2} className="text-sage-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-sage-800 leading-relaxed">
            <span className="font-semibold">Why YouMindo recommends these professionals:</span>{" "}
            Every professional on our platform is identity-verified, holds a recognised mental health credential,
            and has agreed to our professional code of conduct. You can message and book sessions directly
            through YouMindo — no external referrals needed.
          </p>
        </div>

        {/* Specialization filter */}
        {!loadingPlatform && allSpecs.length > 1 && (
          <div className="flex flex-wrap gap-2 px-6 pt-4">
            {["All", ...allSpecs].map((spec) => {
              const isActive = activeSpec === spec;
              return (
                <button
                  key={spec}
                  onClick={() => setActiveSpec(spec)}
                  className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                    isActive
                      ? "bg-sage-700 border-sage-700 text-white"
                      : "bg-white border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700"
                  }`}
                >
                  {spec}
                </button>
              );
            })}
          </div>
        )}

        {/* Cards */}
        <div className="p-5">
          {loadingPlatform && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-stone-50 border border-stone-100 rounded-2xl p-5 animate-pulse">
                  <div className="h-1 bg-stone-200 rounded mb-4" />
                  <div className="flex gap-3 mb-4">
                    <div className="w-12 h-12 bg-stone-200 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-stone-200 rounded w-3/4" />
                      <div className="h-3 bg-stone-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-stone-200 rounded" />
                    <div className="h-3 bg-stone-200 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingPlatform && platformTherapists.length === 0 && (
            <div className="py-10 text-center">
              <div className="w-12 h-12 bg-sage-50 border border-sage-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={22} className="text-sage-400" />
              </div>
              <p className="text-sm font-medium text-stone-700 mb-1">No professionals on the platform yet</p>
              <p className="text-xs text-stone-400">Check back soon — new professionals are added regularly.</p>
            </div>
          )}

          {!loadingPlatform && platformTherapists.length > 0 && filteredPlatformTherapists.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-stone-700 mb-1">No professionals match &quot;{activeSpec}&quot;</p>
              <button
                onClick={() => setActiveSpec("All")}
                className="text-xs font-semibold text-sage-700 hover:text-sage-900 transition-colors"
              >
                Clear filter
              </button>
            </div>
          )}

          {!loadingPlatform && filteredPlatformTherapists.length > 0 && (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visiblePlatformTherapists.map((t) => (
                  <PlatformTherapistCard
                    key={t.id}
                    t={t}
                    onOpen={() => setSelectedTherapist(t)}
                    onMessage={() => handleMessage(t)}
                    onBook={() => setBookingTherapist({ id: t.id, name: t.name, title: t.title })}
                    onRequest={() => handleRequest(t)}
                    messageLoading={messagingId === t.id}
                    myTherapistId={myTherapistId}
                    requestState={requestStates[t.id]}
                    wasSwitch={wasSwitch[t.id]}
                  />
                ))}
              </div>

              {filteredPlatformTherapists.length > 3 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAllPlatform((p) => !p)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage-700 hover:text-sage-900 transition-colors"
                  >
                    {showAllPlatform ? "Show fewer" : `Show all ${filteredPlatformTherapists.length} professionals`}
                    <ChevronRight size={13} strokeWidth={2} className={`transition-transform ${showAllPlatform ? "rotate-90" : ""}`} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {bookingTherapist && (
        <BookingModal
          therapistId={bookingTherapist.id}
          therapistName={bookingTherapist.name}
          therapistTitle={bookingTherapist.title}
          onClose={() => setBookingTherapist(null)}
        />
      )}

      {selectedTherapist && (
        <TherapistProfileModal
          t={platformTherapists.find((pt) => pt.id === selectedTherapist.id) ?? selectedTherapist}
          onClose={() => setSelectedTherapist(null)}
          onMessage={() => handleMessage(selectedTherapist)}
          onBook={() => {
            setBookingTherapist({ id: selectedTherapist.id, name: selectedTherapist.name, title: selectedTherapist.title });
            setSelectedTherapist(null);
          }}
          onRequest={() => handleRequest(selectedTherapist)}
          messageLoading={messagingId === selectedTherapist.id}
          myTherapistId={myTherapistId}
          requestState={requestStates[selectedTherapist.id]}
          wasSwitch={wasSwitch[selectedTherapist.id]}
        />
      )}
    </div>
  );
}
