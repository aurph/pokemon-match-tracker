"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function HandQualityWinrateChart({
  data,
}: {
  data: { quality: number; winPct: number | null; n: number }[];
}) {
  if (!data.some((d) => d.n > 0)) {
    return (
      <div className="flex h-[268px] items-center justify-center rounded-lg border-2 border-dashed border-p-border bg-p-surface p-4 text-center text-sm text-p-muted">
        Rate your opening hands (1–5) to see how hand quality drives wins.
      </div>
    );
  }
  const rows = data.map((d) => ({
    quality: d.quality,
    pct: d.winPct == null ? 0 : Math.round(d.winPct * 100),
    n: d.n,
  }));
  return (
    <div className="rounded-lg border-2 border-p-title bg-p-surface p-4">
      <h3 className="mb-2 font-pixel text-xs text-p-title">WIN% BY HAND QUALITY</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <XAxis dataKey="quality" stroke="#6B5DA0" fontSize={12} />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="#6B5DA0" fontSize={12} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "2px solid #2C1A4D", fontSize: 12 }}
            formatter={(v, _n, item) => [`${v}% (n=${item?.payload?.n ?? 0})`, "Win rate"]}
            labelFormatter={(q) => `Hand quality ${q}`}
          />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
            {rows.map((r, i) => (
              <Cell key={i} fill={`hsl(${Math.round((r.pct / 100) * 120)} 60% 45%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
