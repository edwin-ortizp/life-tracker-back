@props([
    'variant' => 'assist',
    'tone' => 'neutral',
    'selected' => false,
    'icon' => null,
    'href' => null,
    'type' => 'button',
    'disabled' => false,
])

@php
    $variants = ['assist', 'filter', 'input', 'suggestion', 'tonal'];
    $tones = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'];

    abort_unless(in_array($variant, $variants, true), 500, "Variante de chip no soportada: {$variant}");
    abort_unless(in_array($tone, $tones, true), 500, "Tono de chip no soportado: {$tone}");

    // El CSS heredado nombra el tono de error como `--error`; la API lo expone como `danger`.
    $toneSuffix = $tone === 'danger' ? 'error' : $tone;

    $classes = [
        'md-chip',
        'md-chip-'.$variant,
        'md-chip-tonal--'.$toneSuffix => $tone !== 'neutral' && $variant === 'tonal',
        'selected' => $selected,
    ];
@endphp

@if ($href)
    <a href="{{ $href }}" {{ $attributes->class($classes) }} @if ($variant === 'filter') aria-current="{{ $selected ? 'true' : 'false' }}" @endif>
        @if ($icon)<i class="bi {{ $icon }}" aria-hidden="true"></i>@endif
        {{ $slot }}
    </a>
@else
    <button type="{{ $type }}"
            {{ $attributes->class($classes) }}
            @disabled($disabled)
            @if ($variant === 'filter') aria-pressed="{{ $selected ? 'true' : 'false' }}" @endif>
        @if ($icon)<i class="bi {{ $icon }}" aria-hidden="true"></i>@endif
        {{ $slot }}
    </button>
@endif
