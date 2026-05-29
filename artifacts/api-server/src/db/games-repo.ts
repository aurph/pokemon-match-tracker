import { desc, eq, like } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import type { DB } from "./client";
import { customOpponentDecks, games, type Game } from "./schema";
import { buildMatchId, dateStamp, slugifyEvent } from "../lib/match-id";

/** The user-editable columns of a game (everything except identity/timestamps). */
export interface GameFields {
  event: string;
  format: string; // "BO1" | "BO3"
  opponentDeck: string;
  opponentName?: string | null;
  round?: number | null;
  going: string; // "1st" | "2nd"
  coinFlip?: string | null; // "won" | "lost"
  result: string; // "W" | "L" | "T"
  myMulligans: number;
  oppMulligans: number;
  handQuality?: number | null;
  turnCount?: number | null;
  timeUsedMin?: number | null;
  lockTurn?: number | null;
  prizeTrade?: string | null;
  keyCardsDrawn?: string | null;
  techCardsUsed?: string | null;
  prizedCards?: string[] | null; // stored as a JSON array of card names
  mistakes?: string | null;
  notes?: string | null;
  playedAt: number;
}

export interface CreateGameInput extends GameFields {
  gameNumber?: number;
  /** When true, start a new match (bump the per-day counter). */
  newMatch?: boolean;
  /** When continuing an existing match (game 2/3), pass its matchId. */
  matchId?: string;
}

function normalizePrized(p: string[] | null | undefined): string | null {
  return p && p.length ? JSON.stringify(p) : null;
}

export function listGames(db: DB): Game[] {
  return db.select().from(games).orderBy(desc(games.playedAt)).all();
}

export function getGame(db: DB, id: string): Game | undefined {
  return db.select().from(games).where(eq(games.id, id)).get();
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
    coinFlip: input.coinFlip ?? null,
    going: input.going,
    myMulligans: input.myMulligans,
    oppMulligans: input.oppMulligans,
    handQuality: input.handQuality ?? null,
    prizeTrade: input.prizeTrade ?? null,
    turnCount: input.turnCount ?? null,
    timeUsedMin: input.timeUsedMin ?? null,
    lockTurn: input.lockTurn ?? null,
    keyCardsDrawn: input.keyCardsDrawn ?? null,
    techCardsUsed: input.techCardsUsed ?? null,
    prizedCards: normalizePrized(input.prizedCards),
    result: input.result,
    mistakes: input.mistakes ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(games).values(row).run();
  return row;
}

const TEXT_OR_NUM_KEYS = [
  "event",
  "format",
  "opponentDeck",
  "opponentName",
  "round",
  "going",
  "coinFlip",
  "result",
  "myMulligans",
  "oppMulligans",
  "handQuality",
  "turnCount",
  "timeUsedMin",
  "lockTurn",
  "prizeTrade",
  "keyCardsDrawn",
  "techCardsUsed",
  "mistakes",
  "notes",
  "playedAt",
] as const;

export function updateGame(db: DB, id: string, patch: Partial<GameFields>): void {
  const set: Record<string, unknown> = { updatedAt: Date.now() };
  for (const k of TEXT_OR_NUM_KEYS) {
    if (patch[k] !== undefined) set[k] = patch[k];
  }
  if (patch.prizedCards !== undefined) set.prizedCards = normalizePrized(patch.prizedCards);
  db.update(games)
    .set(set as Partial<typeof games.$inferInsert>)
    .where(eq(games.id, id))
    .run();
}

export function deleteGame(db: DB, id: string): void {
  db.delete(games).where(eq(games.id, id)).run();
}

// ---- Custom opponent decks (combobox "create new") ----

export function listCustomOpponentDecks(db: DB): string[] {
  return db
    .select()
    .from(customOpponentDecks)
    .all()
    .map((r) => r.name);
}

export function addCustomOpponentDeck(db: DB, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const existing = db
    .select()
    .from(customOpponentDecks)
    .where(eq(customOpponentDecks.name, trimmed))
    .get();
  if (existing) return;
  db.insert(customOpponentDecks)
    .values({ id: uuidv7(), name: trimmed, createdAt: Date.now() })
    .run();
}
