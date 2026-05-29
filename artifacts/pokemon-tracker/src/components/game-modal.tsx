import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { EVENTS, FORMATS, GOINGS, RESULTS } from "@/lib/enums";

const pad = (n: number) => String(n).padStart(2, "0");
function localDateValue(ms?: number) {
  const d = ms ? new Date(ms) : new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function safeArr(json: string | null | undefined): string[] {
  try {
    const a = JSON.parse(json ?? "[]");
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

const field =
  "mt-1 w-full rounded-md border-2 border-p-border bg-p-surface px-2 py-1.5 text-sm text-p-title focus:border-p-primary focus:outline-none";
const label = "text-xs font-medium uppercase tracking-wide text-p-muted";

const HQ_COLORS = ["#C62828", "#F9A825", "#F5C518", "#9CCC65", "#2E7D32"];

export function GameModal({
  onClose,
  mode,
  game,
  deckNames,
  opponentDecks,
  onRefresh,
}: {
  onClose: () => void;
  mode: "add" | "edit";
  game?: any;
  deckNames: string[];
  opponentDecks: string[];
  onRefresh?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState(game?.result ?? "W");
  const [handQ, setHandQ] = useState<number | null>(game?.handQuality ?? null);
  const [prized, setPrized] = useState<string[]>(() => safeArr(game?.prizedCards));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") formRef.current?.requestSubmit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const myM = Number(fd.get("myMulligans"));
    const oppM = Number(fd.get("oppMulligans"));
    if ([myM, oppM].some((v) => Number.isNaN(v) || v < 0 || v > 20)) {
      setError("Mulligans must be between 0 and 20.");
      return;
    }

    const opp = String(fd.get("opponentDeck") ?? "").trim();
    if (opp && !opponentDecks.includes(opp)) {
      await api.addCustomOpponentDeck(opp);
    }

    const body = {
      event: fd.get("event"),
      format: fd.get("format"),
      opponentDeck: opp,
      opponentName: fd.get("opponentName") || null,
      round: fd.get("round") ? Number(fd.get("round")) : null,
      coinFlip: fd.get("coinFlip") || null,
      going: fd.get("going"),
      result,
      myMulligans: myM,
      oppMulligans: oppM,
      handQuality: handQ,
      turnCount: fd.get("turnCount") ? Number(fd.get("turnCount")) : null,
      timeUsedMin: fd.get("timeUsedMin") ? Number(fd.get("timeUsedMin")) : null,
      lockTurn: fd.get("lockTurn") ? Number(fd.get("lockTurn")) : null,
      prizeTrade: fd.get("prizeTrade") || null,
      keyCardsDrawn: fd.get("keyCardsDrawn") || null,
      techCardsUsed: fd.get("techCardsUsed") || null,
      prizedCards: prized,
      mistakes: fd.get("mistakes") || null,
      notes: fd.get("notes") || null,
      playedAt: new Date(`${fd.get("date")}T12:00:00`).getTime(),
      newMatch: mode === "add",
      matchId: game?.matchId ?? null,
      gameNumber: game?.gameNumber ?? 1,
    };

    setError(null);
    setPending(true);
    try {
      if (mode === "edit" && game) {
        await api.updateGame(game.id, body);
      } else {
        await api.createGame(body);
      }
      onClose();
      onRefresh?.();
    } catch (err: any) {
      setError(err.message);
    }
    setPending(false);
  }

  async function onDelete() {
    if (!game) return;
    if (!window.confirm("Delete this game permanently?")) return;
    setPending(true);
    try {
      await api.deleteGame(game.id);
      onClose();
      onRefresh?.();
    } catch (err: any) {
      setError(err.message);
    }
    setPending(false);
  }

  function togglePrized(name: string) {
    setPrized((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={mode === "edit" ? "Edit game" : "Log game"}
        className="max-h-[92vh] w-full max-w-[620px] overflow-y-auto rounded-xl border-2 border-p-title bg-p-surface p-5 shadow-pixel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-pixel text-sm text-p-title">
            {mode === "edit" ? "EDIT GAME" : "LOG A GAME"}
          </h2>
          {mode === "edit" && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1 rounded-md border-2 border-p-bad px-2 py-1 text-xs text-p-bad hover:bg-p-bad/10"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          {mode === "edit" && game && <input type="hidden" name="id" value={game.id} readOnly />}

          <Section title="When / Where">
            <label className={label}>
              Date
              <input type="date" name="date" defaultValue={localDateValue(game?.playedAt)} required className={field} />
            </label>
            <label className={label}>
              Event
              <select name="event" defaultValue={game?.event ?? "Locals"} required className={field}>
                {EVENTS.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </label>
            <label className={label}>
              Format
              <select name="format" defaultValue={game?.format ?? "BO1"} required className={field}>
                {FORMATS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
            <label className={label}>
              Opponent deck
              <input
                name="opponentDeck"
                list="opp-decks"
                defaultValue={game?.opponentDeck ?? ""}
                required
                placeholder="Pick or type…"
                className={field}
              />
              <datalist id="opp-decks">
                {opponentDecks.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </label>
            <label className={label}>
              Opponent name (optional)
              <input name="opponentName" defaultValue={game?.opponentName ?? ""} className={field} />
            </label>
            <label className={label}>
              Round (optional)
              <input type="number" name="round" min={1} defaultValue={game?.round ?? ""} className={field} />
            </label>
          </Section>

          <Section title="Setup">
            <label className={label}>
              Coin flip
              <select name="coinFlip" defaultValue={game?.coinFlip ?? ""} className={field}>
                <option value="">—</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </label>
            <label className={label}>
              Going
              <select name="going" defaultValue={game?.going ?? "1st"} required className={field}>
                {GOINGS.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className={label}>
              My mulligans
              <input type="number" name="myMulligans" defaultValue={game?.myMulligans ?? 0} required className={field} />
            </label>
            <label className={label}>
              Opp mulligans
              <input type="number" name="oppMulligans" defaultValue={game?.oppMulligans ?? 0} required className={field} />
            </label>
            <div className="col-span-2">
              <span className={label}>Opening hand quality</span>
              <div className="mt-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => setHandQ(null)}
                  className={`flex-1 rounded-md border-2 py-1.5 text-sm ${handQ == null ? "border-p-title bg-p-kpi-bg" : "border-p-border text-p-muted"}`}
                >
                  —
                </button>
                {[1, 2, 3, 4, 5].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setHandQ(q)}
                    className="flex-1 rounded-md border-2 py-1.5 font-pixel text-sm"
                    style={{
                      borderColor: handQ === q ? "#2C1A4D" : "#D9CFEF",
                      backgroundColor: handQ === q ? HQ_COLORS[q - 1] : "transparent",
                      color: handQ === q ? "#fff" : "#6B5DA0",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Course of game">
            <label className={label}>
              Turn count
              <input type="number" name="turnCount" min={0} defaultValue={game?.turnCount ?? ""} className={field} />
            </label>
            <label className={label}>
              Time used (min)
              <input type="number" name="timeUsedMin" min={0} defaultValue={game?.timeUsedMin ?? ""} className={field} />
            </label>
            <label className={label}>
              Lock turn
              <input type="number" name="lockTurn" min={0} defaultValue={game?.lockTurn ?? ""} className={field} />
            </label>
            <label className={label}>
              Prize trade (e.g. 6-2)
              <input name="prizeTrade" defaultValue={game?.prizeTrade ?? ""} className={field} />
            </label>
            <label className={`${label} col-span-2`}>
              Key cards drawn
              <input name="keyCardsDrawn" defaultValue={game?.keyCardsDrawn ?? ""} className={field} />
            </label>
            <label className={`${label} col-span-2`}>
              Tech cards used
              <input name="techCardsUsed" defaultValue={game?.techCardsUsed ?? ""} className={field} />
            </label>
            <div className="col-span-2">
              <span className={label}>Prized cards {prized.length > 0 && `(${prized.length})`}</span>
              <div className="mt-1 flex max-h-28 flex-wrap gap-1 overflow-y-auto rounded-md border-2 border-p-border p-2">
                {deckNames.map((name) => {
                  const on = prized.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => togglePrized(name)}
                      className={`rounded px-2 py-0.5 text-xs ${on ? "bg-p-primary text-white" : "bg-p-kpi-bg text-p-muted hover:text-p-title"}`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          <Section title="Outcome">
            <div className="col-span-2">
              <span className={label}>Result</span>
              <div className="mt-1 flex gap-2">
                {RESULTS.map((r) => {
                  const on = result === r;
                  const tone =
                    r === "W"
                      ? { bg: "#2E7D32", bd: "#2E7D32" }
                      : r === "L"
                        ? { bg: "#C62828", bd: "#C62828" }
                        : { bg: "#F9A825", bd: "#F9A825" };
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setResult(r)}
                      className="flex-1 rounded-md border-2 py-2 font-pixel text-sm"
                      style={{
                        borderColor: on ? tone.bd : "#D9CFEF",
                        backgroundColor: on ? tone.bg : "transparent",
                        color: on ? "#fff" : "#6B5DA0",
                      }}
                    >
                      {r === "W" ? "WIN" : r === "L" ? "LOSS" : "TIE"}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className={`${label} col-span-2`}>
              Mistakes
              <textarea name="mistakes" rows={2} defaultValue={game?.mistakes ?? ""} className={field} />
            </label>
            <label className={`${label} col-span-2`}>
              Notes
              <textarea name="notes" rows={2} defaultValue={game?.notes ?? ""} className={field} />
            </label>
          </Section>

          {error && (
            <p role="alert" className="text-sm text-p-bad">
              {error}
            </p>
          )}

          <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t-2 border-p-border bg-p-surface px-5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-p-muted hover:bg-p-kpi-bg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-p-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Save game"}
              <span className="ml-2 hidden font-mono text-[10px] opacity-70 sm:inline">⌘↵</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 font-pixel text-[10px] uppercase text-p-primary">{title}</legend>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </fieldset>
  );
}
