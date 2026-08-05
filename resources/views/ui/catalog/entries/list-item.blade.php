<x-catalog.example title="Regiones inicial, principal y final" description="El elemento admite icono, texto de apoyo y acciones sin estilos locales.">
    <div class="md-catalog__demo--stack">
        <x-ui.list label="Ejemplos">
            <x-ui.list-item headline="Preparar la compra semanal" supporting="Comidas · vence hoy">
                <x-slot:leading><x-ui.icon name="bi-basket" tone="primary" /></x-slot:leading>
                <x-slot:trailing>
                    <x-ui.chip variant="tonal" tone="warning">Hoy</x-ui.chip>
                    <x-ui.icon-action icon="bi-pencil" label="Editar la compra semanal" size="sm" />
                </x-slot:trailing>
            </x-ui.list-item>

            <x-ui.list-item headline="Registrar el peso" supporting="Salud" :completed="true">
                <x-slot:leading><x-ui.icon name="bi-check2-circle" tone="success" /></x-slot:leading>
            </x-ui.list-item>
        </x-ui.list>
    </div>
</x-catalog.example>

<x-catalog.example title="Navegable y contenido extenso" description="Al navegar, las acciones finales siguen siendo operables.">
    <div class="md-catalog__demo--stack">
        <x-ui.list label="Navegación">
            <x-ui.list-item :headline="\App\Support\Ui\CatalogFixtures::LONG_TEXT"
                            supporting="Vehículos · sin fecha"
                            :href="route('ui.catalog')">
                <x-slot:leading><x-ui.icon name="bi-car-front" tone="muted" /></x-slot:leading>
                <x-slot:trailing><x-ui.icon-action icon="bi-chevron-right" label="Abrir el detalle" size="sm" /></x-slot:trailing>
            </x-ui.list-item>
        </x-ui.list>
    </div>
</x-catalog.example>
