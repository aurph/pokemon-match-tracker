"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { addIterationAction } from "@/app/iterations/actions";

const VERDICTS = ["keep", "revert", "iterate", "pending", "mixed"];
const field =
  "mt-1 w-full rounded-md border-2 border-p-border bg-p-surface px-2 py-1.5 text-sm text-p-title focus:border-p-primary focus:outline-none";
const label = "text-xs font-medium uppercase tracking-wide text-p-muted";

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function IterationForm() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    const res = await addIterationAction(new FormData(form));
    setPending(false);
    if (res.ok) {
      form.reset();
      setShow(false);
      setError(null);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-2 rounded-md bg-p-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus size={16} /> Add change
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border-2 border-p-title bg-p-surface p-4 shadow-pixel-sm"
    >
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Version
          <input name="version" placeholder="v1.1" required className={field} />
        </label>
        <label className={label}>
          Date
          <input type="date" name="date" defaultValue={today()} className={field} />
        </label>
        <label className={label}>
          Cards in (comma-separated)
          <input name="cardsIn" placeholder="2 Iono" className={field} />
        </label>
        <label className={label}>
          Cards out
          <input name="cardsOut" placeholder="1 Budew, 1 Battle Cage" className={field} />
        </label>
        <label className={label}>
          Verdict
          <select name="verdict" defaultValue="pending" className={field}>
            {VERDICTS.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          Tested vs (comma-separated)
          <input name="testedVs" placeholder="Charizard ex, Gardevoir ex" className={field} />
        </label>
      </div>
      <label className={`${label} block`}>
        Reasoning
        <textarea name="reasoning" rows={2} className={field} />
      </label>
      {error && (
        <p role="alert" className="text-sm text-p-bad">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setShow(false)}
          className="rounded-md px-3 py-1.5 text-sm text-p-muted hover:bg-p-kpi-bg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-p-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save change"}
        </button>
      </div>
    </form>
  );
}
