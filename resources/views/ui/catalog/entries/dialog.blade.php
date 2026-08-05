<x-catalog.example title="Diálogo estándar" description="Al abrirlo el foco entra en la superficie, permanece contenido y vuelve al activador al cerrarse.">
    <div x-data="{ showForm: false }">
        <x-ui.action variant="filled" icon="bi-plus-lg" x-on:click="showForm = true">Abrir diálogo</x-ui.action>

        <x-ui.dialog state="showForm" title="Nueva tarea">
            <x-ui.field name="dialogTitle" label="Título" help="Describe la tarea en una frase." />

            <x-slot:actions>
                <x-ui.action variant="text" x-on:click="showForm = false">Cancelar</x-ui.action>
                <x-ui.action variant="filled" x-on:click="showForm = false">Guardar</x-ui.action>
            </x-slot:actions>
        </x-ui.dialog>
    </div>
</x-catalog.example>

<x-catalog.example title="Diálogo amplio" description="Para contenido denso, sin cambiar el contrato de foco ni de cierre.">
    <div x-data="{ showDetail: false }">
        <x-ui.action variant="outlined" x-on:click="showDetail = true">Abrir diálogo amplio</x-ui.action>

        <x-ui.dialog state="showDetail" title="Detalle del registro" size="lg" icon="bi-info-circle">
            <p class="md-body-medium">{{ \App\Support\Ui\CatalogFixtures::LONG_TEXT }}</p>

            <x-slot:actions>
                <x-ui.action variant="text" x-on:click="showDetail = false">Cerrar</x-ui.action>
            </x-slot:actions>
        </x-ui.dialog>
    </div>
</x-catalog.example>
