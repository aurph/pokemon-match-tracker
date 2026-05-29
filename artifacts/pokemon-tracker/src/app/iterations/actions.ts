"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { createIteration } from "@/db/iterations-repo";

export type ActionResult = { ok: true } | { ok: false; error: string };

const splitList = (s: string) =>
  s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);

export async function addIterationAction(formData: FormData): Promise<ActionResult> {
  const version = String(formData.get("version") ?? "").trim();
  if (!version) return { ok: false, error: "Version is required (e.g. v1.1)" };
  const dateStr = String(formData.get("date") ?? "");
  const dated = dateStr ? new Date(`${dateStr}T12:00:00`).getTime() : Date.now();
  createIteration(db, {
    dated,
    version,
    cardsIn: splitList(String(formData.get("cardsIn") ?? "")),
    cardsOut: splitList(String(formData.get("cardsOut") ?? "")),
    reasoning: String(formData.get("reasoning") ?? "") || null,
    testedVs: String(formData.get("testedVs") ?? "") || null,
    verdict: String(formData.get("verdict") ?? "") || null,
  });
  revalidatePath("/iterations");
  return { ok: true };
}
