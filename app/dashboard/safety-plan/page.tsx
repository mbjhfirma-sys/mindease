"use client";

import { useState, useEffect } from "react";
import type { SafetyPlan, SafetyPlanContact } from "@/lib/types";

const EMPTY: SafetyPlan = {
  warningSigns: [], copingStrategies: [], distractionContacts: [], supportContacts: [],
  professionalContacts: [], safeEnvironmentSteps: [], sharedWithTherapist: false,
};

const CRISIS_LINES = [
  { name: "988 Suicide & Crisis Lifeline", detail: "Call or text 988 — available 24/7", tel: "988", sms: "988" },
  { name: "Crisis Text Line", detail: "Text HOME to 741741", tel: null, sms: "741741" },
  { name: "Samaritans (UK/ROI)", detail: "Call 116 123 — free, 24/7", tel: "116123", sms: null },
];

function ListEditor({ label, placeholder, items, onChange }: { label: string; placeholder: string; items: string[]; onChange: (items: string[]) => void }) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
  }
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-2">{label}</label>
      <div className="space-y-1.5 mb-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
            <span className="flex-1 text-sm text-stone-700">{item}</span>
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-stone-300 hover:text-red-400 text-sm">✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sage-400 transition-colors"
        />
        <button onClick={add} className="text-sm border border-stone-200 text-stone-600 px-3 rounded-lg hover:bg-stone-50 transition-colors">Add</button>
      </div>
    </div>
  );
}

function ContactEditor({ label, contacts, onChange }: { label: string; contacts: SafetyPlanContact[]; onChange: (c: SafetyPlanContact[]) => void }) {
  function update(i: number, patch: Partial<SafetyPlanContact>) {
    onChange(contacts.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-2">{label}</label>
      <div className="space-y-2 mb-2">
        {contacts.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={c.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Name" className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sage-400 transition-colors" />
            <input value={c.phone ?? ""} onChange={(e) => update(i, { phone: e.target.value })} placeholder="Phone (optional)" className="w-36 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sage-400 transition-colors" />
            <button onClick={() => onChange(contacts.filter((_, idx) => idx !== i))} className="text-stone-300 hover:text-red-400 text-sm">✕</button>
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...contacts, { name: "", phone: "" }])} className="text-sm border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors">+ Add contact</button>
    </div>
  );
}

export default function SafetyPlanPage() {
  const [plan, setPlan] = useState<SafetyPlan>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/safety-plan").then((r) => r.json()),
      fetch("/api/user").then((r) => r.json()),
    ]).then(([planData, userData]) => {
      const loaded: SafetyPlan = planData.plan ?? EMPTY;
      // First-time setup: pre-fill professional contacts if the plan is entirely empty.
      if (loaded.professionalContacts.length === 0) {
        loaded.professionalContacts = [
          { name: "988 Suicide & Crisis Lifeline", phone: "988" },
          ...(userData.user?.assignedTherapist
            ? [{ name: userData.user.assignedTherapist.user.name, note: "My therapist — message via YouMindo" }]
            : []),
        ];
      }
      setPlan(loaded);
    }).finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/safety-plan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto animate-pulse h-96 bg-white rounded-2xl border border-stone-100" />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Crisis Support & Safety Plan</h1>
        <p className="text-sm text-stone-500 mt-1">Resources for right now, and a plan you build for the harder moments.</p>
      </div>

      {/* Always-visible crisis resources */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-3">If you're in crisis right now</h2>
        <div className="space-y-2">
          {CRISIS_LINES.map((line) => (
            <div key={line.name} className="flex items-center justify-between bg-white/70 rounded-xl px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-stone-800">{line.name}</div>
                <div className="text-xs text-stone-500">{line.detail}</div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {line.tel && <a href={`tel:${line.tel}`} className="text-xs bg-red-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">Call</a>}
                {line.sms && <a href={`sms:${line.sms}`} className="text-xs border border-red-200 text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Text</a>}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-red-600 mt-3">If you or someone else is in immediate danger, call emergency services (911 in the US) or go to your nearest emergency room.</p>
      </div>

      {/* Safety plan builder */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">My Safety Plan</h2>
          <p className="text-xs text-stone-400 mt-1">A personal plan you write for yourself, based on the Stanley-Brown Safety Planning method used by clinicians. Fill in what feels relevant — you can update it anytime.</p>
        </div>

        <ListEditor label="1. Warning signs" placeholder="A thought, feeling, or situation that a crisis may be building..." items={plan.warningSigns} onChange={(v) => setPlan({ ...plan, warningSigns: v })} />
        <ListEditor label="2. Coping strategies I can do alone" placeholder="Something I can do on my own to feel better..." items={plan.copingStrategies} onChange={(v) => setPlan({ ...plan, copingStrategies: v })} />
        <ContactEditor label="3. People & places that help me feel better" contacts={plan.distractionContacts} onChange={(v) => setPlan({ ...plan, distractionContacts: v })} />
        <ContactEditor label="4. People I can ask for help" contacts={plan.supportContacts} onChange={(v) => setPlan({ ...plan, supportContacts: v })} />
        <ContactEditor label="5. Professionals or agencies I can contact" contacts={plan.professionalContacts} onChange={(v) => setPlan({ ...plan, professionalContacts: v })} />
        <ListEditor label="6. Making my environment safer" placeholder="Something I can do to reduce access to means of harm..." items={plan.safeEnvironmentSteps} onChange={(v) => setPlan({ ...plan, safeEnvironmentSteps: v })} />

        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" checked={plan.sharedWithTherapist} onChange={(e) => setPlan({ ...plan, sharedWithTherapist: e.target.checked })} className="accent-sage-700" />
            Share this plan with my therapist
          </label>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs text-sage-600 bg-sage-50 px-2.5 py-1 rounded-lg">Saved</span>}
            <button onClick={save} disabled={saving} className="bg-sage-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-sage-800 disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Save Safety Plan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
