import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { FUNDAMENTOS, styles } from "./shared.js";

// matches: partidos de la categoría de la jugadora, ordenados por fecha
// totalsFor: (playerId, matchId) => totales por fundamento
export default function ProgressChart({ playerId, matches, totalsFor }) {
  const data = matches
    .slice()
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .map((m) => {
      const t = totalsFor(playerId, m.id);
      let acierto = 0, error = 0;
      FUNDAMENTOS.forEach((f) => { acierto += t[f.key].acierto; error += t[f.key].error; });
      const total = acierto + error;
      const efectividad = total ? Math.round((acierto / total) * 100) : null;
      return { label: m.label?.slice(0, 10) || m.date, efectividad, total };
    })
    .filter((d) => d.total > 0);

  if (data.length < 2) return null;

  return (
    <div style={styles.chartWrap}>
      <div style={{ ...styles.sectionLabel, padding: "4px 8px" }}>Progreso de efectividad (%)</div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#163B4F" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "#7FA0B0", fontSize: 9 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "#7FA0B0", fontSize: 9 }} />
          <Tooltip
            contentStyle={{ background: "#0F2A3A", border: "1px solid #163B4F", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#F2E9D8" }}
          />
          <Line type="monotone" dataKey="efectividad" stroke="#3FB8AE" strokeWidth={2} dot={{ r: 3, fill: "#3FB8AE" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
