# Habit Module

Módulo de seguimiento de hábitos diarios organizados por momento del día.

## Descripción

Sistema de seguimiento de hábitos con organización por mañana, tarde, noche y cualquier momento. Permite marcar hábitos como completados y ver progreso mensual/anual.

## Características

- **Hábitos predefinidos**: Lista de hábitos comunes configurables
- **Organización por tiempo**: Agrupados por morning, afternoon, night, anytime
- **Vista semanal**: Ve tu progreso de la semana
- **Vista mensual**: Calendario mensual de cumplimiento
- **Vista anual**: Grid anual tipo GitHub contributions
- **Iconos personalizados**: Cada hábito tiene su emoji representativo
- **Metas de tiempo**: Duración estimada para cada hábito
- **Pasos opcionales**: Desglosa hábitos complejos en pasos
- **Sugerencias IA**: Análisis de patrones y sugerencias

## Componentes

- `HabitTracker` - Componente principal
- `HabitGroup` - Grupo de hábitos por momento del día
- `WeeklyView` - Vista semanal de hábitos
- `MonthlyView` - Vista de calendario mensual
- `YearlyView` - Vista de grid anual
- `HabitAiMenu` - Menú de opciones de IA
- `HabitAiSuggestion` - Sugerencias generadas por IA

## Hooks

- `useHabitData()` - Maneja estado de hábitos completados

## Types

```typescript
interface Habit {
  id: number;
  name: string;
  icon: string;
  timeOfDay: 'morning' | 'afternoon' | 'night' | 'anytime';
  goal: string; // Duración estimada
  steps?: string[]; // Pasos opcionales
}
```

## Estructura de datos en Firestore

```
habits/{userId}_{YYYY-MM}
  - habits: Record<string, boolean> // key: "{habitId}_{YYYY-MM-DD}"
  - updatedAt: Timestamp
```

## Uso

```tsx
import { HabitTracker } from '@/features/habit/components/HabitTracker';

<HabitTracker selectedDate={new Date()} />
```

## Lista de hábitos predefinidos

Se incluyen 21 hábitos organizados en:
- **Mañana**: Agua, ejercicio, ducha fría, desayuno, higiene bucal, tender cama
- **Tarde**: Almuerzo, siesta, agua, higiene bucal
- **Noche**: Cena, diario, organización, lectura, higiene bucal, lista de pendientes

## Personalización

Los hábitos se definen en `src/features/habit/types/index.ts` en la constante `HABITS`.
