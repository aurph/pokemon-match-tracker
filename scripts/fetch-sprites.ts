import { mkdir, writeFile } from "node:fs/promises";
import { DECK_SPRITES } from "../src/lib/sprites";

const OUT = "public/sprites";
const BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

async function main() {
  await mkdir(OUT, { recursive: true });
  let ok = 0;
  for (const { key, dex } of DECK_SPRITES) {
    try {
      const res = await fetch(`${BASE}/${dex}.png`);
      if (!res.ok) {
        console.warn(`MISS ${key} (#${dex}): HTTP ${res.status}`);
        continue;
      }
      await writeFile(`${OUT}/${key}.png`, Buffer.from(await res.arrayBuffer()));
      ok++;
    } catch (err) {
      console.warn(`ERROR ${key} (#${dex}):`, err);
    }
  }
  console.log(`Fetched ${ok}/${DECK_SPRITES.length} pixel sprites into ${OUT}/`);
}

main();
