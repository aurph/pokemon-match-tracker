// Read-only client for the public Limitless TCG API (no key required for the
// tournament/standings endpoints we use). Aggregates recent PTCG standings into
// a lightweight metagame snapshot — archetype share + top-8 finishes — so the
// tracker can show "what's winning / what you'll likely face" without scraping.
//
// The /games/decks endpoint (full decklists) needs an X-Access-Key and is NOT
// used here. If a key is ever granted, set LIMITLESS_API_KEY and it'll be sent.

const BASE = "https://play.limitlesstcg.com/api";
const KEY = process.env.LIMITLESS_API_KEY;

async function fetchJson<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    headers: KEY ? { "X-Access-Key": KEY } : undefined,
  });
  if (!res.ok) throw new Error(`Limitless ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

interface RawTournament {
  id: string;
  name: string;
  date: string;
  players?: number;
}

interface RawStanding {
  placing?: number;
  // `deck` may be a string archetype name, or an object with a name/id.
  deck?: string | { id?: string; name?: string } | null;
}

function deckName(deck: RawStanding["deck"]): string | null {
  if (!deck) return null;
  if (typeof deck === "string") return deck.trim() || null;
  return (deck.name ?? deck.id ?? "").trim() || null;
}

export interface ArchetypeStat {
  name: string;
  /** Total standings rows seen for this archetype across sampled tournaments. */
  count: number;
  /** How many of those were top-8 finishes. */
  top8: number;
  /** Share of all sampled standings rows, 0..1. */
  share: number;
}

export interface MetaSnapshot {
  archetypes: ArchetypeStat[];
  tournamentsSampled: number;
  standingsSampled: number;
  updatedAt: number;
  source: string;
}

interface CacheEntry {
  at: number;
  data: MetaSnapshot;
}
const TTL_MS = 6 * 60 * 60 * 1000; // 6h — meta moves slowly and we want to be gentle on the API
const cache = new Map<string, CacheEntry>();

/**
 * Builds a metagame snapshot from the most recent `tournaments` PTCG events,
 * sampling up to `topN` standings rows from each. Cached in-memory for 6h per
 * (tournaments, topN) key. On any upstream failure the last good snapshot is
 * returned if present, otherwise the error propagates.
 */
export async function getMetaSnapshot(tournaments = 8, topN = 16): Promise<MetaSnapshot> {
  const key = `${tournaments}:${topN}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

  try {
    const recent = await fetchJson<RawTournament[]>("/tournaments", {
      game: "PTCG",
      limit: tournaments,
    });

    const counts = new Map<string, { count: number; top8: number }>();
    let standingsSampled = 0;
    let tournamentsSampled = 0;

    for (const t of recent) {
      let standings: RawStanding[];
      try {
        standings = await fetchJson<RawStanding[]>(`/tournaments/${t.id}/standings`);
      } catch {
        continue; // skip a tournament whose standings aren't available
      }
      tournamentsSampled++;
      for (const s of standings.slice(0, topN)) {
        const name = deckName(s.deck);
        if (!name) continue;
        standingsSampled++;
        const entry = counts.get(name) ?? { count: 0, top8: 0 };
        entry.count++;
        if ((s.placing ?? 999) <= 8) entry.top8++;
        counts.set(name, entry);
      }
    }

    const archetypes: ArchetypeStat[] = [...counts.entries()]
      .map(([name, v]) => ({
        name,
        count: v.count,
        top8: v.top8,
        share: standingsSampled ? v.count / standingsSampled : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const snapshot: MetaSnapshot = {
      archetypes,
      tournamentsSampled,
      standingsSampled,
      updatedAt: Date.now(),
      source: "play.limitlesstcg.com",
    };
    cache.set(key, { at: Date.now(), data: snapshot });
    return snapshot;
  } catch (err) {
    if (hit) return hit.data; // serve stale rather than failing the dashboard
    throw err;
  }
}
