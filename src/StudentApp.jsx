import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, UserPlus, Search, Check, Clock, Waves } from "lucide-react";
import { CATEGORIES, styles, emptyTotals, loadFont } from "./shared.js";
import { subJugadores, subRegistros, crearSolicitud } from "./db.js";
import PlayerBars from "./PlayerBars.jsx";

export default function StudentApp({ onBack }) {
  const [view, setView] = useState("menu"); // menu | crear | enviado | misStats
  const [jugadores, setJugadores] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFont();
    const u1 = subJugadores((data) => { setJugadores(data); setLoading(false); });
    const u2 = subRegistros(setRegistros);
    return () => { u1(); u2(); };
  }, []);

  const totalsFor = useCallback(
    (playerId) => {
      const t = emptyTotals();
      for (const r of registros) {
        if (r.playerId !== playerId) continue;
        if (!t[r.statKey]) continue;
        t[r.statKey][r.result] = (t[r.statKey][r.result] || 0) + 1;
      }
      return t;
    },
    [registros]
  );

  return (
    <div style={styles.app}>
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
          />
        )}
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
    </div>
  );
}

function CrearPerfilView({ onDone }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [number, setNumber] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!name.trim()) return;
    setSending(true);
    try {
      await crearSolicitud({ name: name.trim(), category, number: number.trim() });
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

function MisStatsView({ jugadores, loading, totalsFor }) {
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
    return (
      <div>
        <button style={{ ...styles.ghostBtn, marginBottom: 14 }} onClick={() => setSelected(null)}>
          ← Buscar otro nombre
        </button>
        <div style={styles.card}>
          <div style={styles.playerRow}>
            <div style={styles.avatarSmall}>
              {selected.number ? selected.number : selected.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={styles.playerName}>{selected.name}</div>
              <div style={styles.playerMeta}>{selected.category} · {total} acciones registradas</div>
            </div>
          </div>
          <PlayerBars totals={totals} />
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
            <div style={styles.avatarSmall}>
              {p.number ? p.number : p.name.charAt(0).toUpperCase()}
            </div>
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
