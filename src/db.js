import { db } from "./firebase.js";
import {
  collection, addDoc, deleteDoc, doc,
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

export async function crearSolicitud({ name, category, number }) {
  return addDoc(collection(db, "solicitudes"), {
    name, category, number: number || "",
    createdAt: serverTimestamp(), ts: Date.now(),
  });
}

export async function aprobarSolicitud(solicitud) {
  await addDoc(collection(db, "jugadores"), {
    name: solicitud.name,
    category: solicitud.category,
    number: solicitud.number || "",
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
    label, date, category, createdAt: serverTimestamp(), ts: Date.now(),
  });
  return ref.id;
}

export async function eliminarPartido(id) {
  await deleteDoc(doc(db, "partidos", id));
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
