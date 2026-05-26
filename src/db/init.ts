import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { DB } from "./client";
import { deckCards } from "./schema";
import { seedDeckCards, seedFirstIteration } from "./seed-data";

let initialized = false;

/**
 * Make a database usable with zero manual steps: apply migrations, then seed the
 * starter deck if it's empty. Idempotent and safe to call on every server boot —
 * it never overwrites an existing deck (so your edits survive redeploys).
 */
export function ensureDbReady(db: DB): void {
  if (initialized) return;
  initialized = true;
  try {
    migrate(db, { migrationsFolder: "./drizzle" });
  } catch (err) {
    console.error("[db] migrate failed:", err);
  }
  try {
    if (db.select().from(deckCards).all().length === 0) {
      seedDeckCards(db);
      seedFirstIteration(db);
      console.log("[db] empty database — seeded the 60-card starter deck");
    }
  } catch (err) {
    console.error("[db] seed check failed:", err);
  }
}
