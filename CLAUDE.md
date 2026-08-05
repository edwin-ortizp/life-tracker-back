# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
php artisan serve        # Start development server (port 8000)
php artisan migrate      # Run database migrations
php artisan make:livewire Module/ComponentName  # Create Livewire component
composer install         # Install PHP dependencies
npm run dev              # Compile frontend assets (Vite)
npm run build            # Build frontend for production
```

## Architecture Overview

This is **Life Tracker**, a comprehensive web application for personal productivity tracking built with **Laravel 11 + Livewire 3**. The app follows a modular architecture where each feature is a Livewire full-page component.

### Core Technology Stack
- **Backend**: Laravel 11 (PHP 8.2+)
- **Frontend**: Livewire 3 + Alpine.js
- **Styling**: Custom CSS with Material Design 3 tokens (CSS custom properties)
- **Database**: MySQL via Laragon
- **Icons**: Bootstrap Icons (`bi-*`)
- **Auth**: Laravel built-in authentication

### Project Structure
```
app/
├── Livewire/             # Livewire components (organized by module)
│   ├── Meal/             # MealWeekly, MealRecipes, MealIngredients, MealShopping
│   ├── Task/             # TaskList, TaskGantt, TaskFlow
│   ├── Health/           # HealthIndex, HealthBodyMap
│   └── ...
├── Models/               # Eloquent models
└── Traits/               # BelongsToUser, HasUuids, etc.

resources/views/
├── livewire/             # Livewire component views (mirrors app/Livewire)
├── components/           # Blade components (module-shell, context-widget, etc.)
└── layouts/              # App layout

config/
└── modules.php           # Module definitions: tabs, navigation, preserved query params
```

### Key Feature Modules
- **task**: Task management with Eisenhower matrix, Gantt, flow views (3 tabs)
- **meal**: Weekly meal planning, recipes, ingredients catalog, shopping list (4 tabs)
- **health**: Health event timeline + body map (2 tabs)
- **habit**: Daily/weekly habit tracking with time-of-day grouping
- **goal**: Goal tracking with KPIs and milestones
- **relationship**: Contact management with circles and contact frequency
- **pomodoro**: Configurable timer with session history
- **mood**: Mood and energy tracking
- **exercise**: Exercise tracking with calorie calculations
- **water**: Hydration tracking
- **journal**: Markdown journal entries

## Critical Patterns

### Config-Driven Tab System
Tabs are declared in `config/modules.php` and rendered by `module-shell.blade.php` + `module-tabs.blade.php`. Each tab is a separate full-page Livewire component with its own route.

```php
// config/modules.php
'meals' => [
    'title' => 'Comidas',
    'tabs' => [
        ['label' => 'Planificación', 'route' => 'meals.weekly', ...],
        ['label' => 'Recetas', 'route' => 'meals.recipes', ...],
    ],
],
```

### UUID Models
All models use `HasUuids` trait with UUID primary keys and `BelongsToUser` trait for automatic user scoping.

### Date Handling
- **Always use ISO format (YYYY-MM-DD)** for date consistency
- Use Carbon for date manipulation
- Consider timezone implications for display formatting

### Livewire Component Pattern
- Full-page components with `#[Layout('layouts.app')]` and `#[Title('...')]`
- URL-bound filters via `#[Url(as: 'q', history: true, keep: true)]`
- Dialogs managed with Alpine.js `x-data` + `$wire.entangle`

## UI Patterns

### Design System (canonical components)

The design system lives in `resources/css/m3` (layers: `tokens` -> `primitives` -> `patterns` -> `archetypes` -> `modules`) and exposes Blade components under the `x-ui.*` namespace. **Full contract and definition of done: `docs/design-system.md`.**

Never hand-roll a control that already exists. Use:

| Need | Component |
| --- | --- |
| Button / action link | `x-ui.action`, `x-ui.icon-action` |
| Delete or other destructive action | `x-ui.destructive-action` (confirms when `risk="material"`) |
| Form control | `x-ui.field`, `x-ui.select`, `x-ui.textarea` |
| Search + filters | `x-ui.filter-bar` with `x-slot:chips`, plus `x-ui.chip` and `x-ui.filter-menu` |
| Metric / summary | `x-ui.metric`, `x-ui.metric-grid` |
| Section, list | `x-ui.section`, `x-ui.list`, `x-ui.list-item` |
| Modal surfaces | `x-ui.dialog`, `x-ui.sheet`, `x-ui.snackbar` |
| Data states | `x-ui.state` + `App\Support\Ui\DataState::resolve()` |
| Status marker | `x-ui.chip`, `x-ui.badge`, `x-ui.progress`, `x-ui.icon`, `x-ui.card` |

```html
<x-ui.filter-bar search="search" placeholder="Buscar tareas..." label="Filtros de tareas">
    <x-slot:chips>
        <x-ui.chip variant="filter" :selected="$filter === 'pending'" wire:click="$set('filter', 'pending')">Pendientes</x-ui.chip>
        <div class="md-chip-rail__divider"></div>
        <x-ui.filter-menu name="categoryFilter" label="Categoria" :options="$categories" :selected="$categoryFilter" />
    </x-slot:chips>
</x-ui.filter-bar>
```

Components accept **semantic props only** (`variant`, `tone`, `size`, `risk`, ...) and propagate `wire:*`, `x-*`, ARIA and `data-*`. They never accept colors, paddings or sizes.

**Never use**: inline `style` (except the dynamic custom properties listed in `config/ui-conformance.php`), direct colors, `form-control`, `form-select`, `input-group`, `text-muted`, `text-danger`, `md-chip-select`, `md-chip-group`, `md-chip--selected`, or a native `<select>` outside `x-ui.select`.

Browse every component with its variants and states at `/ui-catalog` (local and testing only). Run `php artisan ui:conformance` before finishing: it fails on any new visual debt.

### Screen archetypes
Every full-page screen composes `x-module-shell` and declares one approved archetype - `list`, `detail`, `dashboard`, `daily-log`, `settings` or `guided-flow` - via the `archetype` prop or `config/modules.php`. The shell exposes the regions `identity`, `navigation`, `actions`, `controls`, `content` and `context`; filters belong in `<x-slot:controls>`, contextual panels in `<x-slot:rail>`. At most one visually dominant action (`md-btn-filled`) per context.

### Context Rail (Right Sidebar)
Use `<x-slot:rail>` inside `<x-module-shell>` for contextual info panels. The shell renders `.md-module-workspace`: content plus a 320px rail from 1200px, single column below. Reference: `resources/views/livewire/task/task-list.blade.php` lines 243-272.

```html
<x-slot:rail>
    <x-context-widget title="Resumen" icon="bi-stars" tone="success">
        <dl class="md-context-list">
            <div><dt>Label</dt><dd>{{ $value }}</dd></div>
        </dl>
    </x-context-widget>

    <x-context-widget title="Links" icon="bi-signpost-split">
        <div class="md-context-links">
            <a href="{{ route('...') }}"><i class="bi bi-icon"></i> Label</a>
        </div>
    </x-context-widget>
</x-slot:rail>
```

### Dialog Pattern
Dialogs use Alpine.js with Livewire entanglement:

```html
<x-module-shell module="..." x-data="{ showDialog: $wire.entangle('showForm') }">
    <!-- ... content ... -->
    <template x-if="showDialog">
        <div>
            <div class="md-dialog-scrim" @click="showDialog = false"></div>
            <div class="md-dialog" @click.stop>
                <h2 class="md-dialog-headline md-headline-small">Title</h2>
                <div class="md-dialog-content">...</div>
                <div class="md-dialog-actions">
                    <button @click="showDialog = false" class="md-btn-text">Cancelar</button>
                    <button wire:click="save" class="md-btn-filled">Guardar</button>
                </div>
            </div>
        </div>
    </template>
</x-module-shell>
```

## Build and Deployment

### Environment
- Laragon local development environment
- MySQL database
- `.env` file for configuration (standard Laravel)

### Responsive Design
- Mobile-first approach with Bootstrap-style breakpoints
- Adaptive navigation: desktop sidebar, mobile bottom navigation
- Touch-optimized interactions for mobile devices
