import { describe, it, expect } from "vitest";
import { winPct, lastNWinPct, rollingWinPct } from "./stats";
import type { Game } from "@/db/schema";

function g(partial: Partial<Game>): Game {
  return {
    id: "x",
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
  it("returns null for zero games (never 0%)", () => {
    expect(winPct([])).toBeNull();
  });
  it("returns 1 when all wins", () => {
    expect(winPct([g({ result: "W" }), g({ result: "W" })])).toBe(1);
  });
  it("returns 0 when all losses", () => {
    expect(winPct([g({ result: "L" }), g({ result: "L" })])).toBe(0);
  });
  it("counts ties in the denominator", () => {
    expect(winPct([g({ result: "W" }), g({ result: "L" }), g({ result: "T" })])).toBeCloseTo(1 / 3);
  });
});

describe("lastNWinPct", () => {
  it("returns null when no games", () => {
    expect(lastNWinPct([], 10)).toBeNull();
  });
  it("uses only the most recent N by playedAt", () => {
    const games = [
      g({ playedAt: 1, result: "L" }),
      g({ playedAt: 2, result: "L" }),
      g({ playedAt: 3, result: "W" }),
      g({ playedAt: 4, result: "W" }),
    ];
    expect(lastNWinPct(games, 2)).toBe(1);
  });
  it("handles fewer games than N", () => {
    expect(lastNWinPct([g({ result: "W" })], 10)).toBe(1);
  });
});

describe("rollingWinPct", () => {
  it("returns empty array for no games", () => {
    expect(rollingWinPct([])).toEqual([]);
  });
  it("computes a rolling window in chronological order", () => {
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
