# Pokémon Match Tracker

A local-first app for logging Pokémon TCG games and turning them into deep, well-labeled stats — built around a pixel/retro aesthetic rather than a generic dashboard. Originally an **Elgyem control** deck tracker; now a general-purpose match tracker with a web app and an Expo mobile companion.

> Log every game, then let the app surface your win rates, streaks, matchup spread, hand-quality trends, favorite victims and nemeses — plus a live snapshot of the competitive metagame pulled from Limitless.

## Screenshots

<!-- Drop images into docs/screenshots/ and uncomment:
![Dashboard](docs/screenshots/dashboard.png)
![Decklist](docs/screenshots/decklist.png)
-->

_Add screenshots to `docs/screenshots/` and link them here._

## Features

- **Game logging** — event, format (BO1/BO3), opponent deck, going 1st/2nd, result, mulligans, hand quality, turn count, time, lock turn, prize trade, notes.
- **Auto-derived stats** — win %, last-10 win %, going-1st/2nd win %, mulligan rate, BO1/BO3 splits, average turns/time/hand-quality, current & longest streaks, favorite victim, nemesis, and a per-opponent matchup table.
- **Decklist with real card art** — full 60-card list (counts, roles, notes) with card images from [pokemontcg.io](https://pokemontcg.io) and pixel Pokémon sprites from [PokéAPI](https://pokeapi.co); a compact card-art strip also lives on the dashboard.
- **Metagame snapshot** — recent PTCG archetype share and top finishes via the public [Limitless TCG API](https://docs.limitlesstcg.com/) (no API key required for tournament/standings data).
- **Deck iterations, prizes & tournaments** — track list changes over time with reasoning/verdicts, prize math, and event records.
- **Local-first** — data lives in a local SQLite file; full JSON import/export.
- **Mobile companion** — an Expo app for logging on the go.

## Tech stack

- **Monorepo:** pnpm workspaces · Node.js · TypeScript 5.9
- **Web:** Vite · React 19 · wouter · TanStack Query · Tailwind CSS v4 · Recharts
- **API:** Express 5 · better-sqlite3 · Drizzle ORM · Zod
- **Mobile:** Expo / React Native
- **Build:** esbuild (API bundle), Vite (web)

## Repository layout

```
artifacts/
  pokemon-tracker/   Web app (Vite + React) — the main dashboard & pages
  api-server/        Express + SQLite/Drizzle API (stats, decklist, Limitless proxy)
  pokemon-mobile/    Expo mobile companion
  mockup-sandbox/    Design/prototype sandbox
lib/
  db/                Shared Drizzle schema & client
  api-spec/          API spec
  api-zod/           Shared Zod schemas
  api-client-react/  Shared React API client
scripts/             Workspace tooling
```

## Getting started

Requires [pnpm](https://pnpm.io) and Node.js.

```bash
pnpm install

# API server (serves /api, seeds the SQLite DB on first run)
pnpm --filter @workspace/api-server run dev

# Web app (proxies /api to the server)
pnpm --filter @workspace/pokemon-tracker run dev
```

Useful workspace commands:

```bash
pnpm run typecheck   # typecheck every package
pnpm run build       # typecheck + build all packages
```

## Deployment

Configured for [Replit](https://replit.com). Note that the API stores data in a single SQLite file — if you deploy, make sure it lives on **persistent, single-instance** storage (a Reserved VM), not ephemeral autoscale storage, or logged games can be lost on redeploy.

## Credits

- Card images: [pokemontcg.io](https://pokemontcg.io)
- Pixel sprites: [PokéAPI](https://pokeapi.co)
- Competitive data: [Limitless TCG](https://limitlesstcg.com)
