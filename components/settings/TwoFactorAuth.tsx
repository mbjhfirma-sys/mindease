"use client";

import { useState } from "react";

export default function TwoFactorAuth({ initialEnabled }: { initialEnabled: boolean }) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialEnabled);
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

  return (
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
            // eslint-disable-next-line @next/next/no-img-element
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
  );
}
