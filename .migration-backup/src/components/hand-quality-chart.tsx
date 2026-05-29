"use client";

import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HandQualityBin } from "@/lib/stats";

export function HandQualityChart({ data }: { data: HandQualityBin[] }) {
  const total = data.reduce((s, b) => s + b.W + b.L + b.T, 0);
  if (total === 0) {
    return (
      <div className="flex h-[296px] items-center justify-center rounded-lg border-2 border-dashed border-p-border bg-p-surface text-sm text-p-muted">
        Rate your opening hands (1–5) to see how hand quality maps to results.
      </div>
    );
  }
  return (
    <div className="rounded-lg border-2 border-p-title bg-p-surface p-4">
      <h3 className="mb-2 font-pixel text-xs text-p-title">HAND QUALITY → RESULT</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <XAxis dataKey="quality" stroke="#6B5DA0" fontSize={12} />
          <YAxis allowDecimals={false} stroke="#6B5DA0" fontSize={12} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "2px solid #2C1A4D", fontSize: 12 }}
            labelFormatter={(q) => `Hand quality ${q}`}
          />
          <Legend />
          <Bar dataKey="W" stackId="r" fill="#2E7D32" name="Win" />
          <Bar dataKey="L" stackId="r" fill="#C62828" name="Loss" />
          <Bar dataKey="T" stackId="r" fill="#F9A825" name="Tie" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
