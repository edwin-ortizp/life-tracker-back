<x-catalog.example title="Encabezado, descripción y acciones" description="La sección agrupa contenido sin introducir estilos locales.">
    <div class="md-catalog__demo--stack">
        <x-ui.section title="Resumen" description="Últimos siete días">
            Contenido de la sección.

            <x-slot:actions>
                <x-ui.action variant="text" size="sm">Ver todo</x-ui.action>
            </x-slot:actions>
        </x-ui.section>
    </div>
</x-catalog.example>

<x-catalog.example title="Niveles de encabezado" description="El nivel se elige según la jerarquía real de la pantalla, no por su tamaño.">
    <div class="md-catalog__demo--stack">
        <x-ui.section title="Sección principal" :level="2">Nivel 2.</x-ui.section>
        <x-ui.section title="Subsección" :level="3">Nivel 3.</x-ui.section>
        <x-ui.section :title="\App\Support\Ui\CatalogFixtures::LONG_TEXT" :level="4">Nivel 4 con título extenso.</x-ui.section>
    </div>
</x-catalog.example>
