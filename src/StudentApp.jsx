import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ChevronLeft, UserPlus, Check, Clock, Waves, MessageCircle,
  Megaphone, Calendar, Trophy, Camera, CalendarCheck, LogIn, LogOut, KeyRound
} from "lucide-react";
import { CATEGORIES, POSICIONES, styles, emptyTotals, fmtDate, todayISO, loadFont, requestNotificationPermission, notify, resizeImageToBase64, fundamentosFor } from "./shared.js";
import { subJugadores, subRegistros, subMensajes, subPartidos, subAnuncios, subAsistencias, crearSolicitud } from "./db.js";
import PlayerBars, { StatSummaryTiles } from "./PlayerBars.jsx";
import ChatView from "./ChatView.jsx";
import Avatar from "./Avatar.jsx";
import ProgressChart from "./ProgressChart.jsx";

const SESSION_KEY = "atlantis-mi-perfil-id";

export default function StudentApp({ onBack }) {
  const [view, setView] = useState("menu"); // menu | crear | enviado | login | misStats | chat | anuncios | calendario
  const [jugadores, setJugadores] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myPlayerId, setMyPlayerId] = useState(() => {
    try { return window.localStorage.getItem(SESSION_KEY) || null; } catch { return null; }
  });

  useEffect(() => {
    loadFont();
    requestNotificationPermission();
    const u1 = subJugadores((data) => { setJugadores(data); setLoading(false); });
    const u2 = subRegistros(setRegistros);
    const u3 = subMensajes(setMensajes);
    const u4 = subPartidos(setPartidos);
    const u5 = subAnuncios(setAnuncios);
    const u6 = subAsistencias(setAsistencias);
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); };
  }, []);

  const myPlayer = useMemo(
    () => jugadores.find((p) => p.id === myPlayerId) || null,
    [jugadores, myPlayerId]
  );

  // Si el id guardado ya no existe (perfil eliminado), cerramos sesión localmente.
  useEffect(() => {
    if (!loading && myPlayerId && jugadores.length > 0 && !myPlayer) {
      logout();
    }
  }, [loading, myPlayerId, jugadores, myPlayer]);

  const login = (player) => {
    setMyPlayerId(player.id);
    try { window.localStorage.setItem(SESSION_KEY, player.id); } catch {}
  };
  const logout = () => {
    setMyPlayerId(null);
    try { window.localStorage.removeItem(SESSION_KEY); } catch {}
    setView("menu");
  };

  // Notificaciones: mensajes nuevos en el chat de mi categoría, de alguien más
  const seenMensajes = useRef(null);
  useEffect(() => {
    const ids = new Set(mensajes.map((m) => m.id));
    if (seenMensajes.current && myPlayer) {
      mensajes.forEach((m) => {
        const isNew = !seenMensajes.current.has(m.id);
        const isMine = m.authorName === myPlayer.name && m.authorRole === "estudiante";
        if (isNew && !isMine && m.category === myPlayer.category) {
          notify(`${m.authorName} · ${m.category}`, m.text);
        }
      });
    }
    seenMensajes.current = ids;
  }, [mensajes, myPlayer]);

  // Notificaciones: anuncios nuevos que apliquen a mi categoría
  const seenAnuncios = useRef(null);
  useEffect(() => {
    const ids = new Set(anuncios.map((a) => a.id));
    if (seenAnuncios.current) {
      anuncios.forEach((a) => {
        const isNew = !seenAnuncios.current.has(a.id);
        const applies = a.category === "Todas" || !myPlayer || a.category === myPlayer.category;
        if (isNew && applies) {
          notify("Nuevo anuncio", a.text);
        }
      });
    }
    seenAnuncios.current = ids;
  }, [anuncios, myPlayer]);

  const totalsFor = useCallback(
    (playerId, matchId = null) => {
      const t = emptyTotals();
      for (const r of registros) {
        if (r.playerId !== playerId) continue;
        if (matchId && r.matchId !== matchId) continue;
        if (!t[r.statKey]) continue;
        t[r.statKey][r.result] = (t[r.statKey][r.result] || 0) + 1;
      }
      return t;
    },
    [registros]
  );

  const goProtected = (target) => {
    setView(myPlayer ? target : "login");
  };

  return (
    <div style={styles.app} className="atlantis-shell">
      <div style={styles.header}>
        <div style={styles.headerRow}>
          <button style={styles.iconBtn} onClick={() => (view === "menu" ? onBack() : setView("menu"))}>
            <ChevronLeft size={20} color="#7FA0B0" />
          </button>
          <img src="/logo.png" alt="Atlantis Academy" style={{ width: 30, height: 30, objectFit: "contain" }} />
          <div style={{ flex: 1 }}>
            <div style={styles.brand}>ATLANTIS ACADEMY</div>
            <div style={styles.tabTitle}>Estudiantes</div>
          </div>
          {myPlayer && view === "menu" && (
            <button style={styles.iconBtn} onClick={logout} title="Cerrar sesión">
              <LogOut size={18} color="#7FA0B0" />
            </button>
          )}
        </div>
      </div>

      <div style={styles.content}>
        {view === "menu" && <MenuView myPlayer={myPlayer} setView={setView} goProtected={goProtected} />}
        {view === "crear" && <CrearPerfilView onDone={() => setView("enviado")} />}
        {view === "enviado" && <EnviadoView onBack={() => setView("menu")} />}
        {view === "login" && (
          <LoginView
            jugadores={jugadores}
            loading={loading}
            onSuccess={(p) => { login(p); setView("menu"); }}
            onCancel={() => setView("menu")}
          />
        )}
        {view === "misStats" && myPlayer && (
          <MisStatsView player={myPlayer} totalsFor={totalsFor} partidos={partidos} asistencias={asistencias} />
        )}
        {view === "chat" && myPlayer && (
          <div>
            <ChatView mensajes={mensajes} category={myPlayer.category} authorName={myPlayer.name} authorRole="estudiante" />
          </div>
        )}
        {view === "anuncios" && <AnnouncementsView anuncios={anuncios} defaultCategory={myPlayer?.category} />}
        {view === "calendario" && <CalendarView partidos={partidos} defaultCategory={myPlayer?.category} />}
      </div>
    </div>
  );
}

function MenuView({ myPlayer, setView, goProtected }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
      {myPlayer && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <Avatar player={myPlayer} size={48} />
          <div>
            <div style={styles.playerName}>Hola, {myPlayer.name}</div>
            <div style={styles.playerMeta}>{myPlayer.category}{myPlayer.posicion ? " · " + myPlayer.posicion : ""}</div>
          </div>
        </div>
      )}

      {!myPlayer && (
        <button style={styles.landingBtn} onClick={() => setView("login")}>
          <LogIn size={22} color="#3FB8AE" />
          Iniciar sesión con mi código
        </button>
      )}
      <button style={styles.landingBtn} onClick={() => setView("crear")}>
        <UserPlus size={22} color="#D9A544" />
        Crear mi perfil
      </button>
      <button style={styles.landingBtn} onClick={() => goProtected("misStats")}>
        <Trophy size={22} color="#3FB8AE" />
        Ver mis estadísticas
      </button>
      <button style={styles.landingBtn} onClick={() => goProtected("chat")}>
        <MessageCircle size={22} color="#7BC67E" />
        Chatear con mi categoría
      </button>
      <button style={styles.landingBtn} onClick={() => setView("anuncios")}>
        <Megaphone size={22} color="#D9A544" />
        Anuncios
      </button>
      <button style={styles.landingBtn} onClick={() => setView("calendario")}>
        <Calendar size={22} color="#3FB8AE" />
        Calendario
      </button>
    </div>
  );
}

function LoginView({ jugadores, loading, onSuccess, onCancel }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState(null);

  const submit = () => {
    const match = jugadores.find((p) => p.codigo === codigo.trim());
    if (match) {
      onSuccess(match);
    } else {
      setError("Código incorrecto. Pídeselo a tu profesor(a).");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={styles.emptyIconWrap}>
          <KeyRound size={24} color="#D9A544" />
        </div>
        <div style={{ ...styles.sectionLabel, textAlign: "center" }}>
          Escribe el código de 4 dígitos que te dio tu profesor(a)
        </div>
      </div>
      <input
        style={{ ...styles.input, textAlign: "center", fontSize: 22, letterSpacing: 6 }}
        placeholder="0000"
        inputMode="numeric"
        maxLength={4}
        value={codigo}
        onChange={(e) => { setCodigo(e.target.value.replace(/\D/g, "")); setError(null); }}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        disabled={loading}
      />
      {error && <div style={{ color: "#E2664B", fontSize: 12, marginBottom: 10, textAlign: "center" }}>{error}</div>}
      <div style={styles.rowGap}>
        <button style={styles.primaryBtn} onClick={submit} disabled={loading || codigo.length < 4}>
          <LogIn size={16} /> {loading ? "Cargando..." : "Entrar"}
        </button>
        <button style={styles.ghostBtn} onClick={onCancel}>Cancelar</button>
      </div>
      <div style={{ ...styles.emptyText, marginTop: 16, textAlign: "center" }}>
        ¿Todavía no tienes código? Primero crea tu perfil y espera a que tu profesor(a) lo apruebe —
        ahí te va a dar tu código personal.
      </div>
    </div>
  );
}

function CrearPerfilView({ onDone }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [posicion, setPosicion] = useState("");
  const [number, setNumber] = useState("");
  const [photo, setPhoto] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageToBase64(file, 200);
      setPhoto(dataUrl);
    } catch {
      setError("No se pudo cargar la foto. Intenta con otra imagen.");
    }
  };

  const submit = async () => {
    if (!name.trim()) return;
    setSending(true);
    try {
      await crearSolicitud({ name: name.trim(), category, number: number.trim(), photo, posicion });
      onDone();
    } catch (e) {
      setError("No se pudo enviar. Revisa tu conexión e intenta de nuevo.");
      setSending(false);
    }
  };

  return (
    <div>
      <div style={{ ...styles.sectionLabel, marginBottom: 12 }}>
        Llena tus datos. Tu profesor(a) va a aprobar tu perfil y te va a dar un código personal
        para entrar solo a tus propias estadísticas.
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <label style={{ position: "relative", cursor: "pointer" }}>
          {photo ? (
            <img src={photo} alt="Tu foto" style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover", border: "2px solid #D9A544" }} />
          ) : (
            <div style={{ ...styles.avatarSmall, width: 84, height: 84, fontSize: 13, flexDirection: "column", gap: 4 }}>
              <Camera size={20} color="#D9A544" />
            </div>
          )}
          <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
        </label>
      </div>
      <div style={{ ...styles.emptyText, textAlign: "center", marginBottom: 14 }}>
        Toca el círculo para agregar tu foto (opcional)
      </div>

      <input
        style={styles.input}
        placeholder="Tu nombre completo"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        style={styles.input}
        placeholder="Número de camiseta (opcional)"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
      />
      <div style={{ ...styles.sectionLabel, marginBottom: 8 }}>Tu categoría</div>
      <div style={styles.chipsRow}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{ ...styles.chip, ...(category === c ? styles.chipActive : {}) }}
          >
            {c}
          </button>
        ))}
      </div>
      <div style={{ ...styles.sectionLabel, marginBottom: 8 }}>Tu posición (opcional)</div>
      <div style={styles.chipsRow}>
        {POSICIONES.map((pos) => (
          <button
            key={pos}
            onClick={() => setPosicion(posicion === pos ? "" : pos)}
            style={{ ...styles.chip, ...(posicion === pos ? styles.chipActive : {}) }}
          >
            {pos}
          </button>
        ))}
      </div>
      {posicion === "Pasadora" && (
        <div style={{ ...styles.emptyText, marginBottom: 10 }}>
          Como pasadora, también vas a poder llevar tu estadística de voleo.
        </div>
      )}
      {error && <div style={{ color: "#E2664B", fontSize: 12, marginBottom: 10 }}>{error}</div>}
      <button style={styles.primaryBtn} onClick={submit} disabled={sending}>
        <Check size={16} /> {sending ? "Enviando..." : "Enviar mi perfil"}
      </button>
    </div>
  );
}

function EnviadoView({ onBack }) {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIconWrap}>
        <Clock size={24} color="#D9A544" />
      </div>
      <div style={{ ...styles.playerName, marginTop: 6 }}>¡Perfil enviado!</div>
      <div style={styles.emptyText}>
        Tu profesor(a) va a revisar tu perfil y darte un código personal de 4 dígitos.
        Con ese código vas a poder entrar solo a tus propias estadísticas, en "Iniciar sesión".
      </div>
      <button style={{ ...styles.ghostBtn, marginTop: 10 }} onClick={onBack}>
        Volver al menú
      </button>
    </div>
  );
}

function MisStatsView({ player, totalsFor, partidos, asistencias }) {
  const totals = totalsFor(player.id);
  const total = Object.values(totals).reduce((s, t) => s + t.acierto + t.error, 0);
  const misPartidos = partidos.filter((m) => m.category === player.category);
  const mvpCount = misPartidos.filter((m) => m.mvpId === player.id).length;
  const misAsistencias = asistencias.filter((a) => a.playerId === player.id);
  const presentes = misAsistencias.filter((a) => a.presente).length;
  const asistenciaPct = misAsistencias.length ? Math.round((presentes / misAsistencias.length) * 100) : null;

  return (
    <div>
      <div style={styles.card}>
        <div style={styles.playerRow}>
          <Avatar player={player} size={44} />
          <div>
            <div style={styles.playerName}>{player.name}</div>
            <div style={styles.playerMeta}>{player.category}{player.posicion ? " · " + player.posicion : ""} · {total} acciones registradas</div>
          </div>
        </div>

        {(mvpCount > 0 || asistenciaPct !== null) && (
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            {mvpCount > 0 && (
              <div style={{ ...styles.mvpBtn, ...styles.mvpBtnActive }}>
                <Trophy size={13} /> MVP x{mvpCount}
              </div>
            )}
            {asistenciaPct !== null && (
              <div style={styles.attendanceBtn}>
                <CalendarCheck size={13} /> Asistencia {asistenciaPct}% ({presentes}/{misAsistencias.length})
              </div>
            )}
          </div>
        )}

        <StatSummaryTiles totals={totals} fundamentos={fundamentosFor(player)} />
        <PlayerBars totals={totals} fundamentos={fundamentosFor(player)} />
        <ProgressChart playerId={player.id} matches={misPartidos} totalsFor={totalsFor} />
      </div>
    </div>
  );
}

function AnnouncementsView({ anuncios, defaultCategory }) {
  const [category, setCategory] = useState(defaultCategory || "Todas");

  const filtered = anuncios
    .filter((a) => category === "Todas" || a.category === "Todas" || a.category === category)
    .slice()
    .sort((a, b) => (b.ts || 0) - (a.ts || 0));

  return (
    <div>
      <div style={{ ...styles.sectionLabel, marginBottom: 12 }}>
        Filtra por tu categoría para ver solo lo que te aplica.
      </div>
      <div style={styles.chipsRow}>
        {["Todas", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{ ...styles.chip, ...(category === c ? styles.chipActive : {}) }}
          >
            {c}
          </button>
        ))}
      </div>
      {filtered.length === 0 && <div style={styles.emptyText}>No hay anuncios todavía.</div>}
      {filtered.map((a) => (
        <div key={a.id} style={styles.announcementCard}>
          <div style={styles.announcementCategory}>{a.category === "Todas" ? "Toda la academia" : a.category}</div>
          <div style={{ fontSize: 14, color: "#F2E9D8" }}>{a.text}</div>
        </div>
      ))}
    </div>
  );
}

function CalendarView({ partidos, defaultCategory }) {
  const [category, setCategory] = useState(defaultCategory || "Todas");
  const today = todayISO();

  const filtered = partidos
    .filter((m) => category === "Todas" || m.category === category)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  return (
    <div>
      <div style={styles.chipsRow}>
        {["Todas", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{ ...styles.chip, ...(category === c ? styles.chipActive : {}) }}
          >
            {c}
          </button>
        ))}
      </div>
      {filtered.length === 0 && <div style={styles.emptyText}>No hay partidos ni entrenamientos programados.</div>}
      {filtered.map((m) => {
        const upcoming = m.date >= today;
        const [, mm, dd] = (m.date || "").split("-");
        return (
          <div key={m.id} style={{ ...styles.calendarItem, ...(upcoming ? styles.calendarItemUpcoming : {}) }}>
            <div style={styles.calendarDateBox}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#D9A544" }}>{dd}</div>
              <div style={{ fontSize: 9, color: "#7FA0B0" }}>/{mm}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.playerName}>{m.label}</div>
              <div style={styles.playerMeta}>{m.category}{upcoming ? " · Próximo" : ""}</div>
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
          </div>
        );
      })}
    </div>
  );
}
