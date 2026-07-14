@props(['title', 'message' => null, 'icon' => 'bi-inbox'])

<div {{ $attributes->class(['md-empty-state']) }}>
    <span class="md-empty-state__icon"><i class="bi {{ $icon }}" aria-hidden="true"></i></span>
    <h2>{{ $title }}</h2>
    @if ($message)<p>{{ $message }}</p>@endif
    @isset($action)<div class="md-empty-state__action">{{ $action }}</div>@endisset
</div>
