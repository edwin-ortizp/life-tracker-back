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

### Search & Filter Standard (Material Design 3)
All modules must use this pattern for search and filtering. Reference: `resources/views/livewire/task/task-list.blade.php`.

```html
<div x-data="{ openMenu: null }" @click.outside="openMenu = null" class="mb-3">
    <!-- Search bar -->
    <div class="md-search-bar mb-2">
        <i class="bi bi-search md-search-bar__icon"></i>
        <input type="text" wire:model.live.debounce.300ms="search"
               class="md-search-bar__input" placeholder="Buscar...">
        @if($search)
            <button wire:click="$set('search', '')" class="md-search-bar__clear">
                <i class="bi bi-x-lg"></i>
            </button>
        @endif
    </div>

    <!-- Chip rail -->
    <div class="md-chip-rail">
        <!-- Toggle chips -->
        <button wire:click="..." class="md-chip md-chip-filter {{ $active ? 'selected' : '' }}">
            Label
        </button>

        <div class="md-chip-rail__divider"></div>

        <!-- Chip-menu dropdown (for option lists) -->
        <div class="md-chip-menu" :class="{ 'open': openMenu === 'name' }">
            <button @click="openMenu = openMenu === 'name' ? null : 'name'"
                    class="md-chip md-chip-filter {{ $filter ? 'selected' : '' }}">
                {{ $filter ? $options[$filter] : 'Label' }}
                <i class="bi bi-chevron-down md-chip-menu__arrow"></i>
            </button>
            <div x-show="openMenu === 'name'" x-transition x-cloak
                 class="md-chip-menu__dropdown">
                <button wire:click="$set('filter', '')" @click="openMenu = null"
                        class="md-chip-menu__item {{ !$filter ? 'active' : '' }}">Todos</button>
                @foreach ($options as $key => $label)
                    <button wire:click="$set('filter', '{{ $key }}')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $filter === $key ? 'active' : '' }}">
                        {{ $label }}
                    </button>
                @endforeach
            </div>
        </div>
    </div>
</div>
```

**Never use**: `md-chip-select` (native select), `md-text-field` for search, `md-chip-group`, or `md-chip--selected` (use `selected` class instead).

### Context Rail (Right Sidebar)
Use `<x-slot:rail>` inside `<x-module-shell>` for contextual info panels. The shell renders a 9/3 grid layout. Reference: `resources/views/livewire/task/task-list.blade.php` lines 243-272.

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
