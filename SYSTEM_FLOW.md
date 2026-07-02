# ForgeVenture - Flujo Completo de Experiencia y Niveles

## 📋 Arquitectura General del Sistema

```
Frontend (React) ← → Backend (Express) ← → Firebase (Firestore + Auth)
```

---

## 🎯 Flujo Completo: Completar Ejercicio y Ganar XP

### **1️⃣ USUARIO COMPLETA SESIÓN (Frontend - SesionModal)**

**Archivo:** `frontend/src/pages/user/UserEjercicios.jsx` (línea ~487)

```javascript
// Usuario hace click en "RECLAMAR XP"
<button onClick={()=>onComplete({
  ejercicioId: ej.id,                    // ID del ejercicio
  xpGanado: xpEarned + xpSerie,          // XP calculado (con bonus)
  tiempoRealizado: null,                 // Tiempo real ejecutado
  repsRealizadas: repsHechas || null     // Reps realizadas
})}
```

**Datos Enviados:**
- `ejercicioId`: Identificador único del ejercicio (ej: "e1", "e2")
- `xpGanado`: Cantidad de XP ganado (número)
- `tiempoRealizado`: Segundos reales (null si se calcula por timer)
- `repsRealizadas`: Número de repeticiones (solo para ejercicios)

---

### **2️⃣ HANDLER PROCESA COMPLECIÓN (Frontend)**

**Archivo:** `frontend/src/pages/user/UserEjercicios.jsx` (línea ~612)

```javascript
const handleComplete = async (sessionData) => {
  const token = await user.getIdToken();  // Obtiene JWT de Firebase
  
  const result = await completarSesion(token, {
    ejercicioId: sessionData.ejercicioId,
    tiempoRealizado: sessionData.tiempoRealizado,
    repsRealizadas: sessionData.repsRealizadas,
    xpGanado: sessionData.xpGanado
  });
  
  // Actualiza estado local con respuesta del servidor
}
```

---

### **3️⃣ API CALL (Frontend Service)**

**Archivo:** `frontend/src/services/api.js` (línea ~209)

```javascript
export const completarSesion = (token, sessionData) =>
  request("/ejercicios/completar-sesion", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },  // JWT Auth
    body: JSON.stringify(sessionData),
  });
```

**Request HTTP:**
```
POST /api/ejercicios/completar-sesion
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "ejercicioId": "e1",
  "xpGanado": 75,
  "tiempoRealizado": null,
  "repsRealizadas": 15
}
```

---

### **4️⃣ MIDDLEWARE VERIFICA TOKEN (Backend)**

**Archivo:** `backend/src/middleware/auth.js`

```javascript
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;  // Obtiene "Bearer <token>"
  const token = authHeader.split(" ")[1];        // Extrae token
  
  const decoded = await auth.verifyIdToken(token);  // Verifica con Firebase
  req.user = decoded;  // {uid: "user123", email: "...", ...}
  next();
};
```

**Resultado:** 
- `req.user.uid` está disponible en el endpoint
- Si el token es inválido, retorna 401

---

### **5️⃣ ENDPOINT PROCESA SOLICITUD (Backend)**

**Archivo:** `backend/src/routes/ejercicios.routes.js` (línea ~254)

```javascript
router.post("/completar-sesion", verifyToken, async (req, res) => {
  // Extrae datos del body
  const { ejercicioId, tiempoRealizado, repsRealizadas, xpGanado } = req.body;
  const uid = req.user.uid;  // Del middleware verifyToken
  
  // Validación básica
  if (!ejercicioId) {
    return res.status(400).json({ error: "ejercicioId requerido" });
  }
  
  // ... lógica de cálculo y actualización
});
```

---

### **6️⃣ CÁLCULO DE XP Y NIVELES (Backend)**

```javascript
// Obtiene XP base del ejercicio si no se proporciona
let xpFinal = xpGanado || 0;
if (!xpGanado) {
  const ejercicioDoc = await db
    .collection("ejercicios")
    .doc("ejercicios")
    .collection("items")
    .doc(ejercicioId)
    .get();
  xpFinal = ejercicioDoc.data().xpBase;
}

// Obtiene perfil actual del usuario
const userRef = db.collection("users").doc(uid);
const userData = (await userRef.get()).data();

// Fórmula de XP para subir de nivel
const xpForNextLevel = Math.floor(100 * Math.pow(currentLevel, 1.5));

// Cálculo de nuevos XP y nivel
let newXp = currentXp + xpFinal;
let newLevel = currentLevel;
let leveledUp = false;

while (newXp >= xpForNextLevel) {
  newXp -= xpForNextLevel;
  newLevel++;
  leveledUp = true;
}
```

---

### **7️⃣ ACTUALIZACIÓN EN FIREBASE (Backend - Transacción)**

**Estructura de Firebase:**

```
users/{uid}/
  ├── level: number
  ├── xp: number
  ├── xpTotal: number
  ├── xpNext: number
  ├── lastLevelUp: timestamp
  └── totalLevelUps: number

users/{uid}/progress/{ejercicioId}
  ├── completadas: number
  ├── xpGanado: number
  ├── ultimoCompletado: timestamp
  ├── tiempoRealizado: number|null
  └── repsRealizadas: number|null

activity_logs/{docId}
  ├── uid: string
  ├── type: "exercise_complete"
  ├── exerciseId: string
  ├── xpGained: number
  ├── levelBefore: number
  ├── levelAfter: number
  ├── leveledUp: boolean
  └── timestamp: timestamp
```

**Backend Transacción:**
```javascript
await db.runTransaction(async (transaction) => {
  // 1. Actualiza perfil del usuario
  transaction.update(userRef, {
    level: newLevel,
    xp: newXp,
    xpTotal: newXpTotal,
    xpNext: Math.floor(100 * Math.pow(newLevel, 1.5)),
    updatedAt: new Date().toISOString()
  });
  
  // 2. Actualiza progreso del ejercicio
  transaction.set(userProgressRef, {
    completadas: (old.completadas || 0) + 1,
    xpGanado: (old.xpGanado || 0) + xpFinal,
    ultimoCompletado: new Date().toISOString(),
    tiempoRealizado,
    repsRealizadas
  }, { merge: true });
  
  // 3. Registra actividad
  transaction.set(activityRef, {
    uid,
    type: "exercise_complete",
    exerciseId,
    xpGained: xpFinal,
    levelBefore: currentLevel,
    levelAfter: newLevel,
    leveledUp,
    timestamp: new Date().toISOString()
  });
});
```

---

### **8️⃣ RESPUESTA AL FRONTEND (Backend)**

```json
{
  "success": true,
  "xpGanado": 75,
  "level": 13,
  "xp": 240,
  "xpNext": 3375,
  "leveledUp": true,
  "levelsGained": 1
}
```

---

### **9️⃣ ACTUALIZACIÓN LOCAL (Frontend)**

```javascript
// Actualiza progreso local
setUserProgress(prev => ({
  ...prev,
  [ejercicioId]: {
    completadas: (prev[ejercicioId]?.completadas || 0) + 1,
    xpGanado: (prev[ejercicioId]?.xpGanado || 0) + result.xpGanado,
    ultimoCompletado: new Date().toISOString()
  }
}));

// Actualiza perfil si subió de nivel
if (result.leveledUp) {
  setProfile(prev => ({
    ...prev,
    level: result.level,
    xp: result.xp,
    xpNext: result.xpNext,
    lastLevelUp: new Date().toISOString()
  }));
  
  // Muestra notificación de celebración
  setXpNotif({ 
    levelUp: true, 
    newLevel: result.level, 
    xpGained: result.xpGanado 
  });
}

// Dispara evento global
window.dispatchEvent(new CustomEvent('exerciseCompleted', {
  detail: {
    xp: result.xpGanado,
    leveledUp: result.leveledUp,
    newLevel: result.level
  }
}));
```

---

## 🔗 Dependencias Entre Servicios

```
SesionModal (UI)
    ↓
handleComplete()
    ↓
completarSesion(API call)
    ↓
request() → POST /api/ejercicios/completar-sesion
    ↓
[Backend]
verifyToken (Auth Middleware)
    ↓
Endpoint Handler
    ↓
Firebase Transacción
    ├── Update: users/{uid}
    ├── Update: users/{uid}/progress/{ejercicioId}
    └── Create: activity_logs/{docId}
    ↓
Response → Frontend
    ↓
setUserProgress() + setProfile() + setXpNotif()
    ↓
UI Updates + Event Dispatch
```

---

## ✅ Validaciones Necesarias

### Backend
- ✅ `ejercicioId` no está vacío
- ✅ El ejercicio existe en Firebase
- ✅ El usuario existe en Firebase
- ✅ Token JWT es válido
- ✅ Token está en header como `Authorization: Bearer <token>`

### Frontend
- ✅ Usuario está autenticado
- ✅ `sesionEj` existe
- ✅ `sessionData` contiene `ejercicioId` y `xpGanado`

---

## 🐛 Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| 400 Bad Request | `ejercicioId` no enviado | Verificar que SesionModal pasa `ejercicioId` |
| 401 Unauthorized | Token inválido o expirado | Regenerar token con `user.getIdToken()` |
| 404 Not Found | Usuario no existe en Firebase | Crear documento de usuario al registrarse |
| 500 Server Error | Estructura incorrecta en Firebase | Verificar colecciones y documentos |

---

## 📊 Fórmula de Cálculo de Niveles

```
XP requerido para nivel N = 100 * (N)^1.5

Ejemplos:
- Nivel 1: 100 * 1^1.5 = 100 XP
- Nivel 2: 100 * 2^1.5 ≈ 283 XP
- Nivel 5: 100 * 5^1.5 ≈ 1118 XP
- Nivel 10: 100 * 10^1.5 ≈ 3162 XP
```

---

## 🎮 Bonificación por Clase

```javascript
const clsBonus = (profile?.heroClass==="GUERRERO"&&["Fuerza","Calistenia","Funcional"].includes(ej.cat))
  ||(profile?.heroClass==="ARQUERO"&&["Cardio","HIIT"].includes(ej.cat))
  ||(profile?.heroClass==="MAGO"&&["Flexibilidad"].includes(ej.cat));

if (clsBonus) {
  xpGanado = Math.round(xpBase * 1.25);  // +25%
}
```

---

## 📈 Datos Registrados en activity_logs

Cada ejercicio completado crea un registro con:
- `uid`: Usuario que lo completó
- `type`: "exercise_complete"
- `exerciseId`: Qué ejercicio fue
- `xpGained`: XP obtenido
- `levelBefore`/`levelAfter`: Niveles antes y después
- `leveledUp`: Si subió de nivel
- `timestamp`: Cuándo pasó
- `metadata`: datos adicionales (tiempo, reps)

---

## 🔄 Datos en Tiempo Real

El sistema usa:
- **Firebase Listeners**: `onSnapshot()` para actualizar perfil en tiempo real
- **Custom Events**: `window.dispatchEvent()` para comunicación entre componentes
- **Local State**: `setUserProgress()`, `setProfile()` para actualizaciones inmediatas

---

Este flujo garantiza que:
✅ Los datos se guardan persistentemente en Firebase
✅ Cada usuario tiene su progreso individual
✅ Los niveles se calculan correctamente
✅ Los registros de actividad están disponibles para análisis
✅ El frontend se actualiza inmediatamente con respuesta del servidor
