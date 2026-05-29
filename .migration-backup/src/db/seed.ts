import { db } from "./client";
import { DECK, DECK_TOTAL, seedDeckCards, seedFirstIteration } from "./seed-data";

// CLI seed: force-reset the deck to the canonical 60 + ensure the v1.0 iteration.
seedDeckCards(db, { reset: true });
seedFirstIteration(db);
console.log(`Seeded ${DECK.length} deck-card entries (${DECK_TOTAL} cards) + v1.0 iteration.`);
