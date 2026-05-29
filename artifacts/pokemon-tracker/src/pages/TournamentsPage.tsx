import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { PixelSprite } from "@/components/pixel-sprite";
import { POKEBALL_SPRITE } from "@/lib/sprites";
import { bo3MatchResults, winPct } from "@/lib/stats";
import { dateStamp } from "@/lib/match-id";

const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
const pctStr = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`);

export function TournamentsPage() {
  const { data: games, isLoading } = useQuery({
    queryKey: ["games"],
    queryFn: api.listGames,
  });

  if (isLoading) return <div className="p-8 text-p-muted">Loading…</div>;

  const allGames = games ?? [];
  const groups = new Map<string, any[]>();
  for (const g of allGames) {
    const key = `${g.event}__${dateStamp(g.playedAt)}`;
    const arr = groups.get(key) ?? [];
    arr.push(g);
    groups.set(key, arr);
  }

  const rollups = [...groups.values()]
    .map((gs) => {
      const matches = bo3MatchResults(gs);
      return {
        event: gs[0].event,
        date: Math.min(...gs.map((g: any) => g.playedAt)),
        games: gs.length,
        w: gs.filter((g: any) => g.result === "W").length,
        l: gs.filter((g: any) => g.result === "L").length,
        t: gs.filter((g: any) => g.result === "T").length,
        winPct: winPct(gs),
        matchRecord:
          matches.length > 0
            ? `${matches.filter((m) => m.result === "W").length}-${matches.filter((m) => m.result === "L").length}${
                matches.filter((m) => m.result === "T").length
                  ? `-${matches.filter((m) => m.result === "T").length}`
                  : ""
              }`
            : null,
      };
    })
    .sort((a, b) => b.date - a.date);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tournaments"
        subtitle="Auto-grouped by event + day"
        icon={<PixelSprite src={POKEBALL_SPRITE} alt="" size={40} />}
      />

      {rollups.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-p-border bg-p-surface p-12 text-center text-sm text-p-muted">
          No games logged yet. Games are auto-grouped into sessions by event + day.
        </div>
      ) : (
        <div className="space-y-3">
          {rollups.map((r, i) => (
            <div key={i} className="rounded-lg border-2 border-p-title bg-p-surface p-4 shadow-pixel-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-pixel text-sm text-p-title">{r.event}</div>
                  <div className="mt-0.5 font-mono text-xs text-p-muted">{fmtDate(r.date)}</div>
                </div>
                <div className="flex gap-3 text-center">
                  <div>
                    <div className="font-pixel text-lg text-p-title">{pctStr(r.winPct)}</div>
                    <div className="font-mono text-[10px] uppercase text-p-muted">Win %</div>
                  </div>
                  <div>
                    <div className="font-pixel text-lg text-p-title">{r.games}</div>
                    <div className="font-mono text-[10px] uppercase text-p-muted">Games</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <span className="rounded bg-p-good/15 px-2 py-1 font-mono text-xs text-p-good">{r.w}W</span>
                <span className="rounded bg-p-bad/15 px-2 py-1 font-mono text-xs text-p-bad">{r.l}L</span>
                {r.t > 0 && (
                  <span className="rounded bg-p-warn/15 px-2 py-1 font-mono text-xs text-p-warn">{r.t}T</span>
                )}
                {r.matchRecord && (
                  <span className="ml-2 rounded bg-p-kpi-bg px-2 py-1 font-mono text-xs text-p-muted">
                    Matches {r.matchRecord}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
