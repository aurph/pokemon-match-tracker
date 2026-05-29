export type Game = { id: string; matchId: string; playedAt: number; format: string; opponentDeck: string; going: string; result: string; myMulligans?: number | null; handQuality?: number | null; turnCount?: number | null; timeUsedMin?: number | null; lockTurn?: number | null };

/** Percentages are 0..1, or null when there is no sample (never fabricate 0%). */
export type Pct = number | null;

// ---- Core win-rate primitives ----

export function winPct(games: Game[]): Pct {
  if (games.length === 0) return null;
  return games.filter((g) => g.result === "W").length / games.length;
}

export function lastNWinPct(games: Game[], n: number): Pct {
  const sorted = [...games].sort((a, b) => b.playedAt - a.playedAt).slice(0, n);
  if (sorted.length === 0) return null;
  return sorted.filter((g) => g.result === "W").length / sorted.length;
}

/** Rolling win rate over a trailing window, chronological. x is the 1-based game index. */
export function rollingWinPct(games: Game[], window = 10): { x: number; y: number }[] {
  const sorted = [...games].sort((a, b) => a.playedAt - b.playedAt);
  return sorted.map((_, i) => {
    const slice = sorted.slice(Math.max(0, i - window + 1), i + 1);
    return { x: i + 1, y: slice.filter((s) => s.result === "W").length / slice.length };
  });
}

export function winPctWhere(games: Game[], pred: (g: Game) => boolean): Pct {
  return winPct(games.filter(pred));
}

export const goingWinPct = (games: Game[], going: string): Pct =>
  winPctWhere(games, (g) => g.going === going);

export const formatGameWinPct = (games: Game[], format: string): Pct =>
  winPctWhere(games, (g) => g.format === format);

/** Fraction of games in which I took at least one mulligan. */
export function mulliganRate(games: Game[]): Pct {
  if (games.length === 0) return null;
  return games.filter((g) => (g.myMulligans ?? 0) > 0).length / games.length;
}

// ---- Averages (ignore null fields) ----

function avgOf(games: Game[], sel: (g: Game) => number | null): number | null {
  const vals = games.map(sel).filter((v): v is number => v != null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export const avgTurns = (g: Game[]) => avgOf(g, (x) => x.turnCount);
export const avgTimeMin = (g: Game[]) => avgOf(g, (x) => x.timeUsedMin);
export const avgHandQuality = (g: Game[]) => avgOf(g, (x) => x.handQuality);
export const avgLockTurn = (g: Game[]) => avgOf(g, (x) => x.lockTurn);

// ---- BO3 match-level aggregation (spec §6.4) ----

export interface MatchResult {
  matchId: string;
  games: Game[];
  result: "W" | "L" | "T";
}

export function bo3MatchResults(games: Game[]): MatchResult[] {
  const byMatch = new Map<string, Game[]>();
  for (const g of games) {
    if (g.format !== "BO3") continue;
    const arr = byMatch.get(g.matchId) ?? [];
    arr.push(g);
    byMatch.set(g.matchId, arr);
  }
  return [...byMatch.entries()].map(([matchId, gs]) => {
    const w = gs.filter((g) => g.result === "W").length;
    const l = gs.filter((g) => g.result === "L").length;
    const result: "W" | "L" | "T" = w >= 2 ? "W" : l >= 2 ? "L" : "T";
    return { matchId, games: gs, result };
  });
}

export function bo3MatchWinPct(games: Game[]): Pct {
  const matches = bo3MatchResults(games);
  if (matches.length === 0) return null;
  return matches.filter((m) => m.result === "W").length / matches.length;
}

// ---- Per-opponent breakdown ----

export interface OpponentStats {
  opponent: string;
  games: number;
  w: number;
  l: number;
  t: number;
  winPct: Pct;
  firstWinPct: Pct;
  secondWinPct: Pct;
  bo1WinPct: Pct;
  bo3WinPct: Pct;
  last5WinPct: Pct;
  avgHandQ: number | null;
}

export function perOpponent(games: Game[]): OpponentStats[] {
  const byOpp = new Map<string, Game[]>();
  for (const g of games) {
    const arr = byOpp.get(g.opponentDeck) ?? [];
    arr.push(g);
    byOpp.set(g.opponentDeck, arr);
  }
  return [...byOpp.entries()]
    .map(([opponent, gs]) => ({
      opponent,
      games: gs.length,
      w: gs.filter((g) => g.result === "W").length,
      l: gs.filter((g) => g.result === "L").length,
      t: gs.filter((g) => g.result === "T").length,
      winPct: winPct(gs),
      firstWinPct: goingWinPct(gs, "1st"),
      secondWinPct: goingWinPct(gs, "2nd"),
      bo1WinPct: formatGameWinPct(gs, "BO1"),
      bo3WinPct: formatGameWinPct(gs, "BO3"),
      last5WinPct: lastNWinPct(gs, 5),
      avgHandQ: avgHandQuality(gs),
    }))
    .sort((a, b) => b.games - a.games);
}

// ---- Hand-quality histogram (stacked by result) ----

export interface HandQualityBin {
  quality: number;
  W: number;
  L: number;
  T: number;
}

export function handQualityHistogram(games: Game[]): HandQualityBin[] {
  return [1, 2, 3, 4, 5].map((quality) => {
    const at = games.filter((g) => g.handQuality === quality);
    return {
      quality,
      W: at.filter((g) => g.result === "W").length,
      L: at.filter((g) => g.result === "L").length,
      T: at.filter((g) => g.result === "T").length,
    };
  });
}

// ---- Fun, auto-tracked stats ----

export interface Streak {
  type: "W" | "L" | "T" | null;
  length: number;
}

/** The active streak: how many of the most-recent games share the latest result. */
export function currentStreak(games: Game[]): Streak {
  const sorted = [...games].sort((a, b) => a.playedAt - b.playedAt);
  if (sorted.length === 0) return { type: null, length: 0 };
  const latest = sorted[sorted.length - 1].result as "W" | "L" | "T";
  let length = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].result === latest) length++;
    else break;
  }
  return { type: latest, length };
}

/** Longest run of a given result across all logged games. */
export function longestStreak(games: Game[], result: "W" | "L" = "W"): number {
  const sorted = [...games].sort((a, b) => a.playedAt - b.playedAt);
  let best = 0;
  let cur = 0;
  for (const g of sorted) {
    if (g.result === result) {
      cur++;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  return best;
}

/** Best matchup (highest win%) among opponents with at least `minGames` games. */
export function favoriteVictim(games: Game[], minGames = 3): OpponentStats | null {
  const eligible = perOpponent(games).filter((o) => o.games >= minGames && o.winPct != null);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, o) => (o.winPct! > best.winPct! ? o : best));
}

/** Worst matchup (lowest win%) among opponents with at least `minGames` games. */
export function nemesis(games: Game[], minGames = 3): OpponentStats | null {
  const eligible = perOpponent(games).filter((o) => o.games >= minGames && o.winPct != null);
  if (eligible.length === 0) return null;
  return eligible.reduce((worst, o) => (o.winPct! < worst.winPct! ? o : worst));
}
