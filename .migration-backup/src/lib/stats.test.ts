import { describe, it, expect } from "vitest";
import {
  winPct,
  lastNWinPct,
  rollingWinPct,
  goingWinPct,
  formatGameWinPct,
  mulliganRate,
  avgTurns,
  avgHandQuality,
  bo3MatchResults,
  bo3MatchWinPct,
  perOpponent,
  handQualityHistogram,
  currentStreak,
  longestStreak,
  favoriteVictim,
  nemesis,
} from "./stats";
import type { Game } from "@/db/schema";

let seq = 0;
function g(partial: Partial<Game>): Game {
  return {
    id: `id-${seq++}`,
    matchId: "m",
    gameNumber: 1,
    playedAt: 0,
    event: "Locals",
    format: "BO1",
    opponentDeck: "Charizard ex",
    opponentName: null,
    tournamentId: null,
    round: null,
    coinFlip: null,
    going: "1st",
    myMulligans: 0,
    oppMulligans: 0,
    handQuality: null,
    prizeTrade: null,
    turnCount: null,
    timeUsedMin: null,
    lockTurn: null,
    keyCardsDrawn: null,
    techCardsUsed: null,
    prizedCards: null,
    result: "W",
    mistakes: null,
    notes: null,
    createdAt: 0,
    updatedAt: 0,
    ...partial,
  };
}

describe("winPct", () => {
  it("returns null for zero games", () => expect(winPct([])).toBeNull());
  it("all wins -> 1", () => expect(winPct([g({ result: "W" }), g({ result: "W" })])).toBe(1));
  it("all losses -> 0", () => expect(winPct([g({ result: "L" })])).toBe(0));
  it("counts ties in denominator", () =>
    expect(winPct([g({ result: "W" }), g({ result: "L" }), g({ result: "T" })])).toBeCloseTo(1 / 3));
});

describe("lastNWinPct", () => {
  it("null when empty", () => expect(lastNWinPct([], 10)).toBeNull());
  it("uses most recent N by playedAt", () => {
    const games = [
      g({ playedAt: 1, result: "L" }),
      g({ playedAt: 2, result: "L" }),
      g({ playedAt: 3, result: "W" }),
      g({ playedAt: 4, result: "W" }),
    ];
    expect(lastNWinPct(games, 2)).toBe(1);
  });
});

describe("rollingWinPct", () => {
  it("empty -> []", () => expect(rollingWinPct([])).toEqual([]));
  it("trailing window, chronological", () => {
    const games = [
      g({ playedAt: 1, result: "W" }),
      g({ playedAt: 2, result: "L" }),
      g({ playedAt: 3, result: "W" }),
    ];
    expect(rollingWinPct(games, 2)).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 0.5 },
      { x: 3, y: 0.5 },
    ]);
  });
});

describe("split win rates", () => {
  const games = [
    g({ going: "1st", result: "W" }),
    g({ going: "1st", result: "L" }),
    g({ going: "2nd", result: "W" }),
    g({ format: "BO3", going: "2nd", result: "W" }),
  ];
  it("goingWinPct", () => {
    expect(goingWinPct(games, "1st")).toBe(0.5);
    expect(goingWinPct(games, "2nd")).toBe(1);
  });
  it("formatGameWinPct", () => expect(formatGameWinPct(games, "BO3")).toBe(1));
  it("null when no games match", () => expect(goingWinPct([], "1st")).toBeNull());
});

describe("mulliganRate", () => {
  it("fraction with >=1 mulligan", () =>
    expect(mulliganRate([g({ myMulligans: 0 }), g({ myMulligans: 2 })])).toBe(0.5));
  it("null when empty", () => expect(mulliganRate([])).toBeNull());
});

describe("averages ignore nulls", () => {
  it("avgTurns", () =>
    expect(avgTurns([g({ turnCount: 10 }), g({ turnCount: 20 }), g({ turnCount: null })])).toBe(15));
  it("avgHandQuality null when none rated", () =>
    expect(avgHandQuality([g({ handQuality: null })])).toBeNull());
});

describe("bo3 match aggregation", () => {
  const games = [
    g({ format: "BO3", matchId: "m1", result: "W" }),
    g({ format: "BO3", matchId: "m1", result: "L" }),
    g({ format: "BO3", matchId: "m1", result: "W" }),
    g({ format: "BO3", matchId: "m2", result: "L" }),
    g({ format: "BO3", matchId: "m2", result: "L" }),
    g({ format: "BO1", matchId: "m3", result: "W" }), // excluded
  ];
  it("rolls games into match results", () => {
    const matches = bo3MatchResults(games);
    expect(matches).toHaveLength(2);
    expect(matches.find((m) => m.matchId === "m1")?.result).toBe("W");
    expect(matches.find((m) => m.matchId === "m2")?.result).toBe("L");
  });
  it("bo3MatchWinPct = 1/2", () => expect(bo3MatchWinPct(games)).toBe(0.5));
  it("null with no BO3 games", () => expect(bo3MatchWinPct([g({ format: "BO1" })])).toBeNull());
});

describe("perOpponent", () => {
  it("aggregates and sorts by games desc", () => {
    const games = [
      g({ opponentDeck: "A", result: "W" }),
      g({ opponentDeck: "A", result: "L" }),
      g({ opponentDeck: "B", result: "W" }),
    ];
    const rows = perOpponent(games);
    expect(rows[0].opponent).toBe("A");
    expect(rows[0]).toMatchObject({ games: 2, w: 1, l: 1, winPct: 0.5 });
  });
});

describe("handQualityHistogram", () => {
  it("bins 1..5 stacked by result", () => {
    const hist = handQualityHistogram([
      g({ handQuality: 5, result: "W" }),
      g({ handQuality: 5, result: "L" }),
      g({ handQuality: 1, result: "L" }),
    ]);
    expect(hist).toHaveLength(5);
    expect(hist.find((b) => b.quality === 5)).toMatchObject({ W: 1, L: 1, T: 0 });
    expect(hist.find((b) => b.quality === 1)).toMatchObject({ W: 0, L: 1 });
  });
});

describe("streaks", () => {
  it("currentStreak counts the latest run", () => {
    const games = [
      g({ playedAt: 1, result: "L" }),
      g({ playedAt: 2, result: "W" }),
      g({ playedAt: 3, result: "W" }),
    ];
    expect(currentStreak(games)).toEqual({ type: "W", length: 2 });
  });
  it("currentStreak empty -> null/0", () =>
    expect(currentStreak([])).toEqual({ type: null, length: 0 }));
  it("longestStreak finds best run", () => {
    const games = [
      g({ playedAt: 1, result: "W" }),
      g({ playedAt: 2, result: "W" }),
      g({ playedAt: 3, result: "L" }),
      g({ playedAt: 4, result: "W" }),
    ];
    expect(longestStreak(games, "W")).toBe(2);
  });
});

describe("favoriteVictim / nemesis", () => {
  const games = [
    ...Array.from({ length: 3 }, () => g({ opponentDeck: "Easy", result: "W" })),
    g({ opponentDeck: "Hard", result: "W" }),
    g({ opponentDeck: "Hard", result: "L" }),
    g({ opponentDeck: "Hard", result: "L" }),
  ];
  it("favoriteVictim = best matchup >= minGames", () =>
    expect(favoriteVictim(games, 3)?.opponent).toBe("Easy"));
  it("nemesis = worst matchup", () => expect(nemesis(games, 3)?.opponent).toBe("Hard"));
  it("null when nobody meets minGames", () => expect(favoriteVictim(games, 99)).toBeNull());
});
