@props([
    'variant' => 'line',
    'lines' => 3,
    'label' => 'Cargando contenido',
])

@php
    $allowed = ['line', 'block', 'card', 'list'];
    abort_unless(in_array($variant, $allowed, true), 500, "Variante de skeleton no soportada: {$variant}");

    $repeat = max(1, (int) $lines);
@endphp

<div {{ $attributes->class(['md-skeleton', 'md-skeleton--'.$variant]) }}
     role="status" aria-live="polite" aria-busy="true" aria-label="{{ $label }}">
    @if ($variant === 'line')
        @for ($i = 0; $i < $repeat; $i++)
            <span class="md-skeleton__line" aria-hidden="true"></span>
        @endfor
    @elseif ($variant === 'block')
        <span class="md-skeleton__block" aria-hidden="true"></span>
    @elseif ($variant === 'card')
        @for ($i = 0; $i < $repeat; $i++)
            <span class="md-skeleton__card" aria-hidden="true">
                <span class="md-skeleton__line md-skeleton__line--title"></span>
                <span class="md-skeleton__line"></span>
                <span class="md-skeleton__line md-skeleton__line--short"></span>
            </span>
        @endfor
    @else
        @for ($i = 0; $i < $repeat; $i++)
            <span class="md-skeleton__row" aria-hidden="true">
                <span class="md-skeleton__avatar"></span>
                <span class="md-skeleton__row-body">
                    <span class="md-skeleton__line md-skeleton__line--title"></span>
                    <span class="md-skeleton__line md-skeleton__line--short"></span>
                </span>
            </span>
        @endfor
    @endif

    <span class="visually-hidden">{{ $label }}</span>
</div>
