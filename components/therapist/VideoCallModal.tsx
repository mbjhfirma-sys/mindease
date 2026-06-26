"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  clientName: string;
  sessionType: string;
  duration: string;
  onEnd: () => void;
};

function useClock() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function VideoCallModal({ clientName, sessionType, duration, onEnd }: Props) {
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [selfVisible, setSelfVisible] = useState(true);
  const [status, setStatus] = useState<"connecting" | "connected">("connecting");
  const elapsed = useClock();
  const initials = clientName.split(" ").map((n) => n[0]).join("").slice(0, 2);

  useEffect(() => {
    const t = setTimeout(() => setStatus("connected"), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col select-none">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 bg-stone-800 rounded-md flex items-center justify-center text-white text-[10px] font-bold">M</span>
          <div>
            <p className="text-white text-sm font-medium leading-tight">{clientName}</p>
            <p className="text-stone-500 text-[11px] capitalize">{sessionType} · {duration}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status === "connected" ? (
            <span className="flex items-center gap-1.5 text-xs text-stone-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Connected · {elapsed}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-stone-500">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-600 animate-pulse" />
              Connecting…
            </span>
          )}
          <button
            onClick={onEnd}
            className="text-stone-500 hover:text-stone-300 transition-colors"
            aria-label="Minimise"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 relative overflow-hidden mx-3 mb-3 rounded-2xl">

        {/* Remote video */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ${
            status === "connected"
              ? "bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950"
              : "bg-stone-950"
          }`}
        >
          {status === "connecting" ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center text-2xl font-semibold text-stone-300 animate-pulse">
                {initials}
              </div>
              <p className="text-stone-500 text-sm">Waiting for {clientName.split(" ")[0]}…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-stone-600 to-stone-800 flex items-center justify-center text-4xl font-semibold text-white shadow-xl">
                {initials}
              </div>
              <p className="text-white text-base font-medium">{clientName}</p>
            </div>
          )}
        </div>

        {/* Self PIP */}
        {selfVisible && (
          <div className="absolute bottom-4 right-4 w-36 h-24 rounded-xl overflow-hidden border border-stone-700 shadow-xl bg-stone-800 flex flex-col items-center justify-center gap-1.5">
            {camOff ? (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-stone-600">
                  <path d="M2 2l14 14M9 4.5C6.5 4.5 4.5 6.5 4.5 9c0 .6.1 1.2.3 1.7M13.5 9c0-2.5-2-4.5-4.5-4.5M6 13.2A4.5 4.5 0 0013.2 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <span className="text-stone-500 text-[10px]">Camera off</span>
              </>
            ) : (
              <span className="text-3xl font-semibold text-stone-400">Dr</span>
            )}
            <span className="absolute bottom-1.5 left-2 text-[10px] text-stone-400">You</span>
            <button
              onClick={() => setSelfVisible(false)}
              className="absolute top-1.5 right-1.5 w-4 h-4 bg-stone-900/70 rounded-full flex items-center justify-center text-stone-400 hover:text-white transition-colors"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* Show self button when PIP dismissed */}
        {!selfVisible && (
          <button
            onClick={() => setSelfVisible(true)}
            className="absolute bottom-4 right-4 text-[11px] text-stone-500 border border-stone-700 px-2.5 py-1.5 rounded-lg hover:text-stone-300 hover:border-stone-600 transition-colors"
          >
            Show camera
          </button>
        )}

        {/* Client name tag */}
        {status === "connected" && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-stone-950/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-white text-xs font-medium">{clientName}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0 flex items-center justify-center gap-3 pb-6">
        {/* Mic */}
        <button
          onClick={() => setMuted((v) => !v)}
          title={muted ? "Unmute" : "Mute"}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            muted ? "bg-stone-100 text-stone-900" : "bg-stone-800 text-white hover:bg-stone-700"
          }`}
        >
          {muted ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M9 3a3 3 0 013 3v1M6 6v3a3 3 0 005.7 1.3M4.5 9A4.5 4.5 0 009 13.5m0 0v3M7 16.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="6.5" y="2" width="5" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M4.5 9A4.5 4.5 0 0013.5 9M9 13.5v3M7 16.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          )}
        </button>

        {/* Camera */}
        <button
          onClick={() => setCamOff((v) => !v)}
          title={camOff ? "Turn on camera" : "Turn off camera"}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            camOff ? "bg-stone-100 text-stone-900" : "bg-stone-800 text-white hover:bg-stone-700"
          }`}
        >
          {camOff ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M3 5H2a1 1 0 00-1 1v7a1 1 0 001 1h10M5 5h7a1 1 0 011 1v1.5l3-2v7l-3-2V13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="5" width="11" height="8" rx="1" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M12 9l5-3v6l-5-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* Screen share — disabled */}
        <button
          disabled
          title="Screen share (coming soon)"
          className="w-12 h-12 rounded-full bg-stone-800 text-stone-600 flex items-center justify-center cursor-not-allowed"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="3" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M6 17h6M9 14v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M7 9l2-2 2 2M9 7v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* End call */}
        <button
          onClick={onEnd}
          title="End call"
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg shadow-red-900/30"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M20.7 15.4l-3-2.7a1.5 1.5 0 00-2 .1l-1.5 1.5a11.6 11.6 0 01-4-2.5 11.6 11.6 0 01-2.5-4l1.5-1.5a1.5 1.5 0 00.1-2L6.6 1.3A1.5 1.5 0 004.5 1L1.8 3.7c-.3.3-.5.7-.4 1.1C2.5 10.5 6.6 15.5 12 17.6c.4.1.8 0 1.1-.3l2.7-2.7a1.5 1.5 0 00-.1-2.2z" fill="currentColor"/>
          </svg>
        </button>

        {/* Notes */}
        <button
          title="Session notes"
          className="w-12 h-12 rounded-full bg-stone-800 text-white hover:bg-stone-700 flex items-center justify-center transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="3" y="2" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M6 6h6M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Chat */}
        <button
          title="In-call chat"
          className="w-12 h-12 rounded-full bg-stone-800 text-white hover:bg-stone-700 flex items-center justify-center transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 3h12a1 1 0 011 1v8a1 1 0 01-1 1H6l-4 3V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
