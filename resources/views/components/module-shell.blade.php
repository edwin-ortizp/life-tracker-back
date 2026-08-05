@props(['module' => null, 'title' => null, 'subtitle' => null, 'icon' => null, 'archetype' => null])

@php
    use App\Support\Ui\ScreenArchetype;

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
    $screenArchetype = ScreenArchetype::resolve($archetype, $definition, $routeName);
    $archetypeSource = ScreenArchetype::isDeclared($archetype, $definition, $routeName) ? 'declared' : 'fallback';
@endphp

<section {{ $attributes->class(['md-module-shell', 'md-archetype--'.$screenArchetype]) }}
         data-module="{{ $moduleKey }}"
         data-archetype="{{ $screenArchetype }}"
         data-archetype-source="{{ $archetypeSource }}">
    <header class="md-module-header">
        <div class="md-module-heading" data-region="identity">
            <div class="md-module-icon" aria-hidden="true"><i class="bi {{ $icon ?? $definition['icon'] ?? 'bi-grid' }}"></i></div>
            <div>
                <p class="md-module-eyebrow mb-1">Life Tracker</p>
                <h1 class="md-module-title">{{ $title ?? $definition['title'] ?? 'Life Tracker' }}</h1>
                @if ($subtitle !== null || ! empty($definition['subtitle']))
                    <p class="md-module-subtitle">{{ $subtitle ?? $definition['subtitle'] }}</p>
                @endif
            </div>
        </div>

        @isset($actions)
            <div class="md-module-header-tools" data-region="actions">{{ $actions }}</div>
        @endisset
    </header>

    @if (! empty($definition['tabs']))
        <div data-region="navigation">
            <x-module-tabs :tabs="$definition['tabs']" :preserve="$definition['preserve'] ?? []" />
        </div>
    @endif

    @isset($controls)
        <div class="md-module-controls" data-region="controls">{{ $controls }}</div>
    @endisset

    <div class="md-module-content">
        @isset($rail)
            {{-- El arquetipo resuelve su propia composición: contenido y contexto en paralelo
                 desde 1200 px y en una sola columna por debajo, sin utilidades externas. --}}
            <div class="md-module-workspace">
                <div class="md-module-primary" data-region="content">{{ $slot }}</div>
                <aside class="md-context-rail" data-region="context" aria-label="Contexto del módulo">{{ $rail }}</aside>
            </div>
        @else
            <div class="md-module-primary" data-region="content">{{ $slot }}</div>
        @endisset
    </div>
</section>
