import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Broader competitive metagame context from the public Limitless TCG API:
// which archetypes are showing up / placing in recent PTCG events — i.e. what
// you're most likely to face. Self-contained and fault-tolerant: if Limitless
// is down it quietly shows a fallback instead of breaking the dashboard.
const pct = (v: number) => `${Math.round(v * 100)}%`;
const fmtAge = (ms: number) => {
  const h = Math.round((Date.now() - ms) / 3.6e6);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

export function MetaSnapshot() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["meta-snapshot"],
    queryFn: api.getMetaSnapshot,
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  const top = (data?.archetypes ?? []).slice(0, 8);
  const max = top.length ? top[0].share : 1;

  return (
    <section className="rounded-lg border-2 border-p-title bg-p-surface">
      <header className="flex items-center justify-between border-b-2 border-p-border px-3 py-2">
        <h3 className="font-pixel text-xs text-p-title">META SNAPSHOT</h3>
        <span className="font-mono text-[10px] text-p-muted">
          {data ? `${data.tournamentsSampled} events · ${fmtAge(data.updatedAt)}` : "Limitless"}
        </span>
      </header>

      {isLoading ? (
        <p className="p-6 text-center text-sm text-p-muted">Loading meta…</p>
      ) : error || !top.length ? (
        <p className="p-6 text-center text-sm text-p-muted">
          Meta data unavailable right now.
        </p>
      ) : (
        <ul className="space-y-1.5 p-3">
          {top.map((a: any) => (
            <li key={a.name} className="flex items-center gap-2 text-sm">
              <span className="w-32 shrink-0 truncate text-p-title sm:w-40" title={a.name}>
                {a.name}
              </span>
              <div className="relative h-3 flex-1 overflow-hidden rounded bg-p-kpi-bg">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-p-primary"
                  style={{ width: `${(a.share / max) * 100}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-p-muted">
                {pct(a.share)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
