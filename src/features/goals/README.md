# Goals Module

Módulo de gestión de objetivos y metas personales.

## Descripción

Permite crear, seguir y completar objetivos a largo plazo con progreso visible y sugerencias de IA.

## Características

- **Gestión de objetivos**: Crea y edita objetivos personales
- **Seguimiento de progreso**: Marca objetivos como completados
- **Categorización**: Organiza por áreas de vida
- **Sugerencias IA**: Genera ideas de objetivos personalizados
- **Detalles expandibles**: Ve información completa de cada objetivo

## Componentes

- `GoalList` - Lista de objetivos con filtros
- `GoalDetail` - Vista detallada de un objetivo
- `GoalForm` - Formulario de creación/edición
- `AiSuggestionsModal` - Modal con sugerencias de IA

## Hooks

- `useGoals()` - Maneja CRUD de objetivos

## Types

```typescript
interface Goal {
  id: string;
  title: string;
  description?: string;
  category?: string;
  completed: boolean;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  userId: string;
}
```

## Estructura de datos en Firestore

```
goals/{goalId}
  - title: string
  - description: string
  - category: string
  - completed: boolean
  - userId: string
  - createdAt: Timestamp
  - completedAt: Timestamp | null
```

## Uso

```tsx
import { GoalList } from '@/features/goals/components/GoalList';

const MyGoalsPage = () => {
  return <GoalList />;
};
```

## Categorías sugeridas

- Salud y Fitness
- Carrera profesional
- Finanzas
- Relaciones
- Desarrollo personal
- Hobbies y creatividad
