<!DOCTYPE html>
<html lang="es" class="lt-m-root">
<head>
    <meta charset="UTF-8">
    {{-- `viewport-fit=cover` deja que el contenido llegue a los bordes; las
         areas seguras se respetan despues con los tokens `--lt-safe-*`. --}}
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'Life Tracker' }}</title>

    <link rel="manifest" href="{{ asset('manifest.json') }}">
    {{-- Mismo color que declara el manifest: si difieren, la barra de estado
         cambia de tono al instalar la aplicacion. --}}
    <meta name="theme-color" content="#2B5BB5">
    <meta name="color-scheme" content="light dark">

    {{-- iOS no lee el manifest: necesita sus propias etiquetas para abrirse
         sin barra de navegador y con el icono correcto. --}}
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Life Tracker">
    <link rel="apple-touch-icon" sizes="192x192" href="{{ asset('icons/icon-192x192.png') }}">

    @include('partials.app-styles')
    @include('partials.app-scripts')
    @livewireStyles
</head>
@php
    $routeName = request()->route()?->getName() ?? '';

    $activeModule = null;
    foreach (config('modules', []) as $key => $candidate) {
        if ($key === 'navigation') {
            continue;
        }
        foreach ($candidate['patterns'] ?? [] as $pattern) {
            if (\Illuminate\Support\Str::is($pattern, $routeName)) {
                $activeModule = $candidate;
                break 2;
            }
        }
    }

    $barTitle = $title ?? $activeModule['title'] ?? 'Life Tracker';

    // `match` es el prefijo de URL con el que la barra decide, en cliente, cual
    // es la pestana activa. Se compara con `location.pathname` porque la barra
    // esta persistida y el servidor ya no la vuelve a renderizar.
    $destinations = [
        ['label' => 'Inicio', 'route' => 'home', 'icon' => 'bi-house', 'match' => '/'],
        ['label' => 'Hábitos', 'route' => 'habits', 'icon' => 'bi-check2-square', 'match' => '/habits'],
        ['label' => 'Tareas', 'route' => 'tasks.list', 'icon' => 'bi-list-task', 'match' => '/tasks'],
        ['label' => 'Stats', 'route' => 'statistics', 'icon' => 'bi-bar-chart', 'match' => '/statistics'],
    ];
@endphp
<body class="lt-m" x-data="ltMobileFrame()">

    <div class="lt-m-offline" :class="{ 'is-visible': offline }" role="status" aria-live="polite" x-cloak>
        Sin conexión — se muestran los datos guardados
    </div>

    {{-- La app bar no se persiste: su titulo cambia en cada pantalla. --}}
    <header class="lt-m-bar" :data-scrolled="scrolled">
        @if (! request()->routeIs('home'))
            <button type="button" class="lt-m-bar__action" @click="goBack()" aria-label="Volver">
                <i class="bi bi-arrow-left" aria-hidden="true"></i>
            </button>
        @endif

        <h1 class="lt-m-bar__title">{{ $barTitle }}</h1>

        {{-- Como maximo dos acciones: mas de eso deja de leerse como app bar. --}}
        <a href="{{ route('settings') }}" wire:navigate class="lt-m-bar__action" aria-label="Ajustes">
            <i class="bi bi-gear" aria-hidden="true"></i>
        </a>
    </header>

    <main class="lt-m-content" id="lt-m-content">
        {{ $slot }}
    </main>

    {{-- @persist mantiene la barra viva entre navegaciones: no se repinta ni
         parpadea. Por eso el estado activo se calcula en cliente a partir de la
         URL, no en servidor con `routeIs`, que quedaria congelado. --}}
    @persist('mobile-tabs')
        <nav class="lt-m-tabs" aria-label="Destinos principales"
             x-data="ltMobileTabs()"
             :data-hidden="hidden">
            @foreach ($destinations as $destination)
                <a href="{{ route($destination['route']) }}" wire:navigate
                   class="lt-m-tabs__item"
                   data-lt-match="{{ $destination['match'] }}"
                   :class="{ 'is-active': isActive($el) }"
                   :aria-current="isActive($el) ? 'page' : null">
                    <span class="lt-m-tabs__icon"><i class="bi {{ $destination['icon'] }}" aria-hidden="true"></i></span>
                    <span>{{ $destination['label'] }}</span>
                </a>
            @endforeach

            <button type="button" class="lt-m-tabs__item" @click="$dispatch('lt-modules-open')">
                <span class="lt-m-tabs__icon"><i class="bi bi-grid" aria-hidden="true"></i></span>
                <span>Módulos</span>
            </button>
        </nav>
    @endpersist

    {{-- Los modulos completos viven en una hoja, no en un sidebar de 51 entradas
         que viajaria en el HTML de cada pantalla. --}}
    <div x-data="{ open: false }" @lt-modules-open.window="open = true">
        <template x-if="open">
            <div>
                <button type="button" class="lt-m-sheet-scrim" @click="open = false" aria-label="Cerrar los módulos"></button>
                <div class="lt-m-sheet" role="dialog" aria-modal="true" aria-label="Módulos" x-md-surface
                     @md-surface-close="open = false">
                    <span class="lt-m-sheet__handle" aria-hidden="true"></span>
                    <div class="lt-m-sheet__scroll">
                        @foreach (config('modules.navigation', []) as $section)
                            <span class="lt-m-sheet__group-label">{{ $section['label'] }}</span>
                            @foreach ($section['items'] as $item)
                                @php($active = request()->routeIs(...$item['active']))
                                <a href="{{ route($item['route']) }}" wire:navigate
                                   class="lt-m-sheet__item {{ $active ? 'is-active' : '' }}"
                                   @if($active) aria-current="page" @endif
                                   @click="open = false">
                                    <i class="bi {{ $item['icon'] }}" aria-hidden="true"></i>
                                    <span>{{ $item['label'] }}</span>
                                </a>
                            @endforeach
                        @endforeach
                    </div>
                </div>
            </div>
        </template>
    </div>

    {{-- Instalacion. Android expone `beforeinstallprompt` y se puede lanzar el
         dialogo del sistema; iOS no lo expone, asi que solo cabe explicar los
         pasos de Safari. El descarte se recuerda 30 dias. --}}
    <div x-data="ltInstallPrompt()">
        <template x-if="open">
            <div>
                <button type="button" class="lt-m-sheet-scrim" @click="dismiss()" aria-label="Cerrar"></button>
                <div class="lt-m-sheet lt-m-install" role="dialog" aria-modal="true" aria-labelledby="lt-install-title">
                    <span class="lt-m-sheet__handle" aria-hidden="true"></span>
                    <div class="lt-m-sheet__scroll">
                        <img src="{{ asset('icons/icon-128x128.png') }}" alt="" width="72" height="72" class="lt-m-install__icon">
                        <h2 id="lt-install-title" class="md-title-medium">Ten Life Tracker a mano</h2>

                        <template x-if="platform === 'android'">
                            <div>
                                <p class="md-body-medium">Añádela a tu pantalla de inicio y ábrela como cualquier otra app, sin barra de navegador.</p>
                                <button type="button" class="md-btn-filled lt-m-install__cta" @click="install()">
                                    <i class="bi bi-phone" aria-hidden="true"></i> Añadir a la pantalla de inicio
                                </button>
                            </div>
                        </template>

                        <template x-if="platform === 'ios'">
                            <div>
                                <p class="md-body-medium">
                                    Toca <i class="bi bi-box-arrow-up" aria-hidden="true"></i> <strong>Compartir</strong>
                                    y luego <strong>Añadir a pantalla de inicio</strong>.
                                </p>
                            </div>
                        </template>

                        <button type="button" class="md-btn-text lt-m-install__later" @click="dismiss()">Ahora no</button>
                    </div>
                </div>
            </div>
        </template>
    </div>

    @livewireScriptConfig
</body>
</html>
