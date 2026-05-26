"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import {
  createGame,
  updateGame,
  deleteGame,
  addCustomOpponentDeck,
  type GameFields,
} from "@/db/games-repo";

export type ActionResult = { ok: true } | { ok: false; error: string };

const emptyToNull = (v: unknown) => (v === "" || v == null ? null : v);
const optInt = (min: number, max: number) =>
  z.preprocess(emptyToNull, z.coerce.number().int().min(min).max(max).nullable());
const optStr = z.preprocess(emptyToNull, z.string().nullable());

const gameSchema = z.object({
  event: z.string().min(1),
  format: z.enum(["BO1", "BO3"]),
  opponentDeck: z.string().min(1),
  opponentName: optStr,
  round: optInt(1, 50),
  going: z.enum(["1st", "2nd"]),
  coinFlip: z.preprocess(emptyToNull, z.enum(["won", "lost"]).nullable()),
  result: z.enum(["W", "L", "T"]),
  myMulligans: z.coerce.number().int().min(0).max(20),
  oppMulligans: z.coerce.number().int().min(0).max(20),
  handQuality: optInt(1, 5),
  turnCount: optInt(0, 200),
  timeUsedMin: optInt(0, 180),
  lockTurn: optInt(0, 100),
  prizeTrade: optStr,
  keyCardsDrawn: optStr,
  techCardsUsed: optStr,
  mistakes: optStr,
  notes: optStr,
  playedAt: z.coerce.number().int().positive(),
  prizedCards: z.preprocess((v) => {
    try {
      return JSON.parse(String(v ?? "[]"));
    } catch {
      return [];
    }
  }, z.array(z.string())),
});

const FORM_KEYS = [
  "event",
  "format",
  "opponentDeck",
  "opponentName",
  "round",
  "going",
  "coinFlip",
  "result",
  "myMulligans",
  "oppMulligans",
  "handQuality",
  "turnCount",
  "timeUsedMin",
  "lockTurn",
  "prizeTrade",
  "keyCardsDrawn",
  "techCardsUsed",
  "mistakes",
  "notes",
  "playedAt",
  "prizedCards",
] as const;

function parse(formData: FormData) {
  const obj: Record<string, unknown> = {};
  for (const key of FORM_KEYS) obj[key] = formData.get(key);
  return gameSchema.safeParse(obj);
}

export async function addGameAction(formData: FormData): Promise<ActionResult> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const newMatch = formData.get("newMatch") !== "false";
  const matchId = (formData.get("matchId") as string) || undefined;
  const gameNumber = formData.get("gameNumber") ? Number(formData.get("gameNumber")) : undefined;
  createGame(db, { ...(parsed.data as GameFields), newMatch, matchId, gameNumber });
  revalidatePath("/");
  revalidatePath("/games");
  return { ok: true };
}

export async function updateGameAction(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing game id" };
  const parsed = parse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  updateGame(db, id, parsed.data as Partial<GameFields>);
  revalidatePath("/");
  revalidatePath("/games");
  return { ok: true };
}

export async function deleteGameAction(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing game id" };
  deleteGame(db, id);
  revalidatePath("/");
  revalidatePath("/games");
  return { ok: true };
}

export async function addCustomOpponentDeckAction(name: string): Promise<ActionResult> {
  if (!name.trim()) return { ok: false, error: "Empty name" };
  addCustomOpponentDeck(db, name);
  revalidatePath("/games");
  return { ok: true };
}
