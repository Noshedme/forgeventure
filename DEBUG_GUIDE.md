# 🔍 Guía de Debuggeo - Error al Completar Ejercicio (400 Bad Request)

## Problema
Cuando intentas completar un ejercicio, recibes error 400: `ejercicioId requerido`

Esto significa que `ejercicioId` no se está enviando al backend correctamente.

---

## Pasos para Debuggear

### 1️⃣ Prepara los servidores

Abre **2 terminales separadas**:

**Terminal 1 - Backend:**
```bash
cd c:\Users\User\Desktop\forgeventure\forgeventure\backend
npm start
```
Verás en esta terminal los logs del backend cuando intentes completar un ejercicio.

**Terminal 2 - Frontend:**
```bash
cd c:\Users\User\Desktop\forgeventure\forgeventure\frontend
npm run dev
```

---

### 2️⃣ Abre la consola del navegador

En tu navegador (Chrome, Firefox, Edge):
- Presiona **F12** o **Ctrl+Shift+I**
- Ve a la pestaña **"Console"**
- Busca los logs que empiezan con `Session Data:`, `SesionEj:`, `Request Payload:`, y `[API]`

---

### 3️⃣ Completa un ejercicio y observa los logs

1. Inicia sesión como usuario
2. Ve a "Ejercicios"
3. Haz click en un ejercicio (por ej. "Flexiones")
4. Haz click en "COMENZAR" en la modal
5. Completa las series (puedes saltar presionando los botones)
6. Cuando llegues a "EJERCICIO COMPLETADO", haz click en "RECLAMAR XP"

---

### 4️⃣ Revisa los logs en ORDEN de aparición

#### 🖥️ Logs en la Consola del Navegador (Frontend):

```
Loaded exercises from Firebase: [...]
// O
Using mock exercises
```
**¿Qué significa?**
- Si ves "Loaded exercises from Firebase" → hay ejercicios en Firebase ✅
- Si ves "Using mock exercises" → no hay ejercicios en Firebase, usa datos mock ✅

---

```
Session Data: {
  ejercicioId: "e1",
  xpGanado: 75,
  tiempoRealizado: null,
  repsRealizadas: 15
}
```
**¿Qué significa?**
- Si ves `ejercicioId: "e1"` → el ejercicio tiene ID correctamente ✅
- Si ves `ejercicioId: undefined` → **PROBLEMA**: el ejercicio no tiene `id` ❌

---

```
SesionEj: {
  id: "e1",
  nombre: "Flexiones",
  ...
}
```
**¿Qué significa?**
- Si ves `id: "e1"` → el objeto del ejercicio tiene `id` ✅
- Si ves `id: undefined` → **PROBLEMA**: el ejercicio no fue cargado correctamente ❌

---

```
Request Payload: {
  ejercicioId: "e1",
  tiempoRealizado: null,
  repsRealizadas: 15,
  xpGanado: 75
}
```
**¿Qué significa?**
- Si ves `ejercicioId: "e1"` → se está enviando correctamente al servidor ✅
- Si ves `ejercicioId: undefined` → **PROBLEMA**: algo en el código está eliminando el `ejercicioId` ❌

---

```
[API] POST http://localhost:4000/api/ejercicios/completar-sesion 
{headers: {...}, method: "POST", body: JSON.stringify({...})}
```
**¿Qué significa?**
- Muestra exactamente qué se envía al servidor
- Revisa que el `body` contenga `ejercicioId`

---

#### 🖥️ Logs en la Terminal del Backend:

```
[BACKEND] Completar sesión request: {
  ejercicioId: "e1",
  tiempoRealizado: null,
  repsRealizadas: 15,
  xpGanado: 75,
  uid: "user123",
  fullBody: {...}
}
```
**¿Qué significa?**
- Si ves `ejercicioId: "e1"` → el servidor recibió correctamente ✅
- Si ves `ejercicioId: undefined` → **PROBLEMA**: algo en la red está perdiendo el dato ❌

---

## 🎯 Posibles Escenarios

### Escenario 1: `ejercicioId` es undefined en Frontend (Console)
**Problema:** El objeto del ejercicio no tiene `id`
**Causa probable:** 
- Los ejercicios no se cargaron correctamente de Firebase
- Hay un bug en cómo se mapean los ejercicios

**Solución:**
- Verifica que el admin creó ejercicios en Firebase
- Revisa que la estructura en Firebase es correcta

---

### Escenario 2: `ejercicioId` en Frontend es correcto, pero undefined en Backend
**Problema:** Se pierde en el request HTTP
**Causa probable:**
- Hay un problema en cómo se serializa el JSON
- El middleware está modificando el body

**Solución:**
- Revisa que `Content-Type: application/json` está en los headers
- Verifica que `body: JSON.stringify(...)` está correcto

---

### Escenario 3: `ejercicioId` está en el backend pero se rechaza
**Problema:** El endpoint rechaza con 400 antes de procesarlo
**Causa probable:**
- El validador en el backend está fallando
- Hay un problema de tipo de dato (number vs string)

**Solución:**
- El `ejercicioId` debe ser un string
- Verifica en el admin cómo se crean los IDs en Firebase

---

## 📝 Información que Necesito

**Por favor, ejecuta el código y comparte estos datos:**

1. ✅ Todos los logs de la consola del navegador (copia/pega)
2. ✅ Los logs de la terminal del backend (copia/pega)
3. ✅ El objeto `SesionEj` completo que ves en console
4. ✅ El objeto `Request Payload` que ves en console
5. ✅ El objeto `[BACKEND] Completar sesión request` que ves en terminal

Con esta información podré identificar exactamente dónde se está perdiendo o deformando `ejercicioId`.

---

## 🔧 Checklist Rápido

- [ ] ¿El usuario está autenticado? (Debe estar logeado)
- [ ] ¿Hay ejercicios en la pantalla? (Si no, verifica la carga)
- [ ] ¿Puedes clickear en un ejercicio? (Si no, hay problema de carga)
- [ ] ¿Puedes abrir la modal de sesión? (Si no, hay problema en DetalleModal)
- [ ] ¿Puedes completar las series? (Si no, hay problema en SesionModal)
- [ ] ¿Ves los logs en console? (Si no, actualiza la página)

---

## 📞 Si encuentras un error en los logs:

1. **Nota exactamente el error**
2. **Copia todo el contexto** (qué logs aparecen antes y después)
3. **Describe qué esperas vs qué ves**

Con esto podré resolver el problema rápidamente! 🚀
