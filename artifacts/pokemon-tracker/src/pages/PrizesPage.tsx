import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { PixelSprite } from "@/components/pixel-sprite";
import { spriteForName, POKEBALL_SPRITE } from "@/lib/sprites";
import { HandQualityWinrateChart } from "@/components/hand-quality-winrate-chart";
import { HandLockScatter } from "@/components/hand-lock-scatter";
import { prizeMap, prizeCurse, winPctByHandQuality, handQualityVsLock } from "@/lib/prizes";
import { mulliganRate, avgHandQuality, avgLockTurn } from "@/lib/stats";

const pctStr = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v * 100)}%`);
const dec = (v: number | null | undefined) => (v == null ? "—" : v.toFixed(1));
const rateBg = (v: number | null) =>
  v == null ? undefined : `hsl(${Math.round((1 - v) * 120)} 60% 90%)`;

export function PrizesPage() {
  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.getDashboard,
  });
  const { data: deckData, isLoading: deckLoading } = useQuery({
    queryKey: ["decklist"],
    queryFn: api.listDeckCards,
  });

  if (dashLoading || deckLoading) return <div className="p-8 text-p-muted">Loading…</div>;

  const games = dashData?.games ?? [];
  const deck = (deckData?.cards ?? []).map((c: any) => ({ name: c.name, count: c.count }));
  const rows = prizeMap(games, deck);
  const curse = prizeCurse(rows);
  const ratedPct = games.length
    ? games.filter((g: any) => g.handQuality != null).length / games.length
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
        icon={<PixelSprite src={POKEBALL_SPRITE} alt="" size={40} />}
      />

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {handStats.map((s) => (
          <div key={s.label} className="rounded-lg border-2 border-p-title bg-p-kpi-bg p-3 shadow-pixel-sm">
            <div className="font-mono text-[10px] uppercase tracking-wider text-p-muted">{s.label}</div>
            <div className="mt-1 font-pixel text-xl text-p-title">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HandQualityWinrateChart data={winPctByHandQuality(games)} />
        <HandLockScatter data={handQualityVsLock(games)} />
      </div>

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
