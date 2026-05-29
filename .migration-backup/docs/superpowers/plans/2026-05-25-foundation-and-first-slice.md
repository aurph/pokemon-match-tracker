# Foundation & First Vertical Slice — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js + SQLite foundation and ship an end-to-end vertical slice: log a game in a modal, persist it to SQLite, and see it reflected on a dashboard (3 KPIs + a rolling win-rate chart) and a games table — with honest empty states.

**Architecture:** Next.js 15 App Router (TS strict). Data lives in a single local SQLite file via better-sqlite3 + Drizzle (synchronous, server-only). Server Components read directly through repository functions; a Server Action handles writes and revalidates the affected routes. Pure stats/match-id logic lives in `src/lib` and is unit-tested; the repository takes an injected `db` so it can be tested against an in-memory database.

**Tech Stack:** Next.js 15, React 19, TypeScript (strict), Tailwind CSS v4, better-sqlite3, Drizzle ORM + drizzle-kit, Zod, uuidv7, Recharts, lucide-react, date-fns; Vitest + Testing Library for tests; tsx for scripts.

**Reference spec:** `docs/superpowers/specs/2026-05-25-elgyem-control-tracker-design.md`. Phases 2–5 (full model, decklist + images, full dashboard, prizes/iterations/tournaments, settings, stretch) are out of scope for this plan and will get their own plans.

**Conventions:**
- Commit messages: no `Co-Authored-By` line.
- The `games` table is defined in **full** here (all §3 fields + the `tournament_id`/`round`/`opponent_name` additions) so later phases need no schema churn; the Slice-1 form only fills core fields and lets the rest default/null.
- `shadcn/ui` is adopted in Phase 2. This slice hand-builds the few primitives it needs to stay dependency-light and fast.

---

### Task 1: Scaffold the Next.js app

**Files:**
- Create: whole Next.js app skeleton in the repo root (`/Users/jackschwartz/elgyem-control-tracker`)
- Preserve: existing `docs/` and `.git/`

- [ ] **Step 1: Move `docs/` aside so create-next-app sees an empty dir**

`create-next-app` refuses a non-empty directory. `.git` is whitelisted; `docs/` is not.

Run:
```bash
cd /Users/jackschwartz/elgyem-control-tracker && mv docs /tmp/ect-docs-bak
```

- [ ] **Step 2: Scaffold into the current directory**

Run:
```bash
cd /Users/jackschwartz/elgyem-control-tracker && \
pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-pnpm --yes
```
Expected: completes with "Success! Created" and a `package.json`, `src/app/`, `tsconfig.json`, `next.config.ts` (or `.mjs`), `postcss.config.mjs`, `src/app/globals.css`. If it asks about React Compiler or other extras, accept the default (No).

> Note on Turbopack: don't pass `--no-turbopack` (current create-next-app rejects unknown flags). If the scaffold puts `--turbopack` in the `dev` script and better-sqlite3 misbehaves under dev, remove `--turbopack` from that script so dev uses webpack. Production `build` is unaffected.

- [ ] **Step 3: Restore `docs/`**

Run:
```bash
cd /Users/jackschwartz/elgyem-control-tracker && rm -rf docs 2>/dev/null; mv /tmp/ect-docs-bak docs
```
(The scaffold does not create `docs/`; the `rm` only guards against a stray empty one.)

- [ ] **Step 4: Verify it builds and dev-serves**

Run:
```bash
cd /Users/jackschwartz/elgyem-control-tracker && pnpm install && pnpm dev --port 3000 &
sleep 8 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000 && kill %1
```
Expected: `200`. Then stop the dev server.

- [ ] **Step 5: Normalize `next.config` to TypeScript with server-external better-sqlite3**

Delete any generated `next.config.mjs`/`next.config.ts` and create `next.config.ts`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module; never bundle it for the client/runtime.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
```

- [ ] **Step 6: Commit the scaffold**

```bash
cd /Users/jackschwartz/elgyem-control-tracker
git add -A && git commit -m "chore: scaffold Next.js 15 app (App Router, TS, Tailwind v4)"
```

---

### Task 2: Project config — gitignore, Prettier, palette tokens, fonts, deps

**Files:**
- Create: `.gitignore` (append), `.prettierrc.json`
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Install: runtime + dev dependencies

- [ ] **Step 1: Install dependencies**

Run:
```bash
cd /Users/jackschwartz/elgyem-control-tracker && \
pnpm add better-sqlite3 drizzle-orm zod uuidv7 date-fns recharts lucide-react && \
pnpm add -D drizzle-kit tsx @types/better-sqlite3 prettier vitest @vitejs/plugin-react \
  jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  vite-tsconfig-paths
```
Expected: completes; `package.json` lists these. Peer-dependency warnings from recharts about React are benign.

- [ ] **Step 2: Ensure local data + build artifacts are ignored**

Append to `.gitignore`:
```gitignore

# Local SQLite database (recreated by seed)
*.db
*.db-shm
*.db-wal

# Downloaded card art
/public/cards/

# Test/coverage
/coverage
```

- [ ] **Step 3: Add Prettier config**

Create `.prettierrc.json`:
```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100
}
```

- [ ] **Step 4: Add the §5 palette + fonts to `globals.css`**

Replace the contents of `src/app/globals.css` with:
```css
@import "tailwindcss";

@theme {
  --color-p-title: #2c1a4d;
  --color-p-primary: #5e3fbd;
  --color-p-accent: #f5c518;
  --color-p-bg: #faf7ff;
  --color-p-surface: #ffffff;
  --color-p-muted: #6b5da0;
  --color-p-border: #d9cfef;
  --color-p-good: #2e7d32;
  --color-p-bad: #c62828;
  --color-p-warn: #f9a825;
  --color-p-kpi-bg: #ede5ff;

  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains), ui-monospace, monospace;
}

body {
  background-color: var(--color-p-bg);
  color: var(--color-p-title);
}
```
This makes `bg-p-primary`, `text-p-title`, `border-p-border`, `font-mono`, etc. available as utilities.

- [ ] **Step 5: Wire fonts in the root layout**

Replace `src/app/layout.tsx` with:
```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Elgyem Control Tracker",
  description: "Local-first Pokémon TCG control-deck match tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Commit**

```bash
cd /Users/jackschwartz/elgyem-control-tracker
git add -A && git commit -m "chore: deps, prettier, gitignore, palette tokens, fonts"
```

---

### Task 3: Vitest setup

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

- [ ] **Step 2: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Add test scripts to `package.json`**

In the `"scripts"` object add:
```json
"test": "vitest run",
"test:watch": "vitest",
"db:generate": "drizzle-kit generate",
"db:migrate": "tsx src/db/migrate.ts",
"db:seed": "tsx src/db/seed.ts"
```

- [ ] **Step 4: Add a smoke test to prove the runner works**

Create `src/lib/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("vitest", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `cd /Users/jackschwartz/elgyem-control-tracker && pnpm test`
Expected: PASS, 1 test. Then delete the smoke test: `rm src/lib/smoke.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "test: configure Vitest + Testing Library"
```

---

### Task 4: Drizzle schema, client, and config

**Files:**
- Create: `src/db/schema.ts`, `src/db/client.ts`, `drizzle.config.ts`

- [ ] **Step 1: Create the full `games` schema**

Create `src/db/schema.ts`:
```ts
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const games = sqliteTable(
  "games",
  {
    id: text("id").primaryKey(),
    matchId: text("match_id").notNull(),
    gameNumber: integer("game_number").notNull().default(1),
    playedAt: integer("played_at").notNull(),
    event: text("event").notNull(),
    format: text("format").notNull(),
    opponentDeck: text("opponent_deck").notNull(),
    opponentName: text("opponent_name"),
    tournamentId: text("tournament_id"),
    round: integer("round"),
    coinFlip: text("coin_flip"),
    going: text("going").notNull(),
    myMulligans: integer("my_mulligans").notNull().default(0),
    oppMulligans: integer("opp_mulligans").notNull().default(0),
    handQuality: integer("hand_quality"),
    prizeTrade: text("prize_trade"),
    turnCount: integer("turn_count"),
    timeUsedMin: integer("time_used_min"),
    lockTurn: integer("lock_turn"),
    keyCardsDrawn: text("key_cards_drawn"),
    techCardsUsed: text("tech_cards_used"),
    prizedCards: text("prized_cards"),
    result: text("result").notNull(),
    mistakes: text("mistakes"),
    notes: text("notes"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    index("idx_games_opponent").on(t.opponentDeck),
    index("idx_games_played_at").on(t.playedAt),
    index("idx_games_match").on(t.matchId),
  ],
);

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
```

- [ ] **Step 2: Create the DB client with a factory for tests**

Create `src/db/client.ts`:
```ts
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export type DB = BetterSQLite3Database<typeof schema>;

export function createDb(path: string): DB {
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  return drizzle(sqlite, { schema });
}

// App-wide singleton (server-only). DB_PATH overrides the default file.
export const db: DB = createDb(process.env.DB_PATH ?? "elgyem.db");
```

- [ ] **Step 3: Create `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: { url: process.env.DB_PATH ?? "elgyem.db" },
});
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(db): games schema, client factory, drizzle config"
```

---

### Task 5: Generate and run the first migration

**Files:**
- Create: `drizzle/` (generated), `src/db/migrate.ts`

- [ ] **Step 1: Create the migrate script**

Create `src/db/migrate.ts`:
```ts
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./client";

migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrations applied.");
```

- [ ] **Step 2: Generate the migration SQL from the schema**

Run: `cd /Users/jackschwartz/elgyem-control-tracker && pnpm db:generate`
Expected: creates `drizzle/0000_*.sql` containing `CREATE TABLE \`games\``.

- [ ] **Step 3: Apply it to a local db**

Run: `cd /Users/jackschwartz/elgyem-control-tracker && pnpm db:migrate`
Expected: prints "Migrations applied." and creates `elgyem.db` in repo root.

- [ ] **Step 4: Verify the table exists**

Run: `cd /Users/jackschwartz/elgyem-control-tracker && sqlite3 elgyem.db ".tables"`
Expected: lists `__drizzle_migrations  games` (sqlite3 CLI ships with macOS).

- [ ] **Step 5: Commit the migration (not the db — it's gitignored)**

```bash
git add drizzle src/db/migrate.ts && git commit -m "feat(db): initial games migration + migrate script"
```

---

### Task 6: Stats library (TDD)

**Files:**
- Create: `src/lib/stats.ts`, `src/lib/stats.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/stats.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { winPct, lastNWinPct, rollingWinPct } from "./stats";
import type { Game } from "@/db/schema";

function g(partial: Partial<Game>): Game {
  return {
    id: "x", matchId: "m", gameNumber: 1, playedAt: 0, event: "Locals",
    format: "BO1", opponentDeck: "Charizard ex", opponentName: null,
    tournamentId: null, round: null, coinFlip: null, going: "1st",
    myMulligans: 0, oppMulligans: 0, handQuality: null, prizeTrade: null,
    turnCount: null, timeUsedMin: null, lockTurn: null, keyCardsDrawn: null,
    techCardsUsed: null, prizedCards: null, result: "W", mistakes: null,
    notes: null, createdAt: 0, updatedAt: 0,
    ...partial,
  };
}

describe("winPct", () => {
  it("returns null for zero games (never 0%)", () => {
    expect(winPct([])).toBeNull();
  });
  it("returns 1 when all wins", () => {
    expect(winPct([g({ result: "W" }), g({ result: "W" })])).toBe(1);
  });
  it("returns 0 when all losses", () => {
    expect(winPct([g({ result: "L" }), g({ result: "L" })])).toBe(0);
  });
  it("counts ties in the denominator", () => {
    // 1W, 1L, 1T => 1/3
    expect(winPct([g({ result: "W" }), g({ result: "L" }), g({ result: "T" })])).toBeCloseTo(1 / 3);
  });
});

describe("lastNWinPct", () => {
  it("returns null when no games", () => {
    expect(lastNWinPct([], 10)).toBeNull();
  });
  it("uses only the most recent N by playedAt", () => {
    const games = [
      g({ playedAt: 1, result: "L" }),
      g({ playedAt: 2, result: "L" }),
      g({ playedAt: 3, result: "W" }),
      g({ playedAt: 4, result: "W" }),
    ];
    expect(lastNWinPct(games, 2)).toBe(1); // games 3 & 4
  });
  it("handles fewer games than N", () => {
    expect(lastNWinPct([g({ result: "W" })], 10)).toBe(1);
  });
});

describe("rollingWinPct", () => {
  it("returns empty array for no games", () => {
    expect(rollingWinPct([])).toEqual([]);
  });
  it("computes a rolling window in chronological order", () => {
    const games = [
      g({ playedAt: 1, result: "W" }),
      g({ playedAt: 2, result: "L" }),
      g({ playedAt: 3, result: "W" }),
    ];
    const out = rollingWinPct(games, 2);
    expect(out).toEqual([
      { x: 1, y: 1 }, // [W] => 1/1
      { x: 2, y: 0.5 }, // [W,L] => 1/2
      { x: 3, y: 0.5 }, // [L,W] => 1/2
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/jackschwartz/elgyem-control-tracker && pnpm test src/lib/stats.test.ts`
Expected: FAIL — cannot resolve `./stats`.

- [ ] **Step 3: Implement `stats.ts`**

Create `src/lib/stats.ts`:
```ts
import type { Game } from "@/db/schema";

/** Win rate over a set of games, or null when there is no sample. Ties count in the denominator. */
export function winPct(games: Game[]): number | null {
  if (games.length === 0) return null;
  return games.filter((x) => x.result === "W").length / games.length;
}

/** Win rate over the most recent N games by playedAt, or null when empty. */
export function lastNWinPct(games: Game[], n: number): number | null {
  const sorted = [...games].sort((a, b) => b.playedAt - a.playedAt).slice(0, n);
  if (sorted.length === 0) return null;
  return sorted.filter((x) => x.result === "W").length / sorted.length;
}

/** Rolling win rate over a trailing window, chronological. x is 1-based game index. */
export function rollingWinPct(games: Game[], window = 10): { x: number; y: number }[] {
  const sorted = [...games].sort((a, b) => a.playedAt - b.playedAt);
  return sorted.map((_, i) => {
    const slice = sorted.slice(Math.max(0, i - window + 1), i + 1);
    return { x: i + 1, y: slice.filter((s) => s.result === "W").length / slice.length };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/jackschwartz/elgyem-control-tracker && pnpm test src/lib/stats.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stats.ts src/lib/stats.test.ts && git commit -m "feat(stats): winPct, lastNWinPct, rollingWinPct (TDD)"
```

---

### Task 7: Match-ID helpers (TDD)

**Files:**
- Create: `src/lib/match-id.ts`, `src/lib/match-id.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/match-id.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { slugifyEvent, dateStamp, buildMatchId } from "./match-id";

describe("slugifyEvent", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyEvent("League Cup")).toBe("league-cup");
  });
  it("strips punctuation and collapses separators", () => {
    expect(slugifyEvent("Online — Tournament!")).toBe("online-tournament");
  });
});

describe("dateStamp", () => {
  it("formats a local YYYYMMDD", () => {
    const ms = new Date(2026, 4, 25, 9, 0, 0).getTime(); // 2026-05-25 local
    expect(dateStamp(ms)).toBe("20260525");
  });
});

describe("buildMatchId", () => {
  it("joins slug, date, and counter", () => {
    const ms = new Date(2026, 4, 25, 9, 0, 0).getTime();
    expect(buildMatchId("League Cup", ms, 2)).toBe("league-cup-20260525-2");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /Users/jackschwartz/elgyem-control-tracker && pnpm test src/lib/match-id.test.ts`
Expected: FAIL — cannot resolve `./match-id`.

- [ ] **Step 3: Implement `match-id.ts`**

Create `src/lib/match-id.ts`:
```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /Users/jackschwartz/elgyem-control-tracker && pnpm test src/lib/match-id.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/match-id.ts src/lib/match-id.test.ts && git commit -m "feat(match-id): slug/dateStamp/buildMatchId helpers (TDD)"
```

---

### Task 8: Games repository with in-memory integration test

**Files:**
- Create: `src/db/games-repo.ts`, `src/db/test-helpers.ts`, `src/db/games-repo.test.ts`

- [ ] **Step 1: Create the in-memory test-db helper**

Create `src/db/test-helpers.ts`:
```ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import type { DB } from "./client";

/** Fresh in-memory DB with all migrations applied. */
export function makeTestDb(): DB {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "./drizzle" });
  return db;
}
```

- [ ] **Step 2: Write the failing repo tests**

Create `src/db/games-repo.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { makeTestDb } from "./test-helpers";
import { createGame, listGames, nextMatchNumber, type CreateGameInput } from "./games-repo";
import type { DB } from "./client";

let db: DB;
beforeEach(() => {
  db = makeTestDb();
});

const base: CreateGameInput = {
  event: "Locals",
  format: "BO1",
  opponentDeck: "Charizard ex",
  going: "1st",
  result: "W",
  myMulligans: 0,
  oppMulligans: 0,
  playedAt: new Date(2026, 4, 25, 10, 0, 0).getTime(),
  newMatch: true,
};

describe("createGame + listGames", () => {
  it("persists a game and reads it back", () => {
    const created = createGame(db, base);
    expect(created.id).toMatch(/[0-9a-f-]{36}/);
    expect(created.matchId).toBe("locals-20260525-1");
    const all = listGames(db);
    expect(all).toHaveLength(1);
    expect(all[0].opponentDeck).toBe("Charizard ex");
  });

  it("orders listGames by playedAt descending", () => {
    createGame(db, { ...base, playedAt: 1000, opponentDeck: "A" });
    createGame(db, { ...base, playedAt: 5000, opponentDeck: "B" });
    const all = listGames(db);
    expect(all.map((x) => x.opponentDeck)).toEqual(["B", "A"]);
  });
});

describe("nextMatchNumber + match grouping", () => {
  it("starts at 1 for a new event-day", () => {
    expect(nextMatchNumber(db, "Locals", base.playedAt)).toBe(1);
  });

  it("increments only when newMatch is requested", () => {
    const a = createGame(db, { ...base, newMatch: true }); // match 1, game 1
    const b = createGame(db, { ...base, newMatch: false, matchId: a.matchId, gameNumber: 2 });
    expect(b.matchId).toBe(a.matchId); // same match
    const c = createGame(db, { ...base, newMatch: true }); // match 2
    expect(c.matchId).toBe("locals-20260525-2");
  });

  it("does not collide across two same-day matches", () => {
    const m1 = createGame(db, { ...base, newMatch: true });
    const m2 = createGame(db, { ...base, newMatch: true });
    expect(m1.matchId).not.toBe(m2.matchId);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `cd /Users/jackschwartz/elgyem-control-tracker && pnpm test src/db/games-repo.test.ts`
Expected: FAIL — cannot resolve `./games-repo`.

- [ ] **Step 4: Implement the repository**

Create `src/db/games-repo.ts`:
```ts
import { desc, like } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import type { DB } from "./client";
import { games, type Game } from "./schema";
import { buildMatchId, dateStamp, slugifyEvent } from "@/lib/match-id";

export interface CreateGameInput {
  event: string;
  format: string; // "BO1" | "BO3"
  opponentDeck: string;
  going: string; // "1st" | "2nd"
  result: string; // "W" | "L" | "T"
  myMulligans: number;
  oppMulligans: number;
  playedAt: number;
  handQuality?: number | null;
  opponentName?: string | null;
  round?: number | null;
  gameNumber?: number;
  /** When true, start a new match (bump the per-day counter). */
  newMatch?: boolean;
  /** When continuing an existing match (game 2/3), pass its matchId. */
  matchId?: string;
}

export function listGames(db: DB): Game[] {
  return db.select().from(games).orderBy(desc(games.playedAt)).all();
}

/** Next per-day match counter for an event: max existing N + 1. */
export function nextMatchNumber(db: DB, event: string, playedAt: number): number {
  const prefix = `${slugifyEvent(event)}-${dateStamp(playedAt)}-`;
  const rows = db
    .select({ matchId: games.matchId })
    .from(games)
    .where(like(games.matchId, `${prefix}%`))
    .all();
  let max = 0;
  for (const r of rows) {
    const n = Number.parseInt(r.matchId.slice(prefix.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

export function createGame(db: DB, input: CreateGameInput): Game {
  const now = Date.now();
  const matchId =
    !input.newMatch && input.matchId
      ? input.matchId
      : buildMatchId(input.event, input.playedAt, nextMatchNumber(db, input.event, input.playedAt));

  const row = {
    id: uuidv7(),
    matchId,
    gameNumber: input.gameNumber ?? 1,
    playedAt: input.playedAt,
    event: input.event,
    format: input.format,
    opponentDeck: input.opponentDeck,
    opponentName: input.opponentName ?? null,
    tournamentId: null,
    round: input.round ?? null,
    coinFlip: null,
    going: input.going,
    myMulligans: input.myMulligans,
    oppMulligans: input.oppMulligans,
    handQuality: input.handQuality ?? null,
    prizeTrade: null,
    turnCount: null,
    timeUsedMin: null,
    lockTurn: null,
    keyCardsDrawn: null,
    techCardsUsed: null,
    prizedCards: null,
    result: input.result,
    mistakes: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(games).values(row).run();
  return row;
}
```

- [ ] **Step 5: Run to verify pass**

Run: `cd /Users/jackschwartz/elgyem-control-tracker && pnpm test src/db/games-repo.test.ts`
Expected: PASS, all cases.

- [ ] **Step 6: Commit**

```bash
git add src/db/games-repo.ts src/db/test-helpers.ts src/db/games-repo.test.ts
git commit -m "feat(db): games repository (create/list/nextMatchNumber) + in-memory tests"
```

---

### Task 9: Enums + Server Action for logging a game

**Files:**
- Create: `src/lib/enums.ts`, `src/app/games/actions.ts`

- [ ] **Step 1: Create the enums module**

Create `src/lib/enums.ts` (from spec §3.1; trimmed to what the slice uses + full opponent list):
```ts
export const EVENTS = [
  "Locals", "League Cup", "League Challenge", "Regional", "International",
  "Online Ladder", "Online Tournament", "Testing", "Playtest",
] as const;

export const OPPONENT_DECKS = [
  "Charizard ex", "Gardevoir ex", "Dragapult ex", "Raging Bolt ex", "Roaring Moon ex",
  "Lugia VSTAR", "Lost Box", "Snorlax Stall", "Pidgeot Control", "Miraidon ex",
  "Hydrapple ex", "Joltik Box", "N's Zoroark ex", "Iron Thorns ex", "Iron Crown ex",
  "Klawf", "Terapagos ex", "Gholdengo ex", "Ceruledge ex", "Ho-Oh ex", "Mew VMAX",
  "Regidrago VSTAR", "Other / Rogue", "Mirror (Elgyem Control)",
] as const;

export const FORMATS = ["BO1", "BO3"] as const;
export const GOINGS = ["1st", "2nd"] as const;
export const RESULTS = ["W", "L", "T"] as const;
```

- [ ] **Step 2: Create the Server Action with Zod validation**

Create `src/app/games/actions.ts`:
```ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { createGame } from "@/db/games-repo";

const schema = z.object({
  event: z.string().min(1),
  format: z.enum(["BO1", "BO3"]),
  opponentDeck: z.string().min(1),
  going: z.enum(["1st", "2nd"]),
  result: z.enum(["W", "L", "T"]),
  myMulligans: z.coerce.number().int().min(0).max(20),
  oppMulligans: z.coerce.number().int().min(0).max(20),
  handQuality: z.coerce.number().int().min(1).max(5).optional(),
  playedAt: z.coerce.number().int().positive(),
});

export type AddGameResult = { ok: true } | { ok: false; error: string };

export async function addGameAction(_prev: AddGameResult | null, formData: FormData): Promise<AddGameResult> {
  const raw = {
    event: formData.get("event"),
    format: formData.get("format"),
    opponentDeck: formData.get("opponentDeck"),
    going: formData.get("going"),
    result: formData.get("result"),
    myMulligans: formData.get("myMulligans"),
    oppMulligans: formData.get("oppMulligans"),
    handQuality: formData.get("handQuality") || undefined,
    playedAt: formData.get("playedAt"),
  };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  createGame(db, { ...parsed.data, newMatch: true });
  revalidatePath("/");
  revalidatePath("/games");
  return { ok: true };
}
```

- [ ] **Step 3: Typecheck**

Run: `cd /Users/jackschwartz/elgyem-control-tracker && pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/enums.ts src/app/games/actions.ts && git commit -m "feat(games): enums + addGame server action with zod validation"
```

---

### Task 10: App shell — nav + page header primitives

**Files:**
- Create: `src/components/nav.tsx`, `src/components/page-header.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create the sidebar/bottom nav**

Create `src/components/nav.tsx`:
```tsx
import Link from "next/link";
import { LayoutDashboard, ScrollText } from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/games", label: "Games", icon: ScrollText },
];

export function Nav() {
  return (
    <nav className="flex gap-1 border-b border-p-border bg-p-surface px-4 py-2 sm:flex-col sm:gap-2 sm:border-b-0 sm:border-r sm:px-3 sm:py-4">
      <span className="hidden px-2 pb-2 font-mono text-xs font-semibold text-p-primary sm:block">
        ELGYEM CONTROL
      </span>
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-p-muted hover:bg-p-kpi-bg hover:text-p-title"
        >
          <Icon size={18} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Create a reusable page header**

Create `src/components/page-header.tsx`:
```tsx
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-semibold leading-tight text-p-title">{title}</h1>
        {subtitle && <p className="text-sm text-p-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
```

- [ ] **Step 3: Add the nav shell to the layout**

In `src/app/layout.tsx`, import the nav and wrap children. Replace the `<body>` line:
```tsx
import { Nav } from "@/components/nav";
```
and the body:
```tsx
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col sm:flex-row">
          <Nav />
          <main className="flex-1 p-4 sm:p-8">{children}</main>
        </div>
      </body>
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(ui): app shell — nav + page header"
```

---

### Task 11: `/games` — table + quick-add modal (with RTL test)

**Files:**
- Create: `src/components/log-game-modal.tsx`, `src/components/log-game-modal.test.tsx`, `src/app/games/page.tsx`

- [ ] **Step 1: Build the client modal**

Create `src/components/log-game-modal.tsx`:
```tsx
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { addGameAction, type AddGameResult } from "@/app/games/actions";
import { EVENTS, OPPONENT_DECKS, FORMATS, GOINGS, RESULTS } from "@/lib/enums";

function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function LogGameModal() {
  const [open, setOpen] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<AddGameResult | null, FormData>(
    addGameAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "n" && !open && (e.target as HTMLElement)?.tagName !== "INPUT") setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function handleSubmit(formData: FormData) {
    const myM = Number(formData.get("myMulligans"));
    const oppM = Number(formData.get("oppMulligans"));
    if (myM < 0 || myM > 20 || oppM < 0 || oppM > 20 || Number.isNaN(myM) || Number.isNaN(oppM)) {
      setClientError("Mulligans must be between 0 and 20.");
      return;
    }
    const dateStr = String(formData.get("date"));
    formData.set("playedAt", String(new Date(`${dateStr}T12:00:00`).getTime()));
    setClientError(null);
    formAction(formData);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-p-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus size={16} /> Log game
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Log game"
            className="max-h-[90vh] w-full max-w-[600px] overflow-y-auto rounded-xl bg-p-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-p-title">Log a game</h2>
            <form ref={formRef} action={handleSubmit} className="grid grid-cols-2 gap-3">
              <label className="col-span-1 text-sm">
                Date
                <input
                  type="date"
                  name="date"
                  defaultValue={todayLocalDate()}
                  required
                  className="mt-1 w-full rounded-md border border-p-border px-2 py-1.5"
                />
              </label>
              <label className="col-span-1 text-sm">
                Event
                <select name="event" required className="mt-1 w-full rounded-md border border-p-border px-2 py-1.5">
                  {EVENTS.map((e) => (<option key={e}>{e}</option>))}
                </select>
              </label>
              <label className="col-span-1 text-sm">
                Format
                <select name="format" required className="mt-1 w-full rounded-md border border-p-border px-2 py-1.5">
                  {FORMATS.map((f) => (<option key={f}>{f}</option>))}
                </select>
              </label>
              <label className="col-span-1 text-sm">
                Opponent deck
                <select name="opponentDeck" required className="mt-1 w-full rounded-md border border-p-border px-2 py-1.5">
                  {OPPONENT_DECKS.map((o) => (<option key={o}>{o}</option>))}
                </select>
              </label>
              <label className="col-span-1 text-sm">
                Going
                <select name="going" required className="mt-1 w-full rounded-md border border-p-border px-2 py-1.5">
                  {GOINGS.map((x) => (<option key={x}>{x}</option>))}
                </select>
              </label>
              <label className="col-span-1 text-sm">
                Hand quality (1–5)
                <input type="number" name="handQuality" min={1} max={5} className="mt-1 w-full rounded-md border border-p-border px-2 py-1.5" />
              </label>
              <label className="col-span-1 text-sm">
                My mulligans
                <input type="number" name="myMulligans" min={0} max={20} defaultValue={0} required className="mt-1 w-full rounded-md border border-p-border px-2 py-1.5" />
              </label>
              <label className="col-span-1 text-sm">
                Opp mulligans
                <input type="number" name="oppMulligans" min={0} max={20} defaultValue={0} required className="mt-1 w-full rounded-md border border-p-border px-2 py-1.5" />
              </label>
              <fieldset className="col-span-2">
                <legend className="text-sm">Result</legend>
                <div className="mt-1 flex gap-2">
                  {RESULTS.map((r, i) => (
                    <label key={r} className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border border-p-border py-2 text-sm has-[:checked]:border-p-primary has-[:checked]:bg-p-kpi-bg">
                      <input type="radio" name="result" value={r} required defaultChecked={i === 0} className="sr-only" />
                      {r === "W" ? "Win" : r === "L" ? "Loss" : "Tie"}
                    </label>
                  ))}
                </div>
              </fieldset>

              {(clientError || (state && !state.ok)) && (
                <p role="alert" className="col-span-2 text-sm text-p-bad">
                  {clientError ?? (state && !state.ok ? state.error : "")}
                </p>
              )}

              <div className="col-span-2 mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-p-muted hover:bg-p-kpi-bg">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="rounded-lg bg-p-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
                  {pending ? "Saving…" : "Save game"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Write the modal component test (failing first)**

Create `src/components/log-game-modal.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// The action touches the DB; stub it so the component test stays a unit test.
vi.mock("@/app/games/actions", () => ({ addGameAction: vi.fn(async () => ({ ok: true })) }));

import { LogGameModal } from "./log-game-modal";
import { addGameAction } from "@/app/games/actions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LogGameModal", () => {
  it("opens when the trigger is clicked", () => {
    render(<LogGameModal />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /log game/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("blocks submit and shows an error when mulligans are out of range", () => {
    render(<LogGameModal />);
    fireEvent.click(screen.getByRole("button", { name: /log game/i }));
    fireEvent.change(screen.getByLabelText(/my mulligans/i), { target: { value: "25" } });
    fireEvent.click(screen.getByRole("button", { name: /save game/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/between 0 and 20/i);
    expect(addGameAction).not.toHaveBeenCalled();
  });

  it("calls the action with valid input", () => {
    render(<LogGameModal />);
    fireEvent.click(screen.getByRole("button", { name: /log game/i }));
    fireEvent.click(screen.getByRole("button", { name: /save game/i }));
    expect(addGameAction).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: Run the test to verify pass**

Run: `cd /Users/jackschwartz/elgyem-control-tracker && pnpm test src/components/log-game-modal.test.tsx`
Expected: PASS (the component already exists from Step 1, so these pass immediately; if any fail, fix the component, not the test).

- [ ] **Step 4: Build the `/games` page (server component, table + empty state)**

Create `src/app/games/page.tsx`:
```tsx
import { db } from "@/db/client";
import { listGames } from "@/db/games-repo";
import { PageHeader } from "@/components/page-header";
import { LogGameModal } from "@/components/log-game-modal";

const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function GamesPage() {
  const games = listGames(db);

  return (
    <div>
      <PageHeader title="Games" subtitle="Match log" actions={<LogGameModal />} />
      {games.length === 0 ? (
        <div className="rounded-xl border border-dashed border-p-border bg-p-surface p-12 text-center">
          <p className="text-p-muted">No games logged yet.</p>
          <p className="mt-1 text-sm text-p-muted">Hit “Log game” (or press <kbd className="font-mono">n</kbd>) to add your first.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-p-border bg-p-surface">
          <table className="w-full text-sm">
            <thead className="bg-p-kpi-bg text-left text-p-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Opponent</th>
                <th className="px-3 py-2 font-medium">Fmt</th>
                <th className="px-3 py-2 font-medium">Going</th>
                <th className="px-3 py-2 font-medium">Hand-Q</th>
                <th className="px-3 py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g, i) => (
                <tr key={g.id} className={i % 2 ? "bg-p-bg/40" : ""}>
                  <td className="px-3 py-2">{fmtDate(g.playedAt)}</td>
                  <td className="px-3 py-2">{g.opponentDeck}</td>
                  <td className="px-3 py-2 font-mono text-xs">{g.format}</td>
                  <td className="px-3 py-2">{g.going}</td>
                  <td className="px-3 py-2">{g.handQuality ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        "rounded px-2 py-0.5 text-xs font-semibold " +
                        (g.result === "W"
                          ? "bg-p-good/15 text-p-good"
                          : g.result === "L"
                            ? "bg-p-bad/15 text-p-bad"
                            : "bg-p-warn/15 text-p-warn")
                      }
                    >
                      {g.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(games): /games table + quick-add modal (RTL-tested)"
```

---

### Task 12: `/` dashboard — 3 KPIs + rolling win-rate chart

**Files:**
- Create: `src/components/kpi-tile.tsx`, `src/components/win-rate-chart.tsx`, `src/app/page.tsx`

- [ ] **Step 1: KPI tile with honest empty state**

Create `src/components/kpi-tile.tsx`:
```tsx
export function KpiTile({ label, value }: { label: string; value: string | null }) {
  const empty = value === null;
  return (
    <div
      className={
        "rounded-2xl border-t-2 p-4 " +
        (empty ? "border-t-p-border bg-p-surface" : "border-t-p-accent bg-p-kpi-bg")
      }
    >
      <div className="text-xs font-medium uppercase tracking-wide text-p-muted">{label}</div>
      <div className={"mt-1 text-3xl font-semibold " + (empty ? "text-p-border" : "text-p-title")}>
        {empty ? "—" : value}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rolling win-rate line chart (client)**

Create `src/components/win-rate-chart.tsx`:
```tsx
"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function WinRateChart({ data }: { data: { x: number; y: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-p-border bg-p-surface text-sm text-p-muted">
        No games yet — your rolling win rate will appear here.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-p-border bg-p-surface p-4">
      <h3 className="mb-2 text-sm font-medium text-p-title">Rolling win rate (last 10)</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <XAxis dataKey="x" stroke="#6B5DA0" fontSize={12} />
          <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} stroke="#6B5DA0" fontSize={12} />
          <Tooltip formatter={(v: number) => `${Math.round(v * 100)}%`} labelFormatter={(l) => `Game ${l}`} />
          <Line type="monotone" dataKey="y" stroke="#5E3FBD" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 3: Dashboard page wiring stats → tiles + chart**

Create `src/app/page.tsx`:
```tsx
import { db } from "@/db/client";
import { listGames } from "@/db/games-repo";
import { winPct, lastNWinPct, rollingWinPct } from "@/lib/stats";
import { PageHeader } from "@/components/page-header";
import { KpiTile } from "@/components/kpi-tile";
import { WinRateChart } from "@/components/win-rate-chart";

const pct = (v: number | null) => (v === null ? null : `${Math.round(v * 100)}%`);

export default function DashboardPage() {
  const games = listGames(db);
  const total = games.length;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your Elgyem control deck, at a glance" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiTile label="Total games" value={total === 0 ? null : String(total)} />
        <KpiTile label="Win %" value={pct(winPct(games))} />
        <KpiTile label="Last 10 W%" value={pct(lastNWinPct(games, 10))} />
      </div>
      <div className="mt-6">
        <WinRateChart data={rollingWinPct(games, 10)} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(dashboard): 3 KPI tiles + rolling win-rate chart with empty states"
```

---

### Task 13: Full verification + production-build smoke

**Files:** none (verification only)

- [ ] **Step 1: Run the whole test suite**

Run: `cd /Users/jackschwartz/elgyem-control-tracker && pnpm test`
Expected: all suites PASS (stats, match-id, games-repo, log-game-modal).

- [ ] **Step 2: Typecheck + lint**

Run: `cd /Users/jackschwartz/elgyem-control-tracker && pnpm exec tsc --noEmit && pnpm lint`
Expected: no type errors; lint clean (fix any warnings).

- [ ] **Step 3: Production build**

Run: `cd /Users/jackschwartz/elgyem-control-tracker && pnpm build`
Expected: build succeeds, `/` and `/games` compiled, no errors. (better-sqlite3 stays external.)

- [ ] **Step 4: Manual end-to-end check**

Run: `cd /Users/jackschwartz/elgyem-control-tracker && pnpm dev --port 3000`
Then in a browser: open `http://localhost:3000` (empty-state KPIs show “—”), go to `/games`, click **Log game**, submit one game, confirm it appears in the table and that the dashboard’s Total/Win% update. Stop the server.

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "chore: foundation + first slice verified (tests, typecheck, build green)" --allow-empty
```

---

## Self-Review

**Spec coverage (this plan = Slice 0 + Slice 1 only):**
- Toolchain/stack (§2/§7 of design) → Tasks 1–3. ✓
- `games` schema incl. additions + `match_id` scheme (§3/§4 of design) → Tasks 4, 7, 8. ✓
- Local SQLite persistence, server-only (§7) → Tasks 4, 5; `serverExternalPackages` in Task 1. ✓
- Stats returning null on empty samples (§6, "honest empty states") → Task 6 + KPI "—" in Task 12. ✓
- Log a game fast via modal (Goal #1) → Tasks 9, 11; `n` shortcut + sensible date default. ✓
- Auto-updating dashboard (Goal #2) → `revalidatePath` in Task 9; dashboard reads live in Task 12. ✓
- Mulligan validation (§9 component-test requirement) → Task 11 RTL test + server Zod in Task 9. ✓
- Visual system tokens (§5) → Task 2 palette; tiles/tables/modal use them. ✓
- **Deferred to later plans (intentionally):** full modal fields, prized-cards chip select, decklist + card images, all 12 KPIs, per-opponent table, BO3 match aggregation, iterations/prizes/tournaments/settings, xlsx import, stretch features. Tracked in design §8–§9.

**Placeholder scan:** none — every code step contains complete code; every command has expected output.

**Type consistency:** `Game` type from `@/db/schema` used uniformly; `createGame(db, input)`/`listGames(db)`/`nextMatchNumber(db, …)` signatures match across repo, tests, and action; `AddGameResult` shape matches between action and modal; enum names (`EVENTS`/`OPPONENT_DECKS`/`FORMATS`/`GOINGS`/`RESULTS`) consistent between `enums.ts`, the action, and the modal.

**Known environment risk:** Node 26 (current, not LTS). If `better-sqlite3` fails to load against the Node 26 ABI, rebuild from source (`pnpm rebuild better-sqlite3`, CLT present) or pin LTS via `brew install node@24` — per design §2.
