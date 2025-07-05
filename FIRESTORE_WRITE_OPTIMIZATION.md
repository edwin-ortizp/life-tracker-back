# 🚨 Diagnóstico y Solución: Escrituras Excesivas a Firestore

## Problemas Identificados

### 1. **Timer de Tareas con Auto-guardado Muy Frecuente** 🔥
- **Ubicación**: `src/features/task/hooks/useTaskTimer.ts`
- **Problema**: Guardaba cada 30 segundos → **120 escrituras/hora por timer activo**
- **Solución aplicada**: 
  - Aumentado a 2 minutos (120s)
  - Agregada validación de cambios significativos (>10s)
  - Reducido de ~120 a ~30 escrituras/hora por timer

### 2. **Verificaciones de Estado Offline Muy Frecuentes** ⚡
- **Ubicación**: `src/components/ui/SyncStatusIndicator.tsx`
- **Problema**: Verificaba cada 5 segundos
- **Solución aplicada**: Cambiado a 30 segundos

### 3. **Auto-generación de Insights Muy Frecuente** 🧠
- **Ubicación**: `src/hooks/useDailyInsight.ts`
- **Problema**: Verificaba cada minuto
- **Solución aplicada**: Cambiado a 5 minutos

### 4. **Monitor de Escrituras Implementado** 📊
- **Ubicación**: `src/utils/firestore-write-monitor.ts`
- **Función**: Detecta patrones de escrituras excesivas en tiempo real
- **Alertas**: Cuando hay >50 escrituras en 5 minutos

## Cómo Usar el Monitor

### En la Consola del Navegador:
```javascript
// Ver estadísticas actuales
console.log(window.firestoreWriteMonitor?.getStats());

// Generar reporte manual
window.firestoreWriteMonitor?.generateReport();

// Limpiar historial de monitoreo
window.firestoreWriteMonitor?.clear();
```

### Las alertas automáticas mostrarán:
- ✏️ Escrituras por fuente (qué hook/componente)
- 📊 Escrituras por colección (tasks, moods, etc.)
- 🔥 Patrones sospechosos (mismo documento múltiples veces)
- ⚠️ Intervalos muy frecuentes (<1 minuto)

## Recomendaciones Adicionales

### 1. **Optimizar Pomodoro Timer**
```typescript
// En usePomodoroTimer.ts considerar:
// - Reducir frecuencia de onSnapshot
// - Usar debouncing para escrituras
// - Solo escribir en cambios de estado significativos
```

### 2. **Implementar Debouncing Universal**
```typescript
// Crear hook useDebounce para todas las escrituras:
const useDebouncedWrite = (writeFunction, delay = 2000) => {
  // Implementar debouncing aquí
};
```

### 3. **Optimizar Cargas de Datos**
```typescript
// En hooks como useDailySummary y useWeeklySummary:
// - Implementar cache más agresivo
// - Evitar recargas innecesarias
// - Usar single-load pattern consistentemente
```

### 4. **Configurar Límites por Usuario**
```javascript
// En Firebase Console → Firestore → Rules
// Agregar límites de escrituras por usuario/tiempo
```

## Verificación de Resultados

### Antes de las optimizaciones:
- **Timer de tareas**: ~120 escrituras/hora por timer
- **Verificaciones de estado**: 720 checks/hora
- **Auto-insights**: 60 checks/hora

### Después de las optimizaciones:
- **Timer de tareas**: ~30 escrituras/hora por timer
- **Verificaciones de estado**: 120 checks/hora
- **Auto-insights**: 12 checks/hora

### **Reducción estimada**: ~85% menos escrituras por estos componentes

## Monitoreo Continuo

1. **Revisar console logs** para alertas del monitor
2. **Verificar Firebase Console** para estadísticas de uso real
3. **Usar `firestoreLogger.logSummary()`** periódicamente
4. **Revisar patrones** en las alertas del monitor

## Siguientes Pasos

Si el problema persiste:

1. **Identificar otros timers/intervalos** no detectados
2. **Revisar efectos de red/offline** que puedan causar reintento
3. **Verificar comportamiento en múltiples pestañas**
4. **Considerar implementar rate limiting** en cliente
5. **Revisar listeners de tiempo real** (onSnapshot)

## Comando de Emergencia

Si necesitas detener todas las escrituras temporalmente:
```javascript
// En consola del navegador:
window.firestoreWriteMonitor?.clear();
// Y recargar la página
```
