import { describe, it, expect, beforeEach } from "vitest";
import { makeTestDb } from "./test-helpers";
import { createGame, listGames, nextMatchNumber, type CreateGameInput } from "./games-repo";
import type { DB } from "./client";

let db: DB;
beforeEach(() => {
  db = makeTestDb();
});

const base: CreateGameInput = {
  event: "Locals",
  format: "BO1",
  opponentDeck: "Charizard ex",
  going: "1st",
  result: "W",
  myMulligans: 0,
  oppMulligans: 0,
  playedAt: new Date(2026, 4, 25, 10, 0, 0).getTime(),
  newMatch: true,
};

describe("createGame + listGames", () => {
  it("persists a game and reads it back", () => {
    const created = createGame(db, base);
    expect(created.id).toMatch(/[0-9a-f-]{36}/);
    expect(created.matchId).toBe("locals-20260525-1");
    const all = listGames(db);
    expect(all).toHaveLength(1);
    expect(all[0].opponentDeck).toBe("Charizard ex");
  });

  it("orders listGames by playedAt descending", () => {
    createGame(db, { ...base, playedAt: 1000, opponentDeck: "A" });
    createGame(db, { ...base, playedAt: 5000, opponentDeck: "B" });
    expect(listGames(db).map((x) => x.opponentDeck)).toEqual(["B", "A"]);
  });
});

describe("nextMatchNumber + match grouping", () => {
  it("starts at 1 for a new event-day", () => {
    expect(nextMatchNumber(db, "Locals", base.playedAt)).toBe(1);
  });

  it("increments only when newMatch is requested", () => {
    const a = createGame(db, { ...base, newMatch: true });
    const b = createGame(db, { ...base, newMatch: false, matchId: a.matchId, gameNumber: 2 });
    expect(b.matchId).toBe(a.matchId);
    const c = createGame(db, { ...base, newMatch: true });
    expect(c.matchId).toBe("locals-20260525-2");
  });

  it("does not collide across two same-day matches", () => {
    const m1 = createGame(db, { ...base, newMatch: true });
    const m2 = createGame(db, { ...base, newMatch: true });
    expect(m1.matchId).not.toBe(m2.matchId);
  });
});
