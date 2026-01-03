# 🚀 Migración Life Tracker: Firebase → Supabase

## ✅ Estado: COMPLETADA

**Fecha:** 2 de Enero, 2026
**Hooks migrados:** 16/16
**Archivos actualizados:** 34
**Registros importados:** 2,842

---

## 📋 Resumen Ejecutivo

Se ha completado exitosamente la migración completa de Life Tracker desde Firebase/Firestore a PostgreSQL/Supabase, incluyendo:

- ✅ Exportación completa de datos (1,282 documentos)
- ✅ Diseño de schema normalizado en PostgreSQL
- ✅ Importación de datos transformados (2,842 registros)
- ✅ Migración de 16 hooks principales
- ✅ Actualización automática de 34 archivos
- ✅ Migración de autenticación a Supabase Auth

---

## 🗂️ Archivos Creados

### Scripts de Migración
```
scripts/
├── export-firebase-data.ts           # Exporta data de Firebase
├── import-to-supabase.ts              # Importa data a Supabase
└── update-imports.js                  # Actualiza imports automáticamente
```

### Schema SQL
```
supabase/migrations/
├── 001_initial_schema.sql             # Schema completo normalizado
├── 002_seed_habits.sql                # Datos de habit_definitions
├── 003_fix_id_types.sql               # Cambio UUID → TEXT
└── 004_create_firebase_user.sql       # Usuario de prueba
```

### Hooks Migrados (16)
```
src/features/
├── task/hooks/useTaskData.supabase.ts
├── shopping-list/hooks/useShoppingList.supabase.ts
├── habit/hooks/
│   ├── useHabitData.supabase.ts
│   ├── useHabitDataDaily.supabase.ts
│   └── useHabitCalendar.supabase.ts
├── meal/hooks/useMealPlan.supabase.ts
├── mood/hooks/
│   ├── useMoodData.supabase.ts
│   └── useEnergyData.supabase.ts
├── water/hooks/useWaterData.supabase.ts
├── exercise/hooks/useExerciseData.supabase.ts
├── pomodoro/hooks/usePomodoroData.supabase.ts
├── journal/hooks/useJournalData.supabase.ts
├── negative-habits/hooks/useNegativeHabitData.supabase.ts
├── goals/hooks/useGoals.supabase.ts
├── recipe/hooks/useRecipes.supabase.ts
└── prepared-meals/hooks/usePreparedMeals.supabase.ts
```

### Auth
```
src/
├── hooks/
│   ├── useAuth.ts                     # ✅ Ahora usa Supabase
│   ├── useAuth.supabase.ts            # Versión Supabase
│   └── useAuth.firebase.ts            # Backup Firebase
├── lib/supabase.ts                    # Cliente Supabase
└── pages/AuthCallbackPage.tsx         # OAuth callback
```

---

## 🔄 Transformaciones de Datos

### 1. Habits (Normalización)
**Antes (Firebase):**
```
habits/{userId}_{yearMonth}
{
  habits: {
    "1_2025-01-15": true,
    "2_2025-01-15": false
  }
}
```

**Después (Supabase):**
```sql
-- Tabla: habit_completions
user_id | habit_id | date       | completed
--------|----------|------------|----------
user123 | 1        | 2025-01-15 | true
user123 | 2        | 2025-01-15 | false
```

### 2. Goals (Denormalización → Normalización)
**Antes (Firebase):**
```json
{
  "title": "Learn React",
  "tasks": [
    {"title": "Read docs", "done": true},
    {"title": "Build app", "done": false}
  ],
  "entries": [
    {"text": "Started learning", "date": "2025-01-01"}
  ]
}
```

**Después (Supabase):**
```sql
-- Tabla: goals
id | user_id | title        | ...
---|---------|--------------|----
g1 | user123 | Learn React  | ...

-- Tabla: goal_tasks
goal_id | title      | done
--------|------------|-----
g1      | Read docs  | true
g1      | Build app  | false

-- Tabla: goal_entries
goal_id | text            | date
--------|-----------------|----------
g1      | Started learning| 2025-01-01
```

### 3. Moods/Energy (Arrays → Registros)
**Antes:** `{moods: [{emoji, text, timestamp}]}`
**Después:** Una fila por mood entry

---

## 📊 Estadísticas de Migración

| Métrica | Valor |
|---------|-------|
| Documentos Firestore exportados | 1,282 |
| Registros PostgreSQL importados | 2,842 |
| Hooks migrados | 16 |
| Archivos actualizados | 34 |
| Tablas creadas | 23 |
| Tiempo total estimado | ~8 horas |

### Distribución de Registros Importados

| Tabla | Registros |
|-------|-----------|
| habit_completions | 1,681 |
| tasks | 555 |
| mood_entries | 272 |
| journal_entries | 194 |
| goals | 25 |
| Otras | 115 |

---

## 🎯 Configuración Necesaria en Supabase

### 1. Habilitar Google OAuth

1. Ve a **Authentication > Providers** en Supabase Dashboard
2. Habilita **Google**
3. Configura las credenciales:
   - Client ID de Google Cloud Console
   - Client Secret de Google Cloud Console
4. Autoriza la URL de callback:
   ```
   https://<tu-proyecto>.supabase.co/auth/v1/callback
   ```

### 2. Configurar URLs de Redirección

En Supabase Dashboard → **Authentication > URL Configuration**:

**Redirect URLs permitidas:**
```
http://localhost:5173/auth/callback
https://<tu-dominio>/auth/callback
```

### 3. Variables de Entorno

Asegúrate de tener en `.env`:
```bash
VITE_SUPABASE_URL=https://tpcjwhnrcrisgcqjfjqg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🧪 Testing Checklist

### Auth
- [ ] Login con Google funciona
- [ ] Redirect a `/auth/callback` funciona
- [ ] Session persiste después de refresh
- [ ] Logout funciona correctamente

### Data Hooks (CRUD)
- [ ] **Tasks**: Crear, listar, editar, eliminar
- [ ] **Habits**: Completar/descompletar hábitos
- [ ] **Goals**: CRUD + tasks + entries
- [ ] **Meals**: Plan semanal, CRUD
- [ ] **Recipes**: CRUD
- [ ] **Mood/Energy**: Agregar entries
- [ ] **Water**: Log drinks
- [ ] **Exercise**: Log workouts
- [ ] **Pomodoro**: Timer, sessions
- [ ] **Journal**: Escribir, guardar
- [ ] **Shopping List**: Kanban, mover items
- [ ] **Negative Habits**: Log occurrences

### Performance
- [ ] Carga inicial < 2s
- [ ] Optimistic updates funcionan
- [ ] Error handling muestra mensajes correctos
- [ ] No hay memory leaks

---

## 🚀 Pasos para Deploy

### 1. Build de Producción
```bash
npm run build
```

### 2. Verificar Build
```bash
npm run preview
```

### 3. Actualizar Environment Variables en Producción
```bash
VITE_SUPABASE_URL=<production-url>
VITE_SUPABASE_ANON_KEY=<production-key>
```

### 4. Deploy
```bash
# GitHub Pages
npm run build:win  # o build:mac
git push

# O tu plataforma preferida (Vercel, Netlify, etc.)
```

---

## 📝 Cambios en el Código

### Patrón de Migración

**Antes (Firebase):**
```typescript
import { useTaskData } from '@/features/task/hooks/useTaskData';
```

**Después (Supabase):**
```typescript
import { useTaskData } from '@/features/task/hooks/useTaskData.supabase';
```

✅ **34 archivos ya actualizados automáticamente**

### Cambios en useAuth

**Antes (Firebase):**
```typescript
const { user, signIn, signOut } = useAuth();
// user.uid
// user.email
```

**Después (Supabase):**
```typescript
const { user, signIn, signOut } = useAuth();
// user.id  ← Cambió de uid a id
// user.email
```

---

## 🔐 Seguridad (RLS)

Todas las tablas tienen **Row Level Security (RLS)** habilitado:

```sql
-- Ejemplo de policy
CREATE POLICY "own_tasks" ON tasks FOR ALL
  USING (user_id = current_setting('request.jwt.claim.sub', true));
```

Esto garantiza que los usuarios solo pueden acceder a sus propios datos.

---

## 🎨 Ventajas de la Migración

### ✅ Datos Normalizados
- Relaciones definidas con foreign keys
- Integridad referencial
- Queries más eficientes

### ✅ SQL Nativo
- Queries complejas más fáciles
- JOINs para features sociales futuras
- Triggers para automatización

### ✅ Backups Simples
- `pg_dump` para backup completo
- Point-in-Time Recovery
- Restore fácil

### ✅ Costo Predecible
- **Free Tier**: $0/mes (hasta 500MB)
- **Pro**: $25/mes (predecible)
- vs Firebase: $30-80/mes (variable)

### ✅ No Vendor Lock-in
- PostgreSQL estándar
- Migratable a RDS, Railway, self-hosted
- Open source (Supabase)

---

## 📦 Archivos de Respaldo

### Mantenidos para Referencia
```
src/hooks/useAuth.firebase.ts          # Versión original de auth
```

### Originales de Firebase (aún presentes)
```
src/features/*/hooks/*.ts              # Versiones Firebase originales
```

**Nota:** Los archivos `.supabase.ts` son las nuevas versiones activas.

---

## 🐛 Troubleshooting

### Error: "Invalid API key"
**Solución:** Verifica que `VITE_SUPABASE_ANON_KEY` esté correctamente configurado en `.env`

### Error: "Row Level Security policy violation"
**Solución:** Asegúrate de estar autenticado. Las policies bloquean acceso sin autenticación.

### Error: "Column does not exist"
**Solución:** Verifica que todas las migraciones SQL se ejecutaron correctamente en Supabase.

### Hook no encuentra datos
**Solución:**
1. Verifica que la importación de datos fue exitosa
2. Revisa que el `user.id` coincide con el `user_id` en la base de datos

---

## 🔄 Rollback (Si es necesario)

Si necesitas volver a Firebase temporalmente:

1. **Revertir Auth:**
   ```bash
   cp src/hooks/useAuth.firebase.ts src/hooks/useAuth.ts
   ```

2. **Revertir Imports:**
   ```typescript
   // Cambiar manualmente los imports de:
   import { useX } from './hooks/useX.supabase';
   // A:
   import { useX } from './hooks/useX';
   ```

3. **Rebuild:**
   ```bash
   npm run build
   ```

---

## 📚 Recursos

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Supabase Dashboard:** https://app.supabase.com

---

## ✨ Conclusión

La migración de Life Tracker a Supabase/PostgreSQL está **100% completa** y lista para testing. Todos los hooks principales han sido migrados, los imports actualizados y la autenticación configurada.

**Próximo paso:** Ejecutar el checklist de testing y hacer deploy a producción.

---

**Preparado por:** Claude Code
**Fecha:** 2 de Enero, 2026
**Versión:** 1.0
