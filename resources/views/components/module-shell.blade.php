@props(['module' => null])

@php
    $routeName = request()->route()?->getName() ?? '';
    $moduleKey = $module;

    if (! $moduleKey) {
        foreach (config('modules', []) as $key => $candidate) {
            foreach ($candidate['patterns'] ?? [] as $pattern) {
                if (\Illuminate\Support\Str::is($pattern, $routeName)) {
                    $moduleKey = $key;
                    break 2;
                }
            }
        }
    }

    $definition = config("modules.{$moduleKey}", []);
@endphp

<section {{ $attributes->class(['md-module-shell']) }} data-module="{{ $moduleKey }}">
    <header class="md-module-header">
        <div class="md-module-heading">
            <div class="md-module-icon" aria-hidden="true"><i class="bi {{ $definition['icon'] ?? 'bi-grid' }}"></i></div>
            <div>
                <p class="md-module-eyebrow mb-1">Life Tracker</p>
                <h1 class="md-module-title">{{ $definition['title'] ?? 'Life Tracker' }}</h1>
                @if (! empty($definition['subtitle']))
                    <p class="md-module-subtitle">{{ $definition['subtitle'] }}</p>
                @endif
            </div>
        </div>

        @isset($actions)
            <div class="md-module-header-tools">{{ $actions }}</div>
        @endisset
    </header>

    @if (! empty($definition['tabs']))
        <x-module-tabs :tabs="$definition['tabs']" :preserve="$definition['preserve'] ?? []" />
    @endif

    <div class="md-module-content">
        @isset($rail)
            <div class="row g-3">
                <div class="col-12 col-md-9">
                    <div class="md-module-primary">{{ $slot }}</div>
                </div>
                <div class="col-12 col-md-3">
                    <aside class="md-context-rail" aria-label="Contexto del módulo">{{ $rail }}</aside>
                </div>
            </div>
        @else
            {{ $slot }}
        @endisset
    </div>
</section>
