# Prepared Meals Module

Módulo de seguimiento de comidas preparadas anticipadamente.

## Descripción

Permite registrar y gestionar comidas que has preparado con anticipación para consumir en días futuros.

## Características

- **Registro de comidas**: Anota comidas preparadas
- **Fecha de preparación**: Registra cuándo se preparó
- **Fecha de consumo**: Planifica cuándo consumirla
- **Estado**: Marca comidas como consumidas
- **Notas**: Añade detalles sobre la preparación

## Componentes

- `PreparedMealsList` - Lista de comidas preparadas
- `PreparedMealForm` - Formulario de registro

## Hooks

- `usePreparedMeals()` - Maneja CRUD de comidas preparadas

## Types

```typescript
interface PreparedMeal {
  id: string;
  name: string;
  preparedDate: Date;
  plannedDate?: Date;
  consumed: boolean;
  notes?: string;
  createdAt: Timestamp;
  userId: string;
}
```

## Estructura de datos en Firestore

```
prepared-meals/{mealId}
  - name: string
  - preparedDate: Timestamp
  - plannedDate: Timestamp | null
  - consumed: boolean
  - notes: string
  - userId: string
  - createdAt: Timestamp
```

## Uso

```tsx
import { usePreparedMeals } from '@/features/prepared-meals';

const MyComponent = () => {
  const { meals, addMeal, updateMeal } = usePreparedMeals();

  return <div>{/* UI */}</div>;
};
```

## Mejores prácticas

- Registra la fecha de preparación para control de frescura
- Marca como consumidas para mantener registro actualizado
- Usa notas para recordar ingredientes especiales o alergias
