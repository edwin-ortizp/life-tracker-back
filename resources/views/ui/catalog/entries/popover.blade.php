<x-catalog.example title="Filtros" description="Un único botón abre el popover; el badge en esquina indica los filtros activos.">
    <div class="md-catalog__popover-demo" x-data="{ open: false }">
        <x-ui.action variant="outlined" icon="bi-sliders" data-popover-trigger x-on:click="open = !open">
            Filtros <x-ui.badge placement="corner" label="2 filtros activos">2</x-ui.badge>
        </x-ui.action>
        <x-ui.popover state="open" title="Filtros">
            <x-ui.select name="catalog-range" label="Rango de tiempo" :options="\App\Support\Ui\CatalogFixtures::periodOptions()" />
            <x-slot:actions>
                <x-ui.action variant="text">Limpiar</x-ui.action>
                <x-ui.action x-on:click="open = false">Aplicar</x-ui.action>
            </x-slot:actions>
        </x-ui.popover>
    </div>
</x-catalog.example>
