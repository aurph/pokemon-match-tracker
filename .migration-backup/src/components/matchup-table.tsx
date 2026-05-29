"use client";

import { useState } from "react";
import type { OpponentStats } from "@/lib/stats";

type SortKey = keyof OpponentStats;

const columns: { key: SortKey; label: string; pct?: boolean }[] = [
  { key: "opponent", label: "Opponent" },
  { key: "games", label: "G" },
  { key: "w", label: "W" },
  { key: "l", label: "L" },
  { key: "t", label: "T" },
  { key: "winPct", label: "Win%", pct: true },
  { key: "firstWinPct", label: "1st%", pct: true },
  { key: "secondWinPct", label: "2nd%", pct: true },
  { key: "bo1WinPct", label: "BO1%", pct: true },
  { key: "bo3WinPct", label: "BO3%", pct: true },
  { key: "last5WinPct", label: "L5%", pct: true },
  { key: "avgHandQ", label: "HandQ" },
];

const fmtPct = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`);

/** Red→yellow→green scale across 0..100% as a soft cell background. */
function pctBg(v: number | null): string | undefined {
  if (v == null) return undefined;
  return `hsl(${Math.round(v * 120)} 60% 90%)`;
}

export function MatchupTable({ rows }: { rows: OpponentStats[] }) {
  const [minGames, setMinGames] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("games");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-p-border bg-p-surface p-8 text-center text-sm text-p-muted">
        Log some games to see your matchup spread.
      </div>
    );
  }

  const sorted = [...rows.filter((r) => r.games >= minGames)].sort((a, b) => {
    if (sortKey === "opponent") {
      const cmp = a.opponent.localeCompare(b.opponent);
      return dir === "asc" ? cmp : -cmp;
    }
    const av = a[sortKey] == null ? -Infinity : (a[sortKey] as number);
    const bv = b[sortKey] == null ? -Infinity : (b[sortKey] as number);
    return dir === "asc" ? av - bv : bv - av;
  });

  function toggleSort(k: SortKey) {
    if (k === sortKey) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setDir(k === "opponent" ? "asc" : "desc");
    }
  }

  return (
    <div className="rounded-lg border-2 border-p-title bg-p-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-p-border px-3 py-2">
        <h3 className="font-pixel text-xs text-p-title">MATCHUP SPREAD</h3>
        <label className="flex items-center gap-2 text-xs text-p-muted">
          min games <span className="font-mono text-p-title">{minGames}</span>
          <input
            type="range"
            min={1}
            max={20}
            value={minGames}
            onChange={(e) => setMinGames(Number(e.target.value))}
            className="accent-p-primary"
          />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-p-muted">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className="cursor-pointer whitespace-nowrap px-2 py-2 font-mono text-[11px] uppercase select-none hover:text-p-title"
                >
                  {c.label}
                  {sortKey === c.key ? (dir === "asc" ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.opponent} className="border-t border-p-border">
                <td className="whitespace-nowrap px-2 py-1.5 font-medium text-p-title">{r.opponent}</td>
                <td className="px-2 py-1.5 text-p-muted">{r.games}</td>
                <td className="px-2 py-1.5 text-p-good">{r.w}</td>
                <td className="px-2 py-1.5 text-p-bad">{r.l}</td>
                <td className="px-2 py-1.5 text-p-warn">{r.t}</td>
                {columns
                  .filter((c) => c.pct)
                  .map((c) => (
                    <td
                      key={c.key}
                      className="px-2 py-1.5 text-center text-p-title"
                      style={{ backgroundColor: pctBg(r[c.key] as number | null) }}
                    >
                      {fmtPct(r[c.key] as number | null)}
                    </td>
                  ))}
                <td className="px-2 py-1.5 text-p-muted">
                  {r.avgHandQ == null ? "—" : r.avgHandQ.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
