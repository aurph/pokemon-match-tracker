import { db } from "@/db/client";
import { listGames } from "@/db/games-repo";
import {
  winPct,
  lastNWinPct,
  rollingWinPct,
  goingWinPct,
  formatGameWinPct,
  mulliganRate,
  bo3MatchWinPct,
  avgTurns,
  avgTimeMin,
  avgHandQuality,
  perOpponent,
  handQualityHistogram,
  currentStreak,
  longestStreak,
  favoriteVictim,
  nemesis,
} from "@/lib/stats";
import { PageHeader } from "@/components/page-header";
import { KpiTile } from "@/components/kpi-tile";
import { WinRateChart } from "@/components/win-rate-chart";
import { HandQualityChart } from "@/components/hand-quality-chart";
import { MatchupTable } from "@/components/matchup-table";
import { PixelSprite } from "@/components/pixel-sprite";
import { POKEBALL_SPRITE } from "@/lib/sprites";

export const dynamic = "force-dynamic";

const pct = (v: number | null) => (v == null ? null : `${Math.round(v * 100)}%`);
const dec = (v: number | null) => (v == null ? null : v.toFixed(1));
const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function DashboardPage() {
  const games = listGames(db);
  const total = games.length;
  const streak = currentStreak(games);
  const fav = favoriteVictim(games, 3);
  const nem = nemesis(games, 3);
  const recent = [...games].sort((a, b) => b.playedAt - a.playedAt).slice(0, 10);

  const kpis: { label: string; value: string | null }[] = [
    { label: "Total games", value: total === 0 ? null : String(total) },
    { label: "Win %", value: pct(winPct(games)) },
    { label: "Last-10 W%", value: pct(lastNWinPct(games, 10)) },
    { label: "Going 1st W%", value: pct(goingWinPct(games, "1st")) },
    { label: "Going 2nd W%", value: pct(goingWinPct(games, "2nd")) },
    { label: "Mulligan rate", value: pct(mulliganRate(games)) },
    { label: "BO1 W%", value: pct(formatGameWinPct(games, "BO1")) },
    { label: "BO3 game W%", value: pct(formatGameWinPct(games, "BO3")) },
    { label: "BO3 match W%", value: pct(bo3MatchWinPct(games)) },
    { label: "Avg turns", value: dec(avgTurns(games)) },
    { label: "Avg time (min)", value: dec(avgTimeMin(games)) },
    { label: "Avg hand-Q", value: dec(avgHandQuality(games)) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Your deck & matchups at a glance"
        icon={<PixelSprite src={POKEBALL_SPRITE} alt="" size={40} />}
      />

      {/* Fun, auto-tracked stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FunStat
          label="Current streak"
          value={streak.length === 0 ? "—" : `${streak.type}${streak.length}`}
          tone={streak.type === "W" ? "good" : streak.type === "L" ? "bad" : "muted"}
        />
        <FunStat
          label="Longest win streak"
          value={total === 0 ? "—" : String(longestStreak(games, "W"))}
          tone="good"
        />
        <FunStat
          label="Favorite victim"
          value={fav ? fav.opponent : "—"}
          sub={fav ? `${pct(fav.winPct)} win rate` : "need 3+ games vs a deck"}
          tone="good"
        />
        <FunStat
          label="Nemesis"
          value={nem ? nem.opponent : "—"}
          sub={nem ? `${pct(nem.winPct)} win rate` : "need 3+ games vs a deck"}
          tone="bad"
        />
      </div>

      {/* 12 KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <KpiTile key={k.label} label={k.label} value={k.value} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <WinRateChart data={rollingWinPct(games, 10)} />
        <HandQualityChart data={handQualityHistogram(games)} />
      </div>

      {/* Matchup spread */}
      <MatchupTable rows={perOpponent(games)} />

      {/* Recent games */}
      <section className="rounded-lg border-2 border-p-title bg-p-surface">
        <h3 className="border-b-2 border-p-border px-3 py-2 font-pixel text-xs text-p-title">
          RECENT GAMES
        </h3>
        {recent.length === 0 ? (
          <p className="p-6 text-center text-sm text-p-muted">No games yet.</p>
        ) : (
          <ul className="divide-y divide-p-border">
            {recent.map((g) => (
              <li key={g.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <ResultChip r={g.result} />
                <span className="flex-1 truncate font-medium text-p-title">{g.opponentDeck}</span>
                <span className="hidden text-xs text-p-muted sm:inline">going {g.going}</span>
                <span className="text-xs text-p-muted">HQ {g.handQuality ?? "—"}</span>
                <span className="font-mono text-xs text-p-muted">{fmtDate(g.playedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FunStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "good" | "bad" | "muted";
}) {
  const color = tone === "good" ? "text-p-good" : tone === "bad" ? "text-p-bad" : "text-p-muted";
  return (
    <div className="rounded-lg border-2 border-p-title bg-p-surface p-3 shadow-pixel-sm">
      <div className="font-mono text-[10px] uppercase tracking-wider text-p-muted">{label}</div>
      <div className={`mt-1 truncate font-pixel text-sm ${color}`}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-p-muted">{sub}</div>}
    </div>
  );
}

function ResultChip({ r }: { r: string }) {
  const cls =
    r === "W"
      ? "bg-p-good/15 text-p-good"
      : r === "L"
        ? "bg-p-bad/15 text-p-bad"
        : "bg-p-warn/15 text-p-warn";
  return <span className={`rounded px-2 py-0.5 font-pixel text-[10px] ${cls}`}>{r}</span>;
}
