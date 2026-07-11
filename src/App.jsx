import React, { useState } from "react";
import { Shield, GraduationCap, Lock } from "lucide-react";
import { styles, loadFont } from "./shared.js";
import { ADMIN_PIN } from "./firebaseConfig.js";
import AdminApp from "./AdminApp.jsx";
import StudentApp from "./StudentApp.jsx";

const SESSION_KEY = "atlantis-admin-ok";

export default function App() {
  const [view, setView] = useState("landing"); // landing | pin | admin | student

  React.useEffect(() => {
    loadFont();
    if (sessionStorage.getItem(SESSION_KEY) === "yes") {
      // ya validó el PIN en esta sesión del navegador
    }
  }, []);

  if (view === "admin") {
    return (
      <AdminApp
        onLogout={() => {
          sessionStorage.removeItem(SESSION_KEY);
          setView("landing");
        }}
      />
    );
  }

  if (view === "student") {
    return <StudentApp onBack={() => setView("landing")} />;
  }

  if (view === "pin") {
    return (
      <PinScreen
        onBack={() => setView("landing")}
        onSuccess={() => {
          sessionStorage.setItem(SESSION_KEY, "yes");
          setView("admin");
        }}
      />
    );
  }

  return (
    <div style={styles.app}>
      <div style={styles.landingWrap}>
        <img src="/logo.png" alt="Atlantis Academy" style={{ width: 150, height: "auto" }} />
        <div style={{ fontSize: 13, color: "#7FA0B0", marginBottom: 10, marginTop: -6 }}>
          Estadísticas de voleibol
        </div>

        <button
          style={styles.landingBtn}
          onClick={() => {
            if (sessionStorage.getItem(SESSION_KEY) === "yes") setView("admin");
            else setView("pin");
          }}
        >
          <Shield size={22} color="#D9A544" />
          Soy administrador/a
        </button>

        <button style={styles.landingBtn} onClick={() => setView("student")}>
          <GraduationCap size={22} color="#3FB8AE" />
          Soy estudiante
        </button>
      </div>
    </div>
  );
}

function PinScreen({ onBack, onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (pin === ADMIN_PIN) {
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div style={styles.app}>
      <div style={styles.landingWrap}>
        <Lock size={30} color="#D9A544" />
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#F2E9D8" }}>
          Código de administrador
        </div>
        <input
          style={{ ...styles.input, textAlign: "center", fontSize: 20, letterSpacing: 4, maxWidth: 200 }}
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
        />
        {error && <div style={{ color: "#E2664B", fontSize: 13 }}>Código incorrecto, intenta de nuevo.</div>}
        <div style={styles.rowGap}>
          <button style={styles.primaryBtn} onClick={submit}>Entrar</button>
          <button style={styles.ghostBtn} onClick={onBack}>Volver</button>
        </div>
      </div>
    </div>
  );
}
