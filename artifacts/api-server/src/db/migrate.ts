import type { DB } from "./client";

export function runMigrations(db: DB): void {
  const raw = (db.$client as import("better-sqlite3").Database);

  raw.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      game_number INTEGER NOT NULL DEFAULT 1,
      played_at INTEGER NOT NULL,
      event TEXT NOT NULL,
      format TEXT NOT NULL,
      opponent_deck TEXT NOT NULL,
      opponent_name TEXT,
      tournament_id TEXT,
      round INTEGER,
      coin_flip TEXT,
      going TEXT NOT NULL,
      my_mulligans INTEGER NOT NULL DEFAULT 0,
      opp_mulligans INTEGER NOT NULL DEFAULT 0,
      hand_quality INTEGER,
      prize_trade TEXT,
      turn_count INTEGER,
      time_used_min INTEGER,
      lock_turn INTEGER,
      key_cards_drawn TEXT,
      tech_cards_used TEXT,
      prized_cards TEXT,
      result TEXT NOT NULL,
      mistakes TEXT,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_games_opponent ON games(opponent_deck);
    CREATE INDEX IF NOT EXISTS idx_games_played_at ON games(played_at);
    CREATE INDEX IF NOT EXISTS idx_games_match ON games(match_id);

    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      event TEXT NOT NULL,
      dated INTEGER NOT NULL,
      format TEXT,
      size INTEGER,
      rounds_total INTEGER,
      final_record TEXT,
      placement INTEGER,
      made_cut INTEGER,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deck_cards (
      id TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      name TEXT NOT NULL,
      set_code TEXT NOT NULL,
      set_number TEXT NOT NULL,
      category TEXT NOT NULL,
      role TEXT,
      notes TEXT,
      image_url TEXT,
      image_local_path TEXT,
      order_index INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_deck_cards_order ON deck_cards(order_index);

    CREATE TABLE IF NOT EXISTS iterations (
      id TEXT PRIMARY KEY,
      dated INTEGER NOT NULL,
      version TEXT NOT NULL,
      cards_in TEXT,
      cards_out TEXT,
      reasoning TEXT,
      tested_vs TEXT,
      verdict TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      name TEXT NOT NULL,
      set_code TEXT NOT NULL,
      set_number TEXT NOT NULL,
      category TEXT NOT NULL,
      role TEXT,
      notes TEXT,
      image_url TEXT,
      image_local_path TEXT,
      order_index INTEGER NOT NULL,
      priority TEXT,
      replaces TEXT,
      reason TEXT
    );

    CREATE TABLE IF NOT EXISTS custom_opponent_decks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );
  `);
}
