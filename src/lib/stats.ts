import type { Game } from "@/db/schema";

/** Win rate over a set of games, or null when there is no sample. Ties count in the denominator. */
export function winPct(games: Game[]): number | null {
  if (games.length === 0) return null;
  return games.filter((x) => x.result === "W").length / games.length;
}

/** Win rate over the most recent N games by playedAt, or null when empty. */
export function lastNWinPct(games: Game[], n: number): number | null {
  const sorted = [...games].sort((a, b) => b.playedAt - a.playedAt).slice(0, n);
  if (sorted.length === 0) return null;
  return sorted.filter((x) => x.result === "W").length / sorted.length;
}

/** Rolling win rate over a trailing window, chronological. x is the 1-based game index. */
export function rollingWinPct(games: Game[], window = 10): { x: number; y: number }[] {
  const sorted = [...games].sort((a, b) => a.playedAt - b.playedAt);
  return sorted.map((_, i) => {
    const slice = sorted.slice(Math.max(0, i - window + 1), i + 1);
    return { x: i + 1, y: slice.filter((s) => s.result === "W").length / slice.length };
  });
}
