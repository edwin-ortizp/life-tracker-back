@props(['label' => null])

<div {{ $attributes->class(['md-metric-grid']) }} role="group" @if ($label) aria-label="{{ $label }}" @endif>
    {{ $slot }}
</div>
