@props([
    'label',
])

@php
    abort_unless(filled($label), 500, 'Las acciones de fila deben declarar un nombre accesible.');
    abort_unless(isset($primary), 500, 'Las acciones de fila necesitan una acción principal (slot primary).');

    $primaryAttributes = $primary->attributes;
@endphp

{{--
    Acciones por fila en vistas de gestión.
    Escritorio: botón dividido (acción principal visible + ▾ con el resto).
    Card compacta o móvil: se colapsa a un único ⋮ que incluye también la acción principal.
    Las opciones se declaran con x-ui.menu-item y x-ui.menu-divider.
--}}
<div {{ $attributes->class(['md-row-actions']) }}
     x-data="{ open: false }"
     @click.outside="open = false"
     @keydown.escape.stop="if (open) { open = false; $refs.trigger.focus() }">
    <button type="button" {{ $primaryAttributes->class(['md-btn-outlined', 'md-row-actions__main']) }}>{{ $primary }}</button>
    <button type="button"
            x-ref="trigger"
            class="md-btn-outlined md-row-actions__more"
            aria-haspopup="menu"
            :aria-expanded="open.toString()"
            aria-label="{{ $label }}"
            title="{{ $label }}"
            @click.stop="open = !open">
        <i class="bi bi-chevron-down md-row-actions__chevron" aria-hidden="true"></i>
        <i class="bi bi-three-dots-vertical md-row-actions__dots" aria-hidden="true"></i>
    </button>
    <div class="md-menu__surface" role="menu" x-cloak x-show="open" x-transition.opacity.duration.120ms @click="open = false">
        <button type="button" role="menuitem" {{ $primaryAttributes->except(['x-optimistic-toggle', 'class'])->class(['md-menu__item', 'md-row-actions__primary-item']) }}>
            <span>{{ $primary }}</span>
        </button>
        {{ $slot }}
    </div>
</div>
