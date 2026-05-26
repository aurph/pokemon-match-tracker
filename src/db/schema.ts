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
