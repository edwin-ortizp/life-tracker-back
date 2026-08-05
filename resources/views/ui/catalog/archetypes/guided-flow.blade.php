<x-layouts.catalog-screen title="Arquetipo de flujo guiado">
    <x-module-shell module="mood" title="Reflexión guiada" subtitle="Cuatro pasos para cerrar el día" archetype="guided-flow">
        <x-slot:actions>
            <x-ui.action variant="text">Salir sin guardar</x-ui.action>
        </x-slot:actions>

        <x-slot:controls>
            <x-ui.flow-steps :steps="\App\Support\Ui\CatalogFixtures::flowSteps()" :current="2" label="Reflexión guiada" />
        </x-slot:controls>

        <x-ui.section title="¿Qué emoción reconoces?" description="Elige la que más se acerque; podrás matizarla después.">
            <x-ui.filter-bar label="Emociones disponibles">
                <x-slot:chips>
                    <x-ui.chip variant="filter" :selected="true">Calma</x-ui.chip>
                    <x-ui.chip variant="filter">Ilusión</x-ui.chip>
                    <x-ui.chip variant="filter">Cansancio</x-ui.chip>
                    <x-ui.chip variant="filter">Frustración</x-ui.chip>
                </x-slot:chips>
            </x-ui.filter-bar>

            <x-ui.textarea name="detail" label="¿Qué la provocó?" rows="4" help="Una frase basta." />
        </x-ui.section>

        <div class="md-flow-actions">
            <x-ui.action variant="text" icon="bi-arrow-left">Anterior</x-ui.action>
            <x-ui.action variant="filled" trailingIcon="bi-arrow-right">Continuar</x-ui.action>
        </div>
    </x-module-shell>
</x-layouts.catalog-screen>
