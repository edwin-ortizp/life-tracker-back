<x-catalog.example title="Opciones y marcador de posición" description="El selector comparte etiqueta, ayuda y error con el campo de texto.">
    <div class="md-catalog__demo--stack">
        <x-ui.select name="status" label="Estado" placeholder="Todos" :options="\App\Support\Ui\CatalogFixtures::statusOptions()" selected="doing" />
        <x-ui.select name="period" label="Periodo" :options="\App\Support\Ui\CatalogFixtures::periodOptions()" help="Define el rango del resumen." />
    </div>
</x-catalog.example>

<x-catalog.example title="Error y sin opciones" description="Un catálogo vacío no rompe la estructura del campo.">
    <div class="md-catalog__demo--stack">
        <x-ui.select name="owner" label="Responsable" placeholder="Sin asignar" :options="[]" error="Elige un responsable." />
    </div>
</x-catalog.example>
