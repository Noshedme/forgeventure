# ForgeVenture

ForgeVenture es una plataforma web de fitness gamificado con temática RPG. Los usuarios eligen una clase de héroe (Guerrero, Arquero o Mago) y completan misiones, rutinas y ejercicios reales para subir de nivel su personaje. La app incluye un dashboard personalizado, tienda, sistema de logros, chat entre usuarios, santuario mental, salud y bienestar, buzón del gremio, árbol de habilidades, boss battles, y mucho más.

## Tecnologías principales

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite, Framer Motion, Lucide, Recharts, GSAP |
| Backend | Node.js, Express |
| Base de datos | Firebase Firestore |
| Autenticación | Firebase Auth |
| Email | Nodemailer (Gmail) |
| Detección de poses | MediaPipe Pose |
| IA | Google Generative AI (Gemini) |

---

## Requisitos previos

Asegúrate de tener instalado lo siguiente **antes** de continuar:

- **Node.js** v18 o superior → https://nodejs.org
- **npm** v9 o superior (viene incluido con Node)
- **Git** → https://git-scm.com
- Una cuenta en **Firebase** con un proyecto creado → https://console.firebase.google.com
- Una cuenta de **Gmail** con contraseña de aplicación generada (para el sistema de emails)

Verifica tus versiones con:

```bash
node --version
npm --version
git --version
```

---

## Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/Noshedme/forgeventure.git
cd forgeventure
```

### 2. Instalar dependencias del frontend

```bash
cd frontend
npm install
```

### 3. Instalar dependencias del backend

Abre otra terminal o regresa a la raíz del proyecto:

```bash
cd backend
npm install
```

---

## Configuración de Firebase

### Paso A — Obtener la Service Account Key

1. Ve a [Firebase Console](https://console.firebase.google.com) y selecciona tu proyecto
2. Haz clic en el ícono de engranaje ⚙️ → **Configuración del proyecto**
3. Ve a la pestaña **Cuentas de servicio**
4. Haz clic en **Generar nueva clave privada**
5. Se descarga un archivo `.json` — renómbralo a `serviceAccountKey.json`
6. Colócalo en la carpeta `backend/` (al mismo nivel que `package.json`):

```
backend/
├── serviceAccountKey.json   ← aquí
├── package.json
└── src/
```

> ⚠️ **IMPORTANTE:** Este archivo contiene credenciales privadas. Nunca lo subas a GitHub. Ya está incluido en el `.gitignore`.

### Paso B — Habilitar servicios en Firebase Console

En tu proyecto de Firebase, asegúrate de tener habilitado:

- **Authentication** → Métodos: Correo/Contraseña y Google
- **Firestore Database** → Crear base de datos en modo producción o prueba
- **Storage** (opcional, para imágenes de perfil)

---

## Variables de entorno

### Backend — crear `backend/.env`

Crea el archivo `backend/.env` con el siguiente contenido (reemplaza los valores):

```env
# Puerto del servidor (debe coincidir con el proxy de Vite → 4000)
PORT=4000

# URL del frontend (para CORS)
FRONTEND_URL=http://localhost:5173

# Firebase
FIREBASE_DATABASE_URL=https://TU_PROJECT_ID-default-rtdb.firebaseio.com

# Gmail — contraseña de aplicación (NO tu contraseña normal)
# Generar en: https://myaccount.google.com/apppasswords
GMAIL_USER=tucorreo@gmail.com
GMAIL_PASS=xxxx xxxx xxxx xxxx

# Remitente en emails
MAIL_FROM=ForgeVenture <tucorreo@gmail.com>

# Seguridad (cadena aleatoria, pon lo que quieras)
ANON_SALT=una_cadena_secreta_aleatoria_aqui
```

> **¿Cómo generar una contraseña de aplicación de Gmail?**
> 1. Ve a tu cuenta Google → Seguridad → Verificación en dos pasos (debe estar activa)
> 2. Ve a https://myaccount.google.com/apppasswords
> 3. Selecciona "Correo" y "Windows" → Generar
> 4. Copia las 16 letras que aparecen y ponlas en `GMAIL_PASS`

### Frontend — crear `frontend/.env.local`

Crea el archivo `frontend/.env.local`:

```env
# URL del backend (apunta al servidor Express)
VITE_API_URL=http://localhost:4000
```

> Este archivo tampoco se sube a GitHub. Ya está en el `.gitignore`.

---

## Levantar el proyecto

Necesitas **dos terminales abiertas al mismo tiempo**.

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

Deberías ver:
```
✅ serviceAccountKey.json cargado correctamente
🚀 Servidor corriendo en http://localhost:4000
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Deberías ver:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

Abre tu navegador en **http://localhost:5173**

---

## Estructura del proyecto

```
forgeventure/
├── backend/
│   ├── src/
│   │   ├── app.js              # Punto de entrada del servidor
│   │   ├── config/             # Email, Firebase config
│   │   ├── routes/             # Rutas de la API (chat, tienda, logros, etc.)
│   │   ├── services/           # Lógica de negocio
│   │   ├── scripts/            # Seeds de datos iniciales
│   │   └── utils/              # Utilidades (achievements, cache, etc.)
│   ├── serviceAccountKey.json  # ← TÚ lo pones aquí (no está en GitHub)
│   ├── .env                    # ← TÚ lo creas aquí (no está en GitHub)
│   └── package.json
│
├── frontend/
│   ├── public/                 # Assets estáticos (imágenes, sprites, sonidos)
│   ├── src/
│   │   ├── avatar/             # Sistema de avatar animado
│   │   ├── components/         # Componentes compartidos y de admin
│   │   ├── design/             # Sistema de diseño (paleta, fuentes, efectos)
│   │   ├── hooks/              # Custom hooks
│   │   ├── i18n/               # Traducciones (ES, EN, PT, FR)
│   │   ├── pages/              # Páginas de usuario y admin
│   │   ├── routes/             # Guards de rutas
│   │   ├── services/           # Llamadas a la API
│   │   └── utils/              # Utilidades
│   ├── .env.local              # ← TÚ lo creas aquí (no está en GitHub)
│   └── package.json
│
├── firestore.rules             # Reglas de seguridad de Firestore
├── firestore.indexes.json      # Índices de Firestore
└── firebase.json               # Configuración de Firebase
```

---

## Archivos que debes crear manualmente

Estos archivos **no están en GitHub** por seguridad. Debes crearlos tú en cada máquina:

| Archivo | Ubicación | Descripción |
|---|---|---|
| `serviceAccountKey.json` | `backend/` | Credenciales de Firebase Admin (se descarga desde Firebase Console) |
| `.env` | `backend/` | Variables de entorno del servidor |
| `.env.local` | `frontend/` | Variables de entorno del frontend |

---

## Build para producción

Si quieres generar la versión optimizada del frontend para desplegar:

```bash
cd frontend
npm run build
```

Los archivos listos para producción quedan en `frontend/dist/`.

---

## Solución de problemas comunes

**El backend no conecta con Firebase**
- Verifica que `serviceAccountKey.json` esté en `backend/` y no tenga errores de formato
- Confirma que el proyecto de Firebase en la consola es el mismo que generó esa key

**El frontend no se conecta al backend**
- Verifica que el backend esté corriendo en el puerto 4000
- Verifica que `frontend/.env.local` tenga `VITE_API_URL=http://localhost:4000`
- Revisa que no haya un firewall bloqueando el puerto 4000

**Error de CORS**
- Verifica que `FRONTEND_URL=http://localhost:5173` esté en `backend/.env`

**Los emails no llegan**
- Asegúrate de usar una contraseña de aplicación de Gmail (no tu contraseña normal)
- La verificación en dos pasos debe estar activa en tu cuenta Google

**`npm install` falla**
- Asegúrate de estar usando Node.js v18 o superior: `node --version`
- Borra `node_modules` y `package-lock.json` y vuelve a correr `npm install`
