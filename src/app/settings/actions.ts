"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import {
  games,
  deckCards,
  iterations,
  wishlist,
  tournaments,
  customOpponentDecks,
} from "@/db/schema";

export type ActionResult = { ok: true } | { ok: false; error: string };

const TABLES = {
  games,
  deckCards,
  iterations,
  wishlist,
  tournaments,
  customOpponentDecks,
} as const;

function revalidateAll() {
  for (const p of ["/", "/games", "/decklist", "/prizes", "/iterations", "/tournaments"]) {
    revalidatePath(p);
  }
}

/** Replace the DB contents with a previously exported JSON backup. */
export async function importDataAction(json: string): Promise<ActionResult> {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  try {
    for (const [key, table] of Object.entries(TABLES)) {
      const rows = data[key];
      if (!Array.isArray(rows)) continue;
      db.delete(table).run();
      for (const row of rows) {
        db.insert(table)
          .values(row as never)
          .run();
      }
    }
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Import failed: ${String(e)}` };
  }
}

export async function wipeGamesAction(): Promise<ActionResult> {
  db.delete(games).run();
  revalidateAll();
  return { ok: true };
}

/** Nuke everything (incl. the decklist). Re-seed the deck afterward with `pnpm db:seed`. */
export async function wipeAllAction(): Promise<ActionResult> {
  for (const table of Object.values(TABLES)) db.delete(table).run();
  revalidateAll();
  return { ok: true };
}
