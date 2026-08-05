@props([
    'value' => null,
    'max' => 100,
    'tone' => 'primary',
    'label' => null,
    'valueText' => null,
])

@php
    $tones = ['primary', 'success', 'warning', 'danger'];

    abort_unless(in_array($tone, $tones, true), 500, "Tono de progreso no soportado: {$tone}");

    // El CSS heredado nombra el tono de error como `--error`; la API lo expone como `danger`.
    $toneSuffix = $tone === 'danger' ? 'error' : $tone;

    $indeterminate = $value === null;
    $max = max((float) $max, 0.0001);
    $percent = $indeterminate ? 0 : max(0, min(100, round(((float) $value / $max) * 100, 2)));
@endphp

<div {{ $attributes->class(['md-progress']) }}>
    @if ($label || $valueText)
        <p class="md-progress-label md-label-medium">
            @if ($label)<span>{{ $label }}</span>@endif
            @if ($valueText)<span>{{ $valueText }}</span>@endif
        </p>
    @endif

    <div class="md-progress-linear @if ($tone !== 'primary') md-progress-linear--{{ $toneSuffix }} @endif @if ($indeterminate) md-progress-linear--indeterminate @endif"
         role="progressbar"
         @if (! $indeterminate)
             aria-valuenow="{{ $percent }}"
             aria-valuemin="0"
             aria-valuemax="100"
         @endif
         @if ($label) aria-label="{{ $label }}" @endif>
        <div class="md-progress-linear-bar" style="--md-progress-value: {{ $percent }}%;"></div>
    </div>
</div>
