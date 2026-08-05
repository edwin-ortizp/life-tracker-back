@props([
    'title' => null,
    'description' => null,
    'level' => 2,
])

@php
    abort_unless(in_array((int) $level, [2, 3, 4], true), 500, "Nivel de encabezado no soportado: {$level}");

    $heading = 'h'.(int) $level;
    $typography = ['2' => 'md-title-large', '3' => 'md-title-medium', '4' => 'md-title-small'][(string) (int) $level];
@endphp

<section {{ $attributes->class(['md-section']) }}>
    @if ($title || $description || isset($actions))
        <div class="md-section__header">
            <div class="md-section__heading">
                @if ($title)
                    <{{ $heading }} class="md-section__title {{ $typography }}">{{ $title }}</{{ $heading }}>
                @endif
                @if ($description)
                    <p class="md-section__description md-body-small">{{ $description }}</p>
                @endif
            </div>
            @isset($actions)
                <div class="md-section__actions">{{ $actions }}</div>
            @endisset
        </div>
    @endif

    {{ $slot }}
</section>
