@props(['tabs' => [], 'preserve' => []])

@php
    $query = \Illuminate\Support\Arr::only(request()->query(), $preserve);
@endphp

<nav class="md-module-tabs" aria-label="Vistas del módulo">
    <div class="md-module-tabs__track">
        @foreach ($tabs as $tab)
            @php
                $active = request()->routeIs(...($tab['active'] ?? [$tab['route']]));
                $href = route($tab['route'], $query);
            @endphp
            <a href="{{ $href }}" class="md-module-tab {{ $active ? 'is-active' : '' }}" @if($active) aria-current="page" @endif>
                <i class="bi {{ $tab['icon'] ?? 'bi-circle' }}" aria-hidden="true"></i>
                <span>{{ $tab['label'] }}</span>
            </a>
        @endforeach
    </div>
</nav>
