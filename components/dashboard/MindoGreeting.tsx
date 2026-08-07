"use client";

import { useEffect, useMemo, useState } from "react";
import { MindoAvatar } from "./MindoAvatar";
import { useMindoAnimator } from "@/lib/mindo/useMindoAnimator";

const WORD_STAGGER_MS = 130;

/**
 * The primary Mindo introduction: idle → eye contact → eyebrows raise +
 * smile → anticipation → jump → settle happy → idle, synced to a warm
 * word-by-word reveal of the greeting text (not a robotic typewriter).
 */
export function MindoGreeting({
  text = "Hi, I am Mindo",
  emoji = "👋",
  size = "lg",
  layout = "stack",
  className = "",
  textClassName = "text-lg font-semibold text-stone-900",
  onSettled,
}: {
  text?: string;
  emoji?: string;
  size?: "lg" | "md" | "sm" | "xs";
  /** "stack" (avatar above text, centered) for a hero card, "inline" (avatar beside text) for a compact pill/row. */
  layout?: "stack" | "inline";
  className?: string;
  textClassName?: string;
  onSettled?: () => void;
}) {
  const mindo = useMindoAnimator("idle");
  const words = useMemo(() => [...text.split(" "), emoji].filter(Boolean), [text, emoji]);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    const reveal = setTimeout(() => setRevealing(true), 150);
    const brighten = setTimeout(() => mindo.animate("happy"), 150);
    const jump = setTimeout(() => mindo.animate("excited"), 560);
    const settled = setTimeout(() => onSettled?.(), 560 + 780);
    const rest = setTimeout(() => mindo.animate("idle"), 4200);
    return () => { [reveal, brighten, jump, settled, rest].forEach(clearTimeout); };
    // Runs once on mount — this is a scripted one-time intro sequence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const layoutClass = layout === "inline" ? "flex items-center text-left gap-2.5" : "flex flex-col items-center text-center gap-3";

  return (
    <div className={`${layoutClass} ${className}`}>
      <MindoAvatar size={size} state={mindo.state} replayKey={mindo.replayKey} />
      <p className={textClassName}>
        <span aria-hidden="true">
          {revealing && words.map((w, i) => (
            <span
              key={i}
              className="mindo-word-reveal"
              style={{ animationDelay: `${i * WORD_STAGGER_MS}ms` }}
            >
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </span>
        <span className="sr-only">{text} {emoji}</span>
      </p>
    </div>
  );
}
