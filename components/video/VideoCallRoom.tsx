"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoRole } from "@/lib/video";

type Phase =
  | "joining"
  | "requesting_media"
  | "media_denied"
  | "waiting_for_peer"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed"
  | "ended";

type CallError = { message: string; retryable: boolean };
type EndedInfo = { reason: "peer" | "expired" };

type JoinResponse = { role: VideoRole; otherJoined: boolean; iceServers: RTCIceServer[] };
type SignalRow = { id: string; type: "offer" | "answer" | "ice_candidate"; payload: unknown; createdAt: string };
type PollResponse = { signals: SignalRow[]; sessionStatus: "open" | "ended"; endedReason: string | null; otherJoined: boolean };
type ErrorResponse = { error: string; opensAt?: string; closesAt?: string };

async function apiCall<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T | ErrorResponse }> {
  const res = await fetch(url, init);
  let data: T | ErrorResponse;
  try {
    data = await res.json();
  } catch {
    data = { error: "invalid_response" };
  }
  return { ok: res.ok, status: res.status, data };
}

function joinErrorMessage(status: number, error?: string): string {
  switch (error) {
    case "join_window_not_open":
      return "This session isn't open yet — you can join starting shortly before the scheduled time.";
    case "join_window_closed":
      return "This session's join window has closed.";
    case "not_a_video_appointment":
      return "This appointment isn't a video session.";
    default:
      return status === 403 || status === 404
        ? "You don't have access to this session."
        : "Couldn't start the session. Please try again.";
  }
}

const RECONNECT_GRACE_MS = 5000;
const WATCHDOG_MS = 30000;
const WAIT_HINT_MS = 60000;

function useVideoCall(appointmentId: string) {
  const [phase, setPhase] = useState<Phase>("joining");
  const [error, setError] = useState<CallError | null>(null);
  const [endedInfo, setEndedInfo] = useState<EndedInfo | null>(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showWaitHint, setShowWaitHint] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const roleRef = useRef<VideoRole | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disconnectGraceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endedRef = useRef(false);
  const phaseRef = useRef<Phase>("joining");
  const pendingLeaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase !== "connected") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Only starts a timer while waiting; the hint itself is gated to the
  // waiting phase at render time, so there's no need to also reset it false
  // on every other phase transition.
  useEffect(() => {
    if (phase !== "waiting_for_peer") return;
    const t = setTimeout(() => setShowWaitHint(true), WAIT_HINT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    let cancelled = false;
    endedRef.current = false;

    // React Strict Mode (dev only) synchronously runs setup → cleanup → setup
    // once, to help surface effects that aren't resilient to being re-run. If
    // the previous cleanup scheduled a leave beacon (see below) and we're
    // back here setting up again, that cleanup was the phantom one — cancel
    // its beacon so it never reaches the server and prematurely ends the call.
    if (pendingLeaveRef.current) {
      clearTimeout(pendingLeaveRef.current);
      pendingLeaveRef.current = null;
    }

    function clearWatchdog() {
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
    }

    function armWatchdog() {
      clearWatchdog();
      watchdogRef.current = setTimeout(() => {
        if (pcRef.current?.connectionState !== "connected") {
          fail("Couldn't connect. This can happen on some networks or firewalls — try switching networks (e.g. mobile data) or try again.");
        }
      }, WATCHDOG_MS);
    }

    function sendLeaveBeacon() {
      fetch(`/api/video/${appointmentId}/leave`, { method: "POST", keepalive: true }).catch(() => {});
    }

    // Stops local media/timers immediately — safe to do even for a phantom
    // Strict Mode cleanup, since a following real setup just re-acquires
    // fresh media anyway. Does NOT contact the server; see sendLeaveBeacon.
    function localCleanup() {
      clearWatchdog();
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      if (disconnectGraceRef.current) clearTimeout(disconnectGraceRef.current);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      pcRef.current = null;
      localStreamRef.current = null;
    }

    function fail(message: string) {
      if (endedRef.current) return;
      endedRef.current = true;
      localCleanup();
      sendLeaveBeacon();
      setError({ message, retryable: true });
      setPhase("failed");
    }

    async function start() {
      const joinRes = await apiCall<JoinResponse>(`/api/video/${appointmentId}/join`, { method: "POST" });
      if (cancelled) return;
      if (!joinRes.ok) {
        const data = joinRes.data as ErrorResponse;
        setError({ message: joinErrorMessage(joinRes.status, data.error), retryable: joinRes.status >= 500 });
        setPhase("failed");
        return;
      }
      const { role, otherJoined: initialOtherJoined, iceServers } = joinRes.data as JoinResponse;
      roleRef.current = role;

      setPhase("requesting_media");
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch {
        if (!cancelled) setPhase("media_denied");
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      setPhase(initialOtherJoined ? "connecting" : "waiting_for_peer");
      if (initialOtherJoined) armWatchdog();

      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      let localDescPosted = false;
      const pendingCandidates: RTCIceCandidateInit[] = [];

      async function sendSignal(type: "offer" | "answer" | "ice_candidate", payload: unknown) {
        await apiCall(`/api/video/${appointmentId}/signal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, payload }),
        });
      }

      async function flushPendingCandidates() {
        localDescPosted = true;
        const queued = pendingCandidates.splice(0, pendingCandidates.length);
        for (const c of queued) await sendSignal("ice_candidate", c);
      }

      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };

      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        const c = e.candidate.toJSON();
        if (localDescPosted) void sendSignal("ice_candidate", c);
        else pendingCandidates.push(c);
      };

      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === "connected") {
          if (disconnectGraceRef.current) {
            clearTimeout(disconnectGraceRef.current);
            disconnectGraceRef.current = null;
          }
          clearWatchdog();
          setPhase("connected");
        } else if (s === "failed") {
          fail("Lost the connection. This can happen on some networks or firewalls.");
        } else if (s === "disconnected") {
          if (phaseRef.current === "connected") {
            setPhase("reconnecting");
            disconnectGraceRef.current = setTimeout(() => {
              if (pcRef.current?.connectionState !== "connected") {
                fail("Lost the connection. This can happen on some networks or firewalls.");
              }
            }, RECONNECT_GRACE_MS);
          }
        }
      };

      if (role === "offerer") {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal("offer", { type: offer.type, sdp: offer.sdp });
        await flushPendingCandidates();
      }

      async function poll() {
        if (cancelled || endedRef.current) return;
        const res = await apiCall<PollResponse>(`/api/video/${appointmentId}/signal`, { method: "GET" });
        if (cancelled || endedRef.current) return;

        if (res.ok) {
          const { signals, sessionStatus, endedReason, otherJoined } = res.data as PollResponse;

          if (otherJoined && phaseRef.current === "waiting_for_peer") {
            setPhase("connecting");
            armWatchdog();
          }

          for (const sig of signals) {
            if (sig.type === "offer" && role === "answerer") {
              await pc.setRemoteDescription(sig.payload as RTCSessionDescriptionInit);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await sendSignal("answer", { type: answer.type, sdp: answer.sdp });
              await flushPendingCandidates();
            } else if (sig.type === "answer" && role === "offerer") {
              await pc.setRemoteDescription(sig.payload as RTCSessionDescriptionInit);
            } else if (sig.type === "ice_candidate") {
              try {
                await pc.addIceCandidate(sig.payload as RTCIceCandidateInit);
              } catch {
                // Benign if the connection already closed mid-poll.
              }
            }
          }

          if (sessionStatus === "ended" && !endedRef.current) {
            endedRef.current = true;
            clearWatchdog();
            if (disconnectGraceRef.current) clearTimeout(disconnectGraceRef.current);
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            pcRef.current?.close();
            pcRef.current = null;
            localStreamRef.current = null;
            setEndedInfo({ reason: endedReason === "expired" ? "expired" : "peer" });
            setPhase("ended");
            return;
          }
        }

        if (!cancelled && !endedRef.current) {
          const delay = phaseRef.current === "connected" ? 5000 : 1500;
          pollTimeoutRef.current = setTimeout(poll, delay);
        }
      }
      poll();
    }

    start();

    const onPageHide = () => {
      fetch(`/api/video/${appointmentId}/leave`, { method: "POST", keepalive: true }).catch(() => {});
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", onPageHide);
      if (!endedRef.current) {
        localCleanup();
        // Delay the actual server-side leave in case this cleanup is Strict
        // Mode's phantom one — the next setup call cancels this if so.
        pendingLeaveRef.current = setTimeout(() => {
          pendingLeaveRef.current = null;
          if (!endedRef.current) {
            endedRef.current = true;
            sendLeaveBeacon();
          }
        }, 300);
      }
    };
  }, [appointmentId]);

  function toggleMute() {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = muted));
    setMuted((v) => !v);
  }
  function toggleCamera() {
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = camOff));
    setCamOff((v) => !v);
  }
  function hangUp() {
    if (!endedRef.current) {
      endedRef.current = true;
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      if (disconnectGraceRef.current) clearTimeout(disconnectGraceRef.current);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      fetch(`/api/video/${appointmentId}/leave`, { method: "POST", keepalive: true }).catch(() => {});
    }
  }
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");

  return {
    phase, error, endedInfo, muted, camOff, showWaitHint,
    elapsed: `${m}:${s}`,
    localVideoRef, remoteVideoRef,
    toggleMute, toggleCamera, hangUp,
  };
}

type Props = {
  appointmentId: string;
  otherPartyName: string;
  sessionType: string;
  durationLabel: string;
  onEnd: () => void;
};

export default function VideoCallRoom(props: Props) {
  // Keying the active call by `attempt` gives "Try again" a clean full remount
  // (fresh hook state, fresh effect run) instead of tracking a retry counter
  // as internal state that has to be manually reset.
  const [attempt, setAttempt] = useState(0);
  return <VideoCallRoomInner key={attempt} {...props} onRetry={() => setAttempt((a) => a + 1)} />;
}

function VideoCallRoomInner({ appointmentId, otherPartyName, sessionType, durationLabel, onEnd, onRetry }: Props & { onRetry: () => void }) {
  const { localVideoRef, remoteVideoRef, ...call } = useVideoCall(appointmentId);
  const initials = otherPartyName.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const firstName = otherPartyName.split(" ")[0];

  function close() {
    call.hangUp();
    onEnd();
  }

  const statusLabel: Record<Phase, string> = {
    joining: "Connecting…",
    requesting_media: "Requesting camera & mic…",
    media_denied: "Camera access needed",
    waiting_for_peer: `Waiting for ${firstName}…`,
    connecting: "Connecting…",
    connected: `Connected · ${call.elapsed}`,
    reconnecting: "Reconnecting…",
    failed: "Connection failed",
    ended: "Call ended",
  };

  const isTerminal = call.phase === "failed" || call.phase === "media_denied" || call.phase === "ended";

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 bg-stone-800 rounded-md flex items-center justify-center text-white text-[10px] font-bold">M</span>
          <div>
            <p className="text-white text-sm font-medium leading-tight">{otherPartyName}</p>
            <p className="text-stone-500 text-[11px] capitalize">{sessionType} · {durationLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-stone-400">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${call.phase === "connected" ? "bg-green-400" : call.phase === "failed" || call.phase === "media_denied" ? "bg-red-400" : "bg-stone-600"}`} />
            {statusLabel[call.phase]}
          </span>
          <button onClick={close} className="text-stone-500 hover:text-stone-300 transition-colors" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 relative overflow-hidden mx-3 mb-3 rounded-2xl bg-black">
        {/* Always mounted (even before "connected") so `ontrack` — which can fire
            slightly before connectionState reports "connected" — always has a
            live element to attach the remote stream to, instead of racing a
            conditionally-rendered <video>. */}
        <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
        {call.phase !== "connected" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 bg-stone-950">
          {call.phase === "media_denied" ? (
            <div className="flex flex-col items-center gap-3 px-8 text-center">
              <p className="text-white text-base font-medium">Camera & microphone access needed</p>
              <p className="text-stone-500 text-sm max-w-xs">Allow camera and microphone access in your browser to join this session.</p>
              <div className="flex gap-2 mt-2">
                <button onClick={onRetry} className="text-sm bg-white text-stone-900 px-4 py-2 rounded-lg font-medium hover:bg-stone-200 transition-colors">Try again</button>
                <button onClick={close} className="text-sm text-stone-400 px-4 py-2 rounded-lg hover:text-stone-200 transition-colors">Close</button>
              </div>
            </div>
          ) : call.phase === "failed" ? (
            <div className="flex flex-col items-center gap-3 px-8 text-center">
              <p className="text-white text-base font-medium">Couldn&apos;t connect to {firstName}</p>
              <p className="text-stone-500 text-sm max-w-xs">{call.error?.message}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={onRetry} className="text-sm bg-white text-stone-900 px-4 py-2 rounded-lg font-medium hover:bg-stone-200 transition-colors">Try again</button>
                <button onClick={close} className="text-sm text-stone-400 px-4 py-2 rounded-lg hover:text-stone-200 transition-colors">Close</button>
              </div>
            </div>
          ) : call.phase === "ended" ? (
            <div className="flex flex-col items-center gap-3 px-8 text-center">
              <p className="text-white text-base font-medium">
                {call.endedInfo?.reason === "expired" ? "This session has ended" : `${firstName} left the call`}
              </p>
              <button onClick={close} className="text-sm bg-white text-stone-900 px-4 py-2 rounded-lg font-medium hover:bg-stone-200 transition-colors mt-2">Close</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center text-2xl font-semibold text-stone-300 animate-pulse">
                {initials}
              </div>
              <p className="text-stone-500 text-sm">{statusLabel[call.phase]}</p>
              {call.showWaitHint && call.phase === "waiting_for_peer" && (
                <p className="text-stone-600 text-xs max-w-xs text-center">Taking a while? Make sure {firstName} has this session open too.</p>
              )}
            </div>
          )}
        </div>
        )}

        {/* Self PIP */}
        {!isTerminal && (
          <div className="absolute bottom-4 right-4 w-36 h-24 rounded-xl overflow-hidden border border-stone-700 shadow-xl bg-stone-800 flex flex-col items-center justify-center gap-1.5">
            {call.camOff ? (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-stone-600">
                  <path d="M2 2l14 14M9 4.5C6.5 4.5 4.5 6.5 4.5 9c0 .6.1 1.2.3 1.7M13.5 9c0-2.5-2-4.5-4.5-4.5M6 13.2A4.5 4.5 0 0013.2 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span className="text-stone-500 text-[10px]">Camera off</span>
              </>
            ) : (
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
            <span className="absolute bottom-1.5 left-2 text-[10px] text-stone-400 bg-stone-950/40 px-1 rounded">You</span>
          </div>
        )}

        {/* Client name tag */}
        {call.phase === "connected" && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-stone-950/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-white text-xs font-medium">{otherPartyName}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      {!isTerminal && (
        <div className="shrink-0 flex items-center justify-center gap-3 pb-6">
          <button
            onClick={call.toggleMute}
            title={call.muted ? "Unmute" : "Mute"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              call.muted ? "bg-stone-100 text-stone-900" : "bg-stone-800 text-white hover:bg-stone-700"
            }`}
          >
            {call.muted ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 2l14 14M9 3a3 3 0 013 3v1M6 6v3a3 3 0 005.7 1.3M4.5 9A4.5 4.5 0 009 13.5m0 0v3M7 16.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="6.5" y="2" width="5" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M4.5 9A4.5 4.5 0 0013.5 9M9 13.5v3M7 16.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            )}
          </button>

          <button
            onClick={call.toggleCamera}
            title={call.camOff ? "Turn on camera" : "Turn off camera"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              call.camOff ? "bg-stone-100 text-stone-900" : "bg-stone-800 text-white hover:bg-stone-700"
            }`}
          >
            {call.camOff ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 2l14 14M3 5H2a1 1 0 00-1 1v7a1 1 0 001 1h10M5 5h7a1 1 0 011 1v1.5l3-2v7l-3-2V13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="5" width="11" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" />
                <path d="M12 9l5-3v6l-5-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          <button disabled title="Screen share (coming soon)" className="w-12 h-12 rounded-full bg-stone-800 text-stone-600 flex items-center justify-center cursor-not-allowed">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="3" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M6 17h6M9 14v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M7 9l2-2 2 2M9 7v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button onClick={close} title="End call" className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg shadow-red-900/30">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M20.7 15.4l-3-2.7a1.5 1.5 0 00-2 .1l-1.5 1.5a11.6 11.6 0 01-4-2.5 11.6 11.6 0 01-2.5-4l1.5-1.5a1.5 1.5 0 00.1-2L6.6 1.3A1.5 1.5 0 004.5 1L1.8 3.7c-.3.3-.5.7-.4 1.1C2.5 10.5 6.6 15.5 12 17.6c.4.1.8 0 1.1-.3l2.7-2.7a1.5 1.5 0 00-.1-2.2z" fill="currentColor" />
            </svg>
          </button>

          <button title="Session notes" className="w-12 h-12 rounded-full bg-stone-800 text-white hover:bg-stone-700 flex items-center justify-center transition-all">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="3" y="2" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M6 6h6M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>

          <button title="In-call chat" className="w-12 h-12 rounded-full bg-stone-800 text-white hover:bg-stone-700 flex items-center justify-center transition-all">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 3h12a1 1 0 011 1v8a1 1 0 01-1 1H6l-4 3V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
