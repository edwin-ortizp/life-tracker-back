@props(['label' => null])

<ul {{ $attributes->class(['md-list']) }} @if ($label) aria-label="{{ $label }}" @endif>
    {{ $slot }}
</ul>
