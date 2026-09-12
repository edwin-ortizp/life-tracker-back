<x-catalog.example title="Varias opciones" description="El disparador resume la selección o muestra la etiqueta de todos.">
    <x-ui.multi-select name="catalogTypes" label="Tipo" :options="\App\Support\Ui\CatalogFixtures::statusOptions()" all-label="Todos los tipos" icon="bi-tag" />
</x-catalog.example>
