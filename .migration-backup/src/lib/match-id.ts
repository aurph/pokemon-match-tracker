/** Lowercase, hyphenate, strip non-alphanumerics. "League Cup" -> "league-cup". */
export function slugifyEvent(event: string): string {
  return event
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Local-time YYYYMMDD for a Unix-ms timestamp. */
export function dateStamp(playedAt: number): string {
  const d = new Date(playedAt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** Compose a match id: `slug(event)-YYYYMMDD-N`. */
export function buildMatchId(event: string, playedAt: number, n: number): string {
  return `${slugifyEvent(event)}-${dateStamp(playedAt)}-${n}`;
}
