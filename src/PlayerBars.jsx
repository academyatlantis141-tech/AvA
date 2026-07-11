import React from "react";
import { FUNDAMENTOS, ACIERTO_COLOR, ERROR_COLOR, styles } from "./shared.js";

export function StatSummaryTiles({ totals }) {
  return (
    <div style={styles.summaryGrid}>
      {FUNDAMENTOS.map((f) => {
        const Icon = f.icon;
        const t = totals[f.key];
        const total = t.acierto + t.error;
        const eff = total ? Math.round((t.acierto / total) * 100) : 0;
        return (
          <div key={f.key} style={{ ...styles.summaryTile, borderColor: f.color }}>
            <Icon size={15} color={f.color} />
            <div style={{ fontSize: 10, color: ACIERTO_COLOR, fontWeight: 700 }}>{t.acierto}✓</div>
            <div style={{ fontSize: 10, color: ERROR_COLOR, fontWeight: 700 }}>{t.error}✕</div>
            <div style={styles.summaryLabel}>{f.label}</div>
            <div style={{ fontSize: 9, color: "#7FA0B0" }}>{eff}% ef.</div>
          </div>
        );
      })}
    </div>
  );
}

export default function PlayerBars({ totals }) {
  return (
    <div style={styles.barsWrap}>
      {FUNDAMENTOS.map((f) => {
        const t = totals[f.key];
        const total = t.acierto + t.error;
        const aciertoPct = total ? (t.acierto / total) * 100 : 0;
        const errorPct = total ? (t.error / total) * 100 : 0;
        return (
          <div key={f.key} style={styles.barRow}>
            <div style={styles.barLabel}>{f.label}</div>
            <div style={styles.barTrack}>
              {total > 0 && (
                <>
                  <div style={{ ...styles.barFillSplit, width: `${aciertoPct}%`, background: ACIERTO_COLOR }} />
                  <div style={{ ...styles.barFillSplit, width: `${errorPct}%`, background: ERROR_COLOR }} />
                </>
              )}
            </div>
            <div style={styles.barVal}>{t.acierto}/{t.error}</div>
          </div>
        );
      })}
    </div>
  );
}
