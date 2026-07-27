import { formatCents } from "@/lib/money";

type Client = { id: string; name: string; cents: number; count: number };

function initials(name: string): string {
  return name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function ClientLeaderboard({ clients, currency }: { clients: Client[]; currency: string }) {
  if (clients.length === 0) {
    return <div className="py-10 text-center text-sm text-stone-400">No client activity in this period.</div>;
  }
  const total = clients.reduce((sum, c) => sum + c.cents, 0) || 1;

  return (
    <div className="flex flex-col">
      {clients.map((c, i) => {
        const pct = Math.round((c.cents / total) * 100);
        return (
          <div key={c.id} className="flex items-center gap-2.5 px-1 py-2.5">
            <div className="text-[11px] font-mono text-stone-400 w-3 flex-none">{i + 1}</div>
            <div className="w-7 h-7 rounded-full bg-sage-50 text-sage-700 text-[10px] font-bold flex items-center justify-center flex-none">
              {initials(c.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-stone-800 truncate mb-1">{c.name}</div>
              <div className="h-1 rounded-full bg-stone-100 overflow-hidden">
                <div className="h-full bg-sage-600 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="text-xs font-bold text-stone-900 tabular-nums flex-none">{formatCents(c.cents, currency)}</div>
          </div>
        );
      })}
    </div>
  );
}
