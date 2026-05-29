/**
 * Maps the deck's internal set codes to pokemontcg.io set IDs.
 * Verified against the live API — do not re-derive.
 */
export const SET_CODE_MAP: Record<string, string> = {
  ASC: "me2pt5",
  PRE: "sv8pt5",
  JTG: "sv9",
  BLK: "zsv10pt5",
  DRI: "sv10",
  MEG: "me1",
  SCR: "sv7",
  SSP: "sv8",
  SFA: "sv6pt5",
  POR: "me3",
  TWM: "sv6",
  TEF: "sv5",
  WHT: "rsv10pt5",
  MEE: "sve",
  PFL: "me2",
};

/**
 * Returns the pokemontcg.io set ID for a given deck set code,
 * or undefined if the code is not in the map.
 */
export function pokemontcgSetId(code: string): string | undefined {
  return SET_CODE_MAP[code];
}
