import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { KpiTile } from "@/components/kpi-tile";
import { WinRateChart } from "@/components/win-rate-chart";
import { HandQualityChart } from "@/components/hand-quality-chart";
import { MatchupTable } from "@/components/matchup-table";
import { DeckStrip } from "@/components/deck-strip";
import { MetaSnapshot } from "@/components/meta-snapshot";
import { PixelSprite } from "@/components/pixel-sprite";
import { POKEBALL_SPRITE } from "@/lib/sprites";

const pct = (v: number | null | undefined) => (v == null ? null : `${Math.round(v * 100)}%`);
const dec = (v: number | null | undefined) => (v == null ? null : v.toFixed(1));
const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function ResultChip({ r }: { r: string }) {
  const cls =
    r === "W"
      ? "bg-p-good/15 text-p-good"
      : r === "L"
        ? "bg-p-bad/15 text-p-bad"
        : "bg-p-warn/15 text-p-warn";
  return <span className={`rounded px-2 py-0.5 font-pixel text-[10px] ${cls}`}>{r}</span>;
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

export function DashboardPage() {
  const [showAllStats, setShowAllStats] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.getDashboard,
  });

  if (isLoading || !data) return <div className="p-8 text-p-muted">Loading…</div>;
  if (error) return <div className="p-8 text-p-bad">Error loading dashboard.</div>;

  const { kpis, streak, favoriteVictim: fav, nemesis: nem, recentGames: recent } = data;
  const total = kpis?.total ?? 0;

  const headlineKpis = [
    { label: "Total games", value: total === 0 ? null : String(total) },
    { label: "Win %", value: pct(kpis?.winPct) },
    { label: "Last-10 W%", value: pct(kpis?.last10WinPct) },
  ];
  const moreKpis = [
    { label: "Going 1st W%", value: pct(kpis?.going1stWinPct) },
    { label: "Going 2nd W%", value: pct(kpis?.going2ndWinPct) },
    { label: "Mulligan rate", value: pct(kpis?.mulliganRate) },
    { label: "BO1 W%", value: pct(kpis?.bo1WinPct) },
    { label: "BO3 game W%", value: pct(kpis?.bo3GameWinPct) },
    { label: "BO3 match W%", value: pct(kpis?.bo3MatchWinPct) },
    { label: "Avg turns", value: dec(kpis?.avgTurns) },
    { label: "Avg time (min)", value: dec(kpis?.avgTimeMin) },
    { label: "Avg hand-Q", value: dec(kpis?.avgHandQuality) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        subtitle="Your deck & matchups at a glance"
        icon={<PixelSprite src={POKEBALL_SPRITE} alt="" size={40} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FunStat
          label="Current streak"
          value={!streak?.length ? "—" : `${streak.type}${streak.length}`}
          tone={streak?.type === "W" ? "good" : streak?.type === "L" ? "bad" : "muted"}
        />
        <FunStat
          label="Longest win streak"
          value={total === 0 ? "—" : String(data.longestWinStreak)}
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

      <div className="grid grid-cols-3 gap-3">
        {headlineKpis.map((k) => (
          <KpiTile key={k.label} label={k.label} value={k.value} />
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowAllStats((v) => !v)}
          className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-p-muted hover:text-p-title"
        >
          <ChevronDown
            size={14}
            className={"transition-transform " + (showAllStats ? "rotate-180" : "")}
          />
          {showAllStats ? "Hide" : "All"} stats
        </button>
        {showAllStats && (
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {moreKpis.map((k) => (
              <KpiTile key={k.label} label={k.label} value={k.value} />
            ))}
          </div>
        )}
      </div>

      <DeckStrip />

      <MetaSnapshot />

      <div>
        <button
          type="button"
          onClick={() => setShowTrends((v) => !v)}
          className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-p-muted hover:text-p-title"
        >
          <ChevronDown
            size={14}
            className={"transition-transform " + (showTrends ? "rotate-180" : "")}
          />
          {showTrends ? "Hide" : "Show"} trends & matchups
        </button>
        {showTrends && (
          <div className="mt-2 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <WinRateChart data={data.rollingWinPct ?? []} />
              <HandQualityChart data={data.handQualityHistogram ?? []} />
            </div>
            <MatchupTable rows={data.matchupTable ?? []} />
          </div>
        )}
      </div>

      <section className="rounded-lg border-2 border-p-title bg-p-surface">
        <h3 className="border-b-2 border-p-border px-3 py-2 font-pixel text-xs text-p-title">
          RECENT GAMES
        </h3>
        {!recent?.length ? (
          <p className="p-6 text-center text-sm text-p-muted">No games yet.</p>
        ) : (
          <ul className="divide-y divide-p-border">
            {recent.map((g: any) => (
              <li key={g.id} className="flex items-center gap-3 px-3 py-1.5 text-sm">
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
