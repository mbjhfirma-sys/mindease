"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

export default function AccessGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/site-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "That code isn't right.");
        setLoading(false);
        return;
      }
      router.push(searchParams.get("next") || "/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-stone-400 hover:text-sage-700 transition-colors underline decoration-dotted underline-offset-4"
      >
        Team member? Enter your access code
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-2.5 w-full max-w-xs">
      <div className="flex w-full gap-2">
        <input
          type="text"
          autoFocus
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(null); }}
          placeholder="Access code"
          className="flex-1 min-w-0 border border-stone-200 rounded-full px-4 py-2.5 text-sm text-center tracking-wide focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all bg-white"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="flex items-center justify-center w-11 h-11 flex-shrink-0 bg-sage-700 hover:bg-sage-800 disabled:opacity-40 text-white rounded-full transition-colors"
          aria-label="Submit access code"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
