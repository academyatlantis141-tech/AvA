# Atlantis Academy — Versión con estudiantes + administrador

Esta versión tiene dos entradas:
- **Estudiantes**: crean su perfil (nombre, categoría, número) y luego pueden
  buscar su nombre para ver sus propias estadísticas.
- **Administrador/a** (tú): apruebas o rechazas los perfiles nuevos,
  registras estadísticas por partido, ves el historial y exportas a Excel.

Todos los datos se guardan en una base de datos en la nube (Firebase), así
que se ven igual desde cualquier celular — el tuyo y el de cada estudiante.

## Parte 1 — Crear tu base de datos gratis en Firebase

1. Ve a **console.firebase.google.com** y entra con una cuenta de Google.
2. Toca **"Crear un proyecto"** ("Add project").
3. Ponle un nombre, por ejemplo `atlantis-academy` → sigue los pasos
   (puedes desactivar Google Analytics, no lo necesitas) → **"Crear proyecto"**.
4. En el menú izquierdo, ve a **"Compilación" → "Firestore Database"**.
5. Toca **"Crear base de datos"**.
   - Elige la ubicación más cercana a ti.
   - Selecciona **"Iniciar en modo de prueba"** (esto permite que la app
     lea y escriba sin configurar reglas complicadas; es la opción más
     simple para un proyecto de este tamaño).
6. Ahora ve al ícono de **engranaje ⚙️ → "Configuración del proyecto"**.
7. Baja hasta **"Tus apps"** → toca el ícono **`</>`** (Web).
8. Ponle un apodo a la app (ej. "atlantis-web") → **"Registrar app"**.
9. Firebase te muestra un bloque de código con un objeto `firebaseConfig`
   parecido a esto:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "atlantis-academy-xxxx.firebaseapp.com",
  projectId: "atlantis-academy-xxxx",
  storageBucket: "atlantis-academy-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

10. Copia esos valores y pégalos en el archivo **`src/firebaseConfig.js`**
    de este proyecto, reemplazando los valores de ejemplo.
11. En ese mismo archivo, cambia `ADMIN_PIN` por el código que tú quieras
    usar para entrar como administrador/a (ej. `"volley2026"`).

⚠️ **Nota sobre el modo de prueba:** Firestore en "modo de prueba" queda
abierto por 30 días y luego bloquea el acceso. Antes de esos 30 días,
vuelve a Firestore → pestaña "Reglas" y cambia la fecha de expiración, o
avísame y te ayudo a poner reglas permanentes simples.

## Parte 2 — Subir el proyecto a GitHub

1. Crea una cuenta en **github.com** si no tienes (ver el mensaje anterior).
2. Toca **"+"** → **"New repository"** → nómbralo `atlantis-academy` →
   **"Create repository"**.
3. Usa el enlace **"uploading an existing file"** y arrastra **todos los
   archivos y carpetas de este proyecto** (incluidas las carpetas `src` y
   `public` completas — `public` trae tu logo, `logo.png`).
4. **"Commit changes"**.

## Parte 3 — Publicar gratis en Vercel

1. Ve a **vercel.com** → **"Sign Up"** → **"Continue with GitHub"**.
2. **"Add New..." → "Project"** → selecciona el repositorio `atlantis-academy`.
3. Vercel detecta que es Vite/React automáticamente → **"Deploy"**.
4. En 1-2 minutos te da un enlace, por ejemplo:
   `https://atlantis-academy-tuusuario.vercel.app`

## Parte 4 — Instalarla en los celulares

- **Tú (administrador/a):** abre el enlace → "Soy administrador/a" →
  escribe tu código → "Agregar a pantalla de inicio".
- **Cada estudiante:** abre el mismo enlace → "Soy estudiante" →
  "Crear mi perfil" → llena sus datos → espera tu aprobación. Cuando ya
  esté aprobado, puede tocar "Ver mis estadísticas" y buscar su nombre.
  También le conviene "Agregar a pantalla de inicio" para tenerlo como app.

## Actualizaciones futuras

Si quieres agregar más cambios más adelante, solo reemplaza los archivos en
el mismo repositorio de GitHub y Vercel vuelve a publicar la app sola.
