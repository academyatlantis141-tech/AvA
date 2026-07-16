import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Users, Trash2, X, Plus, ChevronRight, ChevronLeft, BarChart3, Undo2,
  Check, Waves, Search, Calendar, FileDown, Inbox, LogOut, MessageCircle,
  AlertTriangle, Megaphone, Trophy, CalendarCheck, CalendarX
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  CATEGORIES, FUNDAMENTOS, ACIERTO_COLOR, ERROR_COLOR, styles, globalCss,
  todayISO, fmtDate, emptyTotals, loadFont, requestNotificationPermission, notify,
} from "./shared.js";
import {
  subSolicitudes, subJugadores, subPartidos, subRegistros, subMensajes, subAnuncios, subAsistencias,
  aprobarSolicitud, rechazarSolicitud, eliminarJugador,
  crearPartido, eliminarPartido, agregarRegistro, eliminarRegistro, restablecerEstadisticas,
  crearAnuncio, eliminarAnuncio, marcarAsistencia, marcarMVP, actualizarMarcador,
} from "./db.js";
import PlayerBars, { StatSummaryTiles } from "./PlayerBars.jsx";
import ChatView from "./ChatView.jsx";
import Avatar from "./Avatar.jsx";
import ProgressChart from "./ProgressChart.jsx";

export default function AdminApp({ onLogout }) {
  const [tab, setTab] = useState("solicitudes");
  const [solicitudes, setSolicitudes] = useState([]);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [records, setRecords] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFont();
    requestNotificationPermission();
    let loaded = 0;
    const mark = () => { loaded += 1; if (loaded >= 7) setReady(true); };
    const u1 = subSolicitudes((d) => { setSolicitudes(d); mark(); });
    const u2 = subJugadores((d) => { setPlayers(d); mark(); });
    const u3 = subPartidos((d) => { setMatches(d); mark(); });
    const u4 = subRegistros((d) => { setRecords(d); mark(); });
    const u5 = subMensajes((d) => { setMensajes(d); mark(); });
    const u6 = subAnuncios((d) => { setAnuncios(d); mark(); });
    const u7 = subAsistencias((d) => { setAsistencias(d); mark(); });
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); };
  }, []);

  // Notificaciones: solicitudes nuevas
  const seenSolicitudes = useRef(null);
  useEffect(() => {
    const ids = new Set(solicitudes.map((s) => s.id));
    if (seenSolicitudes.current) {
      solicitudes.forEach((s) => {
        if (!seenSolicitudes.current.has(s.id)) {
          notify("Nueva solicitud de perfil", `${s.name} · ${s.category}`);
        }
      });
    }
    seenSolicitudes.current = ids;
  }, [solicitudes]);

  // Notificaciones: mensajes nuevos de chat (de cualquier categoría, que no sean del admin)
  const seenMensajes = useRef(null);
  useEffect(() => {
    const ids = new Set(mensajes.map((m) => m.id));
    if (seenMensajes.current) {
      mensajes.forEach((m) => {
        if (!seenMensajes.current.has(m.id) && m.authorRole !== "admin") {
          notify(`${m.authorName} · ${m.category}`, m.text);
        }
      });
    }
    seenMensajes.current = ids;
  }, [mensajes]);

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  };

  const totalsFor = useCallback(
    (playerId, matchId = null) => {
      const t = emptyTotals();
      for (const r of records) {
        if (r.playerId !== playerId) continue;
        if (matchId && r.matchId !== matchId) continue;
        if (!t[r.statKey]) continue;
        t[r.statKey][r.result] = (t[r.statKey][r.result] || 0) + 1;
      }
      return t;
    },
    [records]
  );

  const exportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        players.map((p) => ({ Nombre: p.name, Número: p.number || "", Categoría: p.category }))
      ), "Jugadoras");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        matches.map((m) => ({ Fecha: fmtDate(m.date), Partido: m.label, Categoría: m.category, MVP: m.mvpName || "" }))
      ), "Partidos");
      const detalle = records.map((r) => {
        const p = players.find((pl) => pl.id === r.playerId);
        const m = matches.find((mm) => mm.id === r.matchId);
        const f = FUNDAMENTOS.find((ff) => ff.key === r.statKey);
        return {
          Fecha: m ? fmtDate(m.date) : "", Partido: m ? m.label : "",
          Categoría: p ? p.category : "", Jugadora: p ? p.name : "",
          Fundamento: f ? f.label : r.statKey,
          Resultado: r.result === "acierto" ? "Acierto" : "Error",
        };
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalle), "Detalle");
      const resumen = players.map((p) => {
        const t = totalsFor(p.id);
        const row = { Jugadora: p.name, Categoría: p.category };
        FUNDAMENTOS.forEach((f) => {
          row[`${f.label} Acierto`] = t[f.key].acierto;
          row[`${f.label} Error`] = t[f.key].error;
        });
        row["MVPs"] = matches.filter((m) => m.mvpId === p.id).length;
        const misAsist = asistencias.filter((a) => a.playerId === p.id);
        const presentes = misAsist.filter((a) => a.presente).length;
        row["Asistencia"] = misAsist.length ? `${presentes}/${misAsist.length}` : "";
        return row;
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), "Resumen");
      XLSX.writeFile(wb, "Atlantis_Academy_Estadisticas.xlsx");
    } catch (e) {
      showError("No se pudo exportar el archivo.");
    }
  };

  if (!ready) {
    return (
      <div style={styles.loadingScreen}>
        <Waves size={40} color="#3FB8AE" />
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, marginTop: 12, color: "#F2E9D8" }}>
          CARGANDO ATLANTIS...
        </div>
      </div>
    );
  }

  const activeMatch = matches.find((m) => m.id === activeMatchId) || null;

  return (
    <div style={styles.app} className="atlantis-shell">
      <style>{globalCss}</style>
      <Header
        tab={tab}
        onExport={exportExcel}
        hasData={players.length > 0}
        onLogout={onLogout}
        pendingCount={solicitudes.length}
      />
      <div className="atlantis-body" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <SideNav tab={tab} setTab={setTab} pendingCount={solicitudes.length} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={styles.content} className="atlantis-content-scroll">
            {tab === "solicitudes" && (
              <SolicitudesTab
                solicitudes={solicitudes}
                onApprove={(s) => aprobarSolicitud(s).catch(() => showError("No se pudo aprobar."))}
                onReject={(id) => rechazarSolicitud(id).catch(() => showError("No se pudo rechazar."))}
              />
            )}
            {tab === "equipo" && (
              <EquipoTab
                players={players}
                onDelete={(id) => eliminarJugador(id).catch(() => showError("No se pudo eliminar."))}
              />
            )}
            {tab === "registrar" && (
              <RegistrarTab
                players={players}
                matches={matches}
                activeMatch={activeMatch}
                totalsFor={totalsFor}
                onRecord={(playerId, matchId, statKey, result) =>
                  agregarRegistro({ playerId, matchId, statKey, result }).catch(() => showError("No se pudo guardar."))
                }
                onUndo={(playerId, matchId) => {
                  const last = [...records]
                    .filter((r) => r.playerId === playerId && r.matchId === matchId)
                    .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
                  if (last) eliminarRegistro(last.id).catch(() => showError("No se pudo deshacer."));
                }}
                onAddMatch={async (label, date, category) => {
                  const id = await crearPartido({ label, date, category });
                  setActiveMatchId(id);
                }}
                onSelectMatch={setActiveMatchId}
                onUpdateScore={(data) => actualizarMarcador(activeMatchId, data).catch(() => showError("No se pudo guardar el marcador."))}
              />
            )}
            {tab === "historial" && (
              <HistorialTab
                matches={matches}
                players={players}
                totalsFor={totalsFor}
                asistencias={asistencias}
                onDeleteMatch={(id) => eliminarPartido(id).catch(() => showError("No se pudo eliminar."))}
                onSetMVP={(matchId, player) => marcarMVP(matchId, player).catch(() => showError("No se pudo guardar el MVP."))}
                onSetAsistencia={(payload) => marcarAsistencia(payload).catch(() => showError("No se pudo guardar la asistencia."))}
              />
            )}
            {tab === "estadisticas" && (
              <EstadisticasTab
                players={players}
                totalsFor={totalsFor}
                matches={matches}
                asistencias={asistencias}
                onReset={() =>
                  restablecerEstadisticas().catch(() => showError("No se pudo restablecer."))
                }
              />
            )}
            {tab === "anuncios" && (
              <AnunciosTab
                anuncios={anuncios}
                onCreate={(payload) => crearAnuncio(payload).catch(() => showError("No se pudo publicar."))}
                onDelete={(id) => eliminarAnuncio(id).catch(() => showError("No se pudo eliminar."))}
              />
            )}
            {tab === "chat" && <ChatTab mensajes={mensajes} />}
          </div>
          <BottomNav tab={tab} setTab={setTab} pendingCount={solicitudes.length} />
        </div>
      </div>
      {error && <div style={styles.toastError}>{error}</div>}
    </div>
  );
}

const TAB_TITLES = {
  solicitudes: "Solicitudes",
  equipo: "Mi Equipo",
  registrar: "Registrar",
  historial: "Partidos",
  estadisticas: "Estadísticas",
  anuncios: "Anuncios",
  chat: "Chat",
};

function Header({ tab, onExport, hasData, onLogout, pendingCount }) {
  return (
    <div style={styles.header}>
      <div style={styles.headerRow}>
        <button style={styles.iconBtn} onClick={onLogout} title="Salir">
          <LogOut size={18} color="#7FA0B0" />
        </button>
        <img src="/logo.png" alt="Atlantis Academy" style={{ width: 30, height: 30, objectFit: "contain" }} />
        <div style={{ flex: 1 }}>
          <div style={styles.brand}>ATLANTIS ACADEMY · ADMIN</div>
          <div style={styles.tabTitle}>{TAB_TITLES[tab]}</div>
        </div>
        {hasData && (
          <button style={styles.exportBtn} onClick={onExport} title="Exportar a Excel">
            <FileDown size={16} color="#08141F" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Solicitudes ---------------- */

function SolicitudesTab({ solicitudes, onApprove, onReject }) {
  if (solicitudes.length === 0) {
    return <EmptyState text="No hay solicitudes de perfil pendientes por ahora." />;
  }
  return (
    <div className="atlantis-cardgrid" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {solicitudes.map((s) => (
        <div key={s.id} style={styles.card}>
          <div style={styles.playerRow}>
            <Avatar player={s} />
            <div style={{ flex: 1 }}>
              <div style={styles.playerName}>{s.name}</div>
              <div style={styles.playerMeta}>{s.category}</div>
            </div>
          </div>
          <div style={{ ...styles.rowGap, marginTop: 10 }}>
            <button style={{ ...styles.primaryBtn }} onClick={() => onApprove(s)}>
              <Check size={16} /> Aprobar
            </button>
            <button style={styles.dangerBtn} onClick={() => onReject(s.id)}>
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Equipo ---------------- */

function EquipoTab({ players, onDelete }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [confirmId, setConfirmId] = useState(null);
  const filtered = players.filter((p) => p.category === category);

  return (
    <div>
      <CategoryChips category={category} setCategory={setCategory} />
      <div style={styles.sectionRow}>
        <div style={styles.sectionLabel}>
          {filtered.length} {filtered.length === 1 ? "jugador/a" : "jugadores/as"}
        </div>
      </div>
      <div style={{ ...styles.emptyText, marginBottom: 12 }}>
        Los estudiantes crean su propio perfil desde la vista "Estudiantes" — tú solo los apruebas en "Solicitudes".
      </div>
      {filtered.length === 0 && <EmptyState text={`Todavía no hay jugadores aprobados en ${category}.`} />}
      <div className="atlantis-cardgrid" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((p) => (
          <div key={p.id} style={{ ...styles.playerRow, ...styles.card, marginBottom: 0 }}>
            <Avatar player={p} />
            <div style={{ flex: 1 }}>
              <div style={styles.playerName}>{p.name}</div>
              <div style={styles.playerMeta}>{p.category}</div>
            </div>
            {confirmId === p.id ? (
              <div style={styles.rowGap}>
                <button style={styles.dangerBtn} onClick={() => { onDelete(p.id); setConfirmId(null); }}>Eliminar</button>
                <button style={styles.ghostBtnSmall} onClick={() => setConfirmId(null)}><X size={14} /></button>
              </div>
            ) : (
              <button style={styles.iconBtn} onClick={() => setConfirmId(p.id)}>
                <Trash2 size={16} color="#7FA0B0" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Registrar ---------------- */

function RegistrarTab({ players, matches, activeMatch, totalsFor, onRecord, onUndo, onAddMatch, onSelectMatch, onUpdateScore }) {
  const [expandedId, setExpandedId] = useState(null);
  const [pulse, setPulse] = useState(null);
  const [showMatchPicker, setShowMatchPicker] = useState(!activeMatch);

  const filtered = activeMatch ? players.filter((p) => p.category === activeMatch.category) : [];

  const handleTap = (playerId, statKey, result) => {
    onRecord(playerId, activeMatch.id, statKey, result);
    setPulse(`${playerId}-${statKey}-${result}`);
    setTimeout(() => setPulse(null), 250);
  };

  if (showMatchPicker) {
    return (
      <MatchPicker
        matches={matches}
        onCreate={async (label, date, category) => {
          await onAddMatch(label, date, category);
          setShowMatchPicker(false);
        }}
        onSelect={(id) => { onSelectMatch(id); setShowMatchPicker(false); }}
        onClose={() => setShowMatchPicker(false)}
      />
    );
  }

  if (!activeMatch) {
    return (
      <div>
        <EmptyState text='Elige o crea un partido/sesión para empezar a registrar estadísticas.' />
        <button style={styles.primaryBtn} onClick={() => setShowMatchPicker(true)}>
          <Calendar size={16} /> Elegir partido
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.matchBar} onClick={() => setShowMatchPicker(true)}>
        <Calendar size={15} color="#D9A544" />
        <div style={{ flex: 1 }}>
          <div style={styles.matchBarLabel}>{activeMatch.label || "Partido"}</div>
          <div style={styles.matchBarMeta}>{fmtDate(activeMatch.date)} · {activeMatch.category}</div>
        </div>
        <div style={styles.changeLink}>Cambiar</div>
      </div>

      <Marcador match={activeMatch} onUpdate={onUpdateScore} />

      {filtered.length === 0 && (
        <EmptyState text={`No hay jugadores aprobados en ${activeMatch.category} todavía.`} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((p) => {
          const totals = totalsFor(p.id, activeMatch.id);
          const isOpen = expandedId === p.id;
          return (
            <div key={p.id} style={styles.card}>
              <div style={{ ...styles.playerRow, cursor: "pointer" }} onClick={() => setExpandedId(isOpen ? null : p.id)}>
                <Avatar player={p} />
                <div style={{ flex: 1 }}>
                  <div style={styles.playerName}>{p.name}</div>
                  <div style={styles.playerMeta}>
                    {FUNDAMENTOS.map((f) => `${f.label[0]} ${totals[f.key].acierto}/${totals[f.key].error}`).join("  ")}
                  </div>
                </div>
                <ChevronRight size={18} color="#7FA0B0" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
              </div>

              {isOpen && (
                <div style={{ marginTop: 14 }}>
                  {FUNDAMENTOS.map((f) => {
                    const Icon = f.icon;
                    return (
                      <div key={f.key} style={styles.fundamentoRow}>
                        <div style={styles.fundamentoLabel}><Icon size={15} color={f.color} /><span>{f.label}</span></div>
                        <div style={styles.resultBtns}>
                          <button
                            style={{ ...styles.resultBtn, borderColor: ACIERTO_COLOR, transform: pulse === `${p.id}-${f.key}-acierto` ? "scale(0.92)" : "scale(1)" }}
                            onClick={() => handleTap(p.id, f.key, "acierto")}
                          >
                            <Check size={13} color={ACIERTO_COLOR} />
                            <span style={{ color: ACIERTO_COLOR }}>{totals[f.key].acierto}</span>
                          </button>
                          <button
                            style={{ ...styles.resultBtn, borderColor: ERROR_COLOR, transform: pulse === `${p.id}-${f.key}-error` ? "scale(0.92)" : "scale(1)" }}
                            onClick={() => handleTap(p.id, f.key, "error")}
                          >
                            <X size={13} color={ERROR_COLOR} />
                            <span style={{ color: ERROR_COLOR }}>{totals[f.key].error}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button style={styles.undoBtn} onClick={() => onUndo(p.id, activeMatch.id)}>
                    <Undo2 size={14} /> Deshacer última acción
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Marcador({ match, onUpdate }) {
  const puntosNosotros = match.puntosNosotros || 0;
  const puntosRival = match.puntosRival || 0;
  const setsNosotros = match.setsNosotros || 0;
  const setsRival = match.setsRival || 0;
  const sets = match.sets || [];

  const sumar = (side, delta) => {
    const key = side === "nosotros" ? "puntosNosotros" : "puntosRival";
    const current = side === "nosotros" ? puntosNosotros : puntosRival;
    const next = Math.max(0, current + delta);
    onUpdate({ [key]: next });
  };

  const finalizarSet = () => {
    if (puntosNosotros === puntosRival) return;
    const nuevoSet = { nosotros: puntosNosotros, rival: puntosRival };
    const ganamos = puntosNosotros > puntosRival;
    onUpdate({
      sets: [...sets, nuevoSet],
      setsNosotros: ganamos ? setsNosotros + 1 : setsNosotros,
      setsRival: ganamos ? setsRival : setsRival + 1,
      puntosNosotros: 0,
      puntosRival: 0,
    });
  };

  const deshacerSet = () => {
    if (sets.length === 0) return;
    const ultimo = sets[sets.length - 1];
    const ganamosUltimo = ultimo.nosotros > ultimo.rival;
    onUpdate({
      sets: sets.slice(0, -1),
      setsNosotros: ganamosUltimo ? Math.max(0, setsNosotros - 1) : setsNosotros,
      setsRival: ganamosUltimo ? setsRival : Math.max(0, setsRival - 1),
      puntosNosotros: ultimo.nosotros,
      puntosRival: ultimo.rival,
    });
  };

  return (
    <div style={styles.scoreboardWrap}>
      <div style={styles.scoreboardRow}>
        <div style={styles.scoreboardSide}>
          <div style={styles.scoreboardLabel}>Nosotros</div>
          <div style={styles.scoreboardNum}>{puntosNosotros}</div>
          <div style={styles.scoreboardBtns}>
            <button style={styles.scoreboardBtn} onClick={() => sumar("nosotros", -1)}>−</button>
            <button style={styles.scoreboardBtn} onClick={() => sumar("nosotros", 1)}>+</button>
          </div>
        </div>
        <div style={styles.scoreboardVs}>{setsNosotros}-{setsRival}</div>
        <div style={styles.scoreboardSide}>
          <div style={styles.scoreboardLabel}>Rival</div>
          <div style={styles.scoreboardNum}>{puntosRival}</div>
          <div style={styles.scoreboardBtns}>
            <button style={styles.scoreboardBtn} onClick={() => sumar("rival", -1)}>−</button>
            <button style={styles.scoreboardBtn} onClick={() => sumar("rival", 1)}>+</button>
          </div>
        </div>
      </div>
      <div style={styles.rowGap}>
        <button style={{ ...styles.primaryBtn, marginTop: 12 }} onClick={finalizarSet}>
          <Check size={14} /> Finalizar set
        </button>
        {sets.length > 0 && (
          <button style={{ ...styles.ghostBtn, marginTop: 12 }} onClick={deshacerSet}>
            <Undo2 size={14} />
          </button>
        )}
      </div>
      {sets.length > 0 && (
        <div style={{ textAlign: "center" }}>
          {sets.map((s, i) => (
            <span key={i} style={styles.setChip}>{s.nosotros}-{s.rival}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchPicker({ matches, onCreate, onSelect, onClose }) {
  const [creating, setCreating] = useState(matches.length === 0);
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [saving, setSaving] = useState(false);

  const sorted = [...matches].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div style={styles.overlay}>
      <div style={styles.overlayCard}>
        <div style={styles.overlayHeader}>
          {onClose && <button style={styles.iconBtn} onClick={onClose}><ChevronLeft size={18} color="#7FA0B0" /></button>}
          <div style={styles.overlayTitle}>Partido / sesión</div>
        </div>

        {!creating && (
          <>
            <div style={{ maxHeight: 260, overflowY: "auto", marginBottom: 12 }}>
              {sorted.map((m) => (
                <button key={m.id} style={styles.matchOption} onClick={() => onSelect(m.id)}>
                  <div>
                    <div style={styles.matchBarLabel}>{m.label || "Partido"}</div>
                    <div style={styles.matchBarMeta}>{fmtDate(m.date)} · {m.category}</div>
                  </div>
                  <ChevronRight size={16} color="#7FA0B0" />
                </button>
              ))}
              {sorted.length === 0 && <div style={{ ...styles.emptyText, padding: "10px 0" }}>Aún no tienes partidos guardados.</div>}
            </div>
            <button style={styles.primaryBtn} onClick={() => setCreating(true)}>
              <Plus size={16} /> Nuevo partido / sesión
            </button>
          </>
        )}

        {creating && (
          <>
            <input style={styles.input} placeholder='Nombre (ej. "vs Delfines" o "Entrenamiento")' value={label} onChange={(e) => setLabel(e.target.value)} />
            <input style={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <div style={styles.chipsRow}>
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)} style={{ ...styles.chip, ...(category === c ? styles.chipActive : {}) }}>{c}</button>
              ))}
            </div>
            <div style={styles.rowGap}>
              <button
                style={styles.primaryBtn}
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  await onCreate(label.trim() || "Partido", date, category);
                }}
              >
                <Check size={16} /> {saving ? "Creando..." : "Empezar a registrar"}
              </button>
              {matches.length > 0 && <button style={styles.ghostBtn} onClick={() => setCreating(false)}>Volver</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Partidos / Historial (con MVP, asistencia y calendario) ---------------- */

function HistorialTab({ matches, players, totalsFor, asistencias, onDeleteMatch, onSetMVP, onSetAsistencia }) {
  const [openId, setOpenId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const today = todayISO();
  const sorted = [...matches].sort((a, b) => (a.date < b.date ? 1 : -1));
  const proximos = sorted.filter((m) => m.date >= today);
  const pasados = sorted.filter((m) => m.date < today);

  if (sorted.length === 0) {
    return <EmptyState text='Todavía no registras partidos. Ve a "Registrar" para crear el primero.' />;
  }

  const renderMatch = (m) => {
    const isOpen = openId === m.id;
    const roster = players.filter((p) => p.category === m.category);
    const upcoming = m.date >= today;
    return (
      <div key={m.id} style={styles.card}>
        <div style={styles.playerRow} onClick={() => setOpenId(isOpen ? null : m.id)}>
          <div style={{ ...styles.avatarSmall, borderColor: upcoming ? "#3FB8AE" : "#D9A544", color: upcoming ? "#3FB8AE" : "#D9A544" }}>
            <Calendar size={16} />
          </div>
          <div style={{ flex: 1, cursor: "pointer" }}>
            <div style={styles.playerName}>{m.label}</div>
            <div style={styles.playerMeta}>
              {fmtDate(m.date)} · {m.category}{upcoming ? " · Próximo" : ""}
            </div>
            {(m.setsNosotros > 0 || m.setsRival > 0) && (
              <div style={{ fontSize: 12, color: "#3FB8AE", marginTop: 2, fontWeight: 700 }}>
                Sets: {m.setsNosotros || 0}-{m.setsRival || 0}
              </div>
            )}
            {m.mvpName && (
              <div style={{ fontSize: 11, color: "#D9A544", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <Trophy size={11} /> MVP: {m.mvpName}
              </div>
            )}
          </div>
          {confirmId === m.id ? (
            <div style={styles.rowGap}>
              <button style={styles.dangerBtn} onClick={(e) => { e.stopPropagation(); onDeleteMatch(m.id); setConfirmId(null); }}>Eliminar</button>
              <button style={styles.ghostBtnSmall} onClick={(e) => { e.stopPropagation(); setConfirmId(null); }}><X size={14} /></button>
            </div>
          ) : (
            <button style={styles.iconBtn} onClick={(e) => { e.stopPropagation(); setConfirmId(m.id); }}>
              <Trash2 size={16} color="#7FA0B0" />
            </button>
          )}
          <ChevronRight size={18} color="#7FA0B0" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
        </div>

        {isOpen && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            {roster.length === 0 && <div style={styles.emptyText}>No hay jugadoras en esta categoría todavía.</div>}
            {roster.map((p) => {
              const t = totalsFor(p.id, m.id);
              const total = FUNDAMENTOS.reduce((s, f) => s + t[f.key].acierto + t[f.key].error, 0);
              const asistRecord = asistencias.find((a) => a.matchId === m.id && a.playerId === p.id);
              const isMVP = m.mvpId === p.id;
              return (
                <div key={p.id}>
                  <div style={styles.playerRowInner}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar player={p} size={30} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#F2E9D8" }}>{p.name}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button
                        style={{
                          ...styles.attendanceBtn,
                          ...(asistRecord?.presente ? styles.attendancePresente : {}),
                        }}
                        onClick={() => onSetAsistencia({ playerId: p.id, matchId: m.id, category: m.category, date: m.date, presente: true })}
                      >
                        <CalendarCheck size={12} /> Presente
                      </button>
                      <button
                        style={{
                          ...styles.attendanceBtn,
                          ...(asistRecord && !asistRecord.presente ? styles.attendanceAusente : {}),
                        }}
                        onClick={() => onSetAsistencia({ playerId: p.id, matchId: m.id, category: m.category, date: m.date, presente: false })}
                      >
                        <CalendarX size={12} /> Ausente
                      </button>
                      <button
                        style={{ ...styles.mvpBtn, ...(isMVP ? styles.mvpBtnActive : {}) }}
                        onClick={() => onSetMVP(m.id, isMVP ? null : p)}
                      >
                        <Trophy size={12} /> MVP
                      </button>
                    </div>
                  </div>
                  {total > 0 && <PlayerBars totals={t} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {proximos.length > 0 && (
        <>
          <div style={{ ...styles.sectionLabel, marginBottom: 10 }}>Próximos</div>
          {proximos.map(renderMatch)}
        </>
      )}
      {pasados.length > 0 && (
        <>
          <div style={{ ...styles.sectionLabel, marginTop: proximos.length ? 10 : 0, marginBottom: 10 }}>Pasados</div>
          {pasados.map(renderMatch)}
        </>
      )}
    </div>
  );
}

/* ---------------- Chat ---------------- */

function ChatTab({ mensajes }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  return (
    <div>
      <CategoryChips category={category} setCategory={setCategory} />
      <ChatView mensajes={mensajes} category={category} authorName="Profesor/a" authorRole="admin" />
    </div>
  );
}

/* ---------------- Anuncios ---------------- */

function AnunciosTab({ anuncios, onCreate, onDelete }) {
  const [category, setCategory] = useState("Todas");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const sorted = [...anuncios].sort((a, b) => (b.ts || 0) - (a.ts || 0));

  const publish = async () => {
    if (!text.trim()) return;
    setSending(true);
    await onCreate({ text: text.trim(), category });
    setText("");
    setSending(false);
  };

  return (
    <div>
      <div style={styles.card}>
        <div style={{ ...styles.sectionLabel, marginBottom: 8 }}>Nuevo anuncio para:</div>
        <div style={styles.chipsRow}>
          {["Todas", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCategory(c)} style={{ ...styles.chip, ...(category === c ? styles.chipActive : {}) }}>{c}</button>
          ))}
        </div>
        <textarea
          style={{ ...styles.input, minHeight: 70, resize: "vertical", fontFamily: "inherit" }}
          placeholder="Escribe tu anuncio..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button style={styles.primaryBtn} onClick={publish} disabled={sending}>
          <Megaphone size={16} /> {sending ? "Publicando..." : "Publicar"}
        </button>
      </div>

      {sorted.length === 0 && <EmptyState text="Todavía no has publicado ningún anuncio." />}
      {sorted.map((a) => (
        <div key={a.id} style={styles.announcementCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={styles.announcementCategory}>{a.category === "Todas" ? "Toda la academia" : a.category}</div>
            {confirmId === a.id ? (
              <div style={styles.rowGap}>
                <button style={styles.dangerBtn} onClick={() => { onDelete(a.id); setConfirmId(null); }}>Eliminar</button>
                <button style={styles.ghostBtnSmall} onClick={() => setConfirmId(null)}><X size={14} /></button>
              </div>
            ) : (
              <button style={styles.iconBtn} onClick={() => setConfirmId(a.id)}>
                <Trash2 size={14} color="#7FA0B0" />
              </button>
            )}
          </div>
          <div style={{ fontSize: 14, color: "#F2E9D8", marginTop: 2 }}>{a.text}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Estadísticas ---------------- */

function EstadisticasTab({ players, totalsFor, matches, asistencias, onReset }) {
  const [category, setCategory] = useState("Todas");
  const [query, setQuery] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    let list = players;
    if (category !== "Todas") list = list.filter((p) => p.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list
      .map((p) => ({ ...p, totals: totalsFor(p.id) }))
      .sort((a, b) => {
        const sumA = FUNDAMENTOS.reduce((s, f) => s + a.totals[f.key].acierto + a.totals[f.key].error, 0);
        const sumB = FUNDAMENTOS.reduce((s, f) => s + b.totals[f.key].acierto + b.totals[f.key].error, 0);
        return sumB - sumA;
      });
  }, [players, category, query, totalsFor]);

  const teamTotals = useMemo(() => {
    const t = emptyTotals();
    filtered.forEach((p) => {
      FUNDAMENTOS.forEach((f) => {
        t[f.key].acierto += p.totals[f.key].acierto;
        t[f.key].error += p.totals[f.key].error;
      });
    });
    return t;
  }, [filtered]);

  return (
    <div>
      {!confirmReset ? (
        <button
          style={{ ...styles.ghostBtn, width: "100%", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          onClick={() => setConfirmReset(true)}
        >
          <AlertTriangle size={14} /> Restablecer estadísticas
        </button>
      ) : (
        <div style={{ ...styles.card, borderColor: ERROR_COLOR }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={18} color={ERROR_COLOR} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: "#F2E9D8" }}>
              Esto borra <b>todos</b> los registros de saque, ataque, bloqueo y recibo de
              <b> todas las jugadoras y partidos</b>. No se puede deshacer. Las jugadoras y
              los partidos se conservan.
            </div>
          </div>
          <div style={styles.rowGap}>
            <button
              style={styles.dangerBtn}
              disabled={resetting}
              onClick={async () => {
                setResetting(true);
                await onReset();
                setResetting(false);
                setConfirmReset(false);
              }}
            >
              {resetting ? "Borrando..." : "Sí, borrar todo"}
            </button>
            <button style={styles.ghostBtnSmall} onClick={() => setConfirmReset(false)} disabled={resetting}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={styles.chipsRow}>
        {["Todas", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCategory(c)} style={{ ...styles.chip, ...(category === c ? styles.chipActive : {}) }}>{c}</button>
        ))}
      </div>
      <div style={styles.searchWrap}>
        <Search size={15} color="#7FA0B0" />
        <input style={styles.searchInput} placeholder="Buscar jugador/a..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div style={styles.summaryGrid}>
        {FUNDAMENTOS.map((f) => {
          const Icon = f.icon;
          const t = teamTotals[f.key];
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
      {filtered.length === 0 && <EmptyState text="No hay estadísticas para mostrar todavía." />}
      <div className="atlantis-cardgrid" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((p) => {
          const total = FUNDAMENTOS.reduce((s, f) => s + p.totals[f.key].acierto + p.totals[f.key].error, 0);
          const misPartidos = matches.filter((m) => m.category === p.category);
          const mvpCount = misPartidos.filter((m) => m.mvpId === p.id).length;
          const misAsist = asistencias.filter((a) => a.playerId === p.id);
          const presentes = misAsist.filter((a) => a.presente).length;
          const asistPct = misAsist.length ? Math.round((presentes / misAsist.length) * 100) : null;
          const isOpen = expandedId === p.id;
          return (
            <div key={p.id} style={styles.card}>
              <div style={{ ...styles.playerRow, cursor: "pointer" }} onClick={() => setExpandedId(isOpen ? null : p.id)}>
                <Avatar player={p} />
                <div style={{ flex: 1 }}>
                  <div style={styles.playerName}>{p.name}</div>
                  <div style={styles.playerMeta}>{p.category} · {total} acciones</div>
                </div>
                <ChevronRight size={18} color="#7FA0B0" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
              </div>

              {(mvpCount > 0 || asistPct !== null) && (
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {mvpCount > 0 && (
                    <div style={{ ...styles.mvpBtn, ...styles.mvpBtnActive }}>
                      <Trophy size={13} /> MVP x{mvpCount}
                    </div>
                  )}
                  {asistPct !== null && (
                    <div style={styles.attendanceBtn}>
                      <CalendarCheck size={13} /> Asistencia {asistPct}% ({presentes}/{misAsist.length})
                    </div>
                  )}
                </div>
              )}

              <StatSummaryTiles totals={p.totals} />
              {isOpen && (
                <>
                  <PlayerBars totals={p.totals} />
                  <ProgressChart playerId={p.id} matches={misPartidos} totalsFor={totalsFor} />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Compartidos ---------------- */

function CategoryChips({ category, setCategory }) {
  return (
    <div style={styles.chipsRow}>
      {CATEGORIES.map((c) => (
        <button key={c} onClick={() => setCategory(c)} style={{ ...styles.chip, ...(category === c ? styles.chipActive : {}) }}>{c}</button>
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIconWrap}>
        <Waves size={26} color="#3FB8AE" />
      </div>
      <div style={styles.emptyText}>{text}</div>
    </div>
  );
}

function SideNav({ tab, setTab, pendingCount }) {
  const items = [
    { key: "solicitudes", label: "Solicitudes", icon: Inbox, badge: pendingCount },
    { key: "equipo", label: "Equipo", icon: Users },
    { key: "registrar", label: "Registrar", icon: Plus },
    { key: "historial", label: "Partidos", icon: Calendar },
    { key: "estadisticas", label: "Estadísticas", icon: BarChart3 },
    { key: "anuncios", label: "Anuncios", icon: Megaphone },
    { key: "chat", label: "Chat", icon: MessageCircle },
  ];
  return (
    <div className="atlantis-sidenav" style={styles.sideNav}>
      {items.map((it) => {
        const Icon = it.icon;
        const active = tab === it.key;
        return (
          <button
            key={it.key}
            onClick={() => setTab(it.key)}
            style={{ ...styles.sideNavBtn, ...(active ? styles.sideNavBtnActive : {}) }}
          >
            <Icon size={18} strokeWidth={active ? 2.4 : 2} />
            <span>{it.label}</span>
            {!!it.badge && (
              <span style={{ marginLeft: "auto", background: "#E2664B", color: "#08141F", fontSize: 10, fontWeight: 800, borderRadius: 8, padding: "1px 7px" }}>
                {it.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function BottomNav({ tab, setTab, pendingCount }) {
  const items = [
    { key: "solicitudes", label: "Solicitudes", icon: Inbox, badge: pendingCount },
    { key: "equipo", label: "Equipo", icon: Users },
    { key: "registrar", label: "Registrar", icon: Plus },
    { key: "historial", label: "Partidos", icon: Calendar },
    { key: "estadisticas", label: "Stats", icon: BarChart3 },
    { key: "anuncios", label: "Anuncios", icon: Megaphone },
    { key: "chat", label: "Chat", icon: MessageCircle },
  ];
  return (
    <div className="atlantis-bottomnav" style={{ ...styles.bottomNav, overflowX: "auto" }}>
      {items.map((it) => {
        const Icon = it.icon;
        const active = tab === it.key;
        return (
          <button
            key={it.key}
            onClick={() => setTab(it.key)}
            style={{
              ...styles.navBtn,
              ...(active ? styles.navBtnActive : {}),
              flex: "0 0 68px",
              color: active ? "#D9A544" : "#7FA0B0",
              position: "relative",
            }}
          >
            <Icon size={18} strokeWidth={active ? 2.4 : 2} />
            {!!it.badge && (
              <span style={{ position: "absolute", top: -2, right: "28%", background: "#E2664B", color: "#08141F", fontSize: 9, fontWeight: 800, borderRadius: 8, padding: "1px 5px" }}>
                {it.badge}
              </span>
            )}
            <span style={{ fontSize: 9.5, marginTop: 3, fontWeight: active ? 700 : 500 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
