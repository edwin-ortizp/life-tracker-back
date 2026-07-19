<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'Life Tracker' }}</title>
    <link rel="manifest" href="{{ asset('manifest.json') }}">
    <meta name="theme-color" content="#2B5BB5">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    @include('partials.app-styles')
    @include('partials.app-scripts')
    @livewireStyles
</head>
@php
    $activeDrawerSection = match (true) {
        request()->routeIs('habits*', 'water*', 'exercise*', 'health*', 'mood*', 'negative-habits*') => 'wellbeing',
        request()->routeIs('tasks.*', 'pomodoro*', 'goals*') => 'productivity',
        request()->routeIs('meals*') => 'food',
        request()->routeIs('journal*', 'relationships*') => 'life',
        request()->routeIs('vehicles*') => 'vehicles',
        default => 'overview',
    };
@endphp
<body x-data="{ drawerOpen: false, drawerSection: '{{ $activeDrawerSection }}' }" :class="{ 'md-scroll-locked': drawerOpen }">

    {{-- Scrim (drawer overlay) --}}
    <div class="md-scrim"
         x-show="drawerOpen"
         x-transition.opacity.duration.200ms
         @click="drawerOpen = false"
         style="display: none;">
    </div>

    {{-- Navigation Drawer (overlay, desktop + mobile) --}}
    <aside class="md-navigation-drawer"
           x-show="drawerOpen"
           x-transition:enter="md-drawer-enter"
           x-transition:enter-start="md-drawer-enter-start"
           x-transition:enter-end="md-drawer-enter-end"
           x-transition:leave="md-drawer-leave"
           x-transition:leave-start="md-drawer-leave-start"
           x-transition:leave-end="md-drawer-leave-end"
           @click.outside="drawerOpen = false"
           style="display: none;">
        <div class="md-drawer-header">
            <div class="d-flex align-items-center justify-content-between">
                <span class="md-title-large" style="color: var(--md-sys-color-on-surface);">Life Tracker</span>
                <button class="md-btn-icon" @click="drawerOpen = false">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        </div>

        <nav class="md-drawer-content" aria-label="Todos los módulos">
            <p class="md-drawer-hint">Elige un área para ver sus módulos.</p>
            @foreach (config('modules.navigation', []) as $sectionKey => $section)
                <section class="md-drawer-group" :class="{ 'is-open': drawerSection === '{{ $sectionKey }}' }">
                    <button type="button" class="md-drawer-group-toggle" @click="drawerSection = drawerSection === '{{ $sectionKey }}' ? null : '{{ $sectionKey }}'" :aria-expanded="drawerSection === '{{ $sectionKey }}'">
                        <span><i class="bi {{ $section['icon'] }}"></i> {{ $section['label'] }}</span><i class="bi bi-chevron-down"></i>
                    </button>
                    <div x-cloak x-show="drawerSection === '{{ $sectionKey }}'">
                        @foreach ($section['items'] as $item)
                            <a href="{{ route($item['route']) }}" class="md-drawer-item {{ request()->routeIs(...$item['active']) ? 'active' : '' }}" @click="drawerOpen = false">
                                <i class="bi {{ $item['icon'] }}"></i><span>{{ $item['label'] }}</span>
                            </a>
                        @endforeach
                    </div>
                </section>
            @endforeach
        </nav>
    </aside>

    {{-- Desktop: Navigation Rail --}}
    <nav class="md-navigation-rail d-none d-md-flex">
        <button class="md-rail-menu-btn" @click="drawerOpen = !drawerOpen" title="Menú">
            <i class="bi bi-list"></i>
        </button>

        <div class="md-rail-destinations">
            <a href="{{ route('home') }}" class="md-rail-item {{ request()->routeIs('home') ? 'active' : '' }}" title="Inicio">
                <div class="md-rail-indicator">
                    <i class="bi bi-house"></i>
                </div>
                <span class="md-label-medium">Inicio</span>
            </a>
            <a href="{{ route('habits') }}" class="md-rail-item {{ request()->routeIs('habits*') ? 'active' : '' }}" title="Hábitos">
                <div class="md-rail-indicator">
                    <i class="bi bi-check2-square"></i>
                </div>
                <span class="md-label-medium">Hábitos</span>
            </a>
            <a href="{{ route('tasks.list') }}" class="md-rail-item {{ request()->routeIs('tasks.*') ? 'active' : '' }}" title="Tareas">
                <div class="md-rail-indicator">
                    <i class="bi bi-list-task"></i>
                </div>
                <span class="md-label-medium">Tareas</span>
            </a>
            <a href="{{ route('meals') }}" class="md-rail-item md-rail-item--daily {{ request()->routeIs('meals*') ? 'active' : '' }}" title="Comidas">
                <div class="md-rail-indicator">
                    <i class="bi bi-egg-fried"></i>
                </div>
                <span class="md-label-medium">Comidas</span>
            </a>
            <a href="{{ route('water') }}" class="md-rail-item md-rail-item--daily {{ request()->routeIs('water*') ? 'active' : '' }}" title="Hidratación">
                <div class="md-rail-indicator">
                    <i class="bi bi-droplet"></i>
                </div>
                <span class="md-label-medium">Agua</span>
            </a>
            <a href="{{ route('health') }}" class="md-rail-item md-rail-item--daily md-rail-item--optional {{ request()->routeIs('health*') ? 'active' : '' }}" title="Salud">
                <div class="md-rail-indicator">
                    <i class="bi bi-heart-pulse"></i>
                </div>
                <span class="md-label-medium">Salud</span>
            </a>
            <a href="{{ route('statistics') }}" class="md-rail-item {{ request()->routeIs('statistics*') ? 'active' : '' }}" title="Estadísticas">
                <div class="md-rail-indicator">
                    <i class="bi bi-bar-chart"></i>
                </div>
                <span class="md-label-medium">Stats</span>
            </a>
            <button class="md-rail-item md-rail-more" @click="drawerOpen = true" title="Todos los módulos">
                <div class="md-rail-indicator">
                    <i class="bi bi-grid"></i>
                </div>
                <span class="md-label-medium">Más</span>
            </button>
            <a href="{{ route('settings') }}" class="md-rail-item {{ request()->routeIs('settings*') ? 'active' : '' }}" title="Ajustes">
                <div class="md-rail-indicator">
                    <i class="bi bi-gear"></i>
                </div>
                <span class="md-label-medium">Ajustes</span>
            </a>
        </div>
    </nav>

    {{-- Main Content --}}
    <main class="md-main-content">
        {{ $slot }}
    </main>

    {{-- Mobile: Navigation Bar --}}
    <nav class="md-navigation-bar d-md-none">
        <a href="{{ route('home') }}" class="md-nav-bar-item {{ request()->routeIs('home') ? 'active' : '' }}">
            <div class="md-nav-bar-indicator">
                <i class="bi bi-house"></i>
            </div>
            <span class="md-label-medium">Inicio</span>
        </a>
        <a href="{{ route('habits') }}" class="md-nav-bar-item {{ request()->routeIs('habits*') ? 'active' : '' }}">
            <div class="md-nav-bar-indicator">
                <i class="bi bi-check2-square"></i>
            </div>
            <span class="md-label-medium">Hábitos</span>
        </a>
        <a href="{{ route('tasks.list') }}" class="md-nav-bar-item {{ request()->routeIs('tasks.*') ? 'active' : '' }}">
            <div class="md-nav-bar-indicator">
                <i class="bi bi-list-task"></i>
            </div>
            <span class="md-label-medium">Tareas</span>
        </a>
        <a href="{{ route('statistics') }}" class="md-nav-bar-item {{ request()->routeIs('statistics*') ? 'active' : '' }}">
            <div class="md-nav-bar-indicator">
                <i class="bi bi-bar-chart"></i>
            </div>
            <span class="md-label-medium">Stats</span>
        </a>
        <button class="md-nav-bar-item" @click="drawerOpen = true">
            <div class="md-nav-bar-indicator">
                <i class="bi bi-grid"></i>
            </div>
            <span class="md-label-medium">Más</span>
        </button>
    </nav>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    @livewireScripts
</body>
</html>
