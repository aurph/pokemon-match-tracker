import { describe, it, expect } from "vitest";
import {
  categorySection,
  categoryBadge,
  groupDeckSections,
  deckGrandTotal,
} from "./deck-sections";
import type { DeckCard } from "@/db/schema";

function c(partial: Partial<DeckCard>): DeckCard {
  return {
    id: "x",
    count: 1,
    name: "Card",
    setCode: "ASC",
    setNumber: "1",
    category: "pokemon_basic",
    role: null,
    notes: null,
    imageUrl: null,
    imageLocalPath: null,
    orderIndex: 0,
    ...partial,
  };
}

describe("categorySection", () => {
  it("maps pokemon_* categories to the pokemon section", () => {
    expect(categorySection("pokemon_basic")).toBe("pokemon");
    expect(categorySection("pokemon_stage1_ex")).toBe("pokemon");
  });
  it("maps trainer_* categories to the trainer section", () => {
    expect(categorySection("trainer_supporter")).toBe("trainer");
    expect(categorySection("trainer_tool")).toBe("trainer");
  });
  it("maps energy_* categories to the energy section", () => {
    expect(categorySection("energy_basic")).toBe("energy");
    expect(categorySection("energy_special")).toBe("energy");
  });
  it("falls back to trainer for an unknown category", () => {
    expect(categorySection("mystery")).toBe("trainer");
  });
});

describe("categoryBadge", () => {
  it("returns friendly labels", () => {
    expect(categoryBadge("pokemon_basic")).toBe("Basic");
    expect(categoryBadge("pokemon_stage1_ex")).toBe("Stage 1 ex");
    expect(categoryBadge("pokemon_basic_ex")).toBe("Basic ex");
    expect(categoryBadge("trainer_supporter")).toBe("Supporter");
    expect(categoryBadge("trainer_item")).toBe("Item");
    expect(categoryBadge("trainer_tool")).toBe("Tool");
    expect(categoryBadge("trainer_stadium")).toBe("Stadium");
    expect(categoryBadge("energy_basic")).toBe("Energy");
    expect(categoryBadge("energy_special")).toBe("Energy");
  });
  it("falls back to the raw category when unmapped", () => {
    expect(categoryBadge("weird_thing")).toBe("weird_thing");
  });
});

describe("groupDeckSections", () => {
  it("orders sections Pokémon, Trainers, Energy", () => {
    const sections = groupDeckSections([
      c({ category: "energy_basic" }),
      c({ category: "trainer_item" }),
      c({ category: "pokemon_basic" }),
    ]);
    expect(sections.map((s) => s.key)).toEqual(["pokemon", "trainer", "energy"]);
  });

  it("sorts rows within a section by orderIndex", () => {
    const sections = groupDeckSections([
      c({ name: "B", orderIndex: 2 }),
      c({ name: "A", orderIndex: 1 }),
      c({ name: "C", orderIndex: 3 }),
    ]);
    expect(sections[0].cards.map((x) => x.name)).toEqual(["A", "B", "C"]);
  });

  it("computes per-section subtotals from count", () => {
    const sections = groupDeckSections([
      c({ category: "pokemon_basic", count: 3 }),
      c({ category: "pokemon_stage1", count: 2 }),
      c({ category: "trainer_item", count: 4 }),
    ]);
    const pokemon = sections.find((s) => s.key === "pokemon");
    const trainer = sections.find((s) => s.key === "trainer");
    expect(pokemon?.subtotal).toBe(5);
    expect(trainer?.subtotal).toBe(4);
  });

  it("omits empty sections", () => {
    const sections = groupDeckSections([c({ category: "pokemon_basic" })]);
    expect(sections.map((s) => s.key)).toEqual(["pokemon"]);
  });

  it("returns nothing for an empty deck", () => {
    expect(groupDeckSections([])).toEqual([]);
  });
});

describe("deckGrandTotal", () => {
  it("sums every card count", () => {
    expect(deckGrandTotal([c({ count: 3 }), c({ count: 2 }), c({ count: 1 })])).toBe(6);
  });
  it("is 0 for an empty deck", () => {
    expect(deckGrandTotal([])).toBe(0);
  });
});
