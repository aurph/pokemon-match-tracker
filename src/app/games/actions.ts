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

export async function addGameAction(
  _prev: AddGameResult | null,
  formData: FormData,
): Promise<AddGameResult> {
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
