<x-catalog.example title="Etiqueta, ayuda y valor" description="La etiqueta siempre está asociada al control y la ayuda se anuncia con él.">
    <div class="md-catalog__demo--stack">
        <x-ui.field name="title" label="Título" help="Máximo 80 caracteres" />
        <x-ui.field name="reference" label="Referencia" value="LT-2026-0134" />
    </div>
</x-catalog.example>

<x-catalog.example title="Requerido, error y deshabilitado" description="El error se anuncia como alerta y marca el control como inválido.">
    <div class="md-catalog__demo--stack">
        <x-ui.field name="owner" label="Responsable" :required="true" />
        <x-ui.field name="due" label="Fecha límite" type="date" error="La fecha debe ser posterior a hoy." />
        <x-ui.field name="locked" label="Origen" value="Importado" :disabled="true" help="Este campo lo define la integración." />
    </div>
</x-catalog.example>

<x-catalog.example title="Contenido extenso" description="Una etiqueta larga sigue siendo legible y no oculta el control.">
    <div class="md-catalog__demo--stack">
        <x-ui.field name="summary" :label="\App\Support\Ui\CatalogFixtures::LONG_TEXT"
                    :value="\App\Support\Ui\CatalogFixtures::LONG_TEXT" />
    </div>
</x-catalog.example>
