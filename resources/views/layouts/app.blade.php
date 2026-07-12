<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'Life Tracker' }}</title>
    <link rel="manifest" href="{{ asset('manifest.json') }}">
    <meta name="theme-color" content="#3b82f6">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    @livewireStyles
    <style>
        :root {
            --sidebar-width: 256px;
            --sidebar-collapsed-width: 64px;
            --footer-height: 28px;
            --mobile-nav-height: 64px;
        }

        body {
            min-height: 100vh;
            background-color: #f8f9fa;
        }

        .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            width: var(--sidebar-width);
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            transition: width 0.3s ease;
            z-index: 1040;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
        }

        .sidebar.collapsed {
            width: var(--sidebar-collapsed-width);
        }

        .sidebar .nav-link {
            color: rgba(255,255,255,0.7);
            padding: 0.6rem 1rem;
            border-radius: 8px;
            margin: 2px 8px;
            transition: all 0.2s;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 0.9rem;
        }

        .sidebar .nav-link:hover {
            color: #fff;
            background: rgba(255,255,255,0.1);
        }

        .sidebar .nav-link.active {
            color: #fff;
            background: linear-gradient(135deg, #3b82f6, #6366f1);
        }

        .sidebar .nav-link i {
            font-size: 1.2rem;
            min-width: 24px;
            text-align: center;
        }

        .sidebar.collapsed .nav-label {
            display: none;
        }

        .main-content {
            margin-left: var(--sidebar-width);
            padding: 1.5rem;
            padding-bottom: calc(var(--footer-height) + 1rem);
            min-height: 100vh;
            transition: margin-left 0.3s ease;
        }

        .main-content.sidebar-collapsed {
            margin-left: var(--sidebar-collapsed-width);
        }

        .app-footer {
            position: fixed;
            bottom: 0;
            left: var(--sidebar-width);
            right: 0;
            height: var(--footer-height);
            background: #3b82f6;
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 1rem;
            font-size: 0.75rem;
            z-index: 1030;
            transition: left 0.3s ease;
        }

        .app-footer.sidebar-collapsed {
            left: var(--sidebar-collapsed-width);
        }

        .user-profile {
            padding: 1rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 0.9rem;
            border: 2px solid rgba(255,255,255,0.2);
        }

        .sidebar-toggle {
            padding: 0.8rem 1rem;
            border-top: 1px solid rgba(255,255,255,0.1);
            margin-top: auto;
        }

        .sidebar-toggle button {
            background: none;
            border: none;
            color: rgba(255,255,255,0.6);
            cursor: pointer;
            padding: 0.4rem;
            border-radius: 6px;
            transition: all 0.2s;
        }

        .sidebar-toggle button:hover {
            color: white;
            background: rgba(255,255,255,0.1);
        }

        /* Mobile */
        .mobile-bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: var(--mobile-nav-height);
            background: white;
            border-top: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: space-around;
            z-index: 1040;
            padding-bottom: env(safe-area-inset-bottom, 0);
        }

        .mobile-bottom-nav .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            color: #6b7280;
            text-decoration: none;
            font-size: 0.65rem;
            padding: 0.4rem 0.8rem;
            border-radius: 8px;
            transition: all 0.2s;
        }

        .mobile-bottom-nav .nav-item.active {
            color: #3b82f6;
        }

        .mobile-bottom-nav .nav-item i {
            font-size: 1.3rem;
        }

        @media (max-width: 767.98px) {
            .sidebar, .app-footer {
                display: none !important;
            }
            .main-content {
                margin-left: 0 !important;
                padding-bottom: calc(var(--mobile-nav-height) + 1rem);
            }
        }

        @media (min-width: 768px) {
            .mobile-bottom-nav, .mobile-more-overlay {
                display: none !important;
            }
        }

        .mobile-more-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1050;
        }

        .mobile-more-drawer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            border-radius: 1rem 1rem 0 0;
            padding: 1.5rem;
            z-index: 1051;
            max-height: 70vh;
            overflow-y: auto;
        }

        .mobile-more-drawer .drawer-handle {
            width: 40px;
            height: 4px;
            background: #d1d5db;
            border-radius: 2px;
            margin: 0 auto 1rem;
        }

        .mobile-more-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
        }

        .mobile-more-grid a {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            padding: 0.75rem;
            border-radius: 12px;
            color: #374151;
            text-decoration: none;
            font-size: 0.8rem;
            transition: background 0.2s;
        }

        .mobile-more-grid a:hover {
            background: #f3f4f6;
        }

        .mobile-more-grid a i {
            font-size: 1.5rem;
            color: #3b82f6;
        }
    </style>
</head>
<body x-data="{ sidebarCollapsed: localStorage.getItem('sidebar_collapsed') === 'true', mobileMoreOpen: false }">

    {{-- Desktop Sidebar --}}
    <aside class="sidebar d-none d-md-flex" :class="{ 'collapsed': sidebarCollapsed }">
        <div class="user-profile">
            <a href="{{ route('settings') }}" class="d-flex align-items-center gap-3 text-decoration-none">
                <div class="user-avatar">
                    {{ strtoupper(substr(auth()->user()->email ?? 'U', 0, 1)) }}
                </div>
                <div x-show="!sidebarCollapsed" class="text-white" style="min-width: 0;">
                    <div class="fw-medium text-truncate" style="font-size: 0.9rem;">
                        {{ explode('@', auth()->user()->email ?? 'Usuario')[0] }}
                    </div>
                    <div class="text-white-50 text-truncate" style="font-size: 0.75rem;">
                        {{ auth()->user()->email ?? '' }}
                    </div>
                </div>
            </a>
        </div>

        <nav class="flex-grow-1 py-2" style="overflow-y: auto;">
            @php
                $menuItems = [
                    ['icon' => 'bi-house', 'label' => 'Inicio', 'route' => 'home'],
                    ['icon' => 'bi-droplet', 'label' => 'Hidratacion', 'route' => 'water'],
                    ['icon' => 'bi-activity', 'label' => 'Ejercicio', 'route' => 'exercise'],
                    ['icon' => 'bi-check2-square', 'label' => 'Habitos', 'route' => 'habits'],
                    ['icon' => 'bi-emoji-smile', 'label' => 'Estado', 'route' => 'mood'],
                    ['icon' => 'bi-journal-text', 'label' => 'Diario', 'route' => 'journal'],
                    ['icon' => 'bi-clock', 'label' => 'Pomodoro', 'route' => 'pomodoro'],
                    ['icon' => 'bi-egg-fried', 'label' => 'Comidas', 'route' => 'meals'],
                    ['icon' => 'bi-list-task', 'label' => 'Tareas', 'route' => 'tasks'],
                    ['icon' => 'bi-kanban', 'label' => 'Kanban', 'route' => 'tasks.kanban'],
                    ['icon' => 'bi-people', 'label' => 'Relaciones', 'route' => 'relationships'],
                    ['icon' => 'bi-flag', 'label' => 'Objetivos', 'route' => 'goals'],
                    ['icon' => 'bi-bar-chart', 'label' => 'Estadisticas', 'route' => 'statistics'],
                    ['icon' => 'bi-hand-thumbs-down', 'label' => 'Habitos Negativos', 'route' => 'negative-habits'],
                ];
            @endphp

            @foreach ($menuItems as $item)
                <a href="{{ route($item['route']) }}"
                   class="nav-link {{ request()->routeIs($item['route'] . '*') ? 'active' : '' }}"
                   @if($sidebarCollapsed ?? false) title="{{ $item['label'] }}" @endif>
                    <i class="bi {{ $item['icon'] }}"></i>
                    <span class="nav-label">{{ $item['label'] }}</span>
                </a>
            @endforeach
        </nav>

        <div class="sidebar-toggle">
            <button @click="sidebarCollapsed = !sidebarCollapsed; localStorage.setItem('sidebar_collapsed', sidebarCollapsed)"
                    class="w-100 text-start">
                <i class="bi" :class="sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'"></i>
                <span x-show="!sidebarCollapsed" class="ms-2">Colapsar</span>
            </button>
        </div>
    </aside>

    {{-- Main Content --}}
    <main class="main-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        {{ $slot }}
    </main>

    {{-- Desktop Footer --}}
    <footer class="app-footer d-none d-md-flex" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <div class="d-flex align-items-center gap-3">
            <span><i class="bi bi-circle-fill text-success" style="font-size: 0.5rem;"></i> Online</span>
            <span>{{ $title ?? 'Life Tracker' }}</span>
        </div>
        <div class="d-flex align-items-center gap-3">
            <span id="pomodoro-footer-timer"></span>
            <span>Life Tracker v2.0</span>
        </div>
    </footer>

    {{-- Mobile Bottom Navigation --}}
    <nav class="mobile-bottom-nav d-md-none">
        <a href="{{ route('home') }}" class="nav-item {{ request()->routeIs('home') ? 'active' : '' }}">
            <i class="bi bi-house"></i>
            <span>Inicio</span>
        </a>
        <a href="{{ route('water') }}" class="nav-item {{ request()->routeIs('water*') ? 'active' : '' }}">
            <i class="bi bi-droplet"></i>
            <span>Agua</span>
        </a>
        <a href="{{ route('exercise') }}" class="nav-item {{ request()->routeIs('exercise*') ? 'active' : '' }}">
            <i class="bi bi-activity"></i>
            <span>Ejercicio</span>
        </a>
        <a href="{{ route('habits') }}" class="nav-item {{ request()->routeIs('habits*') ? 'active' : '' }}">
            <i class="bi bi-check2-square"></i>
            <span>Habitos</span>
        </a>
        <a href="#" class="nav-item" @click.prevent="mobileMoreOpen = true">
            <i class="bi bi-three-dots"></i>
            <span>Mas</span>
        </a>
    </nav>

    {{-- Mobile More Drawer --}}
    <template x-if="mobileMoreOpen">
        <div>
            <div class="mobile-more-overlay d-md-none" @click="mobileMoreOpen = false"></div>
            <div class="mobile-more-drawer d-md-none">
                <div class="drawer-handle"></div>
                <div class="mobile-more-grid">
                    <a href="{{ route('mood') }}" @click="mobileMoreOpen = false">
                        <i class="bi bi-emoji-smile"></i>Estado
                    </a>
                    <a href="{{ route('journal') }}" @click="mobileMoreOpen = false">
                        <i class="bi bi-journal-text"></i>Diario
                    </a>
                    <a href="{{ route('pomodoro') }}" @click="mobileMoreOpen = false">
                        <i class="bi bi-clock"></i>Pomodoro
                    </a>
                    <a href="{{ route('meals') }}" @click="mobileMoreOpen = false">
                        <i class="bi bi-egg-fried"></i>Comidas
                    </a>
                    <a href="{{ route('tasks') }}" @click="mobileMoreOpen = false">
                        <i class="bi bi-list-task"></i>Tareas
                    </a>
                    <a href="{{ route('tasks.kanban') }}" @click="mobileMoreOpen = false">
                        <i class="bi bi-kanban"></i>Kanban
                    </a>
                    <a href="{{ route('relationships') }}" @click="mobileMoreOpen = false">
                        <i class="bi bi-people"></i>Relaciones
                    </a>
                    <a href="{{ route('goals') }}" @click="mobileMoreOpen = false">
                        <i class="bi bi-flag"></i>Objetivos
                    </a>
                    <a href="{{ route('statistics') }}" @click="mobileMoreOpen = false">
                        <i class="bi bi-bar-chart"></i>Estadisticas
                    </a>
                    <a href="{{ route('negative-habits') }}" @click="mobileMoreOpen = false">
                        <i class="bi bi-hand-thumbs-down"></i>H. Negativos
                    </a>
                    <a href="{{ route('settings') }}" @click="mobileMoreOpen = false">
                        <i class="bi bi-gear"></i>Ajustes
                    </a>
                </div>
            </div>
        </div>
    </template>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    @livewireScripts
</body>
</html>
