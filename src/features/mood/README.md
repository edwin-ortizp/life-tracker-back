# Mood Module

Módulo de seguimiento de estado de ánimo y niveles de energía.

## Descripción

Permite a los usuarios registrar múltiples estados de ánimo y niveles de energía durante el día con comentarios opcionales.

## Características

- **Múltiples registros diarios**: Registra cambios de ánimo a lo largo del día
- **Escala 1-5**: Sistema simple de valoración
- **Comentarios**: Añade contexto a cada registro
- **Historial visual**: Ve la tendencia del día
- **Sugerencias IA**: Análisis de patrones de estado de ánimo
- **Importación**: Importa datos de ánimo desde archivos externos

## Componentes

- `Mood` - Componente principal
- `MoodSelector` - Selector de estado de ánimo (1-5)
- `EnergySelector` - Selector de nivel de energía (1-5)
- `MoodHistory` - Historial de estados de ánimo del día
- `EnergyHistory` - Historial de energía del día
- `MoodAiMenu` - Menú de opciones de IA
- `MoodAiSuggestion` - Diálogo con sugerencias de IA
- `ImportMoodButton` - Botón para importar datos

## Hooks

- `useMoodData(selectedDate)` - Maneja estado de ánimo
- `useEnergyData(selectedDate)` - Maneja niveles de energía

## Types

```typescript
interface MoodEntry {
  value: number; // 1-5
  time: string; // HH:mm
  comment?: string;
  emoji?: string;
  text?: string;
}

interface MoodProps {
  selectedDate: Date;
  energyFirst?: boolean;
}
```

## Estructura de datos en Firestore

```
moods/{userId}_{YYYY-MM-DD}
  - moods: MoodEntry[]
  - updatedAt: Timestamp
```

```
energy/{userId}_{YYYY-MM-DD}
  - entries: EnergyEntry[]
  - updatedAt: Timestamp
```

## Uso

```tsx
import { Mood } from '@/features/mood/components';

<Mood selectedDate={new Date()} energyFirst={false} />
```

## Validación de datos

- Los valores deben estar entre 1 y 5
- El tiempo se registra automáticamente
- Se permite 1 registro de ánimo cada 5 minutos
