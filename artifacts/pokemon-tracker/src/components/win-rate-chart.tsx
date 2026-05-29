"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function WinRateChart({ data }: { data: { x: number; y: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[296px] items-center justify-center rounded-lg border-2 border-dashed border-p-border bg-p-surface text-sm text-p-muted">
        No games yet — your rolling win rate will appear here.
      </div>
    );
  }
  return (
    <div className="rounded-lg border-2 border-p-title bg-p-surface p-4">
      <h3 className="mb-2 font-pixel text-xs text-p-title">ROLLING WIN RATE (LAST 10)</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <XAxis dataKey="x" stroke="#6B5DA0" fontSize={12} />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            stroke="#6B5DA0"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "2px solid #2C1A4D", fontSize: 12 }}
            formatter={(v) => `${Math.round(Number(v) * 100)}%`}
            labelFormatter={(l) => `Game ${l}`}
          />
          <Line type="monotone" dataKey="y" stroke="#5E3FBD" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
