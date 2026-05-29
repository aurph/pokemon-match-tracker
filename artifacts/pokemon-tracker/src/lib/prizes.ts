type Game = { prizedCards?: string | null; handQuality?: number | null; lockTurn?: number | null; result: string };

/** Binomial coefficient C(n, k) via incremental product (exact enough for 60-card math). */
function combos(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
}

/** Hypergeometric P(at least one of `copies` is among the 6 prizes) in a 60-card deck. */
export function expectedPrizeRate(copies: number, deckSize = 60, prizes = 6): number {
  if (copies <= 0) return 0;
  return 1 - combos(deckSize - copies, prizes) / combos(deckSize, prizes);
}

function prizedSet(g: Game): string[] {
  try {
    const a = JSON.parse(g.prizedCards ?? "[]");
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

/** Number of games in which a card name appeared in the prizes (binary per game). */
export function prizeCount(games: Game[], name: string): number {
  return games.filter((g) => prizedSet(g).includes(name)).length;
}

export interface PrizeRow {
  name: string;
  copies: number;
  timesPrized: number;
  gamesLogged: number;
  observedRate: number | null;
  expectedRate: number;
}

/** Per-card prize map. Copies are summed across printings sharing a name. */
export function prizeMap(games: Game[], deck: { name: string; count: number }[]): PrizeRow[] {
  const byName = new Map<string, number>();
  for (const c of deck) byName.set(c.name, (byName.get(c.name) ?? 0) + c.count);
  const gamesLogged = games.length;
  return [...byName.entries()]
    .map(([name, copies]) => {
      const timesPrized = prizeCount(games, name);
      return {
        name,
        copies,
        timesPrized,
        gamesLogged,
        observedRate: gamesLogged === 0 ? null : timesPrized / gamesLogged,
        expectedRate: expectedPrizeRate(copies),
      };
    })
    .sort((a, b) => b.copies - a.copies || a.name.localeCompare(b.name));
}

/** The single card prized most often (the "prize curse"), among cards prized at least once. */
export function prizeCurse(rows: PrizeRow[]): PrizeRow | null {
  const cursed = rows.filter((r) => r.timesPrized > 0);
  if (cursed.length === 0) return null;
  return cursed.reduce((worst, r) => (r.timesPrized > worst.timesPrized ? r : worst));
}

export function winPctByHandQuality(games: Game[]): { quality: number; winPct: number | null; n: number }[] {
  return [1, 2, 3, 4, 5].map((q) => {
    const at = games.filter((g) => g.handQuality === q);
    return {
      quality: q,
      n: at.length,
      winPct: at.length ? at.filter((g) => g.result === "W").length / at.length : null,
    };
  });
}

export function handQualityVsLock(
  games: Game[],
): { handQuality: number; lockTurn: number; result: string }[] {
  return games
    .filter((g) => g.handQuality != null && g.lockTurn != null)
    .map((g) => ({ handQuality: g.handQuality!, lockTurn: g.lockTurn!, result: g.result }));
}
