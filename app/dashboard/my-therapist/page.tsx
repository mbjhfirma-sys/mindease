"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star, MessageCircle, CalendarPlus, GraduationCap, Languages,
  BadgeCheck, Clock, Users, BookOpen, ChevronRight, Search,
} from "lucide-react";
import BookingModal from "@/components/dashboard/BookingModal";

type Appointment = {
  date: string; type: string; status: string; duration: number;
};

type Therapist = {
  id: string; userId: string;
  name: string; email: string; avatar: string | null;
  title: string; specializations: string[];
  bio: string | null; approach: string | null;
  yearsOfExperience: number | null;
  education: string[]; languages: string[];
  licenseNumber: string | null;
  rating: number; totalSessions: number; sessionsWithMe: number;
  nextAppointment: Appointment | null;
};

const SPEC_COLORS: Record<string, string> = {
  anxiety:       "bg-violet-50 text-violet-700 border-violet-200",
  depression:    "bg-blue-50 text-blue-700 border-blue-200",
  trauma:        "bg-amber-50 text-amber-700 border-amber-200",
  ptsd:          "bg-amber-50 text-amber-700 border-amber-200",
  adhd:          "bg-yellow-50 text-yellow-700 border-yellow-200",
  grief:         "bg-teal-50 text-teal-700 border-teal-200",
  relationships: "bg-pink-50 text-pink-700 border-pink-200",
  cbt:           "bg-sage-50 text-sage-700 border-sage-200",
  dbt:           "bg-sage-50 text-sage-700 border-sage-200",
  mindfulness:   "bg-green-50 text-green-700 border-green-200",
  addiction:     "bg-orange-50 text-orange-700 border-orange-200",
  ocd:           "bg-red-50 text-red-700 border-red-200",
  stress:        "bg-stone-50 text-stone-700 border-stone-200",
};

function specColor(s: string) {
  const key = s.toLowerCase().replace(/[^a-z]/g, "");
  for (const [k, v] of Object.entries(SPEC_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-stone-50 text-stone-700 border-stone-200";
}

function fmtApptDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
    " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          className={i <= Math.round(value) ? "text-amber-400 fill-amber-400" : "text-stone-200 fill-stone-200"}
        />
      ))}
      <span className="text-sm font-semibold text-stone-800 ml-1.5">{value.toFixed(1)}</span>
    </div>
  );
}

export default function MyTherapistPage() {
  const router = useRouter();
  const [therapist, setTherapist] = useState<Therapist | null | undefined>(undefined);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);

  async function messageTherapist() {
    if (!therapist || startingConversation) return;
    setStartingConversation(true);
    try {
      const r = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ therapistId: therapist.id }),
      });
      const d = await r.json();
      if (r.ok && d.conversationId) {
        router.push(`/dashboard/messages?open=${d.conversationId}`);
      } else {
        router.push("/dashboard/messages");
      }
    } finally {
      setStartingConversation(false);
    }
  }

  useEffect(() => {
    fetch("/api/my-therapist")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => {
        const t = d.therapist;
        if (t) {
          t.specializations = t.specializations ?? [];
          t.education       = t.education       ?? [];
          t.languages       = t.languages       ?? [];
        }
        setTherapist(t ?? null);
      })
      .catch(() => setTherapist(null));
  }, []);

  // Loading
  if (therapist === undefined) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-6 bg-stone-100 rounded w-1/3" />
        <div className="bg-white border border-stone-100 rounded-2xl p-6 flex gap-5">
          <div className="w-20 h-20 bg-stone-100 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-stone-100 rounded w-1/2" />
            <div className="h-3 bg-stone-100 rounded w-1/3" />
            <div className="h-3 bg-stone-100 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  // No therapist assigned
  if (therapist === null) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-stone-100 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🩺</div>
          <h2 className="text-lg font-semibold text-stone-900 mb-2">No therapist assigned yet</h2>
          <p className="text-sm text-stone-500 mb-6 max-w-sm mx-auto">
            Browse our network of licensed therapists and book your first session to get matched.
          </p>
          <Link
            href="/dashboard/find"
            className="inline-flex items-center gap-2 bg-stone-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-stone-800 transition-colors"
          >
            <Search size={15} />
            Find a Therapist
          </Link>
        </div>
      </div>
    );
  }

  const initials = therapist.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-1">Care Team</p>
        <h1 className="text-2xl font-semibold text-stone-900">My Therapist</h1>
      </div>

      {/* Hero card */}
      <div className="bg-white border border-stone-100 rounded-2xl p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-sage-100 flex items-center justify-center flex-shrink-0">
            {therapist.avatar
              ? <img src={therapist.avatar} alt={therapist.name} className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-sage-700">{initials}</span>}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-stone-900 leading-tight">{therapist.name}</h2>
                <p className="text-sm text-stone-500 mt-0.5">{therapist.title}</p>
                {therapist.licenseNumber && (
                  <div className="flex items-center gap-1 mt-1">
                    <BadgeCheck size={13} className="text-sage-600" />
                    <span className="text-xs text-stone-400">License {therapist.licenseNumber}</span>
                  </div>
                )}
              </div>
              {therapist.rating > 0 && <Stars value={therapist.rating} />}
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3 mt-3">
              {therapist.yearsOfExperience && (
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <Clock size={12} className="text-stone-400" />
                  {therapist.yearsOfExperience} yrs experience
                </div>
              )}
              {therapist.totalSessions > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <Users size={12} className="text-stone-400" />
                  {therapist.totalSessions.toLocaleString()} sessions
                </div>
              )}
              {therapist.sessionsWithMe > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <BookOpen size={12} className="text-stone-400" />
                  {therapist.sessionsWithMe} session{therapist.sessionsWithMe !== 1 ? "s" : ""} with you
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={messageTherapist}
                disabled={startingConversation}
                className="flex items-center gap-1.5 bg-stone-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50"
              >
                <MessageCircle size={13} />
                {startingConversation ? "Opening…" : "Message"}
              </button>
              <button
                onClick={() => setBookingOpen(true)}
                className="flex items-center gap-1.5 border border-stone-200 text-stone-700 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-stone-50 transition-colors"
              >
                <CalendarPlus size={13} />
                Book Session
              </button>
            </div>
          </div>
        </div>

        {/* Next appointment */}
        {therapist.nextAppointment && (
          <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-0.5">Next Session</p>
              <p className="text-sm font-medium text-stone-800">{fmtApptDate(therapist.nextAppointment.date)}</p>
              <p className="text-xs text-stone-400 mt-0.5 capitalize">
                {therapist.nextAppointment.type.replace("_", " ")} · {therapist.nextAppointment.duration} min · {therapist.nextAppointment.status}
              </p>
            </div>
            <Link href="/dashboard/schedule" className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors">
              View schedule <ChevronRight size={12} />
            </Link>
          </div>
        )}
      </div>

      {/* About */}
      {therapist.bio && (
        <Section title="About">
          <p className="text-sm text-stone-600 leading-relaxed">{therapist.bio}</p>
        </Section>
      )}

      {/* Specialisations */}
      {therapist.specializations.length > 0 && (
        <Section title="Specialisations">
          <div className="flex flex-wrap gap-2">
            {therapist.specializations.map((s) => (
              <span key={s} className={`text-xs font-medium px-3 py-1.5 rounded-full border ${specColor(s)}`}>
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Therapeutic approach */}
      {therapist.approach && (
        <Section title="Therapeutic Approach">
          <p className="text-sm text-stone-600 leading-relaxed">{therapist.approach}</p>
        </Section>
      )}

      {/* Education */}
      {therapist.education.length > 0 && (
        <Section title="Education & Qualifications" Icon={GraduationCap}>
          <ul className="space-y-2">
            {therapist.education.map((e, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-stone-600">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-2 flex-shrink-0" />
                {e}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Languages */}
      {therapist.languages.length > 0 && (
        <Section title="Languages" Icon={Languages}>
          <div className="flex flex-wrap gap-2">
            {therapist.languages.map((l) => (
              <span key={l} className="text-xs font-medium px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-stone-700">
                {l}
              </span>
            ))}
          </div>
        </Section>
      )}

      {bookingOpen && (
        <BookingModal onClose={() => setBookingOpen(false)} />
      )}
    </div>
  );
}

function Section({ title, Icon, children }: {
  title: string;
  Icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={15} className="text-stone-400" strokeWidth={1.5} />}
        <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}
