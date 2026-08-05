@props([
    'variant',
    'title' => null,
    'message' => null,
    'icon' => null,
])

@php
    use App\Support\Ui\DataState;

    abort_unless(in_array($variant, DataState::ALL, true), 500, "Estado de datos no soportado: {$variant}");
    abort_unless($variant !== DataState::CONTENT, 500, 'El estado `content` lo renderiza la propia pantalla.');

    $defaults = [
        DataState::INITIAL => ['icon' => 'bi-compass', 'title' => 'Elige qué quieres ver'],
        DataState::LOADING => ['icon' => null, 'title' => 'Cargando...'],
        DataState::EMPTY => ['icon' => 'bi-inbox', 'title' => 'Todavía no hay nada aquí'],
        DataState::FILTERED_EMPTY => ['icon' => 'bi-funnel', 'title' => 'Ningún resultado con estos filtros'],
        DataState::ERROR => ['icon' => 'bi-exclamation-triangle', 'title' => 'No pudimos cargar esta información'],
    ][$variant];

    $stateIcon = $icon ?? $defaults['icon'];
    $stateTitle = $title ?? $defaults['title'];
    $isLoading = $variant === DataState::LOADING;
@endphp

<div {{ $attributes->class(['md-empty-state', 'md-empty-state--'.$variant]) }}
     data-state="{{ $variant }}"
     @if ($isLoading) role="status" aria-live="polite" aria-busy="true" @endif
     @if ($variant === DataState::ERROR) role="alert" @endif>
    <span class="md-empty-state__icon">
        @if ($isLoading)
            <span class="md-state-spinner" aria-hidden="true"></span>
        @else
            <i class="bi {{ $stateIcon }}" aria-hidden="true"></i>
        @endif
    </span>

    <h2>{{ $stateTitle }}</h2>

    @if ($message)<p>{{ $message }}</p>@endif

    @isset($actions)
        <div class="md-empty-state__action">{{ $actions }}</div>
    @endisset
</div>
