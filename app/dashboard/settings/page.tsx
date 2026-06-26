"use client";

import { useState } from "react";
import { userProfile } from "@/lib/mockData";
import { User, Bell, Shield, Lock, CreditCard } from "lucide-react";

type Tab = "profile" | "notifications" | "privacy" | "security" | "subscription";

const PLANS = [
  { id: "free", name: "Free", price: "$0/mo", features: ["3 courses", "Basic AI chat (10 msg/day)", "Community access"], current: false },
  { id: "growth", name: "Growth", price: "$19/mo", features: ["Unlimited courses", "Unlimited AI chat", "Journal & missions", "Priority support"], current: true },
  { id: "therapy", name: "Therapy", price: "$79/mo", features: ["Everything in Growth", "1 therapist session/mo", "Video consultations", "Personalised treatment plan"], current: false },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-stone-900" : "bg-stone-200"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState(userProfile);
  const [saved, setSaved] = useState(false);

  const [notifications, setNotifications] = useState({
    dailyReminder: true,
    missionReminder: true,
    moodReminder: false,
    therapistMessages: true,
    communityUpdates: false,
    weeklyReport: true,
    reminderTime: "08:00",
  });

  const [privacy, setPrivacy] = useState({
    shareJournalWithTherapist: true,
    showInLeaderboard: false,
    anonymousCommunity: true,
    dataForResearch: false,
  });

  const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", Icon: User },
    { id: "notifications", label: "Notifications", Icon: Bell },
    { id: "privacy", label: "Privacy", Icon: Shield },
    { id: "security", label: "Security", Icon: Lock },
    { id: "subscription", label: "Subscription", Icon: CreditCard },
  ];

  function saveProfile() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Settings</h1>
      </div>

      {/* Tab nav */}
      <div className="flex border-b border-stone-100 overflow-x-auto">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === id ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            <Icon size={14} strokeWidth={tab === id ? 2 : 1.5} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Profile ── */}
      {tab === "profile" && (
        <div className="bg-white border border-stone-100 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-stone-100 rounded-xl flex items-center justify-center text-2xl text-stone-500 font-semibold">
              {profile.name?.[0] ?? "A"}
            </div>
            <div>
              <div className="text-sm font-semibold text-stone-800">{profile.name}</div>
              <div className="text-xs text-stone-400 mt-0.5">Member since {profile.memberSince}</div>
              <button className="text-xs text-stone-600 underline mt-1 hover:text-stone-900">Change photo</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Full Name", key: "name", type: "text" },
              { label: "Email", key: "email", type: "email" },
              { label: "Phone", key: "phone", type: "tel" },
              { label: "Date of Birth", key: "dob", type: "date" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">{label}</label>
                <input
                  type={type}
                  value={(profile as Record<string, string>)[key] ?? ""}
                  onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
                />
              </div>
            ))}

            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Timezone</label>
              <select
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
              >
                <option>America/New_York</option>
                <option>America/Los_Angeles</option>
                <option>Europe/London</option>
                <option>Europe/Paris</option>
                <option>Australia/Sydney</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Language</label>
              <select
                value={profile.language}
                onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
              >
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
                <option>Portuguese</option>
                <option>Arabic</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            <button className="text-xs text-red-500 hover:text-red-700 transition-colors">Request data export</button>
            <button
              onClick={saveProfile}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                saved ? "bg-stone-200 text-stone-600" : "bg-stone-900 text-white hover:bg-stone-800"
              }`}
            >
              {saved ? "Saved" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* ── Notifications ── */}
      {tab === "notifications" && (
        <div className="bg-white border border-stone-100 rounded-xl p-6 space-y-6">
          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">Daily reminder time</label>
            <input
              type="time"
              value={notifications.reminderTime}
              onChange={(e) => setNotifications({ ...notifications, reminderTime: e.target.value })}
              className="border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>

          <div className="divide-y divide-stone-50">
            {[
              { key: "dailyReminder", label: "Daily check-in reminder", desc: "Remind me to log my mood each day" },
              { key: "missionReminder", label: "Mission reminders", desc: "Notify me when daily missions are due" },
              { key: "moodReminder", label: "Evening reflection prompt", desc: "Prompt me to journal before bed" },
              { key: "therapistMessages", label: "Therapist messages", desc: "Instant notifications for new messages" },
              { key: "communityUpdates", label: "Community updates", desc: "Replies and likes on my posts" },
              { key: "weeklyReport", label: "Weekly progress report", desc: "Summary of my week every Sunday" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-start justify-between gap-4 py-4 first:pt-0">
                <div>
                  <div className="text-sm font-medium text-stone-800">{label}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{desc}</div>
                </div>
                <Toggle
                  checked={notifications[key as keyof typeof notifications] as boolean}
                  onChange={(v) => setNotifications({ ...notifications, [key]: v })}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Privacy ── */}
      {tab === "privacy" && (
        <div className="bg-white border border-stone-100 rounded-xl p-6 space-y-6">
          <div className="divide-y divide-stone-50">
            {[
              { key: "shareJournalWithTherapist", label: "Share journal with therapist", desc: "Allow your therapist to view entries you mark as shared" },
              { key: "showInLeaderboard", label: "Appear on leaderboard", desc: "Show my (anonymous) progress on the community leaderboard" },
              { key: "anonymousCommunity", label: "Always post anonymously", desc: "Never show any identifying information in community posts" },
              { key: "dataForResearch", label: "Contribute to research", desc: "Share anonymised usage data to help improve mental health research" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-start justify-between gap-4 py-4 first:pt-0">
                <div>
                  <div className="text-sm font-medium text-stone-800">{label}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{desc}</div>
                </div>
                <Toggle
                  checked={privacy[key as keyof typeof privacy]}
                  onChange={(v) => setPrivacy({ ...privacy, [key]: v })}
                />
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-stone-100 space-y-1">
            <button className="w-full text-left text-sm text-stone-600 hover:text-stone-900 py-2 flex justify-between items-center transition-colors">
              <span>Download my data</span><span className="text-stone-400">→</span>
            </button>
            <button className="w-full text-left text-sm text-red-500 hover:text-red-700 py-2 flex justify-between items-center transition-colors">
              <span>Delete my account</span><span className="text-red-300">→</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Security ── */}
      {tab === "security" && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-100 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-stone-900 mb-4">Change Password</h3>
            <div className="space-y-3">
              {["Current password", "New password", "Confirm new password"].map((label) => (
                <div key={label}>
                  <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">{label}</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
                  />
                </div>
              ))}
              <button className="bg-stone-900 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-stone-800 transition-colors mt-1">
                Update Password
              </button>
            </div>
          </div>

          <div className="bg-white border border-stone-100 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Two-Factor Authentication</h3>
            <p className="text-xs text-stone-400 mb-4">Add an extra layer of security to your account.</p>
            <button className="border border-stone-200 text-sm text-stone-700 font-medium px-4 py-2 rounded-lg hover:bg-stone-50 hover:border-stone-300 transition-colors">
              Enable 2FA
            </button>
          </div>

          <div className="bg-white border border-stone-100 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-stone-900 mb-4">Active Sessions</h3>
            <div className="divide-y divide-stone-50">
              {[
                { device: "MacBook Pro", location: "New York, US", last: "Now", current: true },
                { device: "iPhone 15", location: "New York, US", last: "2h ago", current: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-3 first:pt-0">
                  <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center text-base">
                    {s.device.includes("Mac") ? "💻" : "📱"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-700">{s.device}</div>
                    <div className="text-xs text-stone-400">{s.location} · {s.last}</div>
                  </div>
                  {s.current ? (
                    <span className="text-xs text-stone-500 border border-stone-200 px-2 py-0.5 rounded">Current</span>
                  ) : (
                    <button className="text-xs text-red-500 hover:text-red-700 transition-colors">Sign out</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Subscription ── */}
      {tab === "subscription" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl border p-5 ${plan.current ? "border-stone-900 bg-stone-50" : "border-stone-100 bg-white"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-stone-900">{plan.name}</h3>
                  {plan.current && (
                    <span className="text-[10px] bg-stone-900 text-white px-1.5 py-0.5 rounded font-medium">Current</span>
                  )}
                </div>
                <div className="text-2xl font-semibold text-stone-900 mb-3">{plan.price}</div>
                <ul className="space-y-1.5 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-stone-500">
                      <span className="text-stone-400 mt-0.5 flex-shrink-0">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  disabled={plan.current}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    plan.current
                      ? "bg-stone-200 text-stone-500 cursor-default"
                      : "bg-stone-900 text-white hover:bg-stone-800"
                  }`}
                >
                  {plan.current ? "Current plan" : plan.id === "free" ? "Downgrade" : "Upgrade"}
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white border border-stone-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-stone-900 mb-3">Billing</h3>
            <div className="divide-y divide-stone-50">
              <div className="flex items-center justify-between py-3 first:pt-0 text-sm">
                <span className="text-stone-500">Next billing date</span>
                <span className="font-medium text-stone-800">July 19, 2026</span>
              </div>
              <div className="flex items-center justify-between py-3 text-sm">
                <span className="text-stone-500">Payment method</span>
                <span className="font-medium text-stone-800">Visa •••• 4242</span>
              </div>
            </div>
            <div className="flex gap-3 mt-3 pt-3 border-t border-stone-50">
              <button className="text-xs text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors">
                Update payment
              </button>
              <button className="text-xs text-red-500 hover:text-red-700 transition-colors">
                Cancel subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
