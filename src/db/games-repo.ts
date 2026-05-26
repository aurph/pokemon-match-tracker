import { desc, like } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import type { DB } from "./client";
import { games, type Game } from "./schema";
import { buildMatchId, dateStamp, slugifyEvent } from "@/lib/match-id";

export interface CreateGameInput {
  event: string;
  format: string; // "BO1" | "BO3"
  opponentDeck: string;
  going: string; // "1st" | "2nd"
  result: string; // "W" | "L" | "T"
  myMulligans: number;
  oppMulligans: number;
  playedAt: number;
  handQuality?: number | null;
  opponentName?: string | null;
  round?: number | null;
  gameNumber?: number;
  /** When true, start a new match (bump the per-day counter). */
  newMatch?: boolean;
  /** When continuing an existing match (game 2/3), pass its matchId. */
  matchId?: string;
}

export function listGames(db: DB): Game[] {
  return db.select().from(games).orderBy(desc(games.playedAt)).all();
}

/** Next per-day match counter for an event: max existing N + 1. */
export function nextMatchNumber(db: DB, event: string, playedAt: number): number {
  const prefix = `${slugifyEvent(event)}-${dateStamp(playedAt)}-`;
  const rows = db
    .select({ matchId: games.matchId })
    .from(games)
    .where(like(games.matchId, `${prefix}%`))
    .all();
  let max = 0;
  for (const r of rows) {
    const n = Number.parseInt(r.matchId.slice(prefix.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

export function createGame(db: DB, input: CreateGameInput): Game {
  const now = Date.now();
  const matchId =
    !input.newMatch && input.matchId
      ? input.matchId
      : buildMatchId(input.event, input.playedAt, nextMatchNumber(db, input.event, input.playedAt));

  const row: Game = {
    id: uuidv7(),
    matchId,
    gameNumber: input.gameNumber ?? 1,
    playedAt: input.playedAt,
    event: input.event,
    format: input.format,
    opponentDeck: input.opponentDeck,
    opponentName: input.opponentName ?? null,
    tournamentId: null,
    round: input.round ?? null,
    coinFlip: null,
    going: input.going,
    myMulligans: input.myMulligans,
    oppMulligans: input.oppMulligans,
    handQuality: input.handQuality ?? null,
    prizeTrade: null,
    turnCount: null,
    timeUsedMin: null,
    lockTurn: null,
    keyCardsDrawn: null,
    techCardsUsed: null,
    prizedCards: null,
    result: input.result,
    mistakes: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(games).values(row).run();
  return row;
}
