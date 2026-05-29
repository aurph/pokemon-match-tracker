import { NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  games,
  deckCards,
  iterations,
  wishlist,
  tournaments,
  customOpponentDecks,
} from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = {
    exportedAt: new Date().toISOString(),
    version: 1,
    games: db.select().from(games).all(),
    deckCards: db.select().from(deckCards).all(),
    iterations: db.select().from(iterations).all(),
    wishlist: db.select().from(wishlist).all(),
    tournaments: db.select().from(tournaments).all(),
    customOpponentDecks: db.select().from(customOpponentDecks).all(),
  };
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="elgyem-tracker-backup.json"',
    },
  });
}
