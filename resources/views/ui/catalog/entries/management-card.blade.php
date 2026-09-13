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
            <x-ui.action variant="text">Limpiar</x-ui.action>
            <x-ui.action x-on:click="filtersOpen = false">Aplicar</x-ui.action>
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
