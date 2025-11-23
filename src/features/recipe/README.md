# Recipe Module

Módulo de gestión de recetas de cocina.

## Descripción

Permite almacenar y organizar recetas de cocina con ingredientes, instrucciones y metadatos.

## Características

- **Almacenamiento de recetas**: Guarda recetas completas
- **Ingredientes**: Lista de ingredientes con cantidades
- **Instrucciones**: Pasos detallados de preparación
- **Categorización**: Organiza por tipo de comida
- **Tiempos**: Registra tiempo de preparación y cocción
- **Exportación**: Exporta recetas en diferentes formatos

## Componentes

- `RecipeList` - Lista de recetas guardadas
- `RecipeDetail` - Vista detallada de una receta
- `RecipeForm` - Formulario de creación/edición
- `RecipeExportWizard` - Asistente de exportación

## Hooks

- `useRecipes()` - Maneja CRUD de recetas

## Types

```typescript
interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string[];
  category?: string;
  prepTime?: number; // minutos
  cookTime?: number; // minutos
  servings?: number;
  notes?: string;
  createdAt: Timestamp;
  userId: string;
}
```

## Estructura de datos en Firestore

```
recipes/{recipeId}
  - name: string
  - ingredients: string[]
  - instructions: string[]
  - category: string
  - prepTime: number
  - cookTime: number
  - servings: number
  - notes: string
  - userId: string
  - createdAt: Timestamp
```

## Uso

```tsx
import { RecipeList } from '@/features/recipe/components/RecipeList';

const MyRecipesPage = () => {
  return <RecipeList />;
};
```

## Categorías comunes

- Desayuno
- Almuerzo
- Cena
- Snacks
- Postres
- Bebidas
- Ensaladas
