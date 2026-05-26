# Elgyem Control Tracker

A local-first Pokémon TCG match tracker built around an Elgyem control deck. Log a game in
seconds, watch the dashboard update live, browse your decklist with real card art, and dig into
matchup spreads, a prize map, win/loss streaks, and hand-quality analytics — all stored on-device
in SQLite. Pixel/retro flavored, no cloud.

## Stack

Next.js 16 (App Router, strict TS) · Tailwind v4 · better-sqlite3 + Drizzle ORM · Recharts ·
Zod · Vitest + Testing Library. Local-first: one SQLite file, server-only data access.

## Prerequisites

- Node ≥ 18.18 (developed on Node 26) and `pnpm`.

## Setup

```bash
pnpm install
pnpm db:migrate   # create the SQLite schema (elgyem.db in repo root)
pnpm db:seed      # seed the 60-card decklist + a v1.0 iteration
pnpm fetch-images # download real card art -> public/cards (set POKEMONTCG_API_KEY to avoid rate limits)
pnpm exec tsx scripts/fetch-sprites.ts   # pixel Pokémon sprites -> public/sprites
pnpm dev          # http://localhost:3000
```

## Production build

```bash
pnpm build && pnpm start
```

## Where your data lives

- **`elgyem.db`** in the repo root — your games, decklist, iterations, tournaments. Gitignored.
  Override the location with the `DB_PATH` env var.
- **`public/cards/`** — downloaded card art (gitignored, re-fetchable).
- **`public/sprites/`** — pixel Pokémon sprites (committed).

## Backup & restore

- **Settings → Export JSON** (or GET `/api/export`) downloads a full snapshot.
- **Settings → Import JSON** restores a snapshot (replaces current data).

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | run the app |
| `pnpm test` | Vitest unit + component tests |
| `pnpm lint` · `pnpm exec tsc --noEmit` | lint + typecheck |
| `pnpm db:generate` / `db:migrate` / `db:seed` | Drizzle migrations + seed |
| `pnpm fetch-images` | (re)download card art |
| `pnpm exec tsx scripts/fetch-sprites.ts` | (re)download pixel sprites |

## Layout

- `src/app` — pages (dashboard, games, decklist, prizes, iterations, tournaments, settings) + server actions + `/api/export`
- `src/db` — Drizzle schema, client, repositories, migrate/seed
- `src/lib` — stats, prizes, match-id, verified set-code map, sprites, enums
- `src/components` — pixel UI, charts, the game modal
- `docs/superpowers` — design doc + implementation plan

## Notes

- **Honest empty states:** stats render `—`, never a fabricated `0%`, until there's a real sample.
- **Match grouping:** `match_id` is `slug(event)-YYYYMMDD-N`; the modal's "New match" control bumps `N` so BO3 matches never collide on the same event-day.
- **Card images** are © The Pokémon Company — fine for personal/local use. Don't add public
  sharing without first swapping art for placeholders.
