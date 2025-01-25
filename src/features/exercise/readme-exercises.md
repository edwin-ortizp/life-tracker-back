# Módulo de Ejercicios - Life Tracker

## Estructura del Módulo

```
src/features/exercise/
├── components/
│   ├── index.tsx               # Componente principal
│   ├── ExerciseList.tsx        # Lista de ejercicios diarios
│   ├── ExerciseStats.tsx       # Visualizaciones y estadísticas
│   └── ExerciseFormModal.tsx   # Modal para agregar/editar ejercicios
├── types/
│   └── index.ts                # Tipos, interfaces y constantes
├── hooks/
│   └── useExerciseData.ts      # Hook para manejo de datos
src/pages/
└──ExercisePage.tsx             # Página principal
```

## Estructura de Datos en Firebase

Colección: `exercises`
Documento ID: `${userId}_${date}` (YYYY-MM-DD)

```typescript
{
  userId: string;
  exercises: ExerciseLog[];
  summary: {
    totalCalories: number;
    totalSteps: number;
    totalDuration: number;
    totalDistance: number;
    categoryStats: {
      [category]: {
        count: number;
        duration: number;
        calories: number;
      }
    }
  }
}
```

## Consideraciones Importantes

1. Manejo de Fechas
- SIEMPRE usar `getLocalDateString` de `@/utils/dates` para manipulación de fechas
- Las fechas se almacenan en formato YYYY-MM-DD
- Los IDs de documentos usan este formato: `${userId}_${date}`

2. Campos Calculados
- Las calorías se calculan según la duración y tipo de ejercicio
- Los pasos se pueden calcular automáticamente basados en la distancia
- El resumen (summary) debe actualizarse con cada cambio en exercises[]

3. Validaciones Críticas
- Los ejercicios cardio deben tener duración o distancia
- Los ejercicios de fuerza deben tener series y repeticiones
- Los valores numéricos no pueden ser negativos

## Mantenimiento y Actualizaciones

1. Al Agregar Nuevos Ejercicios
- Actualizar EXERCISES en types/index.ts
- Agregar configuración de calorías por hora
- Incluir pasos por km si aplica
- Definir valores por defecto

2. Al Modificar la UI
- Mantener consistencia en colores del tema
- Respetar espaciados y diseño responsivo

1. Al Actualizar Lógica
- Mantener agrupación por fechas en ExerciseStats
- Preservar cálculos pre-computados en el resumen
- No modificar estructura del documento en Firebase

## Funcionalidades Core

1. Gestión de Ejercicios
- Agregar ejercicio diario
- Editar ejercicio existente
- Eliminar ejercicio
- Cálculo automático de calorías/pasos

2. Visualización de Datos
- Resumen diario con totales
- Gráficos de progreso semanal
- Estadísticas por categoría
- Vista detallada por ejercicio

3. Manejo de Estado
- Estado local para formularios
- Estado global de ejercicios del día
- Cálculos derivados en tiempo real

## Debugging

1. Problemas Comunes
- Desincronización de resumen: Recalcular al modificar exercises[]
- Error en fechas: Verificar uso de getLocalDateString

## Optimizaciones

1. Rendimiento
- Usar React.memo para componentes pesados
- Implementar useMemo para cálculos costosos
- Mantener batch updates en Firebase