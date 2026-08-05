<x-catalog.example title="Progreso del flujo" description="El paso actual se anuncia con `aria-current` y solo hay uno por flujo.">
    <div class="md-catalog__demo--stack">
        <x-ui.flow-steps :steps="\App\Support\Ui\CatalogFixtures::flowSteps()" :current="1" label="Reflexión guiada" />
        <x-ui.flow-steps :steps="\App\Support\Ui\CatalogFixtures::flowSteps()" :current="3" label="Reflexión guiada" />
    </div>
</x-catalog.example>

<x-catalog.example title="Flujo corto y acciones" description="Un flujo de dos pasos usa la misma composición y las mismas acciones.">
    <div class="md-catalog__demo--stack">
        <x-ui.flow-steps :steps="['Datos', 'Confirmación']" :current="2" label="Alta rápida" />

        <div class="md-flow-actions">
            <x-ui.action variant="text" icon="bi-arrow-left">Anterior</x-ui.action>
            <x-ui.action variant="filled" trailingIcon="bi-arrow-right">Continuar</x-ui.action>
        </div>
    </div>
</x-catalog.example>
