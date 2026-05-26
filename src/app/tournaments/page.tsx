import { db } from "@/db/client";
import { listGames } from "@/db/games-repo";
import { bo3MatchResults, winPct } from "@/lib/stats";
import { dateStamp } from "@/lib/match-id";
import { PageHeader } from "@/components/page-header";
import { PixelSprite } from "@/components/pixel-sprite";
import { ELGYEM_SPRITE } from "@/lib/sprites";
import type { Game } from "@/db/schema";

export const dynamic = "force-dynamic";

const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
const pctStr = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`);

export default function TournamentsPage() {
  const games = listGames(db);

  // Auto-rollup: group games by event + calendar day (one "tournament" per event-day).
  const groups = new Map<string, Game[]>();
  for (const g of games) {
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
        date: Math.min(...gs.map((g) => g.playedAt)),
        games: gs.length,
        w: gs.filter((g) => g.result === "W").length,
        l: gs.filter((g) => g.result === "L").length,
        t: gs.filter((g) => g.result === "T").length,
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
        icon={<PixelSprite src={ELGYEM_SPRITE} alt="Elgyem" size={40} />}
      />

      {rollups.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-p-border bg-p-surface p-12 text-center text-sm text-p-muted">
          No events yet — logged games group here automatically by event and day.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rollups.map((r, i) => (
            <div key={i} className="rounded-lg border-2 border-p-title bg-p-surface p-4 shadow-pixel-sm">
              <div className="flex items-center justify-between">
                <span className="font-pixel text-xs text-p-title">{r.event}</span>
                <span className="font-mono text-[11px] text-p-muted">{fmtDate(r.date)}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-pixel text-2xl text-p-title">
                  {r.w}-{r.l}
                  {r.t ? `-${r.t}` : ""}
                </span>
                <span className="text-xs text-p-muted">games · {pctStr(r.winPct)} W</span>
              </div>
              {r.matchRecord && (
                <div className="mt-1 text-xs text-p-muted">BO3 matches: {r.matchRecord}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
