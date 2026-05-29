import { describe, it, expect } from "vitest";
import { expectedPrizeRate, prizeCount, prizeMap, prizeCurse, winPctByHandQuality } from "./prizes";
import type { Game } from "@/db/schema";

function g(prized: string[], result = "W", handQuality: number | null = null): Game {
  return {
    id: Math.random().toString(36),
    matchId: "m",
    gameNumber: 1,
    playedAt: 0,
    event: "Locals",
    format: "BO1",
    opponentDeck: "X",
    opponentName: null,
    tournamentId: null,
    round: null,
    coinFlip: null,
    going: "1st",
    myMulligans: 0,
    oppMulligans: 0,
    handQuality,
    prizeTrade: null,
    turnCount: null,
    timeUsedMin: null,
    lockTurn: null,
    keyCardsDrawn: null,
    techCardsUsed: null,
    prizedCards: JSON.stringify(prized),
    result,
    mistakes: null,
    notes: null,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe("expectedPrizeRate", () => {
  it("1 copy ≈ 10%", () => expect(expectedPrizeRate(1)).toBeCloseTo(0.1, 3));
  it("4 copies ≈ 35.2%", () => expect(expectedPrizeRate(4)).toBeCloseTo(0.352, 2));
  it("0 copies -> 0", () => expect(expectedPrizeRate(0)).toBe(0));
});

describe("prizeCount", () => {
  it("counts games where the card was prized", () => {
    const games = [g(["Dreepy", "Budew"]), g(["Budew"]), g([])];
    expect(prizeCount(games, "Budew")).toBe(2);
    expect(prizeCount(games, "Dreepy")).toBe(1);
  });
});

describe("prizeMap", () => {
  const deck = [
    { name: "Dreepy", count: 3 },
    { name: "Budew", count: 1 },
  ];
  it("computes observed vs expected", () => {
    const games = [g(["Budew"]), g([])];
    const rows = prizeMap(games, deck);
    const budew = rows.find((r) => r.name === "Budew")!;
    expect(budew).toMatchObject({ copies: 1, timesPrized: 1, gamesLogged: 2 });
    expect(budew.observedRate).toBe(0.5);
    expect(budew.expectedRate).toBeCloseTo(0.1, 3);
  });
  it("observedRate null when no games", () => {
    expect(prizeMap([], deck)[0].observedRate).toBeNull();
  });
  it("prizeCurse finds the most-prized card", () => {
    const games = [g(["Budew"]), g(["Budew"]), g(["Dreepy"])];
    expect(prizeCurse(prizeMap(games, deck))?.name).toBe("Budew");
  });
});

describe("winPctByHandQuality", () => {
  it("win rate per hand-quality bucket", () => {
    const rows = winPctByHandQuality([g([], "W", 5), g([], "L", 5), g([], "W", 1)]);
    expect(rows.find((r) => r.quality === 5)).toMatchObject({ n: 2, winPct: 0.5 });
    expect(rows.find((r) => r.quality === 2)).toMatchObject({ n: 0, winPct: null });
  });
});
