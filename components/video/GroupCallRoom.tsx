"use client";

import { useEffect, useRef, useState } from "react";

type SessionPhase = "joining" | "requesting_media" | "media_denied" | "in_room" | "failed" | "ended";
type PeerConnState = "connecting" | "connected" | "disconnected" | "failed";

type Participant = { userId: string; name: string; joinedAt: string };
type JoinResponse = { selfUserId: string; selfJoinedAt: string; isHost: boolean; iceServers: RTCIceServer[]; participants: Participant[] };
type SignalRow = { id: string; senderId: string; type: "offer" | "answer" | "ice_candidate"; payload: unknown; createdAt: string };
type PollResponse = { signals: SignalRow[]; sessionStatus: "scheduled" | "ended" | "canceled"; participants: Participant[] };
type ErrorResponse = { error: string; opensAt?: string; closesAt?: string };

// Keeps per-client mesh upload bandwidth manageable at up to 8 participants — not
// present in, and not backported to, the 1:1 VideoCallRoom.
const MAX_VIDEO_BITRATE_BPS = 350_000;
const POLL_MS = 1500;

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
    case "session_not_active":
      return "This session isn't active.";
    case "session_full":
      return "This session is full right now.";
    default:
      return status === 403 || status === 404
        ? "You don't have access to this session."
        : "Couldn't start the session. Please try again.";
  }
}

// Whoever joined later always offers to whoever's already there — a deterministic
// rule both sides compute independently with no coordination. Tiebreak by userId in
// the rare case two joins land in the exact same millisecond.
function shouldOfferTo(myJoinedAtMs: number, myUserId: string, theirJoinedAtMs: number, theirUserId: string): boolean {
  if (myJoinedAtMs !== theirJoinedAtMs) return myJoinedAtMs > theirJoinedAtMs;
  return myUserId > theirUserId;
}

type PeerEntry = {
  pc: RTCPeerConnection;
  pendingCandidates: RTCIceCandidateInit[];
  localDescPosted: boolean;
  name: string;
  connState: PeerConnState;
};

type Tile = { userId: string; name: string; connState: PeerConnState };

function useGroupCall(sessionId: string) {
  const [phase, setPhase] = useState<SessionPhase>("joining");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [endedByHost, setEndedByHost] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const remoteVideoElsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerEntry>>(new Map());
  const selfUserIdRef = useRef<string>("");
  const selfJoinedAtMsRef = useRef<number>(0);
  const iceServersRef = useRef<RTCIceServer[]>([]);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endedRef = useRef(false);
  const pendingLeaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function refreshTiles() {
    setTiles([...peersRef.current.entries()].map(([userId, p]) => ({ userId, name: p.name, connState: p.connState })));
  }

  function setRemoteVideoRef(userId: string, el: HTMLVideoElement | null) {
    if (el) {
      remoteVideoElsRef.current.set(userId, el);
      const stream = remoteStreamsRef.current.get(userId);
      if (stream) el.srcObject = stream;
    } else {
      remoteVideoElsRef.current.delete(userId);
    }
  }

  function capSenderBitrate(pc: RTCPeerConnection) {
    for (const sender of pc.getSenders()) {
      if (sender.track?.kind !== "video") continue;
      const params = sender.getParameters();
      if (!params.encodings) params.encodings = [{}];
      params.encodings[0].maxBitrate = MAX_VIDEO_BITRATE_BPS;
      sender.setParameters(params).catch(() => {});
    }
  }

  useEffect(() => {
    let cancelled = false;
    endedRef.current = false;

    // Same Strict Mode phantom-cleanup guard as the 1:1 room: dev-only double
    // mount→cleanup→mount shouldn't send a real leave beacon for the mount that
    // "didn't really end."
    if (pendingLeaveRef.current) {
      clearTimeout(pendingLeaveRef.current);
      pendingLeaveRef.current = null;
    }

    function sendLeaveBeacon() {
      fetch(`/api/group-sessions/${sessionId}/leave`, { method: "POST", keepalive: true }).catch(() => {});
    }

    function closePeer(userId: string) {
      const entry = peersRef.current.get(userId);
      if (!entry) return;
      entry.pc.close();
      peersRef.current.delete(userId);
      remoteStreamsRef.current.delete(userId);
      const el = remoteVideoElsRef.current.get(userId);
      if (el) el.srcObject = null;
    }

    function localCleanup() {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      for (const userId of [...peersRef.current.keys()]) closePeer(userId);
      localStreamRef.current = null;
    }

    async function sendSignal(recipientId: string, type: "offer" | "answer" | "ice_candidate", payload: unknown) {
      await apiCall(`/api/group-sessions/${sessionId}/signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, type, payload }),
      });
    }

    function wirePeerConnection(userId: string, name: string, pc: RTCPeerConnection): PeerEntry {
      const entry: PeerEntry = { pc, pendingCandidates: [], localDescPosted: false, name, connState: "connecting" };
      peersRef.current.set(userId, entry);

      pc.ontrack = (e) => {
        remoteStreamsRef.current.set(userId, e.streams[0]);
        const el = remoteVideoElsRef.current.get(userId);
        if (el) el.srcObject = e.streams[0];
      };

      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        const c = e.candidate.toJSON();
        if (entry.localDescPosted) void sendSignal(userId, "ice_candidate", c);
        else entry.pendingCandidates.push(c);
      };

      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        const next: PeerConnState = s === "connected" ? "connected" : s === "failed" ? "failed" : s === "disconnected" ? "disconnected" : "connecting";
        const current = peersRef.current.get(userId);
        if (current) { current.connState = next; refreshTiles(); }
      };

      return entry;
    }

    async function offerTo(userId: string, name: string) {
      if (peersRef.current.has(userId) || !localStreamRef.current) return;
      const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
      localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
      capSenderBitrate(pc);
      const entry = wirePeerConnection(userId, name, pc);
      refreshTiles();

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal(userId, "offer", { type: offer.type, sdp: offer.sdp });
      entry.localDescPosted = true;
      const queued = entry.pendingCandidates.splice(0, entry.pendingCandidates.length);
      for (const c of queued) await sendSignal(userId, "ice_candidate", c);
    }

    async function answerOffer(senderId: string, name: string, offerPayload: RTCSessionDescriptionInit) {
      // A fresh offer from a peer I already have a connection with means they
      // reconnected — restart that one link rather than attempting true
      // renegotiation on the old (possibly dead) RTCPeerConnection.
      closePeer(senderId);
      if (!localStreamRef.current) return;
      const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
      localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
      capSenderBitrate(pc);
      const entry = wirePeerConnection(senderId, name, pc);
      refreshTiles();

      await pc.setRemoteDescription(offerPayload);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal(senderId, "answer", { type: answer.type, sdp: answer.sdp });
      entry.localDescPosted = true;
      const queued = entry.pendingCandidates.splice(0, entry.pendingCandidates.length);
      for (const c of queued) await sendSignal(senderId, "ice_candidate", c);
    }

    async function reconcileRoster(participants: Participant[]) {
      const freshIds = new Set(participants.map((p) => p.userId));

      for (const userId of [...peersRef.current.keys()]) {
        if (!freshIds.has(userId)) { closePeer(userId); refreshTiles(); }
      }

      for (const p of participants) {
        if (peersRef.current.has(p.userId)) continue;
        const theirJoinedAtMs = new Date(p.joinedAt).getTime();
        if (shouldOfferTo(selfJoinedAtMsRef.current, selfUserIdRef.current, theirJoinedAtMs, p.userId)) {
          await offerTo(p.userId, p.name);
        }
        // Else: wait for their offer to arrive via polling — handled in poll() below.
      }
    }

    async function poll() {
      if (cancelled || endedRef.current) return;
      const res = await apiCall<PollResponse>(`/api/group-sessions/${sessionId}/signal`, { method: "GET" });
      if (cancelled || endedRef.current) return;

      if (res.ok) {
        const { signals, sessionStatus, participants } = res.data as PollResponse;
        const nameOf = (id: string) => participants.find((p) => p.userId === id)?.name ?? "Someone";

        await reconcileRoster(participants);

        for (const sig of signals) {
          if (sig.type === "offer") {
            await answerOffer(sig.senderId, nameOf(sig.senderId), sig.payload as RTCSessionDescriptionInit);
          } else if (sig.type === "answer") {
            const entry = peersRef.current.get(sig.senderId);
            if (entry) await entry.pc.setRemoteDescription(sig.payload as RTCSessionDescriptionInit);
          } else if (sig.type === "ice_candidate") {
            const entry = peersRef.current.get(sig.senderId);
            if (entry) {
              try {
                await entry.pc.addIceCandidate(sig.payload as RTCIceCandidateInit);
              } catch {
                // Benign if that peer connection already closed mid-poll.
              }
            }
          }
        }

        if (sessionStatus !== "scheduled" && !endedRef.current) {
          endedRef.current = true;
          localCleanup();
          setEndedByHost(sessionStatus === "ended");
          setPhase("ended");
          return;
        }
      }

      if (!cancelled && !endedRef.current) {
        pollTimeoutRef.current = setTimeout(poll, POLL_MS);
      }
    }

    async function start() {
      const joinRes = await apiCall<JoinResponse>(`/api/group-sessions/${sessionId}/join`, { method: "POST" });
      if (cancelled) return;
      if (!joinRes.ok) {
        const data = joinRes.data as ErrorResponse;
        setError(joinErrorMessage(joinRes.status, data.error));
        setPhase("failed");
        return;
      }
      const { selfUserId, selfJoinedAt, isHost: hostFlag, iceServers, participants } = joinRes.data as JoinResponse;
      selfUserIdRef.current = selfUserId;
      selfJoinedAtMsRef.current = new Date(selfJoinedAt).getTime();
      iceServersRef.current = iceServers;
      setIsHost(hostFlag);

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

      setPhase("in_room");
      await reconcileRoster(participants);
      poll();
    }

    start();

    const onPageHide = () => {
      fetch(`/api/group-sessions/${sessionId}/leave`, { method: "POST", keepalive: true }).catch(() => {});
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", onPageHide);
      if (!endedRef.current) {
        localCleanup();
        pendingLeaveRef.current = setTimeout(() => {
          pendingLeaveRef.current = null;
          if (!endedRef.current) {
            endedRef.current = true;
            sendLeaveBeacon();
          }
        }, 300);
      }
    };
  }, [sessionId]);

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
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      for (const entry of peersRef.current.values()) entry.pc.close();
      fetch(`/api/group-sessions/${sessionId}/leave`, { method: "POST", keepalive: true }).catch(() => {});
    }
  }

  return {
    phase, error, muted, camOff, tiles, isHost, endedByHost,
    localVideoRef, setRemoteVideoRef,
    toggleMute, toggleCamera, hangUp,
  };
}

type Props = {
  sessionId: string;
  groupName: string;
  onEnd: () => void;
};

export default function GroupCallRoom(props: Props) {
  const [attempt, setAttempt] = useState(0);
  return <GroupCallRoomInner key={attempt} {...props} onRetry={() => setAttempt((a) => a + 1)} />;
}

const CONN_LABEL: Record<PeerConnState, string> = {
  connecting: "Connecting…", connected: "", disconnected: "Reconnecting…", failed: "Connection issue",
};

function GroupCallRoomInner({ sessionId, groupName, onEnd, onRetry }: Props & { onRetry: () => void }) {
  const { localVideoRef, setRemoteVideoRef, ...call } = useGroupCall(sessionId);

  function close() {
    call.hangUp();
    onEnd();
  }

  const isTerminal = call.phase === "failed" || call.phase === "media_denied" || call.phase === "ended";
  const gridCols = call.tiles.length + 1 <= 1 ? 1 : call.tiles.length + 1 <= 2 ? 2 : call.tiles.length + 1 <= 6 ? 3 : 4;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col select-none">
      <div className="flex items-center justify-between px-5 py-3.5 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 bg-stone-800 rounded-md flex items-center justify-center text-white text-[10px] font-bold">M</span>
          <div>
            <p className="text-white text-sm font-medium leading-tight">{groupName}</p>
            <p className="text-stone-500 text-[11px]">{call.tiles.length + 1} in the room</p>
          </div>
        </div>
        <button onClick={close} className="text-stone-500 hover:text-stone-300 transition-colors" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden mx-3 mb-3 rounded-2xl bg-black">
        {!isTerminal ? (
          <div className="w-full h-full grid gap-2 p-2" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
            {/* Self tile */}
            <div className="relative rounded-xl overflow-hidden bg-stone-900 flex items-center justify-center">
              {call.camOff ? (
                <span className="text-stone-500 text-sm">Camera off</span>
              ) : (
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              )}
              <span className="absolute bottom-2 left-2 text-[11px] text-white bg-stone-950/50 px-2 py-0.5 rounded">You</span>
            </div>

            {/* Peer tiles — video element always mounted (even before "connected"), so
                ontrack (which can fire before connectionState catches up) never races
                a not-yet-existing element. */}
            {call.tiles.map((t) => (
              <div key={t.userId} className="relative rounded-xl overflow-hidden bg-stone-900 flex items-center justify-center">
                <video ref={(el) => setRemoteVideoRef(t.userId, el)} autoPlay playsInline className="w-full h-full object-cover" />
                {t.connState !== "connected" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-stone-950/60">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-sm font-semibold text-stone-300">
                        {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="text-stone-400 text-[11px]">{CONN_LABEL[t.connState]}</span>
                    </div>
                  </div>
                )}
                <span className="absolute bottom-2 left-2 text-[11px] text-white bg-stone-950/50 px-2 py-0.5 rounded">{t.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950">
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
                <p className="text-white text-base font-medium">Couldn&apos;t join the session</p>
                <p className="text-stone-500 text-sm max-w-xs">{call.error}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={onRetry} className="text-sm bg-white text-stone-900 px-4 py-2 rounded-lg font-medium hover:bg-stone-200 transition-colors">Try again</button>
                  <button onClick={close} className="text-sm text-stone-400 px-4 py-2 rounded-lg hover:text-stone-200 transition-colors">Close</button>
                </div>
              </div>
            ) : call.phase === "ended" ? (
              <div className="flex flex-col items-center gap-3 px-8 text-center">
                <p className="text-white text-base font-medium">
                  {call.endedByHost ? "The host ended this session" : "This session has ended"}
                </p>
                <button onClick={close} className="text-sm bg-white text-stone-900 px-4 py-2 rounded-lg font-medium hover:bg-stone-200 transition-colors mt-2">Close</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center text-2xl font-semibold text-stone-300 animate-pulse">…</div>
                <p className="text-stone-500 text-sm">{call.phase === "requesting_media" ? "Requesting camera & mic…" : "Joining…"}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {!isTerminal && (
        <div className="shrink-0 flex items-center justify-center gap-3 pb-6">
          <button
            onClick={call.toggleMute}
            title={call.muted ? "Unmute" : "Mute"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${call.muted ? "bg-stone-100 text-stone-900" : "bg-stone-800 text-white hover:bg-stone-700"}`}
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
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${call.camOff ? "bg-stone-100 text-stone-900" : "bg-stone-800 text-white hover:bg-stone-700"}`}
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

          <button onClick={close} title={call.isHost ? "End session for everyone" : "Leave session"} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg shadow-red-900/30">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M20.7 15.4l-3-2.7a1.5 1.5 0 00-2 .1l-1.5 1.5a11.6 11.6 0 01-4-2.5 11.6 11.6 0 01-2.5-4l1.5-1.5a1.5 1.5 0 00.1-2L6.6 1.3A1.5 1.5 0 004.5 1L1.8 3.7c-.3.3-.5.7-.4 1.1C2.5 10.5 6.6 15.5 12 17.6c.4.1.8 0 1.1-.3l2.7-2.7a1.5 1.5 0 00-.1-2.2z" fill="currentColor" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
