@props([
    'variant' => 'outlined',
    'title' => null,
    'icon' => null,
    'iconTone' => 'primary',
    'as' => 'div',
])

@php
    $variants = ['outlined', 'filled', 'elevated'];
    $iconTones = ['primary', 'secondary', 'tertiary'];

    abort_unless(in_array($variant, $variants, true), 500, "Variante de card no soportada: {$variant}");
    abort_unless(in_array($iconTone, $iconTones, true), 500, "Tono de icono no soportado: {$iconTone}");
@endphp

<{{ $as }} {{ $attributes->class(['md-card-'.$variant]) }}>
    @if ($title || $icon || isset($header))
        <div class="md-card-header">
            @if ($icon)
                <span class="md-card-icon md-card-icon--{{ $iconTone }}"><i class="bi {{ $icon }}" aria-hidden="true"></i></span>
            @endif
            @if ($title)<h3 class="md-title-medium">{{ $title }}</h3>@endif
            {{ $header ?? '' }}
        </div>
    @endif

    <div class="md-card-content">{{ $slot }}</div>

    @isset($actions)
        <div class="md-card-actions">{{ $actions }}</div>
    @endisset
</{{ $as }}>
