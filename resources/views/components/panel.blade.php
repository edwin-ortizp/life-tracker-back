@props([
    'title' => null,
    'icon' => null,
    'accent' => false,
    'flush' => false,
    'as' => 'section',
])

<{{ $as }} {{ $attributes->class(['lt-panel', $accent ? 'lt-panel--accent' : '']) }}>
    @if ($title || isset($tools))
        <div class="lt-panel__head">
            @if ($icon)
                <i class="bi {{ $icon }}" aria-hidden="true"></i>
            @endif
            @if ($title)
                <h2>{{ $title }}</h2>
            @endif
            @isset($tools)
                <div class="lt-panel__tools">{{ $tools }}</div>
            @endisset
        </div>
    @endif

    <div class="lt-panel__body {{ $flush ? 'lt-panel__body--flush' : '' }}">
        {{ $slot }}
    </div>

    @isset($footer)
        <div class="lt-panel__foot">{{ $footer }}</div>
    @endisset
</{{ $as }}>
