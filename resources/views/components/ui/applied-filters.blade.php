@props([
    'filters' => [],
    'remove' => 'removeFilter',
    'clear' => 'clearFilters',
])

{{--
    Franja de filtros aplicados de una card de gestión (slot `strip` de x-ui.management-card).
    `filters` = [['key', 'value', 'label', 'icon'], ...]; cada chip llama a `remove(key, value)`
    y «Limpiar filtros» a `clear`. Un filtro por defecto (p. ej. «Fecha: Hoy») se declara igual.
--}}
@foreach ($filters as $filter)
    <span {{ $attributes->class(['md-chip', 'md-chip-input', 'md-applied-chip']) }} wire:key="applied-filter-{{ $filter['key'] }}-{{ $filter['value'] ?? 'all' }}">
        <i class="bi {{ $filter['icon'] }}" aria-hidden="true"></i>
        <span>{{ $filter['label'] }}</span>
        <button type="button" class="md-btn-icon md-btn--sm md-applied-chip__remove"
                wire:click="{{ $remove }}(@js($filter['key']), @js($filter['value'] ?? null))"
                aria-label="Quitar filtro {{ $filter['label'] }}" title="Quitar filtro">
            <i class="bi bi-x" aria-hidden="true"></i>
        </button>
    </span>
@endforeach
<button type="button" class="md-btn-text md-btn--sm md-applied-clear" wire:click="{{ $clear }}">Limpiar filtros</button>
