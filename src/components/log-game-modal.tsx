"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { addGameAction } from "@/app/games/actions";
import { EVENTS, OPPONENT_DECKS, FORMATS, GOINGS, RESULTS } from "@/lib/enums";

function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const fieldClass = "mt-1 w-full rounded-md border border-p-border bg-p-surface px-2 py-1.5 text-sm";

export function LogGameModal() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "Escape") setOpen(false);
      if (e.key === "n" && !open && tag !== "INPUT" && tag !== "SELECT" && tag !== "TEXTAREA") {
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const myM = Number(formData.get("myMulligans"));
    const oppM = Number(formData.get("oppMulligans"));
    if (Number.isNaN(myM) || Number.isNaN(oppM) || myM < 0 || myM > 20 || oppM < 0 || oppM > 20) {
      setError("Mulligans must be between 0 and 20.");
      return;
    }
    const dateStr = String(formData.get("date"));
    formData.set("playedAt", String(new Date(`${dateStr}T12:00:00`).getTime()));
    setError(null);
    setPending(true);
    const res = await addGameAction(null, formData);
    setPending(false);
    if (res.ok) {
      setOpen(false);
      formRef.current?.reset();
    } else {
      setError(res.error);
    }
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
            <form ref={formRef} onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
              <label className="text-sm text-p-muted">
                Date
                <input type="date" name="date" defaultValue={todayLocalDate()} required className={fieldClass} />
              </label>
              <label className="text-sm text-p-muted">
                Event
                <select name="event" required className={fieldClass}>
                  {EVENTS.map((e) => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-p-muted">
                Format
                <select name="format" required className={fieldClass}>
                  {FORMATS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-p-muted">
                Opponent deck
                <select name="opponentDeck" required className={fieldClass}>
                  {OPPONENT_DECKS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-p-muted">
                Going
                <select name="going" required className={fieldClass}>
                  {GOINGS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-p-muted">
                Hand quality (1–5)
                <input type="number" name="handQuality" min={1} max={5} className={fieldClass} />
              </label>
              <label className="text-sm text-p-muted">
                My mulligans
                <input type="number" name="myMulligans" defaultValue={0} required className={fieldClass} />
              </label>
              <label className="text-sm text-p-muted">
                Opp mulligans
                <input type="number" name="oppMulligans" defaultValue={0} required className={fieldClass} />
              </label>

              <fieldset className="col-span-2">
                <legend className="text-sm text-p-muted">Result</legend>
                <div className="mt-1 flex gap-2">
                  {RESULTS.map((r, i) => (
                    <label
                      key={r}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border border-p-border py-2 text-sm text-p-title has-[:checked]:border-p-primary has-[:checked]:bg-p-kpi-bg"
                    >
                      <input
                        type="radio"
                        name="result"
                        value={r}
                        required
                        defaultChecked={i === 0}
                        className="sr-only"
                      />
                      {r === "W" ? "Win" : r === "L" ? "Loss" : "Tie"}
                    </label>
                  ))}
                </div>
              </fieldset>

              {error && (
                <p role="alert" className="col-span-2 text-sm text-p-bad">
                  {error}
                </p>
              )}

              <div className="col-span-2 mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm text-p-muted hover:bg-p-kpi-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-p-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
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
