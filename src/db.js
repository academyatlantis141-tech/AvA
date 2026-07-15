import { db } from "./firebase.js";
import {
  collection, addDoc, deleteDoc, doc, getDocs, writeBatch, setDoc, updateDoc,
  onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";

function subscribe(colName, cb) {
  const q = query(collection(db, colName), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error(`Error leyendo ${colName}:`, err);
  });
}

export const subSolicitudes = (cb) => subscribe("solicitudes", cb);
export const subJugadores = (cb) => subscribe("jugadores", cb);
export const subPartidos = (cb) => subscribe("partidos", cb);
export const subRegistros = (cb) => subscribe("registros", cb);
export const subMensajes = (cb) => subscribe("mensajes", cb);
export const subAnuncios = (cb) => subscribe("anuncios", cb);
export const subAsistencias = (cb) => subscribe("asistencias", cb);

export async function enviarMensaje({ category, authorName, authorRole, text }) {
  return addDoc(collection(db, "mensajes"), {
    category, authorName, authorRole, text,
    createdAt: serverTimestamp(), ts: Date.now(),
  });
}

export async function crearSolicitud({ name, category, number, photo }) {
  return addDoc(collection(db, "solicitudes"), {
    name, category, number: number || "", photo: photo || "",
    createdAt: serverTimestamp(), ts: Date.now(),
  });
}

export async function aprobarSolicitud(solicitud) {
  await addDoc(collection(db, "jugadores"), {
    name: solicitud.name,
    category: solicitud.category,
    number: solicitud.number || "",
    photo: solicitud.photo || "",
    createdAt: serverTimestamp(),
    ts: Date.now(),
  });
  await deleteDoc(doc(db, "solicitudes", solicitud.id));
}

export async function rechazarSolicitud(id) {
  await deleteDoc(doc(db, "solicitudes", id));
}

export async function eliminarJugador(id) {
  await deleteDoc(doc(db, "jugadores", id));
}

export async function crearPartido({ label, date, category }) {
  const ref = await addDoc(collection(db, "partidos"), {
    label, date, category, mvpId: "", mvpName: "",
    createdAt: serverTimestamp(), ts: Date.now(),
  });
  return ref.id;
}

export async function eliminarPartido(id) {
  await deleteDoc(doc(db, "partidos", id));
}

export async function marcarMVP(matchId, player) {
  await updateDoc(doc(db, "partidos", matchId), {
    mvpId: player ? player.id : "",
    mvpName: player ? player.name : "",
  });
}

export async function agregarRegistro({ playerId, matchId, statKey, result }) {
  return addDoc(collection(db, "registros"), {
    playerId, matchId, statKey, result,
    createdAt: serverTimestamp(), ts: Date.now(),
  });
}

export async function eliminarRegistro(id) {
  await deleteDoc(doc(db, "registros", id));
}

export async function restablecerEstadisticas() {
  const snap = await getDocs(collection(db, "registros"));
  const docs = snap.docs;
  const CHUNK = 450; // margen bajo el límite de 500 por lote de Firestore
  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = writeBatch(db);
    docs.slice(i, i + CHUNK).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

export async function crearAnuncio({ text, category }) {
  return addDoc(collection(db, "anuncios"), {
    text, category, createdAt: serverTimestamp(), ts: Date.now(),
  });
}

export async function eliminarAnuncio(id) {
  await deleteDoc(doc(db, "anuncios", id));
}

export async function marcarAsistencia({ playerId, matchId, category, date, presente }) {
  const id = `${matchId}_${playerId}`;
  await setDoc(doc(db, "asistencias", id), {
    playerId, matchId, category, date, presente,
    createdAt: serverTimestamp(), ts: Date.now(),
  }, { merge: true });
}
