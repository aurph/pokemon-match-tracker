"use client";

import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import type { DeckCard } from "@/db/schema";
import { ROLES } from "@/lib/enums";
import { categoryBadge } from "@/lib/deck-sections";
import { updateDeckCardAction, type UpdateDeckCardInput } from "@/app/decklist/actions";

const clampCount = (n: number) => Math.max(0, Math.min(60, n));

export function DeckCardRow({ card }: { card: DeckCard }) {
  const [count, setCount] = useState(card.count);
  const [role, setRole] = useState(card.role ?? "");
  const [notes, setNotes] = useState(card.notes ?? "");
  const [pending, startTransition] = useTransition();

  function persist(patch: UpdateDeckCardInput, revert: () => void) {
    startTransition(async () => {
      const res = await updateDeckCardAction(card.id, patch);
      if (!res.ok) revert();
    });
  }

  function setCountTo(next: number) {
    const clamped = clampCount(next);
    if (clamped === count) return;
    const prev = count;
    setCount(clamped);
    persist({ count: clamped }, () => setCount(prev));
  }

  function onRoleChange(value: string) {
    const prev = role;
    setRole(value);
    persist({ role: value }, () => setRole(prev));
  }

  function onNotesBlur() {
    const trimmed = notes.trim();
    if (trimmed === (card.notes ?? "")) return;
    persist({ notes: trimmed }, () => setNotes(card.notes ?? ""));
  }

  return (
    <div
      className={
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg px-2 py-2 transition-colors hover:bg-p-kpi-bg/50 " +
        (count === 0 ? "opacity-50" : "")
      }
      aria-busy={pending}
    >
      {card.imageLocalPath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.imageLocalPath}
          alt={card.name}
          className="h-12 w-auto shrink-0 rounded-md border border-p-border bg-p-bg object-contain"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-12 w-9 shrink-0 items-center justify-center rounded-md border border-dashed border-p-border bg-p-bg text-[10px] text-p-muted"
        >
          ?
        </div>
      )}

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setCountTo(count - 1)}
          disabled={count <= 0}
          aria-label={`Decrease ${card.name}`}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-p-border text-p-muted hover:bg-p-surface hover:text-p-title disabled:opacity-40"
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center font-mono text-sm font-semibold text-p-title" aria-live="polite">
          {count}
        </span>
        <button
          type="button"
          onClick={() => setCountTo(count + 1)}
          disabled={count >= 60}
          aria-label={`Increase ${card.name}`}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-p-border text-p-muted hover:bg-p-surface hover:text-p-title disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="min-w-[8rem] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-p-title">{card.name}</span>
          <span className="rounded-full bg-p-kpi-bg px-2 py-0.5 text-[11px] font-medium text-p-primary">
            {categoryBadge(card.category)}
          </span>
        </div>
        <span className="font-mono text-xs text-p-muted">
          {card.setCode} · {card.setNumber}
        </span>
      </div>

      <select
        value={role}
        onChange={(e) => onRoleChange(e.target.value)}
        aria-label={`Role for ${card.name}`}
        className="w-36 shrink-0 rounded-md border border-p-border bg-p-surface px-2 py-1.5 text-xs text-p-title"
      >
        <option value="">—</option>
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={onNotesBlur}
        placeholder="Notes…"
        aria-label={`Notes for ${card.name}`}
        className="w-full min-w-[8rem] flex-1 rounded-md border border-p-border bg-p-surface px-2 py-1.5 text-xs text-p-title placeholder:text-p-muted/60 sm:w-auto"
      />
    </div>
  );
}
