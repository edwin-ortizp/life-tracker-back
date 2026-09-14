@props(['tabs' => [], 'preserve' => [], 'label' => 'Vistas del módulo', 'back' => null])

@php
    $query = \Illuminate\Support\Arr::only(request()->query(), $preserve);
@endphp

{{-- Con `back` es la navegación de un detalle: el regreso vive al inicio de la fila de pestañas, nunca en una fila propia. --}}
<nav @class(['md-module-tabs', 'md-module-tabs--detail' => $back]) aria-label="{{ $label }}">
    @if ($back)
        <a href="{{ $back['href'] }}" @if ($back['navigate'] ?? true) wire:navigate @endif class="md-btn-icon md-module-tabs__back"
           aria-label="{{ $back['label'] }}" title="{{ $back['label'] }}">
            <i class="bi bi-arrow-left" aria-hidden="true"></i>
        </a>
        <span class="md-module-tabs__divider" aria-hidden="true"></span>
    @endif
    <div class="md-module-tabs__track">
        @foreach ($tabs as $tab)
            @php
                $active = request()->routeIs(...($tab['active'] ?? [$tab['route']]));
                $href = route($tab['route'], array_merge($tab['params'] ?? [], $query));
            @endphp
            <a href="{{ $href }}" @if ($tab['navigate'] ?? true) wire:navigate @endif class="md-module-tab {{ $active ? 'is-active' : '' }}" @if($active) aria-current="page" @endif>
                <i class="bi {{ $tab['icon'] ?? 'bi-circle' }}" aria-hidden="true"></i>
                <span>{{ $tab['label'] }}</span>
            </a>
        @endforeach
    </div>
</nav>
