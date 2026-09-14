@php
    $activeFilters = ($type !== '' ? 1 : 0) + ($category !== '' ? 1 : 0) + ($archived ? 1 : 0);
@endphp

<x-module-shell module="relationships" :title="$relationship->full_name"
                :tabs="\App\Support\Ui\Tabs\PersonTabs::for($relationship)" :back="\App\Support\Ui\Tabs\PersonTabs::back()">
    <x-slot:actions>
        <x-module-actions :primary="['label' => 'Registrar acontecimiento', 'icon' => 'bi-calendar-plus', 'action' => 'openEventForm']" />
    </x-slot:actions>

    <x-ui.management-card id="relationship-history" title="Historial" icon="bi-clock-history"
                          :count="'('.$entries->total().' / '.$total.')'" search="search" search-placeholder="Buscar por título o notas"
                          :active-filters="$activeFilters" :paginator="$entries" noun="registros">
        <x-slot:filters>
            <div class="md-chip-rail md-mcard__filter-chips" role="group" aria-label="Tipo de registro">
                <x-ui.chip variant="filter" icon="bi-grid" :selected="$type === ''" wire:click="setType('')" wire:key="history-type-all">Todos</x-ui.chip>
                @foreach ($typeFilters as $key => $label)
                    <x-ui.chip variant="filter" :icon="$key === 'event' ? 'bi-calendar-event' : 'bi-map'" :selected="$type === $key"
                               wire:click="setType('{{ $key }}')" wire:key="history-type-{{ $key }}">{{ $label }}</x-ui.chip>
                @endforeach
            </div>
            <x-ui.select name="category" label="Categoría" placeholder="Todas las categorías" :options="$categories" :selected="$category" icon="bi-tag" wire:model.live="category" />
            <div class="md-chip-rail md-mcard__filter-chips">
                <x-ui.chip variant="filter" icon="bi-archive" :selected="$archived" wire:click="$toggle('archived')">Incluir archivados</x-ui.chip>
            </div>
        </x-slot:filters>

        @if ($activeFilters > 0)
            <x-slot:strip>
                @if ($type !== '')
                    <x-ui.chip variant="input" icon="bi-x" wire:click="clearFilter('type')" :aria-label="'Quitar filtro '.$typeFilters[$type]">{{ $typeFilters[$type] }}</x-ui.chip>
                @endif
                @if ($category !== '')
                    <x-ui.chip variant="input" icon="bi-x" wire:click="clearFilter('category')" :aria-label="'Quitar filtro '.$categories[$category]">{{ $categories[$category] }}</x-ui.chip>
                @endif
                @if ($archived)
                    <x-ui.chip variant="input" icon="bi-x" wire:click="clearFilter('archived')" aria-label="Quitar filtro Incluir archivados">Incluye archivados</x-ui.chip>
                @endif
                <button type="button" class="md-btn-text md-btn--sm" wire:click="clearFilters">Limpiar filtros</button>
            </x-slot:strip>
        @endif

        @if ($entries->isNotEmpty())
            @include('livewire.relationship.partials.history-table', ['rows' => $entries])
        @elseif ($total > 0 || $archived)
            <x-ui.state variant="filtered-empty" message="No hay registros con estos filtros." />
        @else
            <x-ui.state variant="empty" icon="bi-clock-history" title="Todavía no hay historial"
                        message="Registra un acontecimiento o marca un plan como realizado con esta persona." />
        @endif
    </x-ui.management-card>

    @include('livewire.relationship.partials.event-dialog')
</x-module-shell>
