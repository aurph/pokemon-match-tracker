// Pixel-art Pokémon sprites (PokeAPI front_default) for the deck's Pokémon.
// Rendered crisp/upscaled via the `.pixelated` CSS utility for the retro aesthetic.
// Order matters: more specific names (dudunsparce) must precede substrings (dunsparce).
export const DECK_SPRITES: { key: string; dex: number; match: RegExp }[] = [
  { key: "dreepy", dex: 885, match: /dreepy/i },
  { key: "drakloak", dex: 886, match: /drakloak/i },
  { key: "dudunsparce", dex: 982, match: /dudunsparce/i },
  { key: "dunsparce", dex: 206, match: /dunsparce/i },
  { key: "elgyem", dex: 605, match: /elgyem/i },
  { key: "sudowoodo", dex: 185, match: /sudowoodo/i },
  { key: "ogerpon", dex: 1017, match: /ogerpon/i },
  { key: "shuckle", dex: 213, match: /shuckle/i },
  { key: "comfey", dex: 764, match: /comfey/i },
  { key: "shaymin", dex: 492, match: /shaymin/i },
  { key: "dedenne", dex: 702, match: /dedenne/i },
  { key: "flutter-mane", dex: 987, match: /flutter mane/i },
  { key: "budew", dex: 406, match: /budew/i },
];

/** Local sprite path for a deck-card name, or null if the card isn't a known Pokémon. */
export function spriteForName(name: string): string | null {
  const hit = DECK_SPRITES.find((s) => s.match.test(name));
  return hit ? `/sprites/${hit.key}.png` : null;
}

/** The deck's namesake — used as the app mascot in headers and empty states. */
export const ELGYEM_SPRITE = "/sprites/elgyem.png";
