import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export type DB = BetterSQLite3Database<typeof schema>;

export function createDb(path: string): DB {
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  return drizzle(sqlite, { schema });
}

// App-wide singleton (server-only). DB_PATH overrides the default file.
export const db: DB = createDb(process.env.DB_PATH ?? "elgyem.db");
