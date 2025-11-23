# Statistics Module

Módulo de estadísticas y resúmenes diarios/semanales para Life Tracker.

## Descripción

Este módulo proporciona resúmenes agregados de todas las actividades del usuario, incluyendo:
- Palabras escritas en el diario
- Estado de ánimo y energía promedio
- Hábitos completados
- Hábitos negativos registrados
- Ejercicios realizados (minutos y calorías)
- Tareas completadas y pendientes
- Sesiones Pomodoro
- Consumo de agua

## Componentes

- `DailySummary` - Resumen diario con todas las métricas
- `WeeklySummary` - Resumen semanal con gráficos de tendencias
- `DailyDashboard` - Panel de control diario
- `WeeklyDashboard` - Panel de control semanal
- `MoodChart` - Gráfico de estado de ánimo del día
- `AiInsightCard` - Tarjeta con insights generados por IA
- `DebugDataCard` - Tarjeta de depuración de datos

## Hooks

- `useDailySummary(date)` - Carga resumen de un día específico
- `useWeeklySummary(startDate)` - Carga resumen de una semana

## Types

```typescript
interface DailySummaryData {
  journal: { words: number };
  mood: { count: number; average: number; highest: number; lowest: number };
  habits: { completed: number; total: number };
  negativeHabits: { count: number };
  exercise: { minutes: number; calories: number };
  tasks: { completed: number; activeAndOverdue: number; todayPending: number; overdue: number };
  pomodoro: { count: number; workMinutes: number; completionRate: number };
  water: { intake: number };
}
```

## Uso

```tsx
import { useDailySummary } from '@/features/statistics/hooks/useDailySummary';

const MyComponent = () => {
  const { summary, loading, error, refetch } = useDailySummary(new Date());

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Resumen del día</h2>
      <p>Palabras escritas: {summary.journal.words}</p>
      <p>Hábitos completados: {summary.habits.completed}/{summary.habits.total}</p>
    </div>
  );
};
```

## Optimizaciones

- Los resúmenes se cargan una sola vez (no hay listeners en tiempo real)
- Se utiliza cache para evitar recargas innecesarias
- Las consultas de Firestore están optimizadas para minimizar lecturas
