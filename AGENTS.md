# Instrucciones para Agentes IA

Este proyecto es **Life Tracker**, una aplicación web para el seguimiento de productividad personal. Construido con **Laravel 11**, **Livewire 3**, **Alpine.js** y **MySQL**.

## Stack Tecnológico
- **Backend**: Laravel 11 (PHP 8.2+)
- **Frontend**: Livewire 3 + Alpine.js
- **Estilos**: CSS personalizado con tokens de Material Design 3 (custom properties)
- **Base de datos**: MySQL (Laragon)
- **Iconos**: Bootstrap Icons (`bi-*`)
- **Autenticación**: Laravel built-in

## Estructura del Proyecto

```
app/
├── Livewire/             # Componentes Livewire (por módulo)
│   ├── Meal/             # MealWeekly, MealRecipes, MealIngredients, MealShopping
│   ├── Task/             # TaskList, TaskGantt, TaskFlow
│   ├── Health/           # HealthIndex, HealthBodyMap
│   ├── Goal/             # GoalIndex, GoalShow
│   ├── Relationship/     # RelationshipIndex
│   └── ...
├── Models/               # Modelos Eloquent (UUID, BelongsToUser)
└── Traits/               # BelongsToUser, HasUuids

resources/views/
├── livewire/             # Vistas de componentes (espeja app/Livewire)
├── components/           # Blade components (module-shell, context-widget, etc.)
└── layouts/              # Layout principal

config/
└── modules.php           # Definición de módulos: tabs, navegación, query params preservados

routes/
└── web.php               # Rutas (cada tab es una ruta separada)
```

## Módulos

| Módulo | Tabs | Ruta base |
|--------|------|-----------|
| Tareas | Lista, Gantt, Flujo | `/tasks/*` |
| Comidas | Planificación, Recetas, Ingredientes, Compras | `/meals/*` |
| Salud | Cronología, Mapa corporal | `/health/*` |
| Objetivos | Índice, Detalle | `/goals/*` |
| Relaciones | Índice | `/relationships` |
| Hábitos | Índice | `/habits` |
| Pomodoro | Índice | `/pomodoro` |
| Ánimo | Índice | `/mood` |
| Ejercicio | Índice | `/exercise` |
| Agua | Índice | `/water` |
| Diario | Índice | `/journal` |

## Patrones Clave

### Sistema de Tabs
Los tabs se declaran en `config/modules.php` y se renderizan con `module-shell.blade.php` + `module-tabs.blade.php`. Cada tab es un componente Livewire de página completa con su propia ruta.

### Modelos
- Todos usan `HasUuids` (UUID como PK) y `BelongsToUser` (scope automático por usuario)
- Relaciones estándar de Eloquent (hasMany, belongsTo, etc.)

### Componentes Livewire
- Páginas completas con `#[Layout('layouts.app')]` y `#[Title('...')]`
- Filtros en URL con `#[Url(as: 'q', history: true, keep: true)]`
- Diálogos con Alpine.js `x-data` + `$wire.entangle`

## Estándares de UI

### Búsqueda y Filtros (Material Design 3)
Todos los módulos deben seguir este patrón. Referencia: `resources/views/livewire/task/task-list.blade.php`.

- **Buscador**: `md-search-bar` con `md-search-bar__icon`, `md-search-bar__input`, `md-search-bar__clear`
- **Contenedor de filtros**: `md-chip-rail` con `md-chip-rail__divider` entre grupos
- **Chips toggle**: `md-chip md-chip-filter` con clase `selected` (no `md-chip--selected`)
- **Dropdowns**: `md-chip-menu` con `md-chip-menu__dropdown` y `md-chip-menu__item`
- **Nunca usar**: `md-chip-select` (select nativo), `md-text-field` para búsqueda, `md-chip-group`

### Barra Contextual (Rail)
- Usar `<x-slot:rail>` dentro de `<x-module-shell>` para información contextual
- Widgets con `<x-context-widget title="..." icon="..." tone="...">`
- Estadísticas: `<dl class="md-context-list">` con `<div><dt>Label</dt><dd>Valor</dd></div>`
- Enlaces: `<div class="md-context-links">` con `<a>` hijos

### Diálogos
- Alpine.js con entanglement: `x-data="{ show: $wire.entangle('showForm') }"`
- Estructura: `md-dialog-scrim` + `md-dialog` con `md-dialog-headline`, `md-dialog-content`, `md-dialog-actions`

## Comandos

```bash
php artisan serve              # Servidor de desarrollo
php artisan migrate            # Ejecutar migraciones
php artisan make:livewire M/C  # Crear componente Livewire
composer install               # Instalar dependencias PHP
npm run dev                    # Compilar assets (Vite)
npm run build                  # Build de producción
```

---

*Última actualización: Julio 2026*
