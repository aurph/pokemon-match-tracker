import { db } from "@/db/client";
import { listGames } from "@/db/games-repo";
import { deckCards } from "@/db/schema";
import { prizeMap, prizeCurse, winPctByHandQuality, handQualityVsLock } from "@/lib/prizes";
import { mulliganRate, avgHandQuality, avgLockTurn } from "@/lib/stats";
import { PageHeader } from "@/components/page-header";
import { PixelSprite } from "@/components/pixel-sprite";
import { spriteForName, ELGYEM_SPRITE } from "@/lib/sprites";
import { HandQualityWinrateChart } from "@/components/hand-quality-winrate-chart";
import { HandLockScatter } from "@/components/hand-lock-scatter";

export const dynamic = "force-dynamic";

const pctStr = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`);
const dec = (v: number | null) => (v == null ? "—" : v.toFixed(1));

/** Observed prize rate: lower = greener (good — your key cards stay out of prizes). */
const rateBg = (v: number | null) => (v == null ? undefined : `hsl(${Math.round((1 - v) * 120)} 60% 90%)`);

export default function PrizesPage() {
  const games = listGames(db);
  const deck = db
    .select({ name: deckCards.name, count: deckCards.count })
    .from(deckCards)
    .orderBy(deckCards.orderIndex)
    .all();
  const rows = prizeMap(games, deck);
  const curse = prizeCurse(rows);
  const ratedPct = games.length
    ? games.filter((g) => g.handQuality != null).length / games.length
    : null;

  const handStats = [
    { label: "Avg hand-Q", value: dec(avgHandQuality(games)) },
    { label: "% hands rated", value: pctStr(ratedPct) },
    { label: "Mulligan rate", value: pctStr(mulliganRate(games)) },
    { label: "Avg lock turn", value: dec(avgLockTurn(games)) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prizes & Hands"
        subtitle="Which lock pieces get prized — and how your hands play out"
        icon={<PixelSprite src={ELGYEM_SPRITE} alt="Elgyem" size={40} />}
      />

      {/* Prize curse callout */}
      {curse && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-p-bad bg-p-bad/5 p-3 shadow-pixel-sm">
          {spriteForName(curse.name) && (
            <PixelSprite src={spriteForName(curse.name)!} alt={curse.name} size={44} />
          )}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-p-bad">
              Prize curse
            </div>
            <div className="font-pixel text-sm text-p-title">{curse.name}</div>
            <div className="text-xs text-p-muted">
              prized in {curse.timesPrized} of {curse.gamesLogged} games ({pctStr(curse.observedRate)})
            </div>
          </div>
        </div>
      )}

      {/* Hand-stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {handStats.map((s) => (
          <div key={s.label} className="rounded-lg border-2 border-p-title bg-p-kpi-bg p-3 shadow-pixel-sm">
            <div className="font-mono text-[10px] uppercase tracking-wider text-p-muted">{s.label}</div>
            <div className="mt-1 font-pixel text-xl text-p-title">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Hand charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <HandQualityWinrateChart data={winPctByHandQuality(games)} />
        <HandLockScatter data={handQualityVsLock(games)} />
      </div>

      {/* Prize map */}
      <div className="overflow-x-auto rounded-lg border-2 border-p-title bg-p-surface">
        <h3 className="border-b-2 border-p-border px-3 py-2 font-pixel text-xs text-p-title">PRIZE MAP</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-p-muted">
            <tr>
              {["Card", "Copies", "Prized", "Observed", "Expected", "vs exp."].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2 font-mono text-[11px] uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const sprite = spriteForName(r.name);
              const delta = r.observedRate == null ? null : r.observedRate - r.expectedRate;
              return (
                <tr key={r.name} className="border-t border-p-border">
                  <td className="flex items-center gap-2 whitespace-nowrap px-3 py-1.5 font-medium text-p-title">
                    {sprite ? (
                      <PixelSprite src={sprite} alt="" size={24} />
                    ) : (
                      <span className="inline-block h-6 w-6 rounded bg-p-kpi-bg" />
                    )}
                    {r.name}
                  </td>
                  <td className="px-3 py-1.5 text-p-muted">{r.copies}</td>
                  <td className="px-3 py-1.5 text-p-muted">
                    {r.timesPrized}/{r.gamesLogged}
                  </td>
                  <td
                    className="px-3 py-1.5 text-center text-p-title"
                    style={{ backgroundColor: rateBg(r.observedRate) }}
                  >
                    {pctStr(r.observedRate)}
                  </td>
                  <td className="px-3 py-1.5 text-center text-p-muted">
                    {Math.round(r.expectedRate * 100)}%
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    {delta == null ? (
                      "—"
                    ) : (
                      <span className={delta > 0.001 ? "text-p-bad" : delta < -0.001 ? "text-p-good" : "text-p-muted"}>
                        {delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} {Math.abs(Math.round(delta * 100))}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
