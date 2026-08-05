<x-catalog.example title="Búsqueda con rail de chips" description="Misma jerarquía, mismos estados seleccionados y mismo control de limpieza en todos los módulos.">
    <div class="md-catalog__demo--stack">
        <x-ui.filter-bar search="search" placeholder="Buscar tareas" label="Filtros de tareas">
            <x-slot:chips>
                <x-ui.chip variant="filter" :selected="true">Hoy</x-ui.chip>
                <x-ui.chip variant="filter">Esta semana</x-ui.chip>
                <div class="md-chip-rail__divider"></div>
                <x-ui.filter-menu name="status" label="Estado" :options="\App\Support\Ui\CatalogFixtures::statusOptions()" selected="doing" />
            </x-slot:chips>
        </x-ui.filter-bar>
    </div>
</x-catalog.example>

<x-catalog.example title="Solo búsqueda" description="Un listado sin filtros usa el mismo campo de búsqueda.">
    <div class="md-catalog__demo--stack">
        <x-ui.filter-bar search="query" placeholder="Buscar recetas" />
    </div>
</x-catalog.example>

<x-catalog.example title="Solo filtros" description="Una superficie sin búsqueda conserva el rail de chips.">
    <div class="md-catalog__demo--stack">
        <x-ui.filter-bar label="Periodo del resumen">
            <x-slot:chips>
                @foreach (\App\Support\Ui\CatalogFixtures::periodOptions() as $value => $label)
                    <x-ui.chip variant="filter" :selected="$value === 'week'">{{ $label }}</x-ui.chip>
                @endforeach
            </x-slot:chips>
        </x-ui.filter-bar>
    </div>
</x-catalog.example>
