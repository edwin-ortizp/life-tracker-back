<x-module-shell module="journal">
    @php
        $isFiltered = $period !== '1m' || trim($search) !== '';
    @endphp

    <x-ui.management-card id="journal-summary" title="Resumen del diario" icon="bi-card-list"
                          :count="'('.$entries->total().' / '.$totalCount.')'" search="search" search-placeholder="Buscar en los resúmenes"
                          :active-filters="$period !== '1m' ? 1 : 0" :paginator="$entries" noun="días" flush
                          alpine="draftPeriod: '1m', draftFrom: '', draftTo: ''"
                          on-filters-open="draftPeriod = $wire.period; draftFrom = $wire.from; draftTo = $wire.to">
        <x-slot:filters>
            <x-ui.select name="period" label="Periodo" :options="$periods" :selected="$period" icon="bi-calendar-range" x-model="draftPeriod" />
            <div class="journal-summary__range" x-show="draftPeriod === 'custom'" x-cloak>
                <x-ui.field name="from" label="Desde" type="date" x-model="draftFrom" />
                <x-ui.field name="to" label="Hasta" type="date" x-model="draftTo" />
            </div>
        </x-slot:filters>
        <x-slot:filterActions>
            <x-ui.action variant="text" wire:click="clearFilters" x-on:click="filtersOpen = false">Restablecer</x-ui.action>
            <x-ui.action variant="filled" x-on:click="$wire.applyFilters(draftPeriod, draftFrom, draftTo); filtersOpen = false">Aplicar</x-ui.action>
        </x-slot:filterActions>

        <x-slot:strip>
            <span class="md-chip md-chip-input" wire:key="journal-summary-period-{{ $period }}-{{ $from }}-{{ $to }}">
                <i class="bi bi-calendar-range" aria-hidden="true"></i>
                <span>{{ $periodLabel }}</span>
                @if ($period !== '1m')
                    <button type="button" class="md-btn-icon md-btn--sm" wire:click="removeFilter('period')"
                            aria-label="Quitar filtro {{ $periodLabel }}" title="Quitar filtro">
                        <i class="bi bi-x" aria-hidden="true"></i>
                    </button>
                @endif
            </span>
            @if ($isFiltered)
                <button type="button" class="md-btn-text md-btn--sm" wire:click="clearFilters" x-on:click="$wire.set('search', '')">Limpiar filtros</button>
            @endif
        </x-slot:strip>

        @if ($entries->isNotEmpty())
            <table class="journal-summary__table">
                <thead class="visually-hidden">
                    <tr><th scope="col">Fecha</th><th scope="col">Resumen</th></tr>
                </thead>
                <tbody>
                    @foreach ($entries as $entry)
                        <tr class="journal-summary__row" wire:key="journal-summary-{{ $entry->id }}">
                            <th scope="row" class="journal-summary__date">
                                <a href="{{ route('journal', ['date' => $entry->date->toDateString()]) }}" wire:navigate
                                   aria-label="Abrir la entrada del {{ $entry->date->translatedFormat('l j \d\e F \d\e Y') }}">
                                    <strong>{{ $entry->date->format('d') }}</strong>
                                    <span>{{ $entry->date->translatedFormat('M Y') }}</span>
                                    <small>{{ $entry->date->translatedFormat('D') }}</small>
                                </a>
                            </th>
                            <td class="journal-summary__text">{{ $entry->summary }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @elseif ($totalCount === 0)
            <x-ui.state variant="empty" icon="bi-card-list" title="Aún no hay resúmenes"
                        message="Escribe un resumen de una línea al guardar tu entrada del día y aparecerá aquí." />
        @else
            <x-ui.state variant="filtered-empty" title="Sin resúmenes en este periodo"
                        message="Prueba con otro periodo o cambia la búsqueda." />
        @endif
    </x-ui.management-card>
</x-module-shell>
