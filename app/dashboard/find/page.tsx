"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, Phone, Globe, Shield, Navigation, Search, X,
  Stethoscope, Brain, ClipboardList, HandHeart,
  Users, Pill, Loader2, SlidersHorizontal, Check,
  Star, MessageCircle, BadgeCheck, Sparkles, ChevronRight,
} from "lucide-react";
import BookingModal from "@/components/dashboard/BookingModal";

// ── Platform therapist type ───────────────────────────────────────────────────

type PlatformTherapist = {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  title: string;
  specializations: string[];
  bio: string | null;
  rating: number;
  totalSessions: number;
  activeClients: number;
  maxClients: number | null;
  isFull: boolean;
};

// ── External provider data ────────────────────────────────────────────────────

const NEEDS = [
  { id: "anxiety",          label: "Anxiety",           emoji: "😰", desc: "Worry, panic, phobias" },
  { id: "depression",       label: "Depression",         emoji: "💙", desc: "Sadness, hopelessness" },
  { id: "trauma",           label: "Trauma / PTSD",      emoji: "🛡️", desc: "Past trauma, flashbacks" },
  { id: "adhd",             label: "ADHD",               emoji: "⚡", desc: "Focus, hyperactivity" },
  { id: "addiction",        label: "Addiction",          emoji: "🔗", desc: "Substance use, behaviors" },
  { id: "grief",            label: "Grief & Loss",       emoji: "🌧️", desc: "Loss, bereavement" },
  { id: "relationship",     label: "Relationships",      emoji: "💑", desc: "Couples, family, social" },
  { id: "eating-disorders", label: "Eating Disorders",   emoji: "🌱", desc: "ED recovery, body image" },
  { id: "ocd",              label: "OCD",                emoji: "🔄", desc: "Obsessions, compulsions" },
  { id: "anger",            label: "Anger",              emoji: "🌋", desc: "Anger management" },
  { id: "stress",           label: "Stress / Burnout",   emoji: "🔥", desc: "Work stress, burnout" },
  { id: "bipolar",          label: "Bipolar Disorder",   emoji: "🌊", desc: "Mood episodes" },
  { id: "sleep",            label: "Sleep Issues",       emoji: "🌙", desc: "Insomnia, sleep anxiety" },
  { id: "self-esteem",      label: "Self-Esteem",        emoji: "🌟", desc: "Confidence, identity" },
];

const PROVIDER_TYPES = [
  { id: "therapist",          labelUS: "Therapist",           labelDK: "Psykoterapeut",    Icon: Brain,         descUS: "Talk therapy, CBT, DBT",              descDK: "Samtaleterapi, KAT, psykoterapi" },
  { id: "psychiatrist",       labelUS: "Psychiatrist",         labelDK: "Psykiater",        Icon: Stethoscope,   descUS: "Medication management (MD)",           descDK: "Medicinsk behandling, speciallæge" },
  { id: "psychologist",       labelUS: "Psychologist",         labelDK: "Psykolog",         Icon: ClipboardList, descUS: "Assessment & therapy (PhD/PsyD)",      descDK: "Autoriseret psykolog, test & terapi" },
  { id: "social-worker",      labelUS: "Social Worker",        labelDK: "Socialrådgiver",   Icon: HandHeart,     descUS: "LCSW, holistic support",               descDK: "Rådgivning, sociale ressourcer" },
  { id: "marriage-family",    labelUS: "Marriage & Family",    labelDK: "Parterapeut",      Icon: Users,         descUS: "Couples & family therapy",             descDK: "Par- og familieterapi" },
  { id: "addiction-counselor",labelUS: "Addiction Specialist", labelDK: "Misbrugsbehandler",Icon: Pill,          descUS: "Substance use & recovery",             descDK: "Rusmiddelbehandling, afhængighed" },
];

const NEED_RECOMMENDATIONS: Record<string, string[]> = {
  anxiety:           ["therapist", "psychologist", "psychiatrist"],
  depression:        ["psychiatrist", "therapist", "psychologist"],
  trauma:            ["therapist", "psychologist"],
  adhd:              ["psychiatrist", "psychologist", "therapist"],
  addiction:         ["addiction-counselor", "therapist"],
  grief:             ["therapist", "social-worker"],
  relationship:      ["marriage-family", "therapist"],
  "eating-disorders":["therapist", "psychologist", "psychiatrist"],
  ocd:               ["therapist", "psychologist"],
  anger:             ["therapist", "social-worker"],
  stress:            ["therapist", "social-worker"],
  bipolar:           ["psychiatrist", "therapist", "psychologist"],
  sleep:             ["psychologist", "therapist"],
  "self-esteem":     ["therapist", "social-worker"],
};

const US_STATES: [string, string][] = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],
  ["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["DC","D.C."],["FL","Florida"],
  ["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],
  ["IA","Iowa"],["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],
  ["MD","Maryland"],["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],
  ["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],
  ["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],["ND","North Dakota"],
  ["OH","Ohio"],["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],
  ["SC","South Carolina"],["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],
  ["VT","Vermont"],["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],
];

const DK_CITIES = [
  "København","Aarhus","Odense","Aalborg","Esbjerg","Randers","Kolding",
  "Horsens","Vejle","Roskilde","Helsingør","Silkeborg","Herning","Næstved","Viborg",
];

type Provider = {
  id: string;
  name: string;
  credential: string;
  gender: string;
  specialty: string;
  address: { street: string; city: string; state: string; zip: string };
  phone: string;
  website: string;
  lat: number | null;
  lon: number | null;
  isIndividual: boolean;
  country: string;
  source: string;
  proffUrl?: string;
  distKm?: number;
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

// ── Step header ───────────────────────────────────────────────────────────────

function StepHeader({
  n, title, subtitle, action,
}: {
  n: number; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-stone-50">
      <div className="w-7 h-7 rounded-full bg-sage-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</div>
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-stone-800 text-sm leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Platform therapist card ───────────────────────────────────────────────────

function PlatformTherapistCard({
  t, onMessage, onBook, onRequest, messageLoading, myTherapistId, requestState,
}: {
  t: PlatformTherapist;
  onMessage: () => void;
  onBook: () => void;
  onRequest: () => void;
  messageLoading: boolean;
  myTherapistId: string | null;
  requestState?: "loading" | "assigned" | "waitlisted" | "error";
}) {
  const pal = avatarPalette(t.name);
  const ini = initials(t.name);
  const specs = t.specializations.length > 0
    ? t.specializations.slice(0, 3).join(" · ")
    : null;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-lg hover:border-stone-200 transition-all duration-200 flex flex-col group">
      {/* YouMindo badge stripe */}
      <div className="h-1 bg-gradient-to-r from-sage-500 to-sage-700" />

      <div className="p-5 flex-1">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-12 h-12 ${pal.bg} rounded-xl flex items-center justify-center text-base font-bold ${pal.text} flex-shrink-0 transition-transform group-hover:scale-105`}>
            {ini}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-bold text-stone-900 leading-snug">{t.name}</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sage-700 bg-sage-50 border border-sage-200 px-2 py-0.5 rounded-full flex-shrink-0">
                <BadgeCheck size={10} strokeWidth={2.5} /> YouMindo Verified
              </span>
            </div>
            <p className="text-xs text-sage-700 font-semibold mt-0.5">{t.title}</p>
            {specs && <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">{specs}</p>}
          </div>
        </div>

        {/* Bio */}
        {t.bio ? (
          <p className="text-xs text-stone-500 leading-relaxed line-clamp-3 mb-4">{t.bio}</p>
        ) : (
          <p className="text-xs text-stone-300 italic mb-4">Licensed mental health professional on YouMindo</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[11px] text-stone-400">
          {t.rating > 0 && (
            <span className="flex items-center gap-1">
              <Star size={11} strokeWidth={2} className="text-amber-400 fill-amber-400" />
              <span className="font-semibold text-stone-600">{t.rating.toFixed(1)}</span>
            </span>
          )}
          {t.totalSessions > 0 && (
            <span><span className="font-semibold text-stone-600">{t.totalSessions}</span> sessions</span>
          )}
          {t.activeClients > 0 && (
            <span><span className="font-semibold text-stone-600">{t.activeClients}</span> clients</span>
          )}
          {t.isFull && (
            <span className="text-amber-600 font-semibold">Full — waitlist open</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-5 pb-5 pt-3 border-t border-stone-50">
        {t.id === myTherapistId ? (
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
        ) : myTherapistId === null ? (
          requestState === "assigned" ? (
            <span className="flex-1 text-xs font-semibold py-2.5 px-2 text-center text-sage-700">Matched! Refresh to message.</span>
          ) : requestState === "waitlisted" ? (
            <span className="flex-1 text-xs font-semibold py-2.5 px-2 text-center text-amber-600">You're on the waitlist.</span>
          ) : (
            <button
              onClick={onRequest}
              disabled={requestState === "loading"}
              className="flex items-center justify-center gap-1.5 flex-1 text-xs font-semibold py-2.5 px-2 bg-sage-700 hover:bg-sage-800 disabled:opacity-60 text-white rounded-xl transition-colors shadow-sm"
            >
              {requestState === "loading" ? <Loader2 size={12} className="animate-spin" /> : null}
              {requestState === "loading" ? "Requesting…" : t.isFull ? "Join waitlist" : "Request this therapist"}
            </button>
          )
        ) : (
          <span className="flex-1 text-xs text-stone-400 py-2.5 px-2 text-center">You already have an assigned therapist</span>
        )}
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

  const [country, setCountry] = useState("us");
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState("therapist");
  const [city, setCity] = useState("");
  const [usState, setUsState] = useState("NY");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"default" | "name" | "distance">("default");
  const [showAllPlatform, setShowAllPlatform] = useState(false);

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

  const visiblePlatformTherapists = showAllPlatform
    ? platformTherapists
    : platformTherapists.slice(0, 3);

  const recommendedTypes = selectedNeed ? (NEED_RECOMMENDATIONS[selectedNeed] ?? []) : [];
  const activeNeed = NEEDS.find((n) => n.id === selectedNeed);
  const isDK = country === "dk";

  function handleCountryChange(c: string) {
    setCountry(c);
    setCity("");
    setProviders([]);
    setSearched(false);
    setError(null);
  }

  function handleNeedSelect(needId: string) {
    const next = needId === selectedNeed ? null : needId;
    setSelectedNeed(next);
    if (next) {
      const recs = NEED_RECOMMENDATIONS[next] ?? [];
      if (recs.length) setSelectedType(recs[0]);
    }
  }

  async function handleSearch() {
    if (!city.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const params = new URLSearchParams({ country, type: selectedType, city: city.trim(), limit: "20" });
      if (!isDK) params.set("state", usState);
      const res = await fetch(`/api/find?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProviders(data.providers);
      setCount(data.count);
    } catch {
      setError("Could not load providers. Please try again.");
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }

  const activeProviderType = PROVIDER_TYPES.find((p) => p.id === selectedType);

  const sortedProviders = [...providers].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "distance" && a.distKm !== undefined && b.distKm !== undefined)
      return a.distKm - b.distKm;
    return 0;
  });

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-4">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-sage-700 via-sage-700 to-sage-800 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 right-32 w-24 h-24 bg-white/[0.03] rounded-full" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <p className="text-sage-300 text-xs font-semibold uppercase tracking-widest mb-1.5">Mental Health Directory</p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Find a Professional</h1>
            <p className="mt-2 text-sage-200/80 text-sm max-w-sm leading-relaxed">
              Connect with YouMindo-verified professionals or search local licensed providers.
            </p>
          </div>
          <div className="flex gap-1 bg-black/20 rounded-2xl p-1 self-start sm:self-auto flex-shrink-0 backdrop-blur-sm">
            {[{ id: "us", label: "🇺🇸 USA" }, { id: "dk", label: "🇩🇰 Denmark" }].map((c) => (
              <button
                key={c.id}
                onClick={() => handleCountryChange(c.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  country === c.id
                    ? "bg-white text-sage-700 shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

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
                Verified therapists on our platform — message or book directly
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
            Every therapist on our platform is identity-verified, holds a recognised mental health credential,
            and has agreed to our professional code of conduct. You can message and book sessions directly
            through YouMindo — no external referrals needed.
          </p>
        </div>

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
              <p className="text-xs text-stone-400">Use the search below to find licensed providers in your area.</p>
            </div>
          )}

          {!loadingPlatform && platformTherapists.length > 0 && (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visiblePlatformTherapists.map((t) => (
                  <PlatformTherapistCard
                    key={t.id}
                    t={t}
                    onMessage={() => handleMessage(t)}
                    onBook={() => setBookingTherapist({ id: t.id, name: t.name, title: t.title })}
                    onRequest={() => handleRequest(t)}
                    messageLoading={messagingId === t.id}
                    myTherapistId={myTherapistId}
                    requestState={requestStates[t.id]}
                  />
                ))}
              </div>

              {platformTherapists.length > 3 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAllPlatform((p) => !p)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage-700 hover:text-sage-900 transition-colors"
                  >
                    {showAllPlatform ? "Show fewer" : `Show all ${platformTherapists.length} professionals`}
                    <ChevronRight size={13} strokeWidth={2} className={`transition-transform ${showAllPlatform ? "rotate-90" : ""}`} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────────── */}
      <div className="relative flex items-center gap-4">
        <div className="flex-1 h-px bg-stone-200" />
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest bg-stone-50 px-3 py-1 rounded-full border border-stone-200">
          Or search local providers
        </span>
        <div className="flex-1 h-px bg-stone-200" />
      </div>

      {/* ── Step 1: What brings you here ──────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm">
        <StepHeader
          n={1}
          title="What brings you here?"
          subtitle="Choose what you'd like support with — helps us recommend the right provider"
          action={
            selectedNeed ? (
              <button
                onClick={() => setSelectedNeed(null)}
                className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-100 hover:border-stone-200 px-3 py-1.5 rounded-full transition-all flex-shrink-0"
              >
                <X size={10} /> Clear
              </button>
            ) : (
              <span className="text-xs text-stone-300 flex-shrink-0">Optional</span>
            )
          }
        />
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {NEEDS.map((need) => {
              const isActive = selectedNeed === need.id;
              return (
                <button
                  key={need.id}
                  onClick={() => handleNeedSelect(need.id)}
                  className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    isActive
                      ? "bg-sage-700 border-sage-700 text-white shadow-lg shadow-sage-200"
                      : "bg-stone-50 border-stone-100 text-stone-700 hover:bg-white hover:border-stone-200 hover:shadow-sm"
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                      <Check size={9} strokeWidth={3} />
                    </span>
                  )}
                  <span className={`text-2xl w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${isActive ? "bg-white/15" : "bg-white"}`}>
                    {need.emoji}
                  </span>
                  <div>
                    <div className="font-semibold text-[13px] leading-tight">{need.label}</div>
                    <div className={`text-[11px] mt-0.5 leading-tight ${isActive ? "text-white/65" : "text-stone-400"}`}>{need.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Step 2: Provider type ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm">
        <StepHeader
          n={2}
          title="Who would you like to see?"
          subtitle={activeProviderType ? (isDK ? activeProviderType.descDK : activeProviderType.descUS) : "Select a provider type"}
        />
        <div className="p-5 space-y-4">
          {recommendedTypes.length > 0 && activeNeed && (
            <div className="flex items-center gap-2.5 bg-sage-50 border border-sage-100 rounded-2xl px-4 py-3">
              <span className="text-base flex-shrink-0">💡</span>
              <p className="text-sm text-sage-700">
                For <strong>{activeNeed.label}</strong>, we recommend:{" "}
                <span className="font-medium">
                  {recommendedTypes
                    .map((t) => PROVIDER_TYPES.find((p) => p.id === t))
                    .filter(Boolean)
                    .map((pt) => (isDK ? pt!.labelDK : pt!.labelUS))
                    .join(", ")}
                </span>
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PROVIDER_TYPES.map((pt) => {
              const isActive = selectedType === pt.id;
              const isRec = recommendedTypes.includes(pt.id);
              const { Icon } = pt;
              return (
                <button
                  key={pt.id}
                  onClick={() => setSelectedType(pt.id)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-150 ${
                    isActive
                      ? "bg-sage-700 border-sage-700 text-white shadow-md shadow-sage-200"
                      : isRec
                      ? "bg-sage-50 border-sage-200 text-sage-800 hover:bg-sage-100"
                      : "bg-stone-50 border-stone-100 text-stone-600 hover:bg-white hover:border-stone-200 hover:shadow-sm"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isActive ? "bg-white/20" : isRec ? "bg-sage-100 text-sage-600" : "bg-white border border-stone-100 text-stone-500"
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm leading-tight">{isDK ? pt.labelDK : pt.labelUS}</div>
                    <div className={`text-[11px] mt-1 leading-snug ${
                      isActive ? "text-white/65" : isRec ? "text-sage-500" : "text-stone-400"
                    }`}>
                      {isRec && !isActive
                        ? <><span className="font-semibold text-sage-500">Recommended · </span>{isDK ? pt.descDK : pt.descUS}</>
                        : (isDK ? pt.descDK : pt.descUS)
                      }
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Step 3: Location + Search ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm">
        <StepHeader
          n={3}
          title="Where are you located?"
          subtitle="We'll find licensed providers near you"
        />
        <div className="p-5">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {isDK ? (
              <div className="flex-1 relative">
                <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="City in Denmark (e.g. København, Aarhus…)"
                  list="dk-cities"
                  className="w-full border border-stone-200 rounded-2xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all bg-stone-50 focus:bg-white"
                />
                <datalist id="dk-cities">
                  {DK_CITIES.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
            ) : (
              <>
                <div className="flex-1 relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="City"
                    className="w-full border border-stone-200 rounded-2xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all bg-stone-50 focus:bg-white"
                  />
                </div>
                <select
                  value={usState}
                  onChange={(e) => setUsState(e.target.value)}
                  className="border border-stone-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all bg-stone-50 focus:bg-white text-stone-700 sm:w-52"
                >
                  {US_STATES.map(([code, name]) => (
                    <option key={code} value={code}>{name} ({code})</option>
                  ))}
                </select>
              </>
            )}
            <button
              onClick={handleSearch}
              disabled={!city.trim() || loading}
              className="flex items-center justify-center gap-2 bg-sage-700 hover:bg-sage-800 active:bg-sage-900 text-white font-semibold px-8 py-3 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm flex-shrink-0 shadow-sm hover:shadow-md"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {loading ? "Searching…" : "Find Providers"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Loading skeletons ──────────────────────────────────────────────────── */}
      {loading && (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-stone-100 animate-pulse">
              <div className="flex gap-4 items-start mb-5">
                <div className="w-14 h-14 bg-stone-100 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className="h-4 bg-stone-100 rounded-lg w-3/4" />
                  <div className="h-3 bg-stone-100 rounded-lg w-1/2" />
                </div>
                <div className="w-16 h-5 bg-stone-100 rounded-full flex-shrink-0" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-stone-100 rounded-lg w-full" />
                <div className="h-3 bg-stone-100 rounded-lg w-2/3" />
              </div>
              <div className="flex gap-2 pt-3 border-t border-stone-50">
                <div className="flex-1 h-8 bg-stone-100 rounded-xl" />
                <div className="flex-1 h-8 bg-stone-100 rounded-xl" />
                <div className="flex-1 h-8 bg-stone-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-red-600 text-sm text-center">{error}</div>
      )}

      {/* ── Results ───────────────────────────────────────────────────────────── */}
      {!loading && providers.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white border border-stone-100 rounded-2xl px-5 py-3.5 shadow-sm">
            <p className="text-sm text-stone-500">
              <span className="font-semibold text-stone-800">{providers.length}</span>
              {count > providers.length && (
                <> of <span className="font-semibold text-stone-800">{count.toLocaleString()}</span></>
              )}{" "}
              {isDK
                ? PROVIDER_TYPES.find((p) => p.id === selectedType)?.labelDK
                : PROVIDER_TYPES.find((p) => p.id === selectedType)?.labelUS}
              s near{" "}
              <span className="font-semibold text-stone-800">{city}{!isDK && `, ${usState}`}</span>
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <SlidersHorizontal size={13} className="text-stone-300 mr-1" />
              {(["default", "name", "distance"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    sortBy === s ? "bg-stone-800 text-white" : "text-stone-400 hover:text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {s === "default" ? "Default" : s === "name" ? "Name" : "Distance"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {sortedProviders.map((p) => (
              <ProviderCard key={p.id} provider={p} isDK={isDK} />
            ))}
          </div>

          <p className="text-xs text-stone-400 text-center pt-2">
            {isDK
              ? "Data sourced from Proff.dk via the Danish CVR (Central Business Register). Contact providers directly to confirm availability."
              : "Data from the NPPES National Provider Identifier Registry. Contact providers directly to confirm availability."}
          </p>
        </>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────────── */}
      {!loading && searched && !error && providers.length === 0 && (
        <div className="bg-white rounded-3xl border border-stone-100 p-14 text-center shadow-sm">
          <div className="w-14 h-14 bg-stone-50 border border-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search size={22} className="text-stone-300" />
          </div>
          <h3 className="font-semibold text-stone-800 mb-1">No providers found</h3>
          <p className="text-stone-400 text-sm max-w-sm mx-auto">
            {isDK ? "Try a larger city or a different provider type." : "Try a different city, state, or provider type."}
          </p>
        </div>
      )}

      {/* ── Pre-search hint ───────────────────────────────────────────────────── */}
      {!searched && (
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="p-8 text-center border-b border-stone-50">
            <div className="w-12 h-12 bg-sage-50 border border-sage-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain size={22} className="text-sage-600" />
            </div>
            <h3 className="font-semibold text-stone-800 mb-1.5">
              {isDK ? "Find hjælp i Danmark" : "Find help near you"}
            </h3>
            <p className="text-stone-400 text-sm max-w-xs mx-auto leading-relaxed">
              {isDK
                ? "Vælg hvad du har brug for, vælg en faggruppe og angiv din by."
                : "Tell us what you need, choose a provider type, then enter your city."}
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-stone-50">
            {[
              { step: "1", label: "Pick a topic", icon: "🎯" },
              { step: "2", label: "Choose provider", icon: "👤" },
              { step: "3", label: "Enter your city", icon: "📍" },
            ].map(({ step, label, icon }) => (
              <div key={step} className="flex flex-col items-center gap-2 py-5 px-4 text-center">
                <span className="text-xl">{icon}</span>
                <div>
                  <div className="text-[10px] font-bold text-stone-300 uppercase tracking-wider">Step {step}</div>
                  <div className="text-xs font-medium text-stone-500 mt-0.5">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bookingTherapist && (
        <BookingModal
          therapistId={bookingTherapist.id}
          therapistName={bookingTherapist.name}
          therapistTitle={bookingTherapist.title}
          onClose={() => setBookingTherapist(null)}
        />
      )}
    </div>
  );
}

// ── External provider card ────────────────────────────────────────────────────

function ProviderCard({ provider: p, isDK }: { provider: Provider; isDK: boolean }) {
  const ini = initials(p.name);
  const palette = avatarPalette(p.name);

  const mapsUrl = p.lat && p.lon
    ? `https://www.google.com/maps?q=${p.lat},${p.lon}`
    : `https://www.google.com/maps/search/${encodeURIComponent(`${p.name} ${p.address.city}`)}`;
  const profileUrl = p.country === "US"
    ? `https://npiregistry.cms.hhs.gov/provider-view/${p.id}`
    : (p.proffUrl ?? `https://www.proff.dk`);
  const cleanPhone = p.phone.replace(/[^\d+]/g, "");
  const specialtyLabel = p.specialty.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const displayWebsite = p.website.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden hover:shadow-lg hover:border-stone-200 transition-all duration-200 group flex flex-col">
      <div className="p-5 pb-4 flex-1">
        <div className="flex gap-4 items-start">
          <div className={`w-[52px] h-[52px] ${palette.bg} rounded-2xl flex items-center justify-center font-bold text-base ${palette.text} flex-shrink-0 select-none transition-transform group-hover:scale-105`}>
            {ini}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-bold text-stone-800 text-sm leading-snug">
              {p.name}
              {p.credential && <span className="text-stone-400 font-normal text-xs ml-0.5">, {p.credential}</span>}
            </h3>
            <p className="text-sage-600 text-xs font-semibold mt-1">{specialtyLabel}</p>
            {p.gender && (
              <p className="text-[11px] text-stone-400 mt-0.5">
                {p.gender === "M" ? "Male provider" : p.gender === "F" ? "Female provider" : ""}
              </p>
            )}
          </div>
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full flex-shrink-0">
            <Shield size={9} /> {p.country === "DK" ? "CVR" : "Licensed"}
          </span>
        </div>

        <div className="mt-4 space-y-1.5">
          {(p.address.street || p.address.city) && (
            <div className="flex items-start gap-2 text-xs text-stone-500">
              <MapPin size={12} className="flex-shrink-0 mt-0.5 text-stone-300" />
              <span>
                {p.address.street ? `${p.address.street}, ` : ""}
                {p.address.city}
                {p.address.zip && p.country === "DK" ? ` ${p.address.zip}` : ""}
                {!p.address.street && p.country === "US" ? `, ${p.address.state} ${p.address.zip}` : ""}
              </span>
            </div>
          )}
          {p.phone && (
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Phone size={12} className="flex-shrink-0 text-stone-300" />
              <a href={`tel:${cleanPhone}`} className="hover:text-sage-700 transition-colors">{p.phone}</a>
            </div>
          )}
          {p.website && (
            <div className="flex items-center gap-2 text-xs text-stone-500 min-w-0">
              <Globe size={12} className="flex-shrink-0 text-stone-300" />
              <a
                href={p.website.startsWith("http") ? p.website : `https://${p.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-sage-700 transition-colors truncate"
              >
                {displayWebsite}
              </a>
            </div>
          )}
          {p.distKm !== undefined && (
            <div className="flex items-center gap-2 text-xs text-stone-400 mt-1">
              <Navigation size={11} className="text-stone-300 flex-shrink-0" />
              {p.distKm} km away
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 px-5 pb-5 pt-3 border-t border-stone-50">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 flex-1 text-xs font-semibold py-2.5 px-2 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-xl transition-colors border border-stone-100"
        >
          <Navigation size={12} />
          {isDK ? "Vejviser" : "Directions"}
        </a>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 flex-1 text-xs font-semibold py-2.5 px-2 bg-sage-50 hover:bg-sage-100 text-sage-700 rounded-xl transition-colors border border-sage-100"
        >
          <Shield size={12} />
          {isDK ? "Proff.dk" : "NPI Profile"}
        </a>
        {p.phone ? (
          <a
            href={`tel:${cleanPhone}`}
            className="flex items-center justify-center gap-1.5 flex-1 text-xs font-semibold py-2.5 px-2 bg-sage-700 hover:bg-sage-800 text-white rounded-xl transition-colors shadow-sm"
          >
            <Phone size={12} />
            {isDK ? "Ring" : "Call"}
          </a>
        ) : p.website ? (
          <a
            href={p.website.startsWith("http") ? p.website : `https://${p.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 flex-1 text-xs font-semibold py-2.5 px-2 bg-sage-700 hover:bg-sage-800 text-white rounded-xl transition-colors shadow-sm"
          >
            <Globe size={12} />
            {isDK ? "Besøg" : "Visit"}
          </a>
        ) : null}
      </div>
    </div>
  );
}
