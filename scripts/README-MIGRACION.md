# 🔄 Migración: dueDate → startDate

## ¿Por qué migrar?

El módulo de tareas ahora usa `startDate` y `endDate` en lugar de `dueDate` para soportar rangos horarios. Tus tareas existentes en Firestore todavía tienen el campo `dueDate` y necesitan migrarse.

---

## 📋 Método 1: Desde Firebase Console (Recomendado)

### Paso 1: Abrir Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database**

### Paso 2: Abrir consola del navegador
1. Presiona **F12** para abrir DevTools
2. Ve a la pestaña **Console**

### Paso 3: Ejecutar el script
1. Copia todo el contenido de [`migrate-firestore-console.txt`](./migrate-firestore-console.txt)
2. Pégalo en la consola
3. Presiona Enter

### Paso 4: Verificar
El script mostrará:
```
🚀 Iniciando migración...
✅ Migrada: Crear la historia de usuario para...
✅ Migrada: Revisar documentación de Firebase
...
📊 Resumen:
   ✅ Migradas: 42
   ⏭️  Omitidas: 5
   📝 Total: 47
✨ Migración completada
```

---

## 🔧 Método 2: Usando Node.js

### Requisitos
- Node.js instalado
- Credenciales de Firebase

### Paso 1: Configurar credenciales
1. Abre [`migrate-duedate-to-startdate.js`](./migrate-duedate-to-startdate.js)
2. Reemplaza `firebaseConfig` con tus credenciales:
```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  // ... resto de config
};
```

### Paso 2: Instalar dependencias
```bash
npm install firebase
```

### Paso 3: Ejecutar el script
```bash
node scripts/migrate-duedate-to-startdate.js
```

---

## ✅ Verificación Post-Migración

### 1. Verifica en Firestore
- Ve a Firestore Database
- Abre una tarea cualquiera
- Verifica que tenga el campo `startDate`

### 2. Verifica en la aplicación
- Recarga la aplicación (Ctrl + Shift + R)
- Ve al calendario de tareas
- Las tareas deberían aparecer en las columnas correctas

---

## ⚠️ Importante

### ¿Qué hace la migración?
- ✅ Copia el valor de `dueDate` a `startDate`
- ⚠️ **NO elimina** el campo `dueDate` (por seguridad)
- ✅ Omite tareas que ya tienen `startDate`

### ¿Es seguro?
- ✅ Sí, no se pierden datos
- ✅ Se puede ejecutar múltiples veces (es idempotente)
- ✅ No modifica tareas completadas

### ¿Puedo deshacer la migración?
Sí, si algo sale mal:
```javascript
// En Firebase Console:
const db = firebase.firestore();
const batch = db.batch();

db.collection('tasks').get().then(snapshot => {
  snapshot.docs.forEach(doc => {
    if (doc.data().dueDate && doc.data().startDate) {
      batch.update(doc.ref, { startDate: firebase.firestore.FieldValue.delete() });
    }
  });
  return batch.commit();
});
```

---

## 🆘 Problemas Comunes

### "Cannot read property 'sync'"
- Este es un warning del service worker de PWA
- **Puedes ignorarlo**, no afecta la migración

### "No se muestran las tareas en el calendario"
1. Verifica que la migración se completó
2. Limpia el cache: DevTools > Application > Clear Storage
3. Recarga con Ctrl + Shift + R

### "Las tareas aparecen en la columna equivocada"
- Verifica que `startDate` tenga la fecha correcta
- Si una tarea tiene hora "12:00:00", se considera "sin hora"
- Edita la tarea para asignar una hora específica

---

## 📞 Contacto

Si tienes problemas, revisa:
1. La consola del navegador (F12 > Console)
2. Los logs de Firebase (Firebase Console > Functions > Logs)
3. Este README completo
