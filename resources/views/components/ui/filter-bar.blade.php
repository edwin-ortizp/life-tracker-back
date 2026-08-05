@props([
    'search' => null,
    'placeholder' => 'Buscar...',
    'label' => null,
    'debounce' => '300ms',
])

@php
    $searchId = $search ? \App\Support\Ui\FieldIdentity::for($search, $placeholder) : null;
    $searchLabel = $label ?? $placeholder;
@endphp

<div x-data="{ openMenu: null }" @click.outside="openMenu = null" {{ $attributes->class(['md-filter-bar']) }}>
    @if ($search)
        <div class="md-search-bar">
            <i class="bi bi-search md-search-bar__icon" aria-hidden="true"></i>
            <label class="visually-hidden" for="{{ $searchId }}">{{ $searchLabel }}</label>
            <input type="search"
                   id="{{ $searchId }}"
                   class="md-search-bar__input"
                   placeholder="{{ $placeholder }}"
                   wire:model.live.debounce.{{ $debounce }}="{{ $search }}">
            <button type="button"
                    class="md-search-bar__clear"
                    wire:click="$set('{{ $search }}', '')"
                    x-show="$el.previousElementSibling.value.length > 0"
                    x-cloak
                    aria-label="Limpiar búsqueda">
                <i class="bi bi-x-lg" aria-hidden="true"></i>
            </button>
        </div>
    @endif

    @isset($chips)
        <div class="md-chip-rail" role="group" @if ($label) aria-label="{{ $label }}" @endif>
            {{ $chips }}
        </div>
    @endisset

    {{ $slot }}
</div>
