# Proposal

## Why

Los ajustes de Tareas presentan categorías y estados como listas sin la tarjeta de gestión que ya utiliza Planes, con una navegación cuya ubicación en la captura de producción no coincide con el layout local. Se necesita una interfaz compacta y coherente con los componentes existentes, y eliminar la opción de restaurar categorías predeterminadas.

## What Changes

- Sustituir las listas de categorías y estados por tablas dentro de `x-ui.management-card`, con icono, título, contador, búsqueda, menú ⋮ y paginación.
- Mostrar una tarjeta de navegación a la derecha en escritorio con Categorías de tareas y Estados de tareas; situarla arriba del contenido en móvil.
- Mostrar Nombre, Pendientes, Total y Acciones para categorías; Nombre, Tipo, Tareas y Acciones para estados.
- Conservar split buttons, orden manual, jerarquía de categorías, restricciones de estados, reasignaciones y creación mediante FAB y diálogo.
- Eliminar las dos entradas de restauración/agregado de categorías predeterminadas y el método público `TaskSettings::restoreDefaults`.
- Comprobar el layout y los assets generados para resolver la discrepancia visual sin asumir una causa de producción.

## Capabilities

### New Capabilities

- `task-settings`: gestión de los catálogos personales de categorías y estados de tareas, su navegación y presentación responsive.

### Modified Capabilities

Ninguna. El inventario vigente no contiene una especificación de ajustes de tareas.

## Impact

`TaskSettings`, sus vistas y estilos de ajustes; componentes compartidos `management-card`, `row-actions`, `form-dialog` y trait `WithManagementCard` reutilizados. Pruebas focalizadas de ajustes, estados, aislamiento y UI. Sin nuevas dependencias, migraciones, cambios de datos existentes ni despliegue; sin cambios funcionales en Planes, otros módulos o inicialización de catálogos fuera de este panel.
