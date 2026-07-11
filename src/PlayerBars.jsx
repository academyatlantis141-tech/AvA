import React from "react";
import { FUNDAMENTOS, ACIERTO_COLOR, ERROR_COLOR, styles } from "./shared.js";

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
