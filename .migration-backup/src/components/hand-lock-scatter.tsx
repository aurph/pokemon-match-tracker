"use client";

import { Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";

const color = (r: string) => (r === "W" ? "#2E7D32" : r === "L" ? "#C62828" : "#F9A825");

export function HandLockScatter({
  data,
}: {
  data: { handQuality: number; lockTurn: number; result: string }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[268px] items-center justify-center rounded-lg border-2 border-dashed border-p-border bg-p-surface p-4 text-center text-sm text-p-muted">
        Log hand quality + lock turn together to plot when your lock comes online.
      </div>
    );
  }
  return (
    <div className="rounded-lg border-2 border-p-title bg-p-surface p-4">
      <h3 className="mb-2 font-pixel text-xs text-p-title">HAND QUALITY vs LOCK TURN</h3>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <XAxis
            type="number"
            dataKey="handQuality"
            name="Hand Q"
            domain={[0, 6]}
            ticks={[1, 2, 3, 4, 5]}
            stroke="#6B5DA0"
            fontSize={12}
          />
          <YAxis type="number" dataKey="lockTurn" name="Lock turn" stroke="#6B5DA0" fontSize={12} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{ borderRadius: 8, border: "2px solid #2C1A4D", fontSize: 12 }}
          />
          <Scatter data={data}>
            {data.map((d, i) => (
              <Cell key={i} fill={color(d.result)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
