@props([
    'label',
    'value' => null,
    'unit' => null,
    'support' => null,
    'icon' => null,
    'tone' => 'neutral',
    'placeholder' => '—',
])

@php
    $tones = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'];

    abort_unless(in_array($tone, $tones, true), 500, "Tono de métrica no soportado: {$tone}");

    $displayValue = filled($value) ? $value : $placeholder;
@endphp

<article {{ $attributes->class(['md-metric', 'md-metric--'.$tone => $tone !== 'neutral']) }}>
    <p class="md-metric__label md-label-medium">
        @if ($icon)<i class="bi {{ $icon }}" aria-hidden="true"></i>@endif
        <span>{{ $label }}</span>
    </p>
    <p class="md-metric__value">
        {{ $displayValue }}@if ($unit && filled($value))<span class="md-metric__unit">{{ $unit }}</span>@endif
    </p>
    @if ($support)
        <p class="md-metric__support md-body-small">{{ $support }}</p>
    @endif
    {{ $slot }}
</article>
