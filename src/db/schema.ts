import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const games = sqliteTable(
  "games",
  {
    id: text("id").primaryKey(),
    matchId: text("match_id").notNull(),
    gameNumber: integer("game_number").notNull().default(1),
    playedAt: integer("played_at").notNull(),
    event: text("event").notNull(),
    format: text("format").notNull(),
    opponentDeck: text("opponent_deck").notNull(),
    opponentName: text("opponent_name"),
    tournamentId: text("tournament_id"),
    round: integer("round"),
    coinFlip: text("coin_flip"),
    going: text("going").notNull(),
    myMulligans: integer("my_mulligans").notNull().default(0),
    oppMulligans: integer("opp_mulligans").notNull().default(0),
    handQuality: integer("hand_quality"),
    prizeTrade: text("prize_trade"),
    turnCount: integer("turn_count"),
    timeUsedMin: integer("time_used_min"),
    lockTurn: integer("lock_turn"),
    keyCardsDrawn: text("key_cards_drawn"),
    techCardsUsed: text("tech_cards_used"),
    prizedCards: text("prized_cards"),
    result: text("result").notNull(),
    mistakes: text("mistakes"),
    notes: text("notes"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    index("idx_games_opponent").on(t.opponentDeck),
    index("idx_games_played_at").on(t.playedAt),
    index("idx_games_match").on(t.matchId),
  ],
);

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;

export const tournaments = sqliteTable("tournaments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  event: text("event").notNull(),
  dated: integer("dated").notNull(),
  format: text("format"),
  size: integer("size"),
  roundsTotal: integer("rounds_total"),
  finalRecord: text("final_record"),
  placement: integer("placement"),
  madeCut: integer("made_cut"),
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const deckCards = sqliteTable(
  "deck_cards",
  {
    id: text("id").primaryKey(),
    count: integer("count").notNull(),
    name: text("name").notNull(),
    setCode: text("set_code").notNull(),
    setNumber: text("set_number").notNull(),
    category: text("category").notNull(),
    role: text("role"),
    notes: text("notes"),
    imageUrl: text("image_url"),
    imageLocalPath: text("image_local_path"),
    orderIndex: integer("order_index").notNull(),
  },
  (t) => [index("idx_deck_cards_order").on(t.orderIndex)],
);

export const iterations = sqliteTable("iterations", {
  id: text("id").primaryKey(),
  dated: integer("dated").notNull(),
  version: text("version").notNull(),
  cardsIn: text("cards_in"),
  cardsOut: text("cards_out"),
  reasoning: text("reasoning"),
  testedVs: text("tested_vs"),
  verdict: text("verdict"),
  createdAt: integer("created_at").notNull(),
});

export const wishlist = sqliteTable("wishlist", {
  id: text("id").primaryKey(),
  count: integer("count").notNull(),
  name: text("name").notNull(),
  setCode: text("set_code").notNull(),
  setNumber: text("set_number").notNull(),
  category: text("category").notNull(),
  role: text("role"),
  notes: text("notes"),
  imageUrl: text("image_url"),
  imageLocalPath: text("image_local_path"),
  orderIndex: integer("order_index").notNull(),
  priority: text("priority"),
  replaces: text("replaces"),
  reason: text("reason"),
});

export const customOpponentDecks = sqliteTable("custom_opponent_decks", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at").notNull(),
});

export type Tournament = typeof tournaments.$inferSelect;
export type DeckCard = typeof deckCards.$inferSelect;
export type NewDeckCard = typeof deckCards.$inferInsert;
export type Iteration = typeof iterations.$inferSelect;
export type WishlistItem = typeof wishlist.$inferSelect;
