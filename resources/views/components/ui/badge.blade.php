@props([
    'tone' => 'neutral',
    'label' => null,
])

@php
    $tones = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'];

    abort_unless(in_array($tone, $tones, true), 500, "Tono de badge no soportado: {$tone}");

    // El CSS heredado nombra el tono de error como `--error`; la API lo expone como `danger`.
    $toneSuffix = $tone === 'danger' ? 'error' : $tone;
@endphp

<span {{ $attributes->class(['md-count-badge', 'md-count-badge--'.$toneSuffix => $tone !== 'neutral']) }}
      @if ($label) aria-label="{{ $label }}" @endif>
    {{ $slot }}
</span>
