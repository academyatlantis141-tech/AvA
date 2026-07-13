import { Send, Zap, Shield, Hand } from "lucide-react";

export const CATEGORIES = ["Pre Mini", "Mini", "Intermedia", "Juvenil"];

export const FUNDAMENTOS = [
  { key: "saque", label: "Saque", icon: Send, color: "#3FB8AE" },
  { key: "ataque", label: "Ataque", icon: Zap, color: "#D9A544" },
  { key: "bloqueo", label: "Bloqueo", icon: Shield, color: "#5B8DBE" },
  { key: "recibo", label: "Recibo", icon: Hand, color: "#7BC67E" },
];

export const ACIERTO_COLOR = "#7BC67E";
export const ERROR_COLOR = "#E2664B";

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
export function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
export function emptyTotals() {
  const t = {};
  FUNDAMENTOS.forEach((f) => (t[f.key] = { acierto: 0, error: 0 }));
  return t;
}

export function loadFont() {
  if (document.getElementById("atlantis-fonts")) return;
  const link = document.createElement("link");
  link.id = "atlantis-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(link);
}

export const styles = {
  app: {
    fontFamily: "'Inter', sans-serif",
    background: "#08141F",
    minHeight: "100vh",
    color: "#F2E9D8",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  loadingScreen: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#08141F",
  },
  header: {
    background: "linear-gradient(180deg, #0F2A3A 0%, #08141F 100%)",
    padding: "18px 18px 14px",
    borderBottom: "1px solid #163B4F",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerRow: { display: "flex", alignItems: "center", gap: 10 },
  medallion: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #E8C877, #D9A544)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 0 2px #08141F, 0 0 0 3px #D9A544",
    flexShrink: 0,
  },
  brand: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: 2, color: "#D9A544" },
  tabTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 1, color: "#F2E9D8" },
  exportBtn: {
    background: "#3FB8AE", border: "none", borderRadius: 10, padding: "9px 10px",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  content: { flex: 1, padding: "16px 16px 90px", overflowY: "auto" },
  chipsRow: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 14 },
  chip: {
    flexShrink: 0, padding: "8px 14px", borderRadius: 20, border: "1px solid #2B4F5F",
    background: "#0F2A3A", color: "#9FBAC8", fontSize: 13, fontWeight: 600,
  },
  chipActive: { background: "#3FB8AE", color: "#08141F", border: "1px solid #3FB8AE" },
  sectionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionLabel: { fontSize: 13, color: "#7FA0B0", fontWeight: 600 },
  addBtn: {
    display: "flex", alignItems: "center", gap: 6, background: "#D9A544", color: "#08141F",
    border: "none", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 700,
  },
  card: { background: "#0F2A3A", border: "1px solid #163B4F", borderRadius: 14, padding: 14, marginBottom: 12 },
  input: {
    width: "100%", background: "#08141F", border: "1px solid #2B4F5F", borderRadius: 10,
    padding: "10px 12px", color: "#F2E9D8", fontSize: 14, marginBottom: 10,
  },
  rowGap: { display: "flex", gap: 8 },
  primaryBtn: {
    display: "flex", alignItems: "center", gap: 6, justifyContent: "center", flex: 1,
    background: "#3FB8AE", color: "#08141F", border: "none", borderRadius: 10,
    padding: "10px 12px", fontSize: 13, fontWeight: 700,
  },
  ghostBtn: {
    background: "transparent", color: "#7FA0B0", border: "1px solid #2B4F5F", borderRadius: 10,
    padding: "10px 14px", fontSize: 13, fontWeight: 600,
  },
  ghostBtnSmall: {
    background: "transparent", color: "#7FA0B0", border: "1px solid #2B4F5F", borderRadius: 8, padding: "6px 8px",
  },
  dangerBtn: {
    background: "#E2664B", color: "#08141F", border: "none", borderRadius: 8,
    padding: "6px 10px", fontSize: 12, fontWeight: 700,
  },
  successBtn: {
    background: "#7BC67E", color: "#08141F", border: "none", borderRadius: 8,
    padding: "6px 10px", fontSize: 12, fontWeight: 700,
  },
  iconBtn: { background: "transparent", border: "none", padding: 6 },
  playerRow: { display: "flex", alignItems: "center", gap: 12 },
  avatarSmall: {
    width: 40, height: 40, borderRadius: "50%", background: "#16374B", border: "1.5px solid #D9A544",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, color: "#D9A544", flexShrink: 0,
  },
  playerName: { fontSize: 15, fontWeight: 700, color: "#F2E9D8" },
  playerMeta: { fontSize: 12, color: "#7FA0B0", marginTop: 2 },
  fundamentoRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "8px 0", borderBottom: "1px solid #163B4F",
  },
  fundamentoLabel: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#F2E9D8" },
  resultBtns: { display: "flex", gap: 8 },
  resultBtn: {
    display: "flex", alignItems: "center", gap: 5, background: "#08141F", border: "1.5px solid",
    borderRadius: 9, padding: "6px 10px", fontSize: 13, fontWeight: 700, transition: "transform .12s",
  },
  undoBtn: {
    marginTop: 10, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    background: "transparent", border: "1px dashed #2B4F5F", color: "#7FA0B0", borderRadius: 10,
    padding: "8px 10px", fontSize: 12, fontWeight: 600,
  },
  matchBar: {
    display: "flex", alignItems: "center", gap: 10, background: "#0F2A3A", border: "1px solid #D9A544",
    borderRadius: 12, padding: "10px 12px", marginBottom: 14, cursor: "pointer",
  },
  matchBarLabel: { fontSize: 14, fontWeight: 700, color: "#F2E9D8" },
  matchBarMeta: { fontSize: 11, color: "#7FA0B0", marginTop: 1 },
  changeLink: { fontSize: 12, color: "#D9A544", fontWeight: 700 },
  overlay: {
    position: "absolute", inset: 0, background: "rgba(8,20,31,0.92)", display: "flex",
    alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", zIndex: 20,
  },
  overlayCard: { background: "#0F2A3A", border: "1px solid #163B4F", borderRadius: 16, padding: 18, width: "100%", maxWidth: 420 },
  overlayHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14 },
  overlayTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 1, color: "#D9A544" },
  matchOption: {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#08141F", border: "1px solid #163B4F", borderRadius: 10, padding: "10px 12px",
    marginBottom: 8, textAlign: "left",
  },
  searchWrap: {
    display: "flex", alignItems: "center", gap: 8, background: "#0F2A3A", border: "1px solid #163B4F",
    borderRadius: 10, padding: "9px 12px", marginBottom: 14,
  },
  searchInput: { flex: 1, background: "transparent", border: "none", color: "#F2E9D8", fontSize: 14 },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 16 },
  summaryTile: {
    background: "#0F2A3A", border: "1.5px solid", borderRadius: 10, padding: "8px 4px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
  },
  summaryLabel: { fontSize: 9, color: "#F2E9D8", fontWeight: 700, marginTop: 2 },
  barsWrap: { marginTop: 12, display: "flex", flexDirection: "column", gap: 6 },
  barRow: { display: "flex", alignItems: "center", gap: 8 },
  barLabel: { width: 56, fontSize: 11, color: "#9FBAC8", fontWeight: 600 },
  barTrack: { flex: 1, height: 8, background: "#08141F", borderRadius: 4, overflow: "hidden", display: "flex" },
  barFillSplit: { height: "100%", transition: "width .3s" },
  barVal: { width: 34, textAlign: "right", fontSize: 11, fontWeight: 700, color: "#F2E9D8" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "40px 20px", textAlign: "center" },
  emptyText: { fontSize: 13, color: "#7FA0B0", maxWidth: 240 },
  bottomNav: { position: "sticky", bottom: 0, display: "flex", background: "#0F2A3A", borderTop: "1px solid #163B4F", padding: "8px 0 12px" },
  navBtn: { flex: 1, background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center" },
  toastError: {
    position: "absolute", bottom: 80, left: 16, right: 16, background: "#E2664B", color: "#08141F",
    padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, textAlign: "center", zIndex: 30,
  },
  landingWrap: {
    minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: 24, gap: 16, textAlign: "center",
  },
  landingBtn: {
    width: "100%", maxWidth: 300, padding: "16px", borderRadius: 14, border: "1.5px solid #2B4F5F",
    background: "#0F2A3A", color: "#F2E9D8", fontSize: 15, fontWeight: 700, display: "flex",
    flexDirection: "column", alignItems: "center", gap: 8,
  },
  pendingBadge: {
    background: "#16374B", color: "#D9A544", fontSize: 11, fontWeight: 700,
    padding: "3px 8px", borderRadius: 8,
  },
  chatMessages: {
    display: "flex", flexDirection: "column", gap: 8,
    height: "calc(100vh - 300px)", minHeight: 260,
    overflowY: "auto", padding: "4px 2px 10px",
  },
  bubbleRow: { display: "flex", flexDirection: "column", maxWidth: "80%" },
  bubbleRowMine: { alignSelf: "flex-end", alignItems: "flex-end" },
  bubbleRowOther: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubbleAuthor: { fontSize: 10, color: "#7FA0B0", fontWeight: 700, marginBottom: 2, padding: "0 4px" },
  bubbleMine: {
    background: "#3FB8AE", color: "#08141F", borderRadius: "14px 14px 4px 14px",
    padding: "8px 12px", fontSize: 13.5, fontWeight: 500, wordBreak: "break-word",
  },
  bubbleOther: {
    background: "#16374B", color: "#F2E9D8", borderRadius: "14px 14px 14px 4px",
    padding: "8px 12px", fontSize: 13.5, fontWeight: 500, wordBreak: "break-word",
  },
  bubbleTime: { fontSize: 9, color: "#7FA0B0", marginTop: 2, padding: "0 4px" },
  chatInputRow: { display: "flex", gap: 8, marginTop: 10 },
  chatInput: {
    flex: 1, background: "#0F2A3A", border: "1px solid #2B4F5F", borderRadius: 20,
    padding: "10px 14px", color: "#F2E9D8", fontSize: 14,
  },
  chatSendBtn: {
    background: "#D9A544", border: "none", borderRadius: "50%", width: 40, height: 40,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
};

export const globalCss = `
  * { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  input:focus { outline: 2px solid #3FB8AE; }
  button:focus-visible { outline: 2px solid #D9A544; outline-offset: 2px; }
  button { font-family: inherit; cursor: pointer; }
  ::-webkit-scrollbar { display: none; }
  .atlantis-shell { max-width: 480px; margin: 0 auto; width: 100%; }
  @media (min-width: 768px) {
    .atlantis-shell { max-width: 900px; }
  }
`;
