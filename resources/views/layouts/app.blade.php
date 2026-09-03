<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'Life Tracker' }}</title>
    <link rel="manifest" href="{{ asset('manifest.json') }}">
    <meta name="theme-color" content="#0D6BC4">
    @include('partials.app-styles')
    @include('partials.app-scripts')
    @livewireStyles
</head>
@php
    $routeName = request()->route()?->getName() ?? '';
    $activeModuleKey = null;
    foreach (config('modules', []) as $key => $candidate) {
        if ($key === 'navigation') {
            continue;
        }
        foreach ($candidate['patterns'] ?? [] as $pattern) {
            if (\Illuminate\Support\Str::is($pattern, $routeName)) {
                $activeModuleKey = $key;
                break 2;
            }
        }
    }
    $activeModuleTitle = $activeModuleKey ? (config("modules.{$activeModuleKey}.title") ?? 'Life Tracker') : 'Life Tracker';

    $searchIndex = collect(config('modules.navigation', []))
        ->flatMap(fn ($section) => $section['items'] ?? [])
        ->map(fn ($item) => ['label' => $item['label'], 'icon' => $item['icon'], 'href' => route($item['route'])])
        ->values();
@endphp
<body class="lt-frame"
      x-data="{
          sidebarOpen: false,
          sidebarRail: localStorage.getItem('lt-sidebar-rail') === '1',
          compact: window.matchMedia('(max-width: 767.98px)').matches,
          search: '',
          searchOpen: false,
          init() {
              const mq = window.matchMedia('(max-width: 767.98px)');
              mq.addEventListener('change', (e) => { this.compact = e.matches; if (!this.compact) { this.sidebarOpen = false; this.searchOpen = false; } });
              this.$watch('sidebarRail', (v) => localStorage.setItem('lt-sidebar-rail', v ? '1' : '0'));
          },
          toggleNav() {
              if (this.compact) { this.sidebarOpen = !this.sidebarOpen; return; }
              this.sidebarRail = !this.sidebarRail;
          },
      }"
      :class="{ 'is-rail': sidebarRail && !compact, 'lt-frame--compact': compact }">

    {{-- Sidebar: expandida, raíl o superpuesta en móvil, según config('modules.navigation') --}}
    <aside class="lt-sidebar" :class="{ 'is-open': sidebarOpen }" aria-label="Módulos de Life Tracker">
        <div class="lt-sidebar__brand">
            <span class="lt-sidebar__mark" aria-hidden="true"><i class="bi bi-activity"></i></span>
            <span class="lt-sidebar__name">Life Tracker</span>
        </div>
        <nav class="lt-sidebar__scroll">
            @foreach (config('modules.navigation', []) as $section)
                <div class="lt-nav-group">
                    <span class="lt-nav-group__label">{{ $section['label'] }}</span>
                    @foreach ($section['items'] as $item)
                        @php($active = request()->routeIs(...$item['active']))
                        <a href="{{ route($item['route']) }}" wire:navigate class="lt-nav-item {{ $active ? 'is-active' : '' }}"
                           @if($active) aria-current="page" @endif
                           @click="sidebarOpen = false">
                            <span class="lt-nav-item__icon"><i class="bi {{ $item['icon'] }}" aria-hidden="true"></i></span>
                            <span class="lt-nav-item__label">{{ $item['label'] }}</span>
                        </a>
                    @endforeach
                </div>
            @endforeach
        </nav>
    </aside>
    <button type="button" class="lt-scrim" x-show="compact && sidebarOpen" x-cloak aria-label="Cerrar los módulos" @click="sidebarOpen = false"></button>

    <div class="lt-frame__body">
        <header class="lt-topbar">
            <button type="button" class="md-btn-icon lt-topbar__menu" x-show="!(compact && searchOpen)" @click="toggleNav()"
                    :aria-label="compact ? 'Mostrar los módulos' : (sidebarRail ? 'Expandir la barra de módulos' : 'Colapsar la barra de módulos')"
                    :aria-expanded="compact ? sidebarOpen : !sidebarRail">
                <i class="bi bi-list" aria-hidden="true"></i>
            </button>

            {{-- Solo en compacto: mientras se busca, este botón cierra la búsqueda
                 en vez de abrir la sidebar; en el resto de casos no se muestra. --}}
            <button type="button" class="md-btn-icon" x-show="compact && searchOpen" x-cloak
                    @click="searchOpen = false; search = ''" aria-label="Cerrar búsqueda">
                <i class="bi bi-arrow-left" aria-hidden="true"></i>
            </button>

            <h2 class="lt-topbar__title" x-show="!(compact && searchOpen)">{{ $activeModuleTitle }}</h2>

            {{-- Escritorio: buscador siempre visible. Compacto: icono que expande
                 a buscador de ancho completo, patrón M3 de "search view". --}}
            <button type="button" class="md-btn-icon" x-show="compact && !searchOpen" @click="searchOpen = true; $nextTick(() => document.getElementById('lt-global-search').focus())" aria-label="Buscar">
                <i class="bi bi-search" aria-hidden="true"></i>
            </button>
            <div class="lt-search" role="search" x-show="!compact || searchOpen" x-data="{ open: false }" @click.outside="open = false">
                <i class="bi bi-search" aria-hidden="true"></i>
                <label class="visually-hidden" for="lt-global-search">Buscar en todos los módulos</label>
                <input id="lt-global-search" type="search" placeholder="Buscar en todos los módulos…" x-ref="globalSearch"
                       x-model="search" @focus="open = true" @input="open = true">
                <template x-if="open && search.length">
                    <div class="lt-pop__surface" style="position:absolute; top:calc(100% + 8px); left:0; right:0;">
                        <template x-for="result in ({{ \Illuminate\Support\Js::from($searchIndex) }}).filter(m => m.label.toLowerCase().includes(search.toLowerCase()))" :key="result.href">
                            <a class="lt-pop__item" wire:navigate :href="result.href">
                                <i :class="'bi ' + result.icon" aria-hidden="true"></i>
                                <span x-text="result.label"></span>
                            </a>
                        </template>
                    </div>
                </template>
            </div>

            <div class="lt-topbar__tools" x-show="!(compact && searchOpen)">
                <a href="{{ route('settings') }}" wire:navigate class="md-btn-icon" aria-label="Ajustes">
                    <i class="bi bi-gear" aria-hidden="true"></i>
                </a>
                <button type="button" class="md-btn-icon lt-topbar__bell" aria-label="Notificaciones">
                    <i class="bi bi-bell" aria-hidden="true"></i>
                </button>
                @auth
                    <a href="{{ route('settings') }}" wire:navigate class="lt-avatar" aria-label="Tu perfil">{{ \Illuminate\Support\Str::of(auth()->user()->name)->explode(' ')->map(fn ($p) => mb_substr($p, 0, 1))->take(2)->implode('') }}</a>
                @endauth
            </div>
        </header>

        @if(app()->environment('local'))
            <div style="position:sticky;top:0;left:0;right:0;height:20px;background:rgba(245,158,11,0.8);color:#000;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;z-index:99999;pointer-events:none;letter-spacing:.5px;">
                LOCAL ENVIRONMENT
            </div>
        @endif

        <main class="lt-main">
            {{ $slot }}
        </main>

        {{-- Móvil: barra inferior con destinos principales --}}
        <nav class="lt-bottom" aria-label="Destinos principales" x-show="compact" x-cloak>
            <a href="{{ route('home') }}" wire:navigate class="lt-bottom__item {{ request()->routeIs('home') ? 'is-active' : '' }}" @if(request()->routeIs('home')) aria-current="page" @endif>
                <span class="lt-bottom__icon"><i class="bi bi-house" aria-hidden="true"></i></span>
                <span>Inicio</span>
            </a>
            <a href="{{ route('habits') }}" wire:navigate class="lt-bottom__item {{ request()->routeIs('habits*') ? 'is-active' : '' }}" @if(request()->routeIs('habits*')) aria-current="page" @endif>
                <span class="lt-bottom__icon"><i class="bi bi-check2-square" aria-hidden="true"></i></span>
                <span>Hábitos</span>
            </a>
            <a href="{{ route('tasks.list') }}" wire:navigate class="lt-bottom__item {{ request()->routeIs('tasks.*') ? 'is-active' : '' }}" @if(request()->routeIs('tasks.*')) aria-current="page" @endif>
                <span class="lt-bottom__icon"><i class="bi bi-list-task" aria-hidden="true"></i></span>
                <span>Tareas</span>
            </a>
            <a href="{{ route('statistics') }}" wire:navigate class="lt-bottom__item {{ request()->routeIs('statistics*') ? 'is-active' : '' }}" @if(request()->routeIs('statistics*')) aria-current="page" @endif>
                <span class="lt-bottom__icon"><i class="bi bi-bar-chart" aria-hidden="true"></i></span>
                <span>Stats</span>
            </a>
            <button type="button" class="lt-bottom__item" @click="sidebarOpen = true">
                <span class="lt-bottom__icon"><i class="bi bi-grid" aria-hidden="true"></i></span>
                <span>Módulos</span>
            </button>
        </nav>
    </div>

    @livewireScriptConfig
</body>
</html>
