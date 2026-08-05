@props([
    'headline' => null,
    'supporting' => null,
    'href' => null,
    'completed' => false,
])

@php
    $classes = ['md-list-item', 'md-list-item--completed' => $completed];
@endphp

<li {{ $attributes->class($classes) }}>
    @isset($leading)
        <div class="md-list-item-leading">{{ $leading }}</div>
    @endisset

    @if ($href)
        <a href="{{ $href }}" class="md-list-item-link">
            <span class="md-list-item-content">
                @if ($headline)<span class="md-list-item-headline">{{ $headline }}</span>@endif
                @if ($supporting)<span class="md-list-item-supporting">{{ $supporting }}</span>@endif
                {{ $slot }}
            </span>
        </a>
    @else
        <div class="md-list-item-content">
            @if ($headline)<p class="md-list-item-headline">{{ $headline }}</p>@endif
            @if ($supporting)<p class="md-list-item-supporting">{{ $supporting }}</p>@endif
            {{ $slot }}
        </div>
    @endif

    @isset($trailing)
        <div class="md-list-item-trailing">{{ $trailing }}</div>
    @endisset
</li>
