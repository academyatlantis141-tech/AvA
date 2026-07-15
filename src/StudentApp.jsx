import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ChevronLeft, UserPlus, Search, Check, Clock, Waves, MessageCircle,
  Megaphone, Calendar, Trophy, Camera, CalendarCheck
} from "lucide-react";
import { CATEGORIES, styles, emptyTotals, fmtDate, todayISO, loadFont, requestNotificationPermission, notify, resizeImageToBase64 } from "./shared.js";
import { subJugadores, subRegistros, subMensajes, subPartidos, subAnuncios, subAsistencias, crearSolicitud } from "./db.js";
import PlayerBars, { StatSummaryTiles } from "./PlayerBars.jsx";
import ChatView from "./ChatView.jsx";
import Avatar from "./Avatar.jsx";
import ProgressChart from "./ProgressChart.jsx";

export default function StudentApp({ onBack }) {
  const [view, setView] = useState("menu"); // menu | crear | enviado | misStats | chat | anuncios | calendario
  const [jugadores, setJugadores] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myIdentity, setMyIdentity] = useState(null); // { name, category }

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

  // Notificaciones: mensajes nuevos en el chat de mi categoría, de alguien más
  const seenMensajes = useRef(null);
  useEffect(() => {
    const ids = new Set(mensajes.map((m) => m.id));
    if (seenMensajes.current && myIdentity) {
      mensajes.forEach((m) => {
        const isNew = !seenMensajes.current.has(m.id);
        const isMine = m.authorName === myIdentity.name && m.authorRole === "estudiante";
        if (isNew && !isMine && m.category === myIdentity.category) {
          notify(`${m.authorName} · ${m.category}`, m.text);
        }
      });
    }
    seenMensajes.current = ids;
  }, [mensajes, myIdentity]);

  // Notificaciones: anuncios nuevos que apliquen a mi categoría
  const seenAnuncios = useRef(null);
  useEffect(() => {
    const ids = new Set(anuncios.map((a) => a.id));
    if (seenAnuncios.current) {
      anuncios.forEach((a) => {
        const isNew = !seenAnuncios.current.has(a.id);
        const applies = a.category === "Todas" || !myIdentity || a.category === myIdentity.category;
        if (isNew && applies) {
          notify("Nuevo anuncio", a.text);
        }
      });
    }
    seenAnuncios.current = ids;
  }, [anuncios, myIdentity]);

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

  return (
    <div style={styles.app} className="atlantis-shell">
      <div style={styles.header}>
        <div style={styles.headerRow}>
          <button style={styles.iconBtn} onClick={() => (view === "menu" ? onBack() : setView("menu"))}>
            <ChevronLeft size={20} color="#7FA0B0" />
          </button>
          <img src="/logo.png" alt="Atlantis Academy" style={{ width: 30, height: 30, objectFit: "contain" }} />
          <div>
            <div style={styles.brand}>ATLANTIS ACADEMY</div>
            <div style={styles.tabTitle}>Estudiantes</div>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {view === "menu" && <MenuView setView={setView} />}
        {view === "crear" && <CrearPerfilView onDone={() => setView("enviado")} />}
        {view === "enviado" && <EnviadoView onBack={() => setView("menu")} />}
        {view === "misStats" && (
          <MisStatsView
            jugadores={jugadores}
            loading={loading}
            totalsFor={totalsFor}
            partidos={partidos}
            asistencias={asistencias}
          />
        )}
        {view === "chat" && (
          <ChatEntryView
            jugadores={jugadores}
            loading={loading}
            mensajes={mensajes}
            onIdentify={(p) => setMyIdentity({ name: p.name, category: p.category })}
          />
        )}
        {view === "anuncios" && <AnnouncementsView anuncios={anuncios} />}
        {view === "calendario" && <CalendarView partidos={partidos} />}
      </div>
    </div>
  );
}

function MenuView({ setView }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
      <button style={styles.landingBtn} onClick={() => setView("crear")}>
        <UserPlus size={22} color="#D9A544" />
        Crear mi perfil
      </button>
      <button style={styles.landingBtn} onClick={() => setView("misStats")}>
        <Search size={22} color="#3FB8AE" />
        Ver mis estadísticas
      </button>
      <button style={styles.landingBtn} onClick={() => setView("chat")}>
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

function CrearPerfilView({ onDone }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
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
      await crearSolicitud({ name: name.trim(), category, number: number.trim(), photo });
      onDone();
    } catch (e) {
      setError("No se pudo enviar. Revisa tu conexión e intenta de nuevo.");
      setSending(false);
    }
  };

  return (
    <div>
      <div style={{ ...styles.sectionLabel, marginBottom: 12 }}>
        Llena tus datos. Tu profesor(a) va a aprobar tu perfil antes de que aparezca.
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
      <Clock size={30} color="#D9A544" />
      <div style={{ ...styles.playerName, marginTop: 6 }}>¡Perfil enviado!</div>
      <div style={styles.emptyText}>
        Tu profesor(a) va a revisar y aprobar tu perfil pronto. Después de eso vas a poder
        ver tus estadísticas en "Ver mis estadísticas".
      </div>
      <button style={{ ...styles.ghostBtn, marginTop: 10 }} onClick={onBack}>
        Volver al menú
      </button>
    </div>
  );
}

function ChatEntryView({ jugadores, loading, mensajes, onIdentify }) {
  const [category, setCategory] = useState("Todas");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    let list = jugadores;
    if (category !== "Todas") list = list.filter((p) => p.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [jugadores, category, query]);

  if (loading) {
    return (
      <div style={styles.emptyState}>
        <Waves size={26} color="#2B4F5F" />
        <div style={styles.emptyText}>Cargando...</div>
      </div>
    );
  }

  if (selected) {
    return (
      <div>
        <button style={{ ...styles.ghostBtn, marginBottom: 14 }} onClick={() => setSelected(null)}>
          ← Salir del chat
        </button>
        <ChatView
          mensajes={mensajes}
          category={selected.category}
          authorName={selected.name}
          authorRole="estudiante"
        />
      </div>
    );
  }

  return (
    <div>
      <div style={{ ...styles.sectionLabel, marginBottom: 12 }}>
        Busca tu nombre para entrar al chat de tu categoría.
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
      <div style={styles.searchWrap}>
        <Search size={15} color="#7FA0B0" />
        <input
          style={styles.searchInput}
          placeholder="Busca tu nombre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {filtered.length === 0 && (
        <div style={styles.emptyText}>
          No encontramos tu nombre. Si acabas de crear tu perfil, espera a que tu profesor(a) lo apruebe.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((p) => (
          <div key={p.id} style={{ ...styles.playerRow, cursor: "pointer" }} onClick={() => { setSelected(p); onIdentify(p); }}>
            <Avatar player={p} />
            <div>
              <div style={styles.playerName}>{p.name}</div>
              <div style={styles.playerMeta}>{p.category}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MisStatsView({ jugadores, loading, totalsFor, partidos, asistencias }) {
  const [category, setCategory] = useState("Todas");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    let list = jugadores;
    if (category !== "Todas") list = list.filter((p) => p.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [jugadores, category, query]);

  if (loading) {
    return (
      <div style={styles.emptyState}>
        <Waves size={26} color="#2B4F5F" />
        <div style={styles.emptyText}>Cargando...</div>
      </div>
    );
  }

  if (selected) {
    const totals = totalsFor(selected.id);
    const total = Object.values(totals).reduce((s, t) => s + t.acierto + t.error, 0);
    const misPartidos = partidos.filter((m) => m.category === selected.category);
    const mvpCount = misPartidos.filter((m) => m.mvpId === selected.id).length;
    const misAsistencias = asistencias.filter((a) => a.playerId === selected.id);
    const presentes = misAsistencias.filter((a) => a.presente).length;
    const asistenciaPct = misAsistencias.length ? Math.round((presentes / misAsistencias.length) * 100) : null;

    return (
      <div>
        <button style={{ ...styles.ghostBtn, marginBottom: 14 }} onClick={() => setSelected(null)}>
          ← Buscar otro nombre
        </button>
        <div style={styles.card}>
          <div style={styles.playerRow}>
            <Avatar player={selected} size={44} />
            <div>
              <div style={styles.playerName}>{selected.name}</div>
              <div style={styles.playerMeta}>{selected.category} · {total} acciones registradas</div>
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

          <StatSummaryTiles totals={totals} />
          <PlayerBars totals={totals} />
          <ProgressChart playerId={selected.id} matches={misPartidos} totalsFor={totalsFor} />
        </div>
      </div>
    );
  }

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
      <div style={styles.searchWrap}>
        <Search size={15} color="#7FA0B0" />
        <input
          style={styles.searchInput}
          placeholder="Busca tu nombre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {filtered.length === 0 && (
        <div style={styles.emptyText}>
          No encontramos tu nombre. Si acabas de crear tu perfil, espera a que tu profesor(a) lo apruebe.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((p) => (
          <div key={p.id} style={{ ...styles.playerRow, cursor: "pointer" }} onClick={() => setSelected(p)}>
            <Avatar player={p} />
            <div>
              <div style={styles.playerName}>{p.name}</div>
              <div style={styles.playerMeta}>{p.category}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnnouncementsView({ anuncios }) {
  const [category, setCategory] = useState("Todas");

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

function CalendarView({ partidos }) {
  const [category, setCategory] = useState("Todas");
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
