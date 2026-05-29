import { desc } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import type { DB } from "./client";
import { iterations, type Iteration } from "./schema";

export interface IterationInput {
  dated: number;
  version: string;
  cardsIn?: string[] | null;
  cardsOut?: string[] | null;
  reasoning?: string | null;
  testedVs?: string | null;
  verdict?: string | null;
}

export function listIterations(db: DB): Iteration[] {
  return db
    .select()
    .from(iterations)
    .orderBy(desc(iterations.dated), desc(iterations.createdAt))
    .all();
}

export function createIteration(db: DB, input: IterationInput): Iteration {
  const row: Iteration = {
    id: uuidv7(),
    dated: input.dated,
    version: input.version,
    cardsIn: input.cardsIn && input.cardsIn.length ? JSON.stringify(input.cardsIn) : null,
    cardsOut: input.cardsOut && input.cardsOut.length ? JSON.stringify(input.cardsOut) : null,
    reasoning: input.reasoning ?? null,
    testedVs: input.testedVs ?? null,
    verdict: input.verdict ?? null,
    createdAt: Date.now(),
  };
  db.insert(iterations).values(row).run();
  return row;
}
