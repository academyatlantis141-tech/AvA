import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { styles } from "./shared.js";
import { enviarMensaje } from "./db.js";

export default function ChatView({ mensajes, category, authorName, authorRole }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const filtered = mensajes
    .filter((m) => m.category === category)
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filtered.length]);

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    setText("");
    setSending(true);
    try {
      await enviarMensaje({ category, authorName, authorRole, text: value });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div style={{ ...styles.sectionLabel, marginBottom: 8 }}>
        Chat de {category}
      </div>
      <div style={styles.chatMessages} ref={scrollRef}>
        {filtered.length === 0 && (
          <div style={styles.emptyText}>Todavía no hay mensajes en este chat. ¡Escribe el primero!</div>
        )}
        {filtered.map((m) => {
          const mine = m.authorName === authorName && m.authorRole === authorRole;
          const time = m.createdAt?.toDate
            ? m.createdAt.toDate().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
            : "";
          return (
            <div key={m.id} style={{ ...styles.bubbleRow, ...(mine ? styles.bubbleRowMine : styles.bubbleRowOther) }}>
              {!mine && (
                <div style={styles.bubbleAuthor}>
                  {m.authorName}{m.authorRole === "admin" ? " · Profe" : ""}
                </div>
              )}
              <div style={mine ? styles.bubbleMine : styles.bubbleOther}>{m.text}</div>
              {time && <div style={styles.bubbleTime}>{time}</div>}
            </div>
          );
        })}
      </div>
      <div style={styles.chatInputRow}>
        <input
          style={styles.chatInput}
          placeholder="Escribe un mensaje..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button style={styles.chatSendBtn} onClick={send} disabled={sending}>
          <Send size={17} color="#08141F" />
        </button>
      </div>
    </div>
  );
}
