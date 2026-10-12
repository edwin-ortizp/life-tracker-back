<x-catalog.example title="Metadatos de un precio" description="El texto resume los valores; al pulsarlo aparecen los campos.">
    <x-ui.inline-fields :summary="['Fuente: Manual', 'Fecha: 12/10/2026']">
        <x-ui.select name="catalogSource" label="Fuente" :options="['manual' => 'Manual', 'web' => 'Web', 'ticket' => 'Ticket']" selected="manual" />
        <x-ui.field name="catalogDate" label="Fecha" type="date" value="2026-10-12" />
    </x-ui.inline-fields>
</x-catalog.example>
