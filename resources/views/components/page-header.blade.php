@props([
    'title' => null,
    'subtitle' => null,
    'icon' => null,
    'back' => null,
    'backRoute' => null,
    'tabs' => [],
    'preserve' => [],
])

@php
    $query = \Illuminate\Support\Arr::only(request()->query(), $preserve);
@endphp

<header {{ $attributes->class(['lt-page-head-block']) }}>
    <div class="lt-page-head">
        @if ($title)
            <div class="lt-page-head__id">
                @if ($icon)
                    <span class="lt-page-head__icon" aria-hidden="true"><i class="bi {{ $icon }}"></i></span>
                @endif
                <div class="lt-page-head__id-body">
                    @if ($back)
                        <a href="{{ $backRoute ? route($backRoute) : 'javascript:history.back()' }}" @if($backRoute) wire:navigate @endif class="lt-page-head__back">
                            <i class="bi bi-arrow-left" aria-hidden="true"></i> {{ $back }}
                        </a>
                    @endif
                    <h1 class="lt-page-head__title">{{ $title }}</h1>
                    @if ($subtitle)
                        <p class="lt-page-head__subtitle">{{ $subtitle }}</p>
                    @endif
                </div>
            </div>
        @elseif ($subtitle)
            <p class="lt-page-head__lead">{{ $subtitle }}</p>
        @else
            <span></span>
        @endif

        @isset($actions)
            <div class="lt-page-head__actions">{{ $actions }}</div>
        @endisset
    </div>

    @if (! empty($tabs))
        <nav class="lt-tabs" role="tablist" aria-label="{{ 'Vistas de '.($title ?? 'la pantalla') }}">
            @foreach ($tabs as $tab)
                @php($active = request()->routeIs(...($tab['active'] ?? [$tab['route']])))
                <a href="{{ route($tab['route'], $query) }}" wire:navigate role="tab" aria-selected="{{ $active ? 'true' : 'false' }}"
                   class="lt-tab {{ $active ? 'is-active' : '' }}" @if($active) aria-current="page" @endif>
                    @if (! empty($tab['icon']))
                        <i class="bi {{ $tab['icon'] }}" aria-hidden="true"></i>
                    @endif
                    <span>{{ $tab['label'] }}</span>
                </a>
            @endforeach
        </nav>
    @endif

    @isset($controls)
        <div class="md-module-controls">{{ $controls }}</div>
    @endisset
</header>
