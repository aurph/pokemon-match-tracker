export function KpiTile({ label, value }: { label: string; value: string | null }) {
  const empty = value === null;
  return (
    <div
      className={
        "rounded-2xl border-t-2 p-4 " +
        (empty ? "border-t-p-border bg-p-surface" : "border-t-p-accent bg-p-kpi-bg")
      }
    >
      <div className="text-xs font-medium uppercase tracking-wide text-p-muted">{label}</div>
      <div className={"mt-1 text-3xl font-semibold " + (empty ? "text-p-border" : "text-p-title")}>
        {empty ? "—" : value}
      </div>
    </div>
  );
}
