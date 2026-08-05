@props([
    'variant' => 'filled',
    'tone' => 'neutral',
    'size' => 'md',
    'icon' => null,
    'trailingIcon' => null,
    'href' => null,
    'type' => 'button',
    'loading' => false,
    'disabled' => false,
])

@php
    $variants = ['filled', 'tonal', 'outlined', 'text'];
    $tones = ['neutral', 'danger', 'success', 'warning', 'info'];
    $sizes = ['sm', 'md', 'lg'];

    abort_unless(in_array($variant, $variants, true), 500, "Variante de acción no soportada: {$variant}");
    abort_unless(in_array($tone, $tones, true), 500, "Tono de acción no soportado: {$tone}");
    abort_unless(in_array($size, $sizes, true), 500, "Tamaño de acción no soportado: {$size}");

    $classes = [
        "md-btn-{$variant}",
        'md-btn--'.$tone => $tone !== 'neutral',
        'md-btn--'.$size => $size !== 'md',
    ];

    $unavailable = $disabled || $loading;
@endphp

@if ($href && ! $unavailable)
    <a href="{{ $href }}" {{ $attributes->class($classes) }}>
        @if ($icon)<i class="bi {{ $icon }} md-btn__icon" aria-hidden="true"></i>@endif
        <span>{{ $slot }}</span>
        @if ($trailingIcon)<i class="bi {{ $trailingIcon }}" aria-hidden="true"></i>@endif
    </a>
@elseif ($href)
    <span {{ $attributes->class($classes)->merge(['class' => 'md-is-disabled']) }} aria-disabled="true" role="link">
        @if ($icon)<i class="bi {{ $icon }} md-btn__icon" aria-hidden="true"></i>@endif
        <span>{{ $slot }}</span>
    </span>
@else
    <button type="{{ $type }}"
            {{ $attributes->class($classes) }}
            @disabled($unavailable)
            @if ($loading) aria-busy="true" @endif>
        @if ($icon)<i class="bi {{ $icon }} md-btn__icon" aria-hidden="true"></i>@endif
        <span class="md-btn__spinner" aria-hidden="true"></span>
        <span>{{ $slot }}</span>
        @if ($trailingIcon)<i class="bi {{ $trailingIcon }}" aria-hidden="true"></i>@endif
    </button>
@endif
