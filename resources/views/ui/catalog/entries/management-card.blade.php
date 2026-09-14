@php
    $catalogPaginator = new \Illuminate\Pagination\LengthAwarePaginator(range(1, 25), 58, 25, 1, ['path' => url('/ui-catalog/management-card')]);
@endphp

<x-catalog.example title="Card de gestión" description="Header con ícono, título y contador; búsqueda, Filtros y ⋮ separados por divisores. Bajo 640 px de ancho de la card el header se compacta en íconos y la búsqueda se expande al tocarla.">
    <x-ui.management-card id="catalog-mcard" title="Cronología de salud" icon="bi-clock-history" count="(25 / 58)"
                          search="catalogSearch" search-placeholder="Buscar eventos" :active-filters="2" :paginator="$catalogPaginator" noun="eventos">
        <x-slot:filters>
            <x-ui.select name="catalog-mcard-range" label="Rango de tiempo" :options="\App\Support\Ui\CatalogFixtures::periodOptions()" />
        </x-slot:filters>
        <x-slot:filterActions>
            <x-ui.action variant="outlined" icon="bi-eraser">Limpiar</x-ui.action>
            <x-ui.action variant="filled" icon="bi-funnel-fill" x-on:click="filtersOpen = false">Filtrar</x-ui.action>
        </x-slot:filterActions>
        <x-slot:menu>
            <x-ui.menu-item icon="bi-filetype-csv">Exportar CSV</x-ui.menu-item>
        </x-slot:menu>
        <x-slot:strip>
            <x-ui.chip variant="input" icon="bi-calendar-range">Últimos 60 días</x-ui.chip>
            <x-ui.chip variant="input" icon="bi-activity">En seguimiento</x-ui.chip>
        </x-slot:strip>
        <x-ui.list>
            <x-ui.list-item title="Dolor lumbar" subtitle="Espalda baja · desde 2 sep. · 9 días" icon="bi-person-standing" />
            <x-ui.list-item title="Migraña" subtitle="Cabeza · 7 sep. · 5 horas" icon="bi-lightning" />
        </x-ui.list>
    </x-ui.management-card>
</x-catalog.example>

<x-catalog.example title="Card de gestión dentro de un detalle" description="Sin búsqueda ni paginación: `headerAction` lleva a la vista completa. La tabla md-table usa chips tonales para tipo y ⋮ por fila, y se apila bajo 640 px de ancho de la card.">
    <x-ui.management-card id="catalog-mcard-summary" title="Historial reciente" icon="bi-clock-history">
        <x-slot:headerAction><a href="{{ route('ui.catalog') }}" class="md-btn-text">Ver historial completo</a></x-slot:headerAction>
        <table class="md-table md-table--stack">
            <thead>
                <tr><th scope="col">Fecha</th><th scope="col">Título</th><th scope="col">Tipo</th><th scope="col">Notas</th><th scope="col" class="md-table__actions"><span class="visually-hidden">Acciones</span></th></tr>
            </thead>
            <tbody>
                <tr>
                    <td class="md-table__date">27 de julio de 2026</td>
                    <td class="md-table__title">Llamada larga<span class="md-table__meta">Conversación</span></td>
                    <td class="md-table__nowrap"><span class="md-chip-tonal md-chip-tonal--primary"><i class="bi bi-calendar-event" aria-hidden="true"></i> Acontecimiento</span></td>
                    <td class="md-table__notes">Me contó de su nuevo trabajo en Medellín.</td>
                    <td class="md-table__actions"><x-ui.menu size="sm" label="Acciones de Llamada larga"><x-ui.menu-item icon="bi-pencil">Editar</x-ui.menu-item></x-ui.menu></td>
                </tr>
            </tbody>
        </table>
    </x-ui.management-card>
</x-catalog.example>
