"use client";

import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { User, Bell, Shield, Lock, CreditCard, Copy, Check, Eye, EyeOff, Camera, Loader2 } from "lucide-react";

function resizeToJpeg(file: File, maxPx = 200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

type Tab = "profile" | "notifications" | "privacy" | "security" | "subscription";

type Profile = {
  name: string; email: string; phone: string; dob: string;
  timezone: string; language: string; createdAt?: string;
};

type NotifPrefs = {
  dailyReminder: boolean; missionReminder: boolean; moodReminder: boolean;
  therapistMessages: boolean; communityUpdates: boolean; weeklyReport: boolean;
  reminderTime: string;
};

type PrivacyPrefs = {
  shareJournalWithTherapist: boolean; showInLeaderboard: boolean;
  anonymousCommunity: boolean; dataForResearch: boolean;
};

const DEFAULT_NOTIF: NotifPrefs = {
  dailyReminder: true, missionReminder: true, moodReminder: false,
  therapistMessages: true, communityUpdates: false, weeklyReport: true,
  reminderTime: "08:00",
};

const DEFAULT_PRIVACY: PrivacyPrefs = {
  shareJournalWithTherapist: true, showInLeaderboard: false,
  anonymousCommunity: true, dataForResearch: false,
};

type SessionLogItem = {
  id: string; date: string; duration: number; type: string; status: string;
  therapist: { user: { name: string } };
};

const PLANS = [
  { id: "free",    name: "Free",     price: "$0/mo",  features: ["3 courses", "Basic AI chat (10 msg/day)", "Community access"], current: false },
  { id: "growth",  name: "Growth",   price: "$19/mo", features: ["Unlimited courses", "Unlimited AI chat", "Journal & missions", "Priority support"], current: true },
  { id: "therapy", name: "Therapy",  price: "$79/mo", features: ["Everything in Growth", "1 therapist session/mo", "Video consultations", "Personalised treatment plan"], current: false },
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

function SaveBar({ saving, saved, error, onSave }: { saving: boolean; saved: boolean; error: string; onSave: () => void }) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-stone-100">
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : saved ? (
        <p className="text-xs text-stone-500 flex items-center gap-1"><Check size={12} className="text-green-600" /> Saved</p>
      ) : (
        <span />
      )}
      <button
        onClick={onSave}
        disabled={saving}
        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
          saved ? "bg-stone-100 text-stone-500" : "bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50"
        }`}
      >
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<Profile>({
    name: "", email: "", phone: "", dob: "", timezone: "Europe/London", language: "English",
  });
  const [clientCode, setClientCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [avatar,   setAvatar]   = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);

  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved,  setNotifSaved]  = useState(false);
  const [notifError,  setNotifError]  = useState("");

  const [privSaving, setPrivSaving] = useState(false);
  const [privSaved,  setPrivSaved]  = useState(false);
  const [privError,  setPrivError]  = useState("");

  const [notifications, setNotifications] = useState<NotifPrefs>(DEFAULT_NOTIF);
  const [privacy,        setPrivacy]       = useState<PrivacyPrefs>(DEFAULT_PRIVACY);
  const [peerMatchingOptIn, setPeerMatchingOptIn] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [tfaStep, setTfaStep] = useState<"idle" | "setup" | "backup-codes">("idle");
  const [tfaQrCode, setTfaQrCode] = useState("");
  const [tfaSecret, setTfaSecret] = useState("");
  const [tfaCode, setTfaCode] = useState("");
  const [tfaError, setTfaError] = useState("");
  const [tfaLoading, setTfaLoading] = useState(false);
  const [tfaBackupCodes, setTfaBackupCodes] = useState<string[]>([]);
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [disableError, setDisableError] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Data export state
  const [exporting, setExporting] = useState(false);

  // Password change state
  const [pwCurrent,  setPwCurrent]  = useState("");
  const [pwNew,      setPwNew]      = useState("");
  const [pwConfirm,  setPwConfirm]  = useState("");
  const [pwShow,     setPwShow]     = useState({ current: false, new: false, confirm: false });
  const [pwSaving,   setPwSaving]   = useState(false);
  const [pwSaved,    setPwSaved]    = useState(false);
  const [pwError,    setPwError]    = useState<Record<string, string>>({});

  const [sessionLog, setSessionLog] = useState<SessionLogItem[]>([]);

  const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: "profile",      label: "Profile",      Icon: User },
    { id: "notifications",label: "Notifications", Icon: Bell },
    { id: "privacy",      label: "Privacy",       Icon: Shield },
    { id: "security",     label: "Security",      Icon: Lock },
    { id: "subscription", label: "Subscription",  Icon: CreditCard },
  ];

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setProfile({
            name:     d.user.name ?? "",
            email:    d.user.email ?? "",
            phone:    d.user.phone ?? "",
            dob:      d.user.dob ? new Date(d.user.dob).toISOString().split("T")[0] : "",
            timezone: d.user.timezone ?? "Europe/London",
            language: d.user.language ?? "English",
            createdAt: d.user.createdAt,
          });
          setClientCode(d.user.clientCode ?? null);
          if (d.user.avatar) setAvatar(d.user.avatar);
          if (d.user.notificationPrefs) setNotifications({ ...DEFAULT_NOTIF, ...d.user.notificationPrefs });
          if (d.user.privacyPrefs)      setPrivacy({ ...DEFAULT_PRIVACY, ...d.user.privacyPrefs });
          setPeerMatchingOptIn(!!d.user.peerMatchingOptIn);
          setTwoFactorEnabled(!!d.user.twoFactorEnabled);
        }
      })
      .finally(() => setLoading(false));

    fetch("/api/appointments")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setSessionLog(d.appointments ?? []))
      .catch(() => {});
  }, []);

  function flash(setter: (v: boolean) => void) {
    setter(true);
    setTimeout(() => setter(false), 2500);
  }

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setAvatarUploading(true);
    try {
      const dataUrl = await resizeToJpeg(file, 200, 0.85);
      setAvatar(dataUrl);
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: dataUrl }),
      });
    } catch {
      // silently ignore — preview is already shown
    } finally {
      setAvatarUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function copyCode() {
    if (!clientCode) return;
    navigator.clipboard.writeText(clientCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  async function saveProfile() {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     profile.name || undefined,
          phone:    profile.phone || undefined,
          dob:      profile.dob ? new Date(profile.dob).toISOString() : undefined,
          timezone: profile.timezone || undefined,
          language: profile.language || undefined,
        }),
      });
      if (!res.ok) { setError("Failed to save. Please try again."); return; }
      flash(setSaved);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveNotifications() {
    setNotifSaving(true); setNotifError(""); setNotifSaved(false);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationPrefs: notifications }),
      });
      if (!res.ok) { setNotifError("Failed to save."); return; }
      flash(setNotifSaved);
    } catch {
      setNotifError("Network error.");
    } finally {
      setNotifSaving(false);
    }
  }

  async function savePrivacy() {
    setPrivSaving(true); setPrivError(""); setPrivSaved(false);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privacyPrefs: privacy, peerMatchingOptIn }),
      });
      if (!res.ok) { setPrivError("Failed to save."); return; }
      flash(setPrivSaved);
    } catch {
      setPrivError("Network error.");
    } finally {
      setPrivSaving(false);
    }
  }

  async function changePassword() {
    setPwSaving(true); setPwError({}); setPwSaved(false);
    if (!pwCurrent) { setPwError({ currentPassword: "Required" }); setPwSaving(false); return; }
    if (pwNew.length < 8) { setPwError({ newPassword: "At least 8 characters" }); setPwSaving(false); return; }
    if (pwNew !== pwConfirm) { setPwError({ confirmPassword: "Passwords do not match" }); setPwSaving(false); return; }

    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew, confirmPassword: pwConfirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errs: Record<string, string> = {};
        if (data.error?.currentPassword) errs.currentPassword = data.error.currentPassword[0];
        if (data.error?.newPassword)     errs.newPassword     = data.error.newPassword[0];
        if (data.error?.confirmPassword) errs.confirmPassword = data.error.confirmPassword[0];
        if (!Object.keys(errs).length)   errs.general = data.error ?? "Failed to change password.";
        setPwError(errs);
        return;
      }
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
      flash(setPwSaved);
    } catch {
      setPwError({ general: "Network error. Please try again." });
    } finally {
      setPwSaving(false);
    }
  }

  async function startTfaSetup() {
    setTfaLoading(true); setTfaError("");
    try {
      const res = await fetch("/api/user/2fa/setup", { method: "POST" });
      const d = await res.json();
      if (!res.ok) { setTfaError(d.error ?? "Failed to start setup."); return; }
      setTfaQrCode(d.qrCodeDataUrl);
      setTfaSecret(d.secret);
      setTfaStep("setup");
    } catch {
      setTfaError("Network error. Please try again.");
    } finally {
      setTfaLoading(false);
    }
  }

  async function confirmTfaSetup() {
    setTfaLoading(true); setTfaError("");
    try {
      const res = await fetch("/api/user/2fa/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: tfaCode }),
      });
      const d = await res.json();
      if (!res.ok) { setTfaError(d.error ?? "Invalid code."); return; }
      setTfaBackupCodes(d.backupCodes ?? []);
      setTfaStep("backup-codes");
    } catch {
      setTfaError("Network error. Please try again.");
    } finally {
      setTfaLoading(false);
    }
  }

  function finishTfaSetup() {
    setTwoFactorEnabled(true);
    setTfaStep("idle");
    setTfaCode(""); setTfaQrCode(""); setTfaSecret(""); setTfaBackupCodes([]);
  }

  async function disableTfa() {
    setDisableLoading(true); setDisableError("");
    try {
      const res = await fetch("/api/user/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword, code: disableCode }),
      });
      const d = await res.json();
      if (!res.ok) { setDisableError(d.error ?? "Failed to disable 2FA."); return; }
      setTwoFactorEnabled(false);
      setShowDisableForm(false);
      setDisablePassword(""); setDisableCode("");
    } catch {
      setDisableError("Network error. Please try again.");
    } finally {
      setDisableLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true); setDeleteError("");
    try {
      const res = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword, code: twoFactorEnabled ? deleteCode : undefined }),
      });
      const d = await res.json();
      if (!res.ok) { setDeleteError(d.error ?? "Failed to delete account."); return; }
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleExportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/user/export");
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `youmindo-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

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
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-14 w-14 bg-stone-100 rounded-xl" />
              <div className="h-4 bg-stone-100 rounded w-1/3" />
              <div className="h-4 bg-stone-100 rounded w-1/2" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                {/* Clickable avatar */}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 group focus:outline-none focus:ring-2 focus:ring-stone-400"
                  title="Change photo"
                >
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-stone-500 font-semibold flex items-center justify-center w-full h-full">
                      {profile.name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5">
                    {avatarUploading
                      ? <Loader2 size={16} className="text-white animate-spin" />
                      : <Camera size={16} className="text-white" />}
                    {!avatarUploading && <span className="text-white text-[9px] font-medium">Change</span>}
                  </div>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFile}
                />

                <div>
                  <div className="text-sm font-semibold text-stone-800">{profile.name || "—"}</div>
                  {memberSince && <div className="text-xs text-stone-400 mt-0.5">Member since {memberSince}</div>}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-xs text-stone-500 hover:text-stone-800 underline underline-offset-2 mt-1 transition-colors"
                  >
                    {avatar ? "Change photo" : "Upload photo"}
                  </button>
                </div>
              </div>

              {/* Client code */}
              <div className="flex items-center justify-between gap-4 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-0.5">Your Client Code</div>
                  {clientCode ? (
                    <>
                      <div className="text-lg font-mono font-semibold text-stone-900 tracking-widest">{clientCode}</div>
                      <div className="text-xs text-stone-400 mt-0.5">Share this with your therapist so they can add you as a client</div>
                    </>
                  ) : (
                    <div className="h-6 w-32 bg-stone-200 rounded animate-pulse mt-1" />
                  )}
                </div>
                {clientCode && (
                  <button
                    onClick={copyCode}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
                  >
                    {codeCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    {codeCopied ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", key: "name", type: "text" },
                  { label: "Email", key: "email", type: "email", readOnly: true },
                  { label: "Phone", key: "phone", type: "tel" },
                  { label: "Date of Birth", key: "dob", type: "date" },
                ].map(({ label, key, type, readOnly }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">{label}</label>
                    <input
                      type={type}
                      value={(profile as Record<string, string>)[key] ?? ""}
                      onChange={(e) => !readOnly && setProfile({ ...profile, [key]: e.target.value })}
                      readOnly={readOnly}
                      className={`w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors ${readOnly ? "bg-stone-50 text-stone-400 cursor-default" : ""}`}
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

              <SaveBar saving={saving} saved={saved} error={error} onSave={saveProfile} />
            </>
          )}
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
            <p className="text-xs text-stone-400 mt-1.5">Used for daily check-in and mission reminders</p>
          </div>
          <div className="divide-y divide-stone-50">
            {([
              { key: "dailyReminder",    label: "Daily check-in reminder",   desc: "Remind me to log my mood each day" },
              { key: "missionReminder",  label: "Mission reminders",          desc: "Notify me when daily missions are due" },
              { key: "moodReminder",     label: "Evening reflection prompt",  desc: "Prompt me to journal before bed" },
              { key: "therapistMessages",label: "Therapist messages",         desc: "Instant notifications for new messages" },
              { key: "communityUpdates", label: "Community updates",          desc: "Replies and likes on my posts" },
              { key: "weeklyReport",     label: "Weekly progress report",     desc: "Summary of my week every Sunday" },
            ] as const).map(({ key, label, desc }) => (
              <div key={key} className="flex items-start justify-between gap-4 py-4 first:pt-0">
                <div>
                  <div className="text-sm font-medium text-stone-800">{label}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{desc}</div>
                </div>
                <Toggle
                  checked={notifications[key]}
                  onChange={(v) => setNotifications({ ...notifications, [key]: v })}
                />
              </div>
            ))}
          </div>
          <SaveBar saving={notifSaving} saved={notifSaved} error={notifError} onSave={saveNotifications} />
        </div>
      )}

      {/* ── Privacy ── */}
      {tab === "privacy" && (
        <div className="bg-white border border-stone-100 rounded-xl p-6 space-y-6">
          <div className="divide-y divide-stone-50">
            {([
              {
                key: "shareJournalWithTherapist",
                label: "Share journal with therapist",
                desc: "Allow your therapist to view your journal entries",
              },
              {
                key: "showInLeaderboard",
                label: "Appear on leaderboard",
                desc: "Show my (anonymous) progress on the community leaderboard",
              },
              {
                key: "anonymousCommunity",
                label: "Always post anonymously",
                desc: "Never show any identifying information in community posts",
              },
              {
                key: "dataForResearch",
                label: "Contribute to research",
                desc: "Share anonymised usage data to help improve mental health research",
              },
            ] as const).map(({ key, label, desc }) => (
              <div key={key} className="flex items-start justify-between gap-4 py-4 first:pt-0">
                <div>
                  <div className="text-sm font-medium text-stone-800">{label}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{desc}</div>
                </div>
                <Toggle
                  checked={privacy[key]}
                  onChange={(v) => setPrivacy({ ...privacy, [key]: v })}
                />
              </div>
            ))}
            <div className="flex items-start justify-between gap-4 py-4">
              <div>
                <div className="text-sm font-medium text-stone-800">Peer matching</div>
                <div className="text-xs text-stone-400 mt-0.5">Let other opted-in members who share your community groups see you as a match under &quot;People like you&quot;</div>
              </div>
              <Toggle checked={peerMatchingOptIn} onChange={setPeerMatchingOptIn} />
            </div>
          </div>
          <SaveBar saving={privSaving} saved={privSaved} error={privError} onSave={savePrivacy} />
          <div className="pt-2 border-t border-stone-100 space-y-1">
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="w-full text-left text-sm text-stone-600 hover:text-stone-900 py-2 flex justify-between items-center transition-colors disabled:opacity-50"
            >
              <span>{exporting ? "Preparing your data…" : "Download my data"}</span><span className="text-stone-400">→</span>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full text-left text-sm text-red-500 hover:text-red-700 py-2 flex justify-between items-center transition-colors"
            >
              <span>Delete my account</span><span className="text-red-300">→</span>
            </button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !deleteLoading && setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-stone-900">Delete your account</h2>
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              This permanently deletes your account and all associated data — journal entries, mood history, missions, assessments, appointments, and messages. This cannot be undone.
            </div>
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400"
              />
            </div>
            {twoFactorEnabled && (
              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Verification code</label>
                <input
                  type="text"
                  value={deleteCode}
                  onChange={(e) => setDeleteCode(e.target.value)}
                  placeholder="Authenticator or backup code"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">
                Type <span className="font-mono font-semibold text-stone-700">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-400"
              />
            </div>
            {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePassword(""); setDeleteCode(""); setDeleteConfirmText(""); setDeleteError(""); }}
                disabled={deleteLoading}
                className="flex-1 py-2.5 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePassword || deleteConfirmText !== "DELETE" || (twoFactorEnabled && !deleteCode)}
                className="flex-1 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {deleteLoading ? "Deleting…" : "Delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Security ── */}
      {tab === "security" && (
        <div className="space-y-4">
          {/* Change password */}
          <div className="bg-white border border-stone-100 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-stone-900 mb-4">Change Password</h3>
            {pwSaved && (
              <div className="mb-4 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                <Check size={14} /> Password updated successfully.
              </div>
            )}
            {pwError.general && (
              <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{pwError.general}</div>
            )}
            <div className="space-y-3">
              {([
                { label: "Current password",    field: "current"  as const, val: pwCurrent,  set: setPwCurrent },
                { label: "New password",         field: "new"      as const, val: pwNew,      set: setPwNew     },
                { label: "Confirm new password", field: "confirm"  as const, val: pwConfirm,  set: setPwConfirm },
              ]).map(({ label, field, val, set }) => {
                const errKey = field === "current" ? "currentPassword" : field === "new" ? "newPassword" : "confirmPassword";
                return (
                  <div key={field}>
                    <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">{label}</label>
                    <div className="relative">
                      <input
                        type={pwShow[field] ? "text" : "password"}
                        value={val}
                        onChange={(e) => { set(e.target.value); setPwError((p) => ({ ...p, [errKey]: "" })); }}
                        placeholder="••••••••"
                        className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors ${pwError[errKey] ? "border-red-300 bg-red-50" : "border-stone-200"}`}
                      />
                      <button
                        type="button"
                        onClick={() => setPwShow((p) => ({ ...p, [field]: !p[field] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {pwShow[field] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {pwError[errKey] && <p className="text-xs text-red-600 mt-1">{pwError[errKey]}</p>}
                  </div>
                );
              })}
              <button
                onClick={changePassword}
                disabled={pwSaving || !pwCurrent || !pwNew || !pwConfirm}
                className="bg-stone-900 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mt-1"
              >
                {pwSaving ? "Updating…" : "Update Password"}
              </button>
            </div>
          </div>

          {/* 2FA */}
          <div className="bg-white border border-stone-100 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Two-Factor Authentication</h3>
            <p className="text-xs text-stone-400 mb-4">Add an extra layer of security to your account.</p>

            {tfaStep === "idle" && (
              <>
                <div className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-100 rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm text-stone-700 font-medium">Authenticator app</p>
                    <p className="text-xs text-stone-400 mt-0.5">Google Authenticator, Authy, or similar</p>
                  </div>
                  {twoFactorEnabled ? (
                    <span className="text-xs text-sage-700 bg-sage-50 border border-sage-200 px-2 py-0.5 rounded font-medium">Enabled</span>
                  ) : (
                    <button
                      onClick={startTfaSetup}
                      disabled={tfaLoading}
                      className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
                    >
                      {tfaLoading ? "Starting…" : "Enable 2FA"}
                    </button>
                  )}
                </div>
                {tfaError && <p className="text-xs text-red-600 mt-2">{tfaError}</p>}

                {twoFactorEnabled && !showDisableForm && (
                  <button
                    onClick={() => setShowDisableForm(true)}
                    className="text-xs text-red-500 hover:text-red-700 mt-3 transition-colors"
                  >
                    Disable 2FA
                  </button>
                )}
                {twoFactorEnabled && showDisableForm && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                    <p className="text-xs text-stone-600">Confirm your password and a current code to disable 2FA.</p>
                    <input
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Password"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                    />
                    <input
                      type="text"
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value)}
                      placeholder="Authenticator or backup code"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                    />
                    {disableError && <p className="text-xs text-red-600">{disableError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowDisableForm(false); setDisablePassword(""); setDisableCode(""); setDisableError(""); }}
                        className="text-xs border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={disableTfa}
                        disabled={disableLoading || !disablePassword || !disableCode}
                        className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {disableLoading ? "Disabling…" : "Disable 2FA"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {tfaStep === "setup" && (
              <div className="space-y-3">
                <p className="text-xs text-stone-500">Scan this QR code with your authenticator app, or enter the code manually.</p>
                {tfaQrCode && (
                  <img src={tfaQrCode} alt="2FA QR code" className="w-40 h-40 border border-stone-100 rounded-lg" />
                )}
                <p className="text-xs font-mono bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 break-all">{tfaSecret}</p>
                <input
                  type="text"
                  value={tfaCode}
                  onChange={(e) => setTfaCode(e.target.value)}
                  placeholder="Enter 6-digit code to confirm"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm tracking-widest focus:outline-none focus:border-stone-400"
                />
                {tfaError && <p className="text-xs text-red-600">{tfaError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setTfaStep("idle"); setTfaCode(""); setTfaError(""); }}
                    className="text-xs border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmTfaSetup}
                    disabled={tfaLoading || !tfaCode}
                    className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
                  >
                    {tfaLoading ? "Verifying…" : "Verify & Enable"}
                  </button>
                </div>
              </div>
            )}

            {tfaStep === "backup-codes" && (
              <div className="space-y-3">
                <div className="px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  Save these backup codes somewhere safe — each can be used once if you lose access to your authenticator app. They won&apos;t be shown again.
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-stone-50 border border-stone-100 rounded-lg p-3">
                  {tfaBackupCodes.map((c) => <div key={c}>{c}</div>)}
                </div>
                <button
                  onClick={finishTfaSetup}
                  className="w-full bg-stone-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-stone-800 transition-colors"
                >
                  I&apos;ve saved these codes
                </button>
              </div>
            )}
          </div>

          {/* Active sessions */}
          <div className="bg-white border border-stone-100 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-stone-900 mb-4">Active Sessions</h3>
            <div className="divide-y divide-stone-50">
              <div className="flex items-center gap-3 py-3 first:pt-0">
                <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center text-base">💻</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-700">Current browser</div>
                  <div className="text-xs text-stone-400">This device · Active now</div>
                </div>
                <span className="text-xs text-stone-500 border border-stone-200 px-2 py-0.5 rounded">Current</span>
              </div>
            </div>
            <p className="text-xs text-stone-400 mt-3 pt-3 border-t border-stone-50">
              To sign out of all devices, change your password above.
            </p>
          </div>
        </div>
      )}

      {/* ── Subscription ── */}
      {tab === "subscription" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PLANS.map((plan) => (
              <div key={plan.id} className={`rounded-xl border p-5 ${plan.current ? "border-stone-900 bg-stone-50" : "border-stone-100 bg-white"}`}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-stone-900">{plan.name}</h3>
                  {plan.current && <span className="text-[10px] bg-stone-900 text-white px-1.5 py-0.5 rounded font-medium">Current</span>}
                </div>
                <div className="text-2xl font-semibold text-stone-900 mb-3">{plan.price}</div>
                <ul className="space-y-1.5 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-stone-500">
                      <span className="text-stone-400 mt-0.5 flex-shrink-0">✓</span><span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button disabled={plan.current} className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${plan.current ? "bg-stone-200 text-stone-500 cursor-default" : "bg-stone-900 text-white hover:bg-stone-800"}`}>
                  {plan.current ? "Current plan" : plan.id === "free" ? "Downgrade" : "Upgrade"}
                </button>
              </div>
            ))}
          </div>
          <div className="bg-white border border-stone-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Session history</h3>
            <p className="text-xs text-stone-400 mb-3">YouMindo doesn&apos;t process payments directly — this is a record of your sessions for your own reference.</p>
            {sessionLog.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">No sessions yet.</p>
            ) : (
              <div className="divide-y divide-stone-50">
                {sessionLog.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <span className="text-stone-700 font-medium">{s.therapist.user.name}</span>
                      <span className="text-stone-400 text-xs ml-2">
                        {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {s.duration}min · {s.type}
                      </span>
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${
                      s.status === "completed" ? "bg-sage-50 text-sage-700"
                      : s.status === "cancelled" || s.status === "no_show" ? "bg-red-50 text-red-600"
                      : "bg-stone-100 text-stone-500"
                    }`}>
                      {s.status.replace("_", "-")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
