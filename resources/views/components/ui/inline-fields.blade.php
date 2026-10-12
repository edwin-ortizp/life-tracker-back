@props([
    'summary' => [],
    'open' => false,
])

{{-- Campos secundarios plegados: se muestran como texto ("Fuente: Manual") y al pulsarlo aparecen los controles; al hacer clic fuera se vuelven a plegar. --}}
<div x-data="{ open: @js((bool) $open) }" x-on:click.outside="open = false" {{ $attributes->class('md-inline-fields') }}>
    <span class="md-inline-fields__summary" x-show="! open">
        @foreach ($summary as $text)
            <button type="button" class="md-inline-fields__toggle" x-on:click="open = true; $nextTick(() => $el.closest('.md-inline-fields').querySelector('.md-inline-fields__controls :is(input, select)')?.focus())">{{ $text }}</button>
        @endforeach
    </span>
    <div class="md-inline-fields__controls" x-show="open" x-cloak>{{ $slot }}</div>
    {{ $aside ?? '' }}
</div>
