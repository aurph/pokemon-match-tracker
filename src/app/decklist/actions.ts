"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { updateDeckCard } from "@/db/deck-cards-repo";

const patchSchema = z
  .object({
    count: z.coerce.number().int().min(0).max(60).optional(),
    role: z.string().max(60).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine((p) => p.count !== undefined || p.role !== undefined || p.notes !== undefined, {
    message: "Nothing to update",
  });

export type UpdateDeckCardInput = z.input<typeof patchSchema>;
export type UpdateDeckCardResult = { ok: true } | { ok: false; error: string };

export async function updateDeckCardAction(
  id: string,
  patch: UpdateDeckCardInput,
): Promise<UpdateDeckCardResult> {
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "Missing card id" };
  }
  const parsed = patchSchema.safeParse(patch);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  // Normalize empty strings to null so "—" role / cleared notes persist as NULL.
  const normalized = {
    ...parsed.data,
    role: parsed.data.role === "" ? null : parsed.data.role,
    notes: parsed.data.notes === "" ? null : parsed.data.notes,
  };
  updateDeckCard(db, id, normalized);
  revalidatePath("/decklist");
  return { ok: true };
}
