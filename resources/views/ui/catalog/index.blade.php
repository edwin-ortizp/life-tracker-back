<x-layouts.catalog :layers="$layers" title="Catálogo del sistema de diseño">
    <header class="md-catalog__header">
        <h1 class="md-headline-medium">Catálogo del sistema de diseño</h1>
        <p class="md-body-medium">
            Cada componente canónico se documenta aquí con sus variantes, estados interactivos, contenido extenso,
            valores ausentes y densidades representativas. Una pantalla debe reutilizar el componente cuando represente
            el mismo propósito e interacción.
        </p>
        <p class="md-body-small">
            Esta superficie solo existe en los entornos de desarrollo y prueba. Los datos que muestra son fijos y no
            provienen de la base de datos.
        </p>
    </header>

    @foreach ($layers as $layer => $entries)
        <x-ui.section :title="\App\Support\Ui\ComponentCatalog::LAYERS[$layer]" :level="2">
            <div class="md-catalog__grid">
                @foreach ($entries as $name => $entry)
                    <x-ui.card variant="outlined" :title="$entry['title']" as="article">
                        <p class="md-body-small">{{ $entry['description'] }}</p>

                        <x-slot:actions>
                            <x-ui.action variant="text" :href="route('ui.catalog.show', $name)" trailingIcon="bi-arrow-right">
                                Ver ejemplos
                            </x-ui.action>
                        </x-slot:actions>
                    </x-ui.card>
                @endforeach
            </div>
        </x-ui.section>
    @endforeach
</x-layouts.catalog>
