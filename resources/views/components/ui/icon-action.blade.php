@props([
    'icon',
    'label',
    'tone' => 'neutral',
    'size' => 'md',
    'emphasis' => 'standard',
    'href' => null,
    'type' => 'button',
    'loading' => false,
    'disabled' => false,
])

@php
    $tones = ['neutral', 'danger', 'success', 'warning', 'info'];
    $sizes = ['sm', 'md', 'lg'];
    $emphases = ['standard', 'filled', 'tonal'];

    abort_unless(in_array($tone, $tones, true), 500, "Tono de acción no soportado: {$tone}");
    abort_unless(in_array($size, $sizes, true), 500, "Tamaño de acción no soportado: {$size}");
    abort_unless(in_array($emphasis, $emphases, true), 500, "Énfasis de acción no soportado: {$emphasis}");
    abort_unless(filled($label), 500, 'Una acción de icono debe declarar un nombre accesible.');

    $classes = [
        'md-btn-icon',
        'md-btn-icon--'.$emphasis => $emphasis !== 'standard',
        'md-btn--'.$tone => $tone !== 'neutral',
        'md-btn--'.$size => $size !== 'md',
    ];

    $unavailable = $disabled || $loading;
@endphp

@if ($href && ! $unavailable)
    <a href="{{ $href }}" {{ $attributes->class($classes) }} aria-label="{{ $label }}" title="{{ $label }}">
        <i class="bi {{ $icon }} md-btn__icon" aria-hidden="true"></i>
    </a>
@else
    <button type="{{ $type }}"
            {{ $attributes->class($classes) }}
            aria-label="{{ $label }}"
            title="{{ $label }}"
            @disabled($unavailable)
            @if ($loading) aria-busy="true" @endif>
        <i class="bi {{ $icon }} md-btn__icon" aria-hidden="true"></i>
        <span class="md-btn__spinner" aria-hidden="true"></span>
    </button>
@endif
