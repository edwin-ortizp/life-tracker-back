@props([
    'tone' => 'neutral',
    'label' => null,
    'placement' => 'inline',
])

@php
    $tones = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'];

    abort_unless(in_array($tone, $tones, true), 500, "Tono de badge no soportado: {$tone}");
    abort_unless(in_array($placement, ['inline', 'corner'], true), 500, "Ubicación de badge no soportada: {$placement}");

    // El CSS heredado nombra el tono de error como `--error`; la API lo expone como `danger`.
    $toneSuffix = $tone === 'danger' ? 'error' : $tone;
@endphp

<span {{ $attributes->class(['md-count-badge', 'md-count-badge--'.$toneSuffix => $tone !== 'neutral', 'md-count-badge--corner' => $placement === 'corner']) }}
      @if ($label) aria-label="{{ $label }}" @endif>
    {{ $slot }}
</span>
