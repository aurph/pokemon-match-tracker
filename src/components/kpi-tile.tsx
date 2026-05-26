export function KpiTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | null;
  hint?: string;
}) {
  const empty = value === null;
  return (
    <div
      className={
        "rounded-lg border-2 p-3 transition-transform " +
        (empty
          ? "border-dashed border-p-border bg-p-surface"
          : "border-p-title bg-p-kpi-bg shadow-pixel-sm hover:-translate-y-0.5")
      }
    >
      <div className="font-mono text-[10px] font-medium uppercase tracking-wider text-p-muted">
        {label}
      </div>
      <div
        className={
          "mt-1 font-pixel text-xl leading-none sm:text-2xl " +
          (empty ? "text-p-border" : "text-p-title")
        }
      >
        {empty ? "—" : value}
      </div>
      {hint && <div className="mt-1 text-[11px] text-p-muted">{hint}</div>}
    </div>
  );
}
