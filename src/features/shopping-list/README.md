# Shopping List Module

Módulo de lista de compras con múltiples vistas y organización por categorías.

## Descripción

Sistema flexible de listas de compras con vistas Kanban, lista tradicional e híbrida. Sincronización con Firestore y organización por categorías.

## Características

- **Tres vistas**:
  - **Kanban**: Columnas de pendiente/comprado
  - **Lista**: Vista tradicional con checkboxes
  - **Híbrida**: Combina lista y tablero
- **Categorías**: Organiza por frutas, verduras, lácteos, etc.
- **Cantidades**: Especifica cantidad de cada item
- **Prioridades**: Marca items como prioritarios
- **Sincronización**: Datos persistidos en Firestore
- **Exportación**: Exporta lista en múltiples formatos
- **Migración**: Herramientas para migrar datos

## Componentes

- `ShoppingList` - Componente principal
- `KanbanView` - Vista de tablero Kanban
- `ListView` - Vista de lista tradicional
- `HybridView` - Vista híbrida
- `ShoppingItem` - Item individual de compra
- `CategoryFilter` - Filtros por categoría
- `ShoppingExportWizard` - Asistente de exportación
- `MigrationButton` - Migración de datos

## Hooks

- `useShoppingList()` - Maneja CRUD de items de compra

## Types

```typescript
interface ShoppingItem {
  id: string;
  name: string;
  quantity?: number;
  category?: string;
  purchased: boolean;
  priority?: boolean;
  notes?: string;
  createdAt: Timestamp;
  userId: string;
}
```

## Estructura de datos en Firestore

```
shopping-items/{itemId}
  - name: string
  - quantity: number
  - category: string
  - purchased: boolean
  - priority: boolean
  - notes: string
  - userId: string
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

## Categorías disponibles

- Frutas
- Verduras
- Carnes
- Lácteos
- Panadería
- Bebidas
- Snacks
- Limpieza
- Higiene personal
- Otros

## Uso

```tsx
import { ShoppingList } from '@/features/shopping-list/components';

<ShoppingList viewMode="kanban" />
```

## Mejores prácticas

- Agrupa items por categoría para compras eficientes
- Marca items prioritarios para no olvidarlos
- Usa notas para marcas específicas o recordatorios
