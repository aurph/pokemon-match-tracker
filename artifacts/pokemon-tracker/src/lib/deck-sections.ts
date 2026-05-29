type DeckCard = { id: string; count: number; name: string; setCode: string; setNumber: string; category: string; role?: string | null; notes?: string | null; orderIndex: number };

/** The three top-level deck sections, in display order. */
export const SECTION_ORDER = ["pokemon", "trainer", "energy"] as const;
export type SectionKey = (typeof SECTION_ORDER)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  pokemon: "Pokémon",
  trainer: "Trainers",
  energy: "Energy",
};

/**
 * Maps a card `category` (e.g. "pokemon_basic_ex") to its section key.
 * Falls back to "trainer" for unrecognized prefixes so a stray row is never dropped.
 */
export function categorySection(category: string): SectionKey {
  if (category.startsWith("pokemon")) return "pokemon";
  if (category.startsWith("energy")) return "energy";
  if (category.startsWith("trainer")) return "trainer";
  return "trainer";
}

const BADGE_LABELS: Record<string, string> = {
  pokemon_basic: "Basic",
  pokemon_stage1: "Stage 1",
  pokemon_stage2: "Stage 2",
  pokemon_basic_ex: "Basic ex",
  pokemon_stage1_ex: "Stage 1 ex",
  pokemon_stage2_ex: "Stage 2 ex",
  trainer_supporter: "Supporter",
  trainer_item: "Item",
  trainer_tool: "Tool",
  trainer_stadium: "Stadium",
  energy_basic: "Energy",
  energy_special: "Energy",
};

/** Friendly badge label for a card category (e.g. "Stage 1 ex"). */
export function categoryBadge(category: string): string {
  return BADGE_LABELS[category] ?? category;
}

export interface DeckSection {
  key: SectionKey;
  label: string;
  cards: DeckCard[];
  subtotal: number;
}

/**
 * Groups cards into the three sections (Pokémon, Trainers, Energy) in display
 * order, sorting each section's rows by `orderIndex` and computing the subtotal
 * (sum of `count`) per section. Empty sections are omitted.
 */
export function groupDeckSections(cards: DeckCard[]): DeckSection[] {
  const buckets: Record<SectionKey, DeckCard[]> = {
    pokemon: [],
    trainer: [],
    energy: [],
  };
  for (const card of cards) {
    buckets[categorySection(card.category)].push(card);
  }
  return SECTION_ORDER.flatMap((key) => {
    const rows = buckets[key].sort((a, b) => a.orderIndex - b.orderIndex);
    if (rows.length === 0) return [];
    return [
      {
        key,
        label: SECTION_LABELS[key],
        cards: rows,
        subtotal: rows.reduce((sum, c) => sum + c.count, 0),
      },
    ];
  });
}

/** Grand total = sum of every card's count. */
export function deckGrandTotal(cards: DeckCard[]): number {
  return cards.reduce((sum, c) => sum + c.count, 0);
}
