import { describe, it, expect } from "vitest";
import { pokemontcgSetId, SET_CODE_MAP } from "./setCodeMap";

describe("SET_CODE_MAP", () => {
  it("contains all expected set codes", () => {
    const expectedCodes = [
      "ASC", "PRE", "JTG", "BLK", "DRI", "MEG",
      "SCR", "SSP", "SFA", "POR", "TWM", "TEF",
      "WHT", "MEE", "PFL",
    ];
    for (const code of expectedCodes) {
      expect(SET_CODE_MAP).toHaveProperty(code);
    }
  });
});

describe("pokemontcgSetId", () => {
  it("returns me2pt5 for ASC", () => {
    expect(pokemontcgSetId("ASC")).toBe("me2pt5");
  });

  it("returns sve for MEE", () => {
    expect(pokemontcgSetId("MEE")).toBe("sve");
  });

  it("returns sv9 for JTG", () => {
    expect(pokemontcgSetId("JTG")).toBe("sv9");
  });

  it("returns zsv10pt5 for BLK", () => {
    expect(pokemontcgSetId("BLK")).toBe("zsv10pt5");
  });

  it("returns me3 for POR", () => {
    expect(pokemontcgSetId("POR")).toBe("me3");
  });

  it("returns undefined for an unknown code", () => {
    expect(pokemontcgSetId("UNKNOWN")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(pokemontcgSetId("")).toBeUndefined();
  });
});
