import { db } from "@/db/client";
import { listGames } from "@/db/games-repo";
import { PageHeader } from "@/components/page-header";
import { LogGameModal } from "@/components/log-game-modal";

export const dynamic = "force-dynamic";

const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function GamesPage() {
  const games = listGames(db);

  return (
    <div>
      <PageHeader title="Games" subtitle="Match log" actions={<LogGameModal />} />
      {games.length === 0 ? (
        <div className="rounded-xl border border-dashed border-p-border bg-p-surface p-12 text-center">
          <p className="text-p-muted">No games logged yet.</p>
          <p className="mt-1 text-sm text-p-muted">
            Hit “Log game” (or press <kbd className="font-mono">n</kbd>) to add your first.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-p-border bg-p-surface">
          <table className="w-full text-sm">
            <thead className="bg-p-kpi-bg text-left text-p-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Opponent</th>
                <th className="px-3 py-2 font-medium">Fmt</th>
                <th className="px-3 py-2 font-medium">Going</th>
                <th className="px-3 py-2 font-medium">Hand-Q</th>
                <th className="px-3 py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g, i) => (
                <tr key={g.id} className={i % 2 ? "bg-p-bg/40" : ""}>
                  <td className="px-3 py-2">{fmtDate(g.playedAt)}</td>
                  <td className="px-3 py-2">{g.opponentDeck}</td>
                  <td className="px-3 py-2 font-mono text-xs">{g.format}</td>
                  <td className="px-3 py-2">{g.going}</td>
                  <td className="px-3 py-2">{g.handQuality ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        "rounded px-2 py-0.5 text-xs font-semibold " +
                        (g.result === "W"
                          ? "bg-p-good/15 text-p-good"
                          : g.result === "L"
                            ? "bg-p-bad/15 text-p-bad"
                            : "bg-p-warn/15 text-p-warn")
                      }
                    >
                      {g.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
