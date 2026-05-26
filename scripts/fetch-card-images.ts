/**
 * Fetches real card art for every deck_cards row and records the path.
 *
 * Usage:
 *   pnpm exec tsx scripts/fetch-card-images.ts
 *   POKEMONTCG_API_KEY=xxx pnpm exec tsx scripts/fetch-card-images.ts
 */

import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { deckCards } from "../src/db/schema";
import { pokemontcgSetId } from "../src/lib/setCodeMap";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TcgCardImage {
  small: string;
  large?: string;
}

interface TcgCard {
  id: string;
  number: string;
  name: string;
  images: TcgCardImage;
}

interface TcgApiResponse {
  data: TcgCard[];
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_KEY = process.env.POKEMONTCG_API_KEY;
const PUBLIC_CARDS_DIR = path.join(process.cwd(), "public", "cards");

// Dex IDs for PokeAPI fallback (match by Pokémon name fragment, lower-cased)
const POKEAPI_DEX_IDS: Record<string, number> = {
  dreepy: 885,
  drakloak: 886,
  dunsparce: 206,
  dudunsparce: 982,
  elgyem: 605,
  sudowoodo: 185, // "ethan's sudowoodo"
  ogerpon: 1017, // "cornerstone mask ogerpon"
  shuckle: 213,
  comfey: 764,
  shaymin: 492,
  dedenne: 702,
  "flutter mane": 987,
  budew: 406,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (API_KEY) {
    headers["X-Api-Key"] = API_KEY;
  }
  return headers;
}

/**
 * Fetches all cards for a TCG set ID with retry + exponential backoff.
 * Handles the documented gotcha: unauthenticated burst returns HTTP 200 with empty data[].
 */
async function fetchSetCards(setId: string, maxRetries = 4): Promise<TcgCard[]> {
  const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=250&select=id,number,name,images`;
  let attempt = 0;

  while (attempt < maxRetries) {
    if (attempt > 0) {
      const backoffMs = Math.min(1000 * 2 ** (attempt - 1), 8000);
      console.log(`  [retry ${attempt}/${maxRetries - 1}] waiting ${backoffMs}ms before re-fetching set ${setId}...`);
      await delay(backoffMs);
    }

    const res = await fetch(url, { headers: buildHeaders() });

    if (!res.ok) {
      console.warn(`  HTTP ${res.status} fetching set ${setId} (attempt ${attempt + 1})`);
      attempt++;
      continue;
    }

    const json = (await res.json()) as TcgApiResponse;

    if (json.data.length > 0) {
      return json.data;
    }

    // Empty data — likely rate-limited silently
    console.warn(`  Empty data array for set ${setId} (attempt ${attempt + 1}) — may be rate-limited`);
    attempt++;
  }

  console.error(`  Gave up fetching set ${setId} after ${maxRetries} attempts.`);
  return [];
}

/**
 * Downloads binary data from a URL and writes it to disk.
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${res.status}`);
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

/**
 * Returns the PokeAPI fallback dex ID for a card name, if any.
 * Trainers and Energy return undefined.
 */
function getPokeapiFallbackId(cardName: string): number | undefined {
  const lower = cardName.toLowerCase();
  for (const [nameFragment, dexId] of Object.entries(POKEAPI_DEX_IDS)) {
    if (lower.includes(nameFragment)) {
      return dexId;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface DeckCardRow {
  id: string;
  name: string;
  setCode: string;
  setNumber: string;
  imageLocalPath: string | null;
}

interface Resolution {
  id: string;
  name: string;
  setCode: string;
  setNumber: string;
  source: "tcg" | "pokeapi" | "failed";
  imageUrl?: string;
  imageLocalPath?: string;
}

async function main(): Promise<void> {
  // Ensure output directory exists
  fs.mkdirSync(PUBLIC_CARDS_DIR, { recursive: true });

  // Load all deck cards
  const allCards = db
    .select({
      id: deckCards.id,
      name: deckCards.name,
      setCode: deckCards.setCode,
      setNumber: deckCards.setNumber,
      imageLocalPath: deckCards.imageLocalPath,
    })
    .from(deckCards)
    .all() as DeckCardRow[];

  console.log(`Loaded ${allCards.length} deck cards from DB.`);

  // Group by setCode
  const bySet = new Map<string, DeckCardRow[]>();
  for (const card of allCards) {
    const group = bySet.get(card.setCode) ?? [];
    group.push(card);
    bySet.set(card.setCode, group);
  }

  // Fetch TCG API data per set (one request per set, with delay between)
  const tcgCardsBySet = new Map<string, TcgCard[]>();
  const setCodes = [...bySet.keys()];

  for (let i = 0; i < setCodes.length; i++) {
    const setCode = setCodes[i];
    const setId = pokemontcgSetId(setCode);

    if (!setId) {
      console.warn(`No TCG set ID mapped for set code "${setCode}" — will try fallback for cards in this set.`);
      tcgCardsBySet.set(setCode, []);
    } else {
      console.log(`Fetching set ${setCode} (${setId})...`);
      const cards = await fetchSetCards(setId);
      console.log(`  Found ${cards.length} cards in set ${setId}.`);
      tcgCardsBySet.set(setCode, cards);
    }

    // Throttle between set requests (not needed after the last one)
    if (i < setCodes.length - 1) {
      await delay(400);
    }
  }

  // Resolve each deck card
  const resolutions: Resolution[] = [];

  for (const card of allCards) {
    const filePath = path.join(PUBLIC_CARDS_DIR, `${card.setCode}_${card.setNumber}.png`);
    const webPath = `/cards/${card.setCode}_${card.setNumber}.png`;

    // Idempotency: skip if already downloaded
    if (card.imageLocalPath && fs.existsSync(filePath)) {
      console.log(`  [skip] ${card.name} (${card.setCode} ${card.setNumber}) — already downloaded`);
      resolutions.push({ id: card.id, name: card.name, setCode: card.setCode, setNumber: card.setNumber, source: "tcg", imageLocalPath: webPath });
      continue;
    }

    const tcgCards = tcgCardsBySet.get(card.setCode) ?? [];
    const match = tcgCards.find((c) => c.number === card.setNumber);

    if (match) {
      const imageUrl = match.images.large ?? match.images.small;
      try {
        await downloadFile(imageUrl, filePath);
        db.update(deckCards)
          .set({ imageUrl, imageLocalPath: webPath })
          .where(eq(deckCards.id, card.id))
          .run();
        resolutions.push({ id: card.id, name: card.name, setCode: card.setCode, setNumber: card.setNumber, source: "tcg", imageUrl, imageLocalPath: webPath });
        console.log(`  [tcg] ${card.name} (${card.setCode} ${card.setNumber}) ✓`);
      } catch (err) {
        console.error(`  [tcg] DOWNLOAD FAILED for ${card.name}: ${String(err)}`);
        resolutions.push({ id: card.id, name: card.name, setCode: card.setCode, setNumber: card.setNumber, source: "failed" });
      }
      continue;
    }

    // TCG miss — try PokeAPI fallback
    const dexId = getPokeapiFallbackId(card.name);
    if (dexId !== undefined) {
      const fallbackUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexId}.png`;
      try {
        await downloadFile(fallbackUrl, filePath);
        db.update(deckCards)
          .set({ imageUrl: fallbackUrl, imageLocalPath: webPath })
          .where(eq(deckCards.id, card.id))
          .run();
        resolutions.push({ id: card.id, name: card.name, setCode: card.setCode, setNumber: card.setNumber, source: "pokeapi", imageUrl: fallbackUrl, imageLocalPath: webPath });
        console.log(`  [pokeapi] ${card.name} (${card.setCode} ${card.setNumber}) ✓ (dex #${dexId})`);
      } catch (err) {
        console.error(`  [pokeapi] DOWNLOAD FAILED for ${card.name}: ${String(err)}`);
        resolutions.push({ id: card.id, name: card.name, setCode: card.setCode, setNumber: card.setNumber, source: "failed" });
      }
    } else {
      console.warn(`  [miss] ${card.name} (${card.setCode} ${card.setNumber}) — not found in TCG API, no PokeAPI fallback`);
      resolutions.push({ id: card.id, name: card.name, setCode: card.setCode, setNumber: card.setNumber, source: "failed" });
    }
  }

  // Summary
  const tcgCount = resolutions.filter((r) => r.source === "tcg").length;
  const fallbackCount = resolutions.filter((r) => r.source === "pokeapi").length;
  const failed = resolutions.filter((r) => r.source === "failed");

  console.log("\n========== SUMMARY ==========");
  console.log(`Resolved via TCG API:   ${tcgCount}`);
  console.log(`Resolved via PokeAPI:   ${fallbackCount}`);
  console.log(`Failed:                 ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nFailed cards:");
    for (const f of failed) {
      console.log(`  - ${f.name} | setCode=${f.setCode} | setNumber=${f.setNumber}`);
    }
  }

  console.log("=============================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
