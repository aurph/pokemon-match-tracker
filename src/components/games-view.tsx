"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, LayoutGrid, Table2 } from "lucide-react";
import { GameModal } from "./game-modal";
import { PixelSprite } from "./pixel-sprite";
import { POKEBALL_SPRITE } from "@/lib/sprites";
import type { Game } from "@/db/schema";

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

const selectCls =
  "rounded-md border-2 border-p-border bg-p-surface px-2 py-1 text-xs text-p-title focus:border-p-primary focus:outline-none";

export function GamesView({
  games,
  deckNames,
  opponentDecks,
}: {
  games: Game[];
  deckNames: string[];
  opponentDecks: string[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Game | undefined>(undefined);
  const [opp, setOpp] = useState("all");
  const [fmt, setFmt] = useState("all");
  const [res, setRes] = useState("all");
  const [recent, setRecent] = useState(false);
  const [view, setView] = useState<"table" | "cards">("table");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = (e.target as HTMLElement)?.tagName;
      if (e.key === "n" && !open && t !== "INPUT" && t !== "SELECT" && t !== "TEXTAREA") {
        setEditing(undefined);
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const opponents = useMemo(
    () => Array.from(new Set(games.map((g) => g.opponentDeck))).sort(),
    [games],
  );

  const filtered = useMemo(() => {
    const cutoff = now - 30 * 864e5;
    return games.filter(
      (g) =>
        (opp === "all" || g.opponentDeck === opp) &&
        (fmt === "all" || g.format === fmt) &&
        (res === "all" || g.result === res) &&
        (!recent || g.playedAt >= cutoff),
    );
  }, [games, opp, fmt, res, recent, now]);

  const openAdd = () => {
    setEditing(undefined);
    setOpen(true);
  };
  const openEdit = (g: Game) => {
    setEditing(g);
    setOpen(true);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={opp} onChange={(e) => setOpp(e.target.value)} className={selectCls}>
          <option value="all">All opponents</option>
          {opponents.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <select value={fmt} onChange={(e) => setFmt(e.target.value)} className={selectCls}>
          <option value="all">BO1 + BO3</option>
          <option value="BO1">BO1</option>
          <option value="BO3">BO3</option>
        </select>
        <select value={res} onChange={(e) => setRes(e.target.value)} className={selectCls}>
          <option value="all">W/L/T</option>
          <option value="W">Wins</option>
          <option value="L">Losses</option>
          <option value="T">Ties</option>
        </select>
        <button
          onClick={() => setRecent((r) => !r)}
          className={`rounded-md border-2 px-2 py-1 text-xs ${recent ? "border-p-primary bg-p-kpi-bg text-p-title" : "border-p-border text-p-muted"}`}
        >
          Last 30 days
        </button>
        <span className="ml-1 text-xs text-p-muted">{filtered.length} games</span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setView((v) => (v === "table" ? "cards" : "table"))}
            className="rounded-md border-2 border-p-border p-1.5 text-p-muted hover:text-p-title"
            title={view === "table" ? "Card view" : "Table view"}
          >
            {view === "table" ? <LayoutGrid size={16} /> : <Table2 size={16} />}
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-md bg-p-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus size={16} /> Log game
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-p-border bg-p-surface p-12 text-center">
          <PixelSprite src={POKEBALL_SPRITE} alt="" size={64} />
          <p className="text-p-muted">
            {games.length === 0 ? "No games logged yet." : "No games match these filters."}
          </p>
          {games.length === 0 && (
            <p className="text-sm text-p-muted">
              Hit <span className="font-medium text-p-title">Log game</span> or press{" "}
              <kbd className="rounded border border-p-border px-1 font-mono">n</kbd>.
            </p>
          )}
        </div>
      ) : view === "table" ? (
        <div className="overflow-x-auto rounded-lg border-2 border-p-title bg-p-surface">
          <table className="w-full text-sm">
            <thead className="bg-p-kpi-bg text-left text-p-muted">
              <tr>
                {["Date", "Event", "Opponent", "Fmt", "Going", "HQ", "Turns", "Lock", "Prize", "Result"].map(
                  (h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2 font-mono text-[11px] uppercase">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => (
                <tr
                  key={g.id}
                  onClick={() => openEdit(g)}
                  className={`cursor-pointer border-t border-p-border hover:bg-p-kpi-bg ${i % 2 ? "bg-p-bg/40" : ""}`}
                >
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{fmtDate(g.playedAt)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-p-muted">{g.event}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-p-title">{g.opponentDeck}</td>
                  <td className="px-3 py-2 font-mono text-xs">{g.format}</td>
                  <td className="px-3 py-2 text-xs">{g.going}</td>
                  <td className="px-3 py-2">{g.handQuality ?? "—"}</td>
                  <td className="px-3 py-2 text-p-muted">{g.turnCount ?? "—"}</td>
                  <td className="px-3 py-2 text-p-muted">{g.lockTurn ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs text-p-muted">{g.prizeTrade ?? "—"}</td>
                  <td className="px-3 py-2">
                    <ResultChip r={g.result} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <button
              key={g.id}
              onClick={() => openEdit(g)}
              className="rounded-lg border-2 border-p-title bg-p-surface p-3 text-left shadow-pixel-sm transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-p-title">{g.opponentDeck}</span>
                <ResultChip r={g.result} />
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-p-muted">
                <span className="font-mono">{fmtDate(g.playedAt)}</span>
                <span>{g.event}</span>
                <span>{g.format}</span>
                <span>going {g.going}</span>
                <span>HQ {g.handQuality ?? "—"}</span>
                {g.prizeTrade && <span>prizes {g.prizeTrade}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <GameModal
          key={editing?.id ?? "new"}
          onClose={() => setOpen(false)}
          mode={editing ? "edit" : "add"}
          game={editing}
          deckNames={deckNames}
          opponentDecks={opponentDecks}
        />
      )}
    </div>
  );
}
