<x-catalog.example title="Patrón" description="Se abre desde el servidor con `:open`. Cabecera: secciones, icono, título, expandir y cerrar. Footer: Cancelar a la izquierda y Guardar a la derecha.">
    <x-ui.form-dialog :open="false" close="closeForm" submit-action="save" title="Registrar evento de salud" icon="bi-heart-pulse"
                      :sections="['basic' => ['label' => 'Información básica', 'icon' => 'bi-file-earmark-text'], 'details' => ['label' => 'Detalles adicionales', 'icon' => 'bi-card-text']]">
        <x-ui.form-dialog-section name="basic" title="Información básica">
            <x-ui.field name="catalog-dialog-title" label="Título" :required="true" />
        </x-ui.form-dialog-section>
    </x-ui.form-dialog>
    <p class="md-body-medium">El modal permanece cerrado en el catálogo; su uso real está en Salud › Registro.</p>
</x-catalog.example>
