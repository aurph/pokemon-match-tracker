import { uuidv7 } from "uuidv7";
import type { DB } from "./client";
import { deckCards, iterations } from "./schema";

/** The 60-card list from the spec (§8). Order is significant. */
export const DECK: Array<[number, string, string, string, string]> = [
  // Pokémon (23)
  [3, "Dreepy", "ASC", "158", "pokemon_basic"],
  [3, "Drakloak", "PRE", "72", "pokemon_stage1"],
  [2, "Dunsparce", "JTG", "120", "pokemon_basic"],
  [1, "Dunsparce", "PRE", "79", "pokemon_basic"],
  [3, "Dudunsparce", "PRE", "80", "pokemon_stage1"],
  [1, "Dudunsparce ex", "JTG", "121", "pokemon_stage1_ex"],
  [2, "Elgyem", "BLK", "40", "pokemon_basic"],
  [1, "Ethan's Sudowoodo", "DRI", "93", "pokemon_basic"],
  [1, "Cornerstone Mask Ogerpon ex", "PRE", "58", "pokemon_basic_ex"],
  [1, "Shuckle", "MEG", "11", "pokemon_basic"],
  [1, "Comfey", "SCR", "63", "pokemon_basic"],
  [1, "Shaymin", "DRI", "10", "pokemon_basic"],
  [1, "Dedenne", "SSP", "87", "pokemon_basic"],
  [1, "Flutter Mane", "PRE", "43", "pokemon_basic"],
  [1, "Budew", "ASC", "16", "pokemon_basic"],
  // Trainers (30)
  [4, "Lillie's Determination", "ASC", "192", "trainer_supporter"],
  [3, "Boss's Orders", "MEG", "114", "trainer_supporter"],
  [1, "Xerosic's Machinations", "SFA", "64", "trainer_supporter"],
  [1, "Ruffian", "JTG", "157", "trainer_supporter"],
  [1, "Eri", "TEF", "146", "trainer_supporter"],
  [1, "Hilda", "WHT", "84", "trainer_supporter"],
  [4, "Buddy-Buddy Poffin", "ASC", "184", "trainer_item"],
  [4, "Poké Pad", "POR", "81", "trainer_item"],
  [2, "Night Stretcher", "SFA", "61", "trainer_item"],
  [1, "Ultra Ball", "ASC", "213", "trainer_item"],
  [1, "Accompanying Flute", "TWM", "142", "trainer_item"],
  [1, "Redeemable Ticket", "JTG", "156", "trainer_item"],
  [3, "Gravity Gemstone", "SCR", "137", "trainer_tool"],
  [1, "Sacred Charm", "PFL", "93", "trainer_tool"],
  [2, "Battle Cage", "PFL", "85", "trainer_tool"],
  // Energy (7)
  [4, "Prism Energy", "ASC", "216", "energy_special"],
  [1, "Psychic Energy", "MEE", "5", "energy_basic"],
  [1, "Rocky Fighting Energy", "POR", "87", "energy_special"],
  [1, "Enriching Energy", "SSP", "191", "energy_special"],
];

export const DECK_TOTAL = DECK.reduce((s, [count]) => s + count, 0);

/** Insert the 60-card list. With `reset`, clears existing deck rows first. */
export function seedDeckCards(db: DB, opts: { reset?: boolean } = {}): number {
  if (opts.reset) db.delete(deckCards).run();
  let i = 0;
  for (const [count, name, setCode, setNumber, category] of DECK) {
    db.insert(deckCards)
      .values({
        id: uuidv7(),
        count,
        name,
        setCode,
        setNumber,
        category,
        role: null,
        notes: null,
        imageUrl: null,
        imageLocalPath: null,
        orderIndex: i++,
      })
      .run();
  }
  return DECK.length;
}

/** Insert the v1.0 baseline iteration if no iterations exist yet. */
export function seedFirstIteration(db: DB): void {
  if (db.select().from(iterations).all().length > 0) return;
  const now = Date.now();
  db.insert(iterations)
    .values({
      id: uuidv7(),
      dated: now,
      version: "v1.0",
      cardsIn: null,
      cardsOut: null,
      reasoning: "Starting 60-card list.",
      testedVs: null,
      verdict: "keep",
      createdAt: now,
    })
    .run();
}
