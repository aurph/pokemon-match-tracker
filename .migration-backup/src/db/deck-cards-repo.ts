import { asc, eq } from "drizzle-orm";
import type { DB } from "./client";
import { deckCards, type DeckCard } from "./schema";

export function listDeckCards(db: DB): DeckCard[] {
  return db.select().from(deckCards).orderBy(asc(deckCards.orderIndex)).all();
}

export interface DeckCardPatch {
  count?: number;
  role?: string | null;
  notes?: string | null;
}

/** Applies a partial update to a single deck_cards row. No-op if patch is empty. */
export function updateDeckCard(db: DB, id: string, patch: DeckCardPatch): void {
  const next: DeckCardPatch = {};
  if (patch.count !== undefined) next.count = patch.count;
  if (patch.role !== undefined) next.role = patch.role;
  if (patch.notes !== undefined) next.notes = patch.notes;
  if (Object.keys(next).length === 0) return;
  db.update(deckCards).set(next).where(eq(deckCards.id, id)).run();
}
