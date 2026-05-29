# Elgyem Control Tracker — Design

**Date:** 2026-05-25
**Status:** Approved-pending-review (brainstorming output; next step is an implementation plan)
**Author:** Jack + Claude

## 1. Summary

A local-first web app to replace `elgyem_control_tracker.xlsx` for logging Pokémon TCG
games with an Elgyem control deck. Priorities, in order: log a game in <30s at a live
event; auto-updating dashboards; real TCG card art; honest empty states ("—", never a
fabricated 0%); survive a phone reboot (local persistence); JSON export for backup.

This document does **not** restate the full build spec. The build spec the user supplied
(sections §0–§14) is the detailed source of truth for field-level behavior, page layouts,
the §5 visual system, and the §6 formulas. **This document records what is locked,
corrected, and added on top of that spec, plus the build order.** Where this document and
the spec disagree, this document wins.

## 2. Source of truth & prerequisites

- **Behavioral source of truth:** the supplied build spec (§0–§14). The original
  `elgyem_control_tracker.xlsx` is **not present on this machine** (searched home tree).
  Consequence: the §10 xlsx importer is deferred until the file is provided, and the spec
  document — not the spreadsheet — drives behavior. Seed data (§8), enums (§3.1), and
  formulas (§6) are fully specified in the spec, so this is not blocking.
- **Toolchain:** installed via Homebrew → **Node v26.0.0, pnpm 11.3.0** (Apple Silicon arm64,
  macOS 15.6.1, Xcode CLT 16.4). Note: 26 is the *current* line, not LTS; Next 14 sets no upper
  Node bound so it runs, and `better-sqlite3` compiles from source against Node 26 if no prebuilt
  ABI exists (CLT present). **Fallback if anything misbehaves:** pin an LTS via
  `brew install node@24` + `.nvmrc` / `package.json#engines`.
- **Project location:** `~/elgyem-control-tracker` (sibling to `~/gridtilt`). Git initialized.

## 3. Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| Q1 | Node toolchain | Claude installs Node + pnpm via Homebrew |
| Q2 | `match_id` uniqueness | `slug(event)-YYYYMMDD-N`, N = per-day match counter; quick-add has a "New match" control |
| Q3 | trainingcourt-inspired scope | Add Tournament rollup entity **+** optional `round` **+** optional `opponent_name` |
| Q4 | PTCG Live log paste | Yes — stretch backlog (after core); manual entry stays primary |

**Defaults chosen without a question (change on request):**

- **Prize-map "expected rate"** (undefined in spec) = hypergeometric P(≥1 copy prized):
  `1 − C(60−c, 6) / C(60, 6)` for a card with `c` copies. Sanity: 1 copy ≈ 10%, 4 copies ≈ 35.2%.
  Observed rate = (games where the card appears in `prized_cards`) ÷ games — directly comparable.
- **Ties in Win%**: follow spec §6.1 (`W / total`, ties in denominator). W/L/T always shown
  separately so the number is never misleading. (One-line switch to `W/(W+L)` if preferred.)
- **`prized_cards`** stored as a JSON array that may contain duplicates (you can prize 2 of a
  card). Prize Map counts games-where-prized (binary, per §6.5); total-copies-prized is a
  secondary stat.
- **`iterations.cards_in` / `cards_out`** stored as JSON arrays (drives the red/green diff),
  free text tolerated on import.
- **`.db` file** lives in repo root, **gitignored**; `seed.ts` recreates it.
- **IDs**: UUIDv7 via the `uuidv7` package (Node's built-in `randomUUID` is v4, not sortable).

## 4. Data-model changes (delta vs spec §3)

The spec §3 tables (`games`, `deck_cards`, `iterations`, `wishlist`) stand as written.
Changes and additions:

### 4.1 `games` — additions
- `tournament_id` text NULL — FK to `tournaments.id` (null for playtest/ladder games).
- `round` int NULL — Swiss/cut round number.
- `opponent_name` text NULL — optional, privacy-friendly.
- **`match_id` generation** is now defined (was ambiguous): `slug(event)-YYYYMMDD-N`.
  `slug(event)` = lowercased, hyphenated event name. `N` = `1 + max(N)` over existing games
  with the same event+date, bumped by the quick-add "New match" control. BO1: each game is
  its own match (N increments per game). This prevents §6.4 BO3 aggregation from silently
  merging two different same-day matches.

### 4.2 New table: `tournaments`
| field | type | notes |
|-------|------|-------|
| id | text PK | uuidv7 |
| name | text NOT NULL | e.g. "May Locals" or auto `{event} {date}` |
| event | text NOT NULL | EVENTS enum (§3.1) |
| dated | int NOT NULL | midnight Unix ms |
| format | text | BO1 / BO3 (typical) |
| size | int NULL | player count |
| rounds_total | int NULL | |
| final_record | text NULL | e.g. "6-2-1" |
| placement | int NULL | finishing position |
| made_cut | int NULL | 0/1 |
| notes | text NULL | |
| created_at / updated_at | int NOT NULL | Unix ms |

Tournament stats (record, win%, placement) are computed by joining linked `games`/matches.
A `/tournaments` page lists tournaments with record + placement; `/games` gets a tournament
filter; the modal gains optional `round` and `opponent_name` fields.

### 4.3 New table: `custom_opponent_decks`
Referenced in §3.1 but missing from §3. `id` text PK, `name` text NOT NULL UNIQUE,
`created_at` int. Powers the "create new" option on the opponent combobox.

## 5. Card images & set-code map (verified)

`setCodeMap.ts` — **verified against the live `api.pokemontcg.io/v2/sets` endpoint
(173 sets) on 2026-05-25.** Maps the deck's codes → pokemontcg.io `set.id`:

| Code | set.id | Set | | Code | set.id | Set |
|------|--------|-----|-|------|--------|-----|
| ASC | `me2pt5` | Ascended Heroes | | TWM | `sv6` | Twilight Masquerade |
| PRE | `sv8pt5` | Prismatic Evolutions | | TEF | `sv5` | Temporal Forces |
| JTG | `sv9` | Journey Together | | WHT | `rsv10pt5` | White Flare |
| BLK | `zsv10pt5` | Black Bolt | | PFL | `me2` | Phantasmal Flames |
| DRI | `sv10` | Destined Rivals | | SCR | `sv7` | Stellar Crown |
| MEG | `me1` | Mega Evolution | | SSP | `sv8` | Surging Sparks |
| POR | `me3` | Perfect Order | | SFA | `sv6pt5` | Shrouded Fable |
| **MEE → `sve`** | | **Scarlet & Violet Energies** | | | | |

**Correction:** no set has `ptcgoCode: MEE`. The deck's "Psychic Energy MEE 5" resolves to
`sve` #5 = Basic Psychic Energy (confirmed by direct card query). `setCodeMap` maps `MEE → sve`.

### 5.1 `fetch-card-images.ts` — revised design (fixes real API gotchas)
- **Query once per set, not per card.** `GET /v2/cards?q=set.id:{id}&pageSize=250`, then match
  card numbers locally. 15 requests instead of 60 → far less rate-limit exposure.
- **Rate limiting is silent.** Unauthenticated bursts return `HTTP 200` with empty `data`
  (observed: 3 of 6 rapid calls came back empty, all succeeded on retry). Add retry-with-backoff
  on empty results before falling back; support optional `POKEMONTCG_API_KEY` env (`X-Api-Key`
  header) to raise limits.
- **Image host varies.** Newer (Mega-era) sets serve `images.scrydex.com/...`; older sets serve
  `images.pokemontcg.io/...`. Read `images.small`/`images.large` from the response; never
  construct the URL. Download to `public/cards/{set}_{number}.png`, set `image_local_path`.
- **PokeAPI fallback** (§7.3) only applies to Pokémon (sprites). Trainers/Energy/Stadiums have no
  sprite fallback — but all are indexed in the API, so this is a last resort only.
- **Licensing** (§7.4): personal/local use only. No public-share feature without swapping images
  for placeholders first.

## 6. Calculation clarifications (delta vs spec §6)

The §6 functions (`winPct`, `lastNWinPct`, `winPctWhere`, `bo3MatchResults`, `prizeCount`,
`rollingWinPct`) stand as written, all returning `null` (not 0) on empty samples. Additions:
- `expectedPrizeRate(copies)` = `1 − C(60−copies, 6) / C(60, 6)` (§3 default above).
- Tournament rollups: per-tournament record/win%/placement by joining games on `tournament_id`.
- All of `src/lib/stats.ts` is pure and unit-tested (Vitest): 0 games, all-W, all-L, mixed BO3,
  missing fields.

## 7. Tech stack (confirmed, no swaps)

Next.js 14 (App Router) + strict TS + Tailwind + shadcn/ui + Recharts + better-sqlite3 +
Drizzle + Zod + date-fns + lucide-react + Vitest. Notes:
- `better-sqlite3` is **server-only**; set `serverExternalPackages: ['better-sqlite3']` (Next 14:
  `experimental.serverComponentsExternalPackages`) or the build breaks. DB access only via Route
  Handlers / Server Actions.
- The §9 "log a game on a 375px viewport" criterion needs a real viewport → **Playwright**
  (jsdom can't). Vitest+RTL covers stats + modal validation. Playwright optional but honest.
- `pnpm dev` for dev; `pnpm build && pnpm start` as the production-parity path.

## 8. Build order

**Slice 0 — toolchain + skeleton:** Node/pnpm (in progress); scaffold Next 14 + strict TS +
Tailwind wired to the §5 violet/gold tokens + ESLint/Prettier; Drizzle + better-sqlite3 with
server-external config; `games` schema + first migration.

**Slice 1 — end-to-end proof (the §13.3 "one page, one form, one chart" milestone):**
`/games` table + quick-add modal (core fields) writing to SQLite; `/` dashboard with 3
games-only KPIs (Total, Win%, Last-10) + the rolling-10 win-rate line chart + honest empty
states; `stats.ts` core (`winPct`/`lastNWinPct`/`rollingWinPct`) with Vitest tests.
**Stop and demo before proceeding.**

**Phase 2 — full model + decklist + images:** complete `games` schema (+ `tournament_id`,
`round`, `opponent_name`) + full grouped modal (prized-cards chip select); `tournaments` +
`custom_opponent_decks` tables; `deck_cards` + §8 seed (order preserved); `/decklist` editor;
`fetch-card-images` (§5.1); verified `setCodeMap.ts`.

**Phase 3 — full dashboard + analytics:** all 12 KPI tiles incl. BO3 match-level (§6.4);
per-opponent table with red→green scales + ≥N-games slider; hand-quality histogram; `stats.ts`
complete with full coverage.

**Phase 4 — remaining pages:** `/iterations` timeline + seed v1.0 entry; `/prizes` Prize Map
(§6 formula) + hand stats + the two charts; `/tournaments` rollup; `/settings` (JSON
export/import, re-fetch images, wipe).

**Phase 5 — quality bar + stretch:** modal component tests (RTL), 375px Playwright pass,
Lighthouse ≥90, zero console errors; then the stretch backlog (section 9 below).

## 9. Stretch backlog (priority order)

1. Match-level BO3 aggregation on dashboard (in Phase 3 already).
2. Filter chips on `/games` (deck, result, format, last-30-days, tournament).
3. Keyboard shortcuts: `n` new game, `g g` games, `g d` dashboard, `?` help.
4. Per-opponent radar (Win%, 1st W%, 2nd W%, avg hand-Q, avg turns, avg time).
5. **PTCG Live game-log paste** → best-effort prefill (going, turn count, prizes), user confirms before save (Q4).
6. Markdown notes with preview.
7. Tags on games + filter chips.
8. Time-window filter on dashboard (7/30/90/all).
9. Print-friendly decklist `/decklist/print` (no card images if ever shared — §7.4).
10. PWA manifest for home-screen install.
11. Dark mode.
12. **xlsx import** (§10) — blocked on the user providing `elgyem_control_tracker.xlsx`.

## 10. Quality gates (§9)

Strict TS (`strict: true`, no `any`); ESLint + Prettier; Vitest unit coverage on `stats.ts`;
RTL component tests for the entry modal (submit writes DB, mulligan-range validation); no
console errors in dev or build; Lighthouse ≥90 on the dashboard (desktop); mobile breakpoint
640px with log-a-game verified at 375px.

## 11. Out of scope / open

- **xlsx import & history migration** — deferred until the source file is provided.
- **No cloud, accounts, or public sharing** — deliberate (local-first; §7.4 licensing).
- The `tournaments` UI is intentionally lightweight (a rollup list + a `/games` filter), not a
  full tournament manager.
