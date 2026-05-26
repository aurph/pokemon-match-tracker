import { db } from "@/db/client";
import { listGames } from "@/db/games-repo";
import { winPct, lastNWinPct, rollingWinPct } from "@/lib/stats";
import { PageHeader } from "@/components/page-header";
import { KpiTile } from "@/components/kpi-tile";
import { WinRateChart } from "@/components/win-rate-chart";

export const dynamic = "force-dynamic";

const pct = (v: number | null) => (v === null ? null : `${Math.round(v * 100)}%`);

export default function DashboardPage() {
  const games = listGames(db);
  const total = games.length;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your Elgyem control deck, at a glance" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiTile label="Total games" value={total === 0 ? null : String(total)} />
        <KpiTile label="Win %" value={pct(winPct(games))} />
        <KpiTile label="Last 10 W%" value={pct(lastNWinPct(games, 10))} />
      </div>
      <div className="mt-6">
        <WinRateChart data={rollingWinPct(games, 10)} />
      </div>
    </div>
  );
}
