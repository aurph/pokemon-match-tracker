import { db } from "@/db/client";
import { listIterations } from "@/db/iterations-repo";
import { PageHeader } from "@/components/page-header";
import { IterationForm } from "@/components/iteration-form";

export const dynamic = "force-dynamic";

const verdictTone: Record<string, string> = {
  keep: "bg-p-good/15 text-p-good",
  revert: "bg-p-bad/15 text-p-bad",
  iterate: "bg-p-primary/15 text-p-primary",
  pending: "bg-p-border/50 text-p-muted",
  mixed: "bg-p-warn/15 text-p-warn",
};

function arr(j: string | null): string[] {
  try {
    const a = JSON.parse(j ?? "[]");
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}
const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function IterationsPage() {
  const items = listIterations(db);

  return (
    <div className="space-y-6">
      <PageHeader title="Iterations" subtitle="How the 60 has evolved" actions={<IterationForm />} />

      {items.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-p-border bg-p-surface p-12 text-center text-sm text-p-muted">
          No changes logged yet. Hit “Add change” when you tweak the list.
        </div>
      ) : (
        <ol className="space-y-4 border-l-2 border-p-border pl-5">
          {items.map((it) => {
            const ins = arr(it.cardsIn);
            const outs = arr(it.cardsOut);
            const tested = (it.testedVs ?? "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            return (
              <li key={it.id} className="relative">
                <span className="absolute -left-[27px] top-2 h-3 w-3 rounded-full border-2 border-p-primary bg-p-surface" />
                <div className="rounded-lg border-2 border-p-title bg-p-surface p-4 shadow-pixel-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-xs text-p-primary">{it.version}</span>
                    <span className="font-mono text-xs text-p-muted">{fmtDate(it.dated)}</span>
                    {it.verdict && (
                      <span
                        className={`ml-auto rounded px-2 py-0.5 text-[10px] font-medium uppercase ${verdictTone[it.verdict] ?? "bg-p-border/50 text-p-muted"}`}
                      >
                        {it.verdict}
                      </span>
                    )}
                  </div>
                  {ins.length + outs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 text-xs">
                      {ins.map((c, i) => (
                        <span key={`i${i}`} className="rounded bg-p-good/15 px-2 py-0.5 text-p-good">
                          + {c}
                        </span>
                      ))}
                      {outs.map((c, i) => (
                        <span key={`o${i}`} className="rounded bg-p-bad/10 px-2 py-0.5 text-p-bad line-through">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                  {it.reasoning && <p className="mt-2 text-sm text-p-title">{it.reasoning}</p>}
                  {tested.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tested.map((t, i) => (
                        <span key={i} className="rounded bg-p-kpi-bg px-2 py-0.5 text-[11px] text-p-muted">
                          vs {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
